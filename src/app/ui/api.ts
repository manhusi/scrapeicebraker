// Kliens-oldali API-hívás EGY helyen (CONSTITUTION 8.) — minden gomb ezt használja.

export type ApiResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

export async function apiCall<T = Record<string, unknown>>(
  path: string,
  opts?: { method?: "POST" | "PATCH"; body?: object },
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      method: opts?.method ?? "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts?.body ?? {}),
    });
    const data = await res.json();
    if (!res.ok || !data.ok)
      return { ok: false, error: data.error ?? "ismeretlen hiba" };
    return data as { ok: true } & T;
  } catch {
    return { ok: false, error: "hálózati hiba" };
  }
}
