// github/zread-jump/src/inject.ts
//
// DOM 注入：GitHub 仓库页动作区（Star 旁）加 "Zread" 按钮，
// Zread 仓库页顶部动作组加 GitHub 图标链接。
// 两个 mount 均幂等，可被 main.ts 的路由 tick 反复调用；
// 锚点缺失（非仓库页 / 站点改版）时静默不动，绝不误注入。

const LINK_ID = "zread-jump-link";
const STYLE_ID = "zread-jump-style";

const GITHUB_BTN_CSS = `
#${LINK_ID}{display:inline-flex;align-items:center;gap:6px;padding:3px 12px;
  border:1px solid rgba(31,35,40,.15);border-radius:6px;background:#f6f8fa;color:#24292f;
  font:500 12px/20px -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif;
  text-decoration:none;cursor:pointer;vertical-align:middle}
#${LINK_ID}:hover{background:#eaeef2;text-decoration:none}
@media (prefers-color-scheme:dark){
  #${LINK_ID}{border-color:rgba(240,246,252,.1);background:#212830;color:#f0f6fc}
  #${LINK_ID}:hover{background:#262c36}
}`;

const ZREAD_ICON_CSS = `
#${LINK_ID}{display:inline-flex;align-items:center;color:inherit;opacity:.75;cursor:pointer}
#${LINK_ID}:hover{opacity:1}`;

const ZREAD_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="2" y="2" width="20" height="20" rx="5" fill="#2563eb"/><path d="M8 8h8l-8 8h8" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const GITHUB_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`;

function ensureStyle(css: string): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = css;
  document.head.appendChild(style);
}

function ensureLink(inner: string): HTMLAnchorElement {
  let link = document.getElementById(LINK_ID) as HTMLAnchorElement | null;
  if (link === null) {
    link = document.createElement("a");
    link.id = LINK_ID;
    link.innerHTML = inner;
    link.target = "_blank";
    link.rel = "noreferrer";
  }
  return link;
}

function removeLink(): void {
  const link = document.getElementById(LINK_ID);
  if (link === null) return;
  link.closest("li")?.remove();
  link.remove();
}

function setTarget(link: HTMLAnchorElement, target: string, title: string): void {
  if (link.getAttribute("href") !== target) link.setAttribute("href", target);
  link.title = title;
}

// GitHub 仓库页锚点：概览/树视图用 Star 按钮所在的 <li>，代码视图（blob）退而用
// 面包屑里的仓库链接；按钮统一插在锚点之后。
function githubAnchor(): HTMLElement | null {
  const starLi = document.querySelector('[data-testid="star-button"]')?.closest("li") ?? null;
  if (starLi !== null) return starLi;
  return document.querySelector('[data-testid="breadcrumbs-repo-link"]')?.closest("li") ?? null;
}

export function mountGitHubButton(target: string | null): void {
  ensureStyle(GITHUB_BTN_CSS);
  const link = ensureLink(`${ZREAD_ICON}<span>Zread</span>`);
  if (target === null) {
    removeLink();
    return;
  }
  setTarget(link, target, "View this repo on Zread");
  const anchor = githubAnchor();
  if (anchor === null) return;
  const wrap = link.parentElement;
  if (wrap !== null && wrap.tagName === "LI" && wrap.isConnected) {
    // 已在 DOM 里：整体挪到锚点之后（insertAdjacentElement 对在册节点是移动语义）。
    if (anchor.nextElementSibling !== wrap) anchor.insertAdjacentElement("afterend", wrap);
  } else {
    const li = document.createElement("li");
    li.appendChild(link);
    anchor.insertAdjacentElement("afterend", li);
  }
}

export function mountZreadButton(target: string | null): void {
  ensureStyle(ZREAD_ICON_CSS);
  const link = ensureLink(GITHUB_ICON);
  if (target === null) {
    removeLink();
    return;
  }
  setTarget(link, target, "View this repo on GitHub");
  const trigger = document.querySelector('header [data-slot="dropdown-menu-trigger"]');
  const group = trigger?.parentElement ?? null;
  if (group === null) return;
  if (link.parentElement === group && link.isConnected) return;
  group.appendChild(link);
}
