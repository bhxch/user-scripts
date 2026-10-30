// github/zread-jump/src/main.ts
//
// 入口：按 hostname 分派到对应站点的按钮挂载。
// GitHub（turbo/pjax）与 Zread（Next.js）都是 SPA，
// 用 MutationObserver 感知路由/DOM 变化，辅以短轮询兜底（如只改 URL 不动 DOM 的情况）。

import { mountGitHubButton, mountZreadButton } from "./inject";
import { githubUrl, parseGitHubRepo, parseZreadRepo, zreadUrl } from "./url-map";

function tick(): void {
  if (location.hostname === "github.com") {
    const ref = parseGitHubRepo(location.pathname);
    mountGitHubButton(ref === null ? null : zreadUrl(ref));
  } else if (location.hostname === "zread.ai") {
    const ref = parseZreadRepo(location.pathname);
    mountZreadButton(ref === null ? null : githubUrl(ref));
  }
}

let scheduled = false;
function schedule(): void {
  if (scheduled) return;
  scheduled = true;
  setTimeout(() => {
    scheduled = false;
    tick();
  }, 100);
}

new MutationObserver(schedule).observe(document.documentElement, {
  childList: true,
  subtree: true,
});
window.addEventListener("popstate", schedule);
setInterval(tick, 500);
tick();
