// github/gh-repo-size-badge/src/dom.ts
//
// DOM 相关的部分：定位仓库标题/列表条目，以及徽标的构造与插入。
// 这里只做定位与插桩，不发请求、不读配置。

import { RESERVED_OWNERS, parseRepoFromPath } from "./page";

export const SINGLE_BADGE_ID = "gh-repo-size-badge";
export const BADGE_CLASS = "gh-repo-size-badge";
export const LIST_BADGE_ATTR = "data-gh-repo-size-badge";

export interface RepoListItem {
  owner: string;
  repo: string;
  key: string;
  link: HTMLAnchorElement;
}

const SINGLE_BADGE_STYLE = `
  display: inline-block; margin-left: 8px; padding: 2px 8px;
  font-size: 12px; font-weight: 500;
  color: var(--fgColor-muted, #656d76);
  background-color: var(--bgColor-neutral-muted, #f6f8fa);
  border-radius: 999px; vertical-align: middle; cursor: default;
`;

const ERROR_BADGE_STYLE = `
  display: inline-block; margin-left: 8px; padding: 2px 8px;
  font-size: 12px; font-weight: 600;
  color: #cf222e; background-color: #ffebe9;
  border: 1px solid #ff8182; border-radius: 999px;
  vertical-align: middle; cursor: help;
`;

const LIST_BADGE_STYLE = `
  display: inline-block; margin-left: 6px; padding: 1px 6px;
  font-size: 11px; font-weight: 500;
  color: var(--fgColor-muted, #656d76);
  background-color: var(--bgColor-neutral-muted, #f6f8fa);
  border-radius: 999px; vertical-align: middle; cursor: default;
`;

/** 仓库页：找到仓库标题链接。GitHub 改版频繁，多条策略依次兜底。 */
export function findRepoTitleElement(owner: string, repo: string): HTMLElement | null {
  const escapedOwner = CSS.escape(owner);
  const escapedRepo = CSS.escape(repo);
  const targetHref = `/${owner}/${repo}`.toLowerCase();

  // 1. GitHub 较稳定的标记
  const marked = document.querySelector('[data-testid="repo-name-link"]');
  if (marked && marked.getAttribute("href")?.toLowerCase() === targetHref) return marked;

  // 2. h1 里的仓库名链接
  const h1 = document.querySelector("h1");
  if (h1) {
    const anchor = h1.querySelector("a");
    if (anchor && anchor.getAttribute("href")?.toLowerCase().startsWith(targetHref)) return anchor;
    if (h1.textContent.toLowerCase().includes(repo.toLowerCase())) return h1;
  }

  // 3. 全局找同 href 的链接，优先标题/面包屑
  const links = document.querySelectorAll(`a[href="/${escapedOwner}/${escapedRepo}"]`);
  for (const link of links) {
    if (link.closest("h1") || link.closest('[data-testid="repository-container-header"]') || link.closest(".AppHeader-context-item")) {
      return link;
    }
  }
  return links[0] ?? null;
}

export function removeAllBadges(): void {
  document.querySelectorAll(`#${SINGLE_BADGE_ID}`).forEach((el) => el.remove());
  document.querySelectorAll(`[${LIST_BADGE_ATTR}]`).forEach((el) => el.remove());
}

/** 把单仓库徽标插到仓库标题后面。找不到标题时返回 false，调用方负责重试。 */
export function placeSingleBadge(badge: HTMLElement): boolean {
  const repo = parseRepoFromPath(location.pathname);
  if (!repo) return false;

  const titleEl = findRepoTitleElement(repo.owner, repo.repo);
  if (!titleEl) return false;
  titleEl.insertAdjacentElement("afterend", badge);
  return true;
}

export function buildSingleBadge(sizeText: string, tokenSource: string | null): HTMLElement {
  const badge = document.createElement("span");
  badge.id = SINGLE_BADGE_ID;
  badge.className = BADGE_CLASS;
  badge.textContent = `· ${sizeText}`;
  badge.title = `仓库大小: ${sizeText}\n认证方式: ${tokenSource ? `Token (${tokenSource})` : "匿名请求"}`;
  badge.style.cssText = SINGLE_BADGE_STYLE;
  return badge;
}

export function showSingleErrorBadge(message: string): void {
  const existing = document.getElementById(SINGLE_BADGE_ID);
  if (existing && existing.dataset.state === "error" && existing.dataset.error === message) return;

  removeAllBadges();
  const badge = document.createElement("span");
  badge.id = SINGLE_BADGE_ID;
  badge.className = BADGE_CLASS;
  badge.textContent = "· ?";
  badge.title = `仓库大小获取失败：${message}`;
  badge.dataset.state = "error";
  badge.dataset.error = message;
  badge.style.cssText = ERROR_BADGE_STYLE;
  placeSingleBadge(badge);
}

/** 列表页/星标页：找出每个仓库条目及其链接。 */
export function findRepoItemsInList(): RepoListItem[] {
  const items: RepoListItem[] = [];
  const seen = new Set<string>();
  const candidates = document.querySelectorAll('li, div.col-12, [data-testid="results-list"] > div');

  for (const el of candidates) {
    let found: { owner: string; repo: string; link: HTMLAnchorElement } | null = null;
    for (const anchor of el.querySelectorAll("a[href]")) {
      const href = anchor.getAttribute("href");
      if (!href) continue;
      const matched = href.match(/^\/([^/]+)\/([^/?#]+)\/?$/);
      if (!matched) continue;
      const [, owner, repo] = matched;
      if (RESERVED_OWNERS.has(owner.toLowerCase())) continue;
      if (anchor.closest("nav, header, .AppHeader, .Sidebar")) continue;

      if (anchor.closest("h3") || anchor.classList.contains("Link--primary") || anchor.parentElement?.tagName === "H3") {
        found = { owner, repo, link: anchor };
        break;
      }
      if (!found) found = { owner, repo, link: anchor };
    }
    if (!found) continue;

    const key = `${found.owner}/${found.repo}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    if (el.querySelector(`[${LIST_BADGE_ATTR}="${CSS.escape(key)}"]`)) continue;

    items.push({ ...found, key });
  }
  return items;
}

export function buildListBadge(sizeText: string, tokenSource: string | null, key: string): HTMLElement {
  const badge = document.createElement("span");
  badge.className = BADGE_CLASS;
  badge.setAttribute(LIST_BADGE_ATTR, key);
  badge.textContent = `· ${sizeText}`;
  badge.title = `仓库大小: ${sizeText}\n认证方式: ${tokenSource ? `Token (${tokenSource})` : "匿名请求"}`;
  badge.style.cssText = LIST_BADGE_STYLE;
  return badge;
}
