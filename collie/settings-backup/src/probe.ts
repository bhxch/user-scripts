// userscript/src/probe.ts
//
// Is this page a Collie settings screen? Two checks in order, the cheap one first: the path
// ends in /settings (a basePath mount's prefix, named by <meta name="collie-base">, is
// stripped first, ADR 0052), then the open /api/health route proves the host is a Collie.
// Nothing else on the page is trusted — the script owns no React DOM.

import type { JsonValue } from "./json";

const SEMVER_PREFIX = /^\d+\.\d+\.\d+/;

export function settingsPathname(base: string, pathname: string): string {
  const mount = base.length > 1 && base.endsWith("/") ? base.slice(0, -1) : base;
  if (mount.length > 1) {
    if (pathname === mount) return "/";
    if (pathname.startsWith(`${mount}/`)) return pathname.slice(mount.length);
  }
  return pathname;
}

/** The mount prefix for URL building: the app writes `/` or `/a/b/` into the meta
 *  (web/src/lib/base-path.ts), so a root mount and any trailing slash collapse to no prefix. */
export function mountPrefix(content: string | null): string {
  if (content === null) return "";
  const trimmed = content.trim();
  const body = trimmed.replace(/\/+$/, "");
  if (body === "" || body === "/") return "";
  return body.startsWith("/") ? body : `/${body}`;
}

export function isSettingsPath(pathname: string): boolean {
  return pathname === "/settings" || pathname.startsWith("/settings/");
}

export function isCollieHealth(value: JsonValue): value is { ok: true; version: string } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  return (
    value["ok"] === true && typeof value["version"] === "string" && SEMVER_PREFIX.test(value["version"])
  );
}

export async function probeHealth(fetcher: typeof fetch, base = ""): Promise<boolean> {
  try {
    const res = await fetcher(`${base}/api/health`, { signal: AbortSignal.timeout(10_000) });
    const body = await res.json().catch(() => null);
    return res.status === 200 && isCollieHealth(body);
  } catch {
    return false;
  }
}
