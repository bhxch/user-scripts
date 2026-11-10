// github/gh-repo-size-badge/src/page.ts
//
// 纯函数：把 GitHub 的 pathname/query 解析成脚本关心的页面类型。
// 脚本只在仓库页、仓库列表页、星标页工作，其余页面一律跳过。

export interface RepoRef {
  owner: string;
  repo: string;
}

export type PageContext =
  | { type: "repo"; owner: string; repo: string }
  | { type: "repo-list"; user: string }
  | { type: "star-list"; user: string }
  | { type: "unknown" };

// GitHub 顶层固定路由（不是 owner 名），命中即放弃。
export const RESERVED_OWNERS: ReadonlySet<string> = new Set([
  "settings", "notifications", "explore", "topics", "trending", "marketplace", "pricing",
  "features", "enterprise", "login", "logout", "join", "signup", "search", "new", "orgs",
  "users", "apps", "sponsors", "collections", "events", "codespaces", "dashboard",
  "account", "site", "security", "about", "contact", "team", "sessions",
  "password_reset", "issues", "pulls", "stars", "watching", "pulse", "home",
]);

export function parseRepoFromPath(pathname: string): RepoRef | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  if (RESERVED_OWNERS.has(parts[0].toLowerCase())) return null;
  return { owner: parts[0], repo: parts[1] };
}

export function getPageContext(pathname: string, search: string): PageContext {
  const parts = pathname.split("/").filter(Boolean);
  const tab = new URLSearchParams(search).get("tab");

  if (parts[0] === "orgs" && parts.length >= 2) {
    if (parts[2] === "repositories" || tab === "repositories") {
      return { type: "repo-list", user: parts[1] };
    }
  }
  if (parts.length === 1 && tab === "repositories") {
    return { type: "repo-list", user: parts[0] };
  }
  if (parts.length === 1 && tab === "stars") {
    return { type: "star-list", user: parts[0] };
  }

  const repo = parseRepoFromPath(pathname);
  if (repo) return { type: "repo", owner: repo.owner, repo: repo.repo };
  return { type: "unknown" };
}
