// Firecrawl kliens EGY helyen (CONSTITUTION 8.). A v2 /scrape valós formátumára szabva:
// kérés: { url, formats:["markdown"], onlyMainContent:true }
// válasz: { success, data: { markdown, metadata } }, metadata.creditsUsed / statusCode

const FIRECRAWL_ENDPOINT = "https://api.firecrawl.dev/v2/scrape";

// Blokkolt/captcha oldal jelei (valós lecke: success:true is lehet szemét, lásd ROADMAP).
const BLOCK_KEYWORDS = [
  "biztonsági ellenőrz",
  "security check",
  "captcha",
  "verify you are human",
  "verify you are a human",
  "cloudflare",
  "hitelesítés / verification",
  "checking your browser",
];
// Ennél rövidebb tartalmat használhatatlannak tekintünk.
const MIN_CONTENT_LENGTH = 200;

export type ScrapeOutcome =
  | {
      ok: true;
      markdown: string;
      title: string | null;
      meta: Record<string, unknown>;
      creditsUsed: number | null;
    }
  | {
      ok: false;
      reason: "blocked" | "too_short" | "no_content" | "http_error";
      detail: string;
      creditsUsed: number | null;
    };

function isBlocked(markdown: string): boolean {
  const lower = markdown.toLowerCase();
  return BLOCK_KEYWORDS.some((kw) => lower.includes(kw));
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Nyers scrape hívás retry-jal (429 / 5xx → exponenciális backoff, max 3 próba).
async function rawScrape(
  url: string,
  apiKey: string,
): Promise<{ status: number; json: unknown }> {
  let lastErr = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(1000 * 2 ** (attempt - 1)); // 1s, 2s

    const res = await fetch(FIRECRAWL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    if (res.status === 429 || res.status >= 500) {
      lastErr = `HTTP ${res.status}`;
      continue; // retryzhető
    }
    const json = await res.json().catch(() => null);
    return { status: res.status, json };
  }
  return { status: 429, json: { error: lastErr || "rate limited" } };
}

// Magas szintű: URL → ScrapeOutcome. Nem dob — a hibát strukturáltan adja vissza (fail-closed).
export async function scrapeUrl(url: string): Promise<ScrapeOutcome> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      reason: "http_error",
      detail: "Hiányzó FIRECRAWL_API_KEY",
      creditsUsed: null,
    };
  }

  const { status, json } = await rawScrape(url, apiKey);
  const body = (json ?? {}) as {
    success?: boolean;
    data?: { markdown?: string; metadata?: Record<string, unknown> };
    error?: string;
  };

  if (status !== 200 || !body.success) {
    return {
      ok: false,
      reason: "http_error",
      detail: body.error ? String(body.error) : `HTTP ${status}`,
      creditsUsed: null,
    };
  }

  const markdown = body.data?.markdown ?? "";
  const meta = body.data?.metadata ?? {};
  const creditsUsed =
    typeof meta.creditsUsed === "number" ? meta.creditsUsed : null;
  const title = typeof meta.title === "string" ? meta.title : null;

  if (!markdown.trim()) {
    return { ok: false, reason: "no_content", detail: "üres markdown", creditsUsed };
  }
  if (isBlocked(markdown)) {
    return {
      ok: false,
      reason: "blocked",
      detail: `bot-védelem/captcha (${title ?? "?"})`,
      creditsUsed,
    };
  }
  if (markdown.length < MIN_CONTENT_LENGTH) {
    return {
      ok: false,
      reason: "too_short",
      detail: `csak ${markdown.length} karakter`,
      creditsUsed,
    };
  }

  return { ok: true, markdown, title, meta, creditsUsed };
}
