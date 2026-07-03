// Gemini kliens EGY helyen (CONSTITUTION 8.). A valós v1beta generateContent API-ra szabva,
// strukturált JSON kimenettel (responseSchema) — verifikálva valós lead-tartalmon.

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function endpoint(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export type GeminiResult<T> =
  | { ok: true; data: T; model: string }
  | { ok: false; error: string };

// JSON-kimenetű generálás megadott sémával. Nem dob — strukturált hibát ad (fail-closed).
export async function generateJson<T>(
  prompt: string,
  responseSchema: object,
  opts: { temperature?: number } = {},
): Promise<GeminiResult<T>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, error: "Hiányzó GEMINI_API_KEY" };

  const model = DEFAULT_MODEL;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: opts.temperature ?? 0.2,
    },
  };

  let lastErr = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(1000 * 2 ** (attempt - 1)); // 1s, 2s

    let res: Response;
    try {
      res = await fetch(endpoint(model), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey, // headerben, ne az URL-ben
        },
        body: JSON.stringify(body),
      });
    } catch (e) {
      lastErr = e instanceof Error ? e.message : "network error";
      continue;
    }

    if (res.status === 429 || res.status >= 500) {
      lastErr = `HTTP ${res.status}`;
      continue; // retryzhető
    }

    const json = (await res.json().catch(() => null)) as {
      candidates?: {
        content?: { parts?: { text?: string }[] };
        finishReason?: string;
      }[];
      error?: { message?: string };
    } | null;

    if (!res.ok || !json) {
      return {
        ok: false,
        error: json?.error?.message ?? `HTTP ${res.status}`,
      };
    }

    const candidate = json.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;
    if (!text) {
      return {
        ok: false,
        error: `nincs kimenet (finishReason: ${candidate?.finishReason ?? "?"})`,
      };
    }

    try {
      const data = JSON.parse(text) as T;
      return { ok: true, data, model };
    } catch {
      return { ok: false, error: "a Gemini nem valid JSON-t adott" };
    }
  }

  return { ok: false, error: lastErr || "sikertelen Gemini hívás" };
}
