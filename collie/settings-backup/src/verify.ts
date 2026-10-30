// userscript/src/verify.ts
//
// The import-side credential probe: prove a token against the bridge before anything writes it.
// The same three states the built-in restore reads (web/src/lib/api.ts verifyDeviceToken):
// 403 is refused; a 2xx whose body names no `current` device is refused too — the bridge answered
// but did not accept the token; anything outside 2xx, including a probe that times out at the
// same 10s the restore allows, is unreachable. The fetcher is injected so the tests need no
// network.

import type { JsonValue } from "./json";

export type VerifyResult = "ok" | "refused" | "unreachable";

export function interpretVerify(status: number, body: JsonValue): VerifyResult {
  if (status === 403) return "refused";
  if (status < 200 || status >= 300) return "unreachable";
  if (typeof body === "object" && body !== null && !Array.isArray(body)) {
    const current = body["current"];
    if (typeof current === "string" && current.length > 0) return "ok";
  }
  return "refused";
}

export async function verifyCredential(token: string, fetcher: typeof fetch, base = ""): Promise<VerifyResult> {
  try {
    const res = await fetcher(`${base}/api/devices`, {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
    });
    const body = await res.json().catch(() => null);
    return interpretVerify(res.status, body);
  } catch {
    return "unreachable";
  }
}
