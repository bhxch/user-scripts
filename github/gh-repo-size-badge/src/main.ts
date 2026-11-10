// github/gh-repo-size-badge/src/main.ts
//
// 入口：识别页面类型 → 取仓库体积 → 把徽标插到仓库标题或列表条目旁。
// GitHub 是 SPA（turbo/pjax），用 turbo/pjax 事件 + MutationObserver 感知路由与 DOM 变化。
// 体积来自 GitHub REST API（repos 接口的 size 字段），按 Owner 可配 Fine-grained PAT。

import { createRepoSizeClient } from "./api";
import {
  LIST_BADGE_ATTR,
  SINGLE_BADGE_ID,
  buildListBadge,
  buildSingleBadge,
  findRepoItemsInList,
  findRepoTitleElement,
  placeSingleBadge,
  removeAllBadges,
  showSingleErrorBadge,
} from "./dom";
import { getPageContext } from "./page";
import { formatSize } from "./size";
import { normalizeConfig, resolveToken, type TokenConfig } from "./tokens";

const CONFIG_KEY = "github_repo_size_tokens";
const CACHE_TTL = 5 * 60 * 1000;
const ERROR_CACHE_TTL = 60 * 1000;
const MAX_ANONYMOUS_LIST = 10;
const LIST_RENDER_DELAY = 1000;
const LIST_ITEM_DELAY = 150;
const PLACE_ATTEMPTS = 5;
const PLACE_RETRY_DELAY = 500;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const client = createRepoSizeClient({
  request: (details) => GM_xmlhttpRequest(details),
  cacheTtlMs: CACHE_TTL,
});

/** 失败结果的短缓存，避免同一仓库反复请求同一处错误。 */
const errorCache = new Map<string, { message: string; timestamp: number }>();

// ==================== 配置 ====================

function loadConfig(): TokenConfig {
  try {
    return normalizeConfig(GM_getValue(CONFIG_KEY, null));
  } catch {
    return { tokens: {} };
  }
}

function saveConfig(config: TokenConfig): void {
  GM_setValue(CONFIG_KEY, config);
  client.clearCache();
  errorCache.clear();
}

function getTokenForOwner(owner: string): { token: string; source: string | null } {
  return resolveToken(loadConfig().tokens, owner);
}

// ==================== 菜单 ====================

function registerMenus(): void {
  GM_registerMenuCommand("🔑 设置 / 更新 Owner Token", () => {
    const config = loadConfig();
    const existing = Object.keys(config.tokens).join(", ") || "（暂无）";
    const owner = prompt(
      "输入 Owner（用户名或组织名，大小写不敏感）。\n输入 * 表示兜底 Token。\n\n" +
      `已配置: ${existing}`,
      "",
    );
    if (owner === null) return;
    const key = owner.trim().toLowerCase();
    if (!key) return alert("Owner 不能为空。");

    const token = prompt(`输入 ${key} 的 Fine-grained PAT。\n（留空并确定 = 删除该配置）`, config.tokens[key] ?? "");
    if (token === null) return;
    const trimmed = token.trim();
    if (trimmed) config.tokens[key] = trimmed;
    else delete config.tokens[key];
    saveConfig(config);
    alert(`已保存。当前配置的 Owner 数量: ${Object.keys(config.tokens).length}`);
  });

  GM_registerMenuCommand("🗑️ 删除某个 Owner Token", () => {
    const config = loadConfig();
    const keys = Object.keys(config.tokens);
    if (keys.length === 0) return alert("尚未配置任何 Token。");
    const owner = prompt(`输入要删除的 Owner（或 *）：\n已配置: ${keys.join(", ")}`, "");
    if (owner === null) return;
    const key = owner.trim().toLowerCase();
    if (!config.tokens[key]) return alert(`未找到 ${key} 的配置。`);
    if (!confirm(`确认删除 ${key} 的 Token？`)) return;
    delete config.tokens[key];
    saveConfig(config);
    alert("已删除。");
  });

  GM_registerMenuCommand("📋 查看 Token 配置", () => {
    const config = loadConfig();
    const keys = Object.keys(config.tokens);
    if (keys.length === 0) return alert("尚未配置任何 Token。");
    const lines = keys.map((key) => {
      const token = config.tokens[key];
      const masked = token.length > 12 ? `${token.slice(0, 8)}…${token.slice(-4)}` : "***";
      return `${key} → ${masked}`;
    });
    alert(`当前 Token 配置：\n\n${lines.join("\n")}`);
  });

  GM_registerMenuCommand("🧪 诊断当前页面", async () => {
    const context = getPageContext(location.pathname, location.search);
    const info: Record<string, unknown> = { url: location.href, ctx: context };

    if (context.type === "repo") {
      const titleLink = findRepoTitleElement(context.owner, context.repo);
      info.titleLinkFound = Boolean(titleLink);
      info.titleLinkTag = titleLink ? titleLink.outerHTML.slice(0, 150) : null;
      const tokenSource = getTokenForOwner(context.owner);
      info.tokenSource = tokenSource.source ?? "（匿名）";
      try {
        info.apiResult = await client.fetchRepoSize(context.owner, context.repo, tokenSource);
      } catch (error) {
        info.apiResult = { error: (error as Error).message };
      }
    } else if (context.type === "repo-list" || context.type === "star-list") {
      const items = findRepoItemsInList();
      info.itemsFound = items.length;
      info.sampleItems = items.slice(0, 5).map((item) => item.key);
    }

    alert(JSON.stringify(info, null, 2));
    console.log("[GitHub Repo Size][诊断]", info);
  });
}

