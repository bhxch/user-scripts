// github/gh-repo-size-badge/src/tokens.ts
//
// Token 配置的读取与解析。GM_getValue/GM_setValue 的调用留在 main.ts，
// 这里只处理纯数据，便于单测。
//
// 配置形如 { tokens: { "<owner>": "<pat>", "*": "<pat>" } }：
// owner 精确匹配优先，其次是 "*" 兜底（所有仓库都用它）。

export interface TokenConfig {
  tokens: Record<string, string>;
}

export interface TokenSource {
  token: string;
  /** 命中的配置键（owner 或 "*"），未命中为 null。 */
  source: string | null;
}

export function normalizeConfig(raw: unknown): TokenConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { tokens: {} };
  const tokens = (raw as { tokens?: unknown }).tokens;
  if (!tokens || typeof tokens !== "object" || Array.isArray(tokens)) return { tokens: {} };

  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(tokens as Record<string, unknown>)) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    out[key.trim().toLowerCase()] = trimmed;
  }
  return { tokens: out };
}

export function resolveToken(tokens: Record<string, string>, owner: string): TokenSource {
  const key = (owner ?? "").trim().toLowerCase();
  if (key && tokens[key]) return { token: tokens[key], source: key };
  if (tokens["*"]) return { token: tokens["*"], source: "*" };
  return { token: "", source: null };
}
