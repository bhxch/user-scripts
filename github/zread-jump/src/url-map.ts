// github/zread-jump/src/url-map.ts
//
// 纯函数：从 GitHub / Zread 的 pathname 提取仓库标识，并生成对方的仓库首页 URL。
// 只关心 owner/repo 两段：任何子路径、query、hash 都被丢弃，只跳对方仓库首页。
// owner/repo 段原样转发不做转码，GitHub 会自行 301 规范化大小写。

export interface RepoRef {
  owner: string;
  repo: string;
}

// GitHub 顶层固定路由（非仓库页）。命中即放弃；即使列表漏了，
// inject.ts 还要求页面存在仓库页特有的 DOM 锚点，不会误注入。
const GITHUB_RESERVED_FIRST = new Set([
  "settings", "orgs", "enterprises", "notifications", "inbox", "explore",
  "marketplace", "topics", "collections", "trending", "events", "sponsors",
  "features", "pricing", "security", "login", "signup", "logout", "session",
  "new", "import", "dashboard", "codespaces", "search", "advanced", "pulls",
  "issues", "apps", "gist", "gists", "about", "contact", "careers",
  "customer-stories", "readme", "education", "admin", "account", "billing",
  "pay", "site", "developer", "git", "status", "support", "feedback",
  "watching", "redeem", "advisories", "footer", "hero",
]);

// 与 owner/repo 同级的用户/组织页面（/owner/<fixed>），第二段命中即放弃。
const GITHUB_RESERVED_SECOND = new Set([
  "packages", "projects", "repositories", "repos", "followers", "following",
  "stars", "sponsors", "sponsorship",
]);

// Zread 自身的功能路由（一段式为主），首段命中即放弃。
const ZREAD_RESERVED_FIRST = new Set([
  "login", "signup", "logout", "auth", "callback", "api", "explore",
  "pricing", "about", "blog", "docs", "help", "terms", "privacy",
  "settings", "profile", "user", "users", "chat", "share", "discover",
  "ranking", "leaderboard", "favorites", "bookmarks", "history",
  "upgrade", "billing", "admin", "static", "assets", "_next",
  "favicon.ico", "en", "zh", "zh-CN",
]);

function splitPath(pathname: string): string[] {
  return pathname.split("/").filter((segment) => segment.length > 0);
}

function refFromSegments(first: string, second: string, reservedFirst: Set<string>, reservedSecond: Set<string>): RepoRef | null {
  if (reservedFirst.has(first.toLowerCase())) return null;
  if (reservedSecond.has(second.toLowerCase())) return null;
  return { owner: first, repo: second };
}

export function parseGitHubRepo(pathname: string): RepoRef | null {
  const segments = splitPath(pathname);
  if (segments.length < 2) return null;
  return refFromSegments(segments[0], segments[1], GITHUB_RESERVED_FIRST, GITHUB_RESERVED_SECOND);
}

export function parseZreadRepo(pathname: string): RepoRef | null {
  const segments = splitPath(pathname);
  if (segments.length < 2) return null;
  return refFromSegments(segments[0], segments[1], ZREAD_RESERVED_FIRST, new Set());
}

export function zreadUrl(ref: RepoRef): string {
  return `https://zread.ai/${ref.owner}/${ref.repo}`;
}

export function githubUrl(ref: RepoRef): string {
  return `https://github.com/${ref.owner}/${ref.repo}`;
}