// ==================== 主流程 ====================

async function processSingleRepo(context: { owner: string; repo: string }): Promise<void> {
  const cacheKey = `${context.owner}/${context.repo}`.toLowerCase();

  const cachedError = errorCache.get(cacheKey);
  if (cachedError && Date.now() - cachedError.timestamp < ERROR_CACHE_TTL) {
    showSingleErrorBadge(cachedError.message);
    return;
  }

  try {
    const tokenSource = getTokenForOwner(context.owner);
    const { sizeKB, tokenSource: used } = await client.fetchRepoSize(context.owner, context.repo, tokenSource);
    const sizeText = formatSize(sizeKB);
    if (!sizeText) return;
    removeAllBadges();

    // GitHub 渲染标题很慢，插入点可能晚于数据到达
    for (let attempt = 0; attempt < PLACE_ATTEMPTS; attempt++) {
      if (placeSingleBadge(buildSingleBadge(sizeText, used))) break;
      await sleep(PLACE_RETRY_DELAY);
    }
  } catch (error) {
    const message = (error as Error).message;
    console.debug("[GitHub Repo Size]", message);
    errorCache.set(cacheKey, { message, timestamp: Date.now() });
    showSingleErrorBadge(message);
  }
}

async function processRepoList(): Promise<void> {
  await sleep(LIST_RENDER_DELAY);
  const items = findRepoItemsInList();
  if (items.length === 0) return;

  const startUrl = location.href;
  let anonymousUsed = 0;

  for (const item of items) {
    if (location.href !== startUrl) return;

    // 有 Token 的仓库一律取；匿名请求按上限节流，避免撞 API 速率限制
    const tokenSource = getTokenForOwner(item.owner);
    if (!tokenSource.token) {
      if (anonymousUsed >= MAX_ANONYMOUS_LIST) continue;
      anonymousUsed += 1;
    }

    try {
      const { sizeKB, tokenSource: used } = await client.fetchRepoSize(item.owner, item.repo, tokenSource);
      const sizeText = formatSize(sizeKB);
      if (sizeText && !document.querySelector(`[${LIST_BADGE_ATTR}="${CSS.escape(item.key)}"]`)) {
        item.link.insertAdjacentElement("afterend", buildListBadge(sizeText, used, item.key));
      }
    } catch {
      // 单个仓库失败不影响其它条目
    }
    await sleep(LIST_ITEM_DELAY);
  }
}

async function processPage(): Promise<void> {
  try {
    const context = getPageContext(location.pathname, location.search);
    if (context.type === "repo") {
      await processSingleRepo(context);
    } else if (context.type === "repo-list" || context.type === "star-list") {
      await processRepoList();
    }
  } catch (error) {
    console.error("[GitHub Repo Size] processPage 异常:", error);
  }
}

// ==================== 导航与观察者 ====================

let lastUrl = location.href;
let placeTimer: ReturnType<typeof setTimeout> | undefined;
let listTimer: ReturnType<typeof setTimeout> | undefined;

function onNavigate(): void {
  if (location.href === lastUrl) return;
  lastUrl = location.href;
  removeAllBadges();
  errorCache.clear();
  setTimeout(() => void processPage(), 600);
}

document.addEventListener("turbo:load", onNavigate);
document.addEventListener("pjax:end", onNavigate);

const observer = new MutationObserver(() => {
  try {
    if (location.href !== lastUrl) {
      onNavigate();
      return;
    }
    const context = getPageContext(location.pathname, location.search);
    if (context.type === "repo") {
      if (!document.getElementById(SINGLE_BADGE_ID) && findRepoTitleElement(context.owner, context.repo)) {
        clearTimeout(placeTimer);
        placeTimer = setTimeout(() => void processPage(), 1000);
      }
    } else if (context.type === "repo-list" || context.type === "star-list") {
      clearTimeout(listTimer);
      listTimer = setTimeout(() => void processPage(), 2000);
    }
  } catch (error) {
    console.error(error);
  }
});
observer.observe(document.body, { childList: true, subtree: true });

// 启动
try {
  registerMenus();
} catch (error) {
  console.error(error);
}
void processPage();
