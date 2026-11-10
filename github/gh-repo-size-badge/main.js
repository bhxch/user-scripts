// ==UserScript==
// @name         GitHub Repo Size Viewer
// @namespace    https://github.com/your-username/github-repo-size
// @version      2.6.0
// @description  在 GitHub 仓库页、仓库列表页、星标页显示仓库大小，支持多 Owner Token
// @match        https://github.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @connect      api.github.com
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG_KEY = 'github_repo_size_tokens';
    const SINGLE_BADGE_ID = 'gh-repo-size-badge';
    const BADGE_CLASS = 'gh-repo-size-badge';
    const LIST_BADGE_ATTR = 'data-gh-repo-size-badge';
    const CACHE_TTL = 5 * 60 * 1000;
    const ERROR_CACHE_TTL = 60 * 1000;
    const MAX_ANONYMOUS_LIST = 10;
    const LIST_ITEM_DELAY = 150;

    const RESERVED_OWNERS = new Set([
        'settings','notifications','explore','topics','trending','marketplace','pricing',
        'features','enterprise','login','logout','join','signup','search','new','orgs',
        'users','apps','sponsors','collections','events','codespaces','dashboard',
        'account','site','security','about','contact','team','sessions',
        'password_reset','issues','pulls','stars','watching','pulse','home'
    ]);

    const cache = new Map();
    const errorCache = new Map();
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    // ==================== 配置 ====================
    function loadConfig() {
        try {
            const cfg = GM_getValue(CONFIG_KEY, null);
            if (!cfg || typeof cfg !== 'object' || !cfg.tokens || typeof cfg.tokens !== 'object') {
                return { tokens: {} };
            }
            return cfg;
        } catch (e) { return { tokens: {} }; }
    }
    function saveConfig(cfg) { GM_setValue(CONFIG_KEY, cfg); }

    function getTokenForOwner(owner) {
        const { tokens } = loadConfig();
        const key = (owner || '').toLowerCase();
        if (key && tokens[key]) return { token: tokens[key], source: key };
        if (tokens['*']) return { token: tokens['*'], source: '*' };
        return { token: '', source: null };
    }

    // ==================== 菜单 ====================
    function registerMenus() {
        GM_registerMenuCommand('🔑 设置 / 更新 Owner Token', () => {
            const cfg = loadConfig();
            const existing = Object.keys(cfg.tokens).join(', ') || '（暂无）';
            const owner = prompt(
                '输入 Owner（用户名或组织名，大小写不敏感）。\n输入 * 表示兜底 Token。\n\n' +
                `已配置: ${existing}`, ''
            );
            if (owner === null) return;
            const key = owner.trim().toLowerCase();
            if (!key) return alert('Owner 不能为空。');
            const current = cfg.tokens[key] || '';
            const token = prompt(`输入 ${key} 的 Fine-grained PAT。\n（留空并确定 = 删除该配置）`, current);
            if (token === null) return;
            const t = token.trim();
            if (t) cfg.tokens[key] = t; else delete cfg.tokens[key];
            saveConfig(cfg);
            cache.clear(); errorCache.clear();
            alert(`已保存。当前配置的 Owner 数量: ${Object.keys(cfg.tokens).length}`);
        });

        GM_registerMenuCommand('🗑️ 删除某个 Owner Token', () => {
            const cfg = loadConfig();
            const keys = Object.keys(cfg.tokens);
            if (keys.length === 0) return alert('尚未配置任何 Token。');
            const owner = prompt('输入要删除的 Owner（或 *）：\n已配置: ' + keys.join(', '), '');
            if (owner === null) return;
            const key = owner.trim().toLowerCase();
            if (!cfg.tokens[key]) return alert(`未找到 ${key} 的配置。`);
            if (!confirm(`确认删除 ${key} 的 Token？`)) return;
            delete cfg.tokens[key];
            saveConfig(cfg);
            cache.clear(); errorCache.clear();
            alert('已删除。');
        });

        GM_registerMenuCommand('📋 查看 Token 配置', () => {
            const cfg = loadConfig();
            const keys = Object.keys(cfg.tokens);
            if (keys.length === 0) return alert('尚未配置任何 Token。');
            const lines = keys.map(k => {
                const t = cfg.tokens[k];
                const masked = t.length > 12 ? t.slice(0, 8) + '…' + t.slice(-4) : '***';
                return `${k} → ${masked}`;
            });
            alert('当前 Token 配置：\n\n' + lines.join('\n'));
        });

        GM_registerMenuCommand('🧪 诊断当前页面', async () => {
            const ctx = getPageContext();
            const info = { url: location.href, ctx };
            if (ctx.type === 'repo') {
                const titleLink = getRepoTitleElement(ctx.owner, ctx.repo);
                info.titleLinkFound = !!titleLink;
                info.titleLinkTag = titleLink ? titleLink.outerHTML.slice(0, 150) : null;
                info.tokenSource = getTokenForOwner(ctx.owner).source || '（匿名）';
                try { info.apiResult = await fetchRepoSize(ctx.owner, ctx.repo); }
                catch (e) { info.apiResult = { error: e.message }; }
            } else if (ctx.type === 'repo-list' || ctx.type === 'star-list') {
                info.itemsFound = findRepoItemsInList().length;
                info.sampleItems = findRepoItemsInList().slice(0, 5).map(i => i.key);
            }
            alert(JSON.stringify(info, null, 2));
            console.log('[GitHub Repo Size][诊断]', info);
        });
    }

    // ==================== 页面解析 ====================
    function parseRepoFromPath(pathname) {
        const parts = pathname.split('/').filter(Boolean);
        if (parts.length < 2) return null;
        if (RESERVED_OWNERS.has(parts[0].toLowerCase())) return null;
        return { owner: parts[0], repo: parts[1] };
    }

    function getPageContext() {
        const pathname = location.pathname;
        const params = new URLSearchParams(location.search);
        const parts = pathname.split('/').filter(Boolean);
        const tab = params.get('tab');

        if (parts[0] === 'orgs' && parts.length >= 2) {
            if (parts[2] === 'repositories' || tab === 'repositories') return { type: 'repo-list', user: parts[1] };
        }
        if (parts.length === 1 && tab === 'repositories') return { type: 'repo-list', user: parts[0] };
        if (parts.length === 1 && tab === 'stars') return { type: 'star-list', user: parts[0] };
        const repoPath = parseRepoFromPath(pathname);
        if (repoPath) return { type: 'repo', ...repoPath };
        return { type: 'unknown' };
    }

    // ==================== 工具 ====================
    function formatSize(kb) {
        if (kb === null || kb === undefined || isNaN(kb) || kb < 0) return null;
        if (kb === 0) return '0 KB';
        const bytes = kb * 1024;
        const units = ['B','KB','MB','GB','TB'];
        let i = 0, size = bytes;
        while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
        return `${size.toFixed(1)} ${units[i]}`;
    }

    async function waitFor(selector, timeout = 8000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const el = document.querySelector(selector);
            if (el) return el;
            await sleep(250);
        }
        return null;
    }

    // ==================== API ====================
    function fetchRepoSize(owner, repo) {
        const cacheKey = `${owner}/${repo}`.toLowerCase();
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return Promise.resolve({ sizeKB: cached.sizeKB, tokenSource: cached.tokenSource });
        }
        const { token, source } = getTokenForOwner(owner);
        const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
        const headers = { 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET', url, headers, timeout: 15000,
                onload: (resp) => {
                    if (resp.status === 200) {
                        try {
                            const data = JSON.parse(resp.responseText);
                            const sizeKB = data.size;
                            if (typeof sizeKB === 'number') {
                                cache.set(cacheKey, { sizeKB, tokenSource: source, timestamp: Date.now() });
                                resolve({ sizeKB, tokenSource: source });
                            } else reject(new Error('API 响应中缺少 size 字段'));
                        } catch (e) { reject(new Error('解析 API 响应失败')); }
                    } else if (resp.status === 404) {
                        reject(new Error(source
                            ? `仓库不存在，或 Owner "${source}" 的 Token 无权访问`
                            : `仓库不存在，或为私有仓库（请为 Owner "${owner}" 配置 Token）`));
                    } else if (resp.status === 403 || resp.status === 429) {
                        reject(new Error(`API 速率限制${source ? `（Token: ${source}）` : '（匿名）'}`));
                    } else if (resp.status === 401) {
                        reject(new Error(`Token 无效或已过期（来源: ${source || '匿名'}）`));
                    } else reject(new Error(`API 请求失败: HTTP ${resp.status}`));
                },
                onerror: () => reject(new Error('网络请求失败')),
                ontimeout: () => reject(new Error('请求超时')),
            });
        });
    }

    // ==================== DOM：单仓库页（全面弃用 header 依赖） ====================
    // 直接找仓库标题链接，不再依赖外层容器
    function getRepoTitleElement(owner, repo) {
        const escapedOwner = CSS.escape(owner);
        const escapedRepo = CSS.escape(repo);
        const targetHref = `/${owner}/${repo}`.toLowerCase();

        // 1. 尝试 GitHub 标准的稳定标记
        let el = document.querySelector('[data-testid="repo-name-link"]');
        if (el && el.getAttribute('href')?.toLowerCase() === targetHref) return el;

        // 2. 找 h1 里面的 a 标签
        const h1 = document.querySelector('h1');
        if (h1) {
            const a = h1.querySelector('a');
            if (a && a.getAttribute('href')?.toLowerCase().startsWith(targetHref)) {
                return a;
            }
            // 如果 h1 里没有 a，但有文本（某些奇怪的布局），直接返回 h1
            if (h1.textContent.toLowerCase().includes(repo.toLowerCase())) {
                return h1;
            }
        }

        // 3. 全局搜索所有匹配 href 的 a 标签
        const links = document.querySelectorAll(`a[href="/${escapedOwner}/${escapedRepo}"]`);
        for (const link of links) {
            // 排除侧边栏、面包屑等杂项，通常主标题在页面顶部
            if (link.closest('h1') || link.closest('[data-testid="repository-container-header"]') || link.closest('.AppHeader-context-item')) {
                return link;
            }
        }
        return links[0] || null; // 兜底返回第一个
    }

    function removeAllBadges() {
        document.querySelectorAll(`#${SINGLE_BADGE_ID}`).forEach(el => el.remove());
        document.querySelectorAll(`[${LIST_BADGE_ATTR}]`).forEach(el => el.remove());
    }

    function placeSingleBadge(badge) {
        const repoPath = parseRepoFromPath(location.pathname);
        if (!repoPath) return false;

        const titleEl = getRepoTitleElement(repoPath.owner, repoPath.repo);
        if (titleEl) {
            // 直接插在标题元素后面
            titleEl.insertAdjacentElement('afterend', badge);
            return true;
        }
        return false;
    }

    function buildSingleBadge(sizeText, tokenSource) {
        const badge = document.createElement('span');
        badge.id = SINGLE_BADGE_ID;
        badge.className = BADGE_CLASS;
        badge.textContent = `· ${sizeText}`;
        badge.title = `仓库大小: ${sizeText}\n认证方式: ${tokenSource ? `Token (${tokenSource})` : '匿名请求'}`;
        badge.style.cssText = `
            display: inline-block; margin-left: 8px; padding: 2px 8px;
            font-size: 12px; font-weight: 500;
            color: var(--fgColor-muted, #656d76);
            background-color: var(--bgColor-neutral-muted, #f6f8fa);
            border-radius: 999px; vertical-align: middle; cursor: default;
        `;
        return badge;
    }

    function showSingleErrorBadge(msg) {
        const existing = document.getElementById(SINGLE_BADGE_ID);
        if (existing && existing.dataset.state === 'error' && existing.dataset.error === msg) return;
        removeAllBadges();
        const badge = document.createElement('span');
        badge.id = SINGLE_BADGE_ID;
        badge.className = BADGE_CLASS;
        badge.textContent = '· ?';
        badge.title = `仓库大小获取失败：${msg}`;
        badge.dataset.state = 'error';
        badge.dataset.error = msg;
        badge.style.cssText = `
            display: inline-block; margin-left: 8px; padding: 2px 8px;
            font-size: 12px; font-weight: 600;
            color: #cf222e; background-color: #ffebe9;
            border: 1px solid #ff8182; border-radius: 999px;
            vertical-align: middle; cursor: help;
        `;
        placeSingleBadge(badge);
    }

    // ==================== DOM：列表页 & 星标页 ====================
    function findRepoItemsInList() {
        const items = [];
        const seen = new Set();
        
        // 为了适配列表和星标，直接在全局（或主容器）找特定的结构
        // GitHub 列表和星标页的仓库通常都包含在一个带 href 的 h3 标签里，或者紧跟着 star 按钮
        const candidates = document.querySelectorAll('li, div.col-12, [data-testid="results-list"] > div');

        for (const el of candidates) {
            let found = null;
            // 找当前块里的 a 标签
            for (const a of el.querySelectorAll('a[href]')) {
                const href = a.getAttribute('href');
                if (!href) continue;
                // 只匹配两段式的 repo 链接
                const m = href.match(/^\/([^\/]+)\/([^\/?#]+)\/?$/);
                if (!m) continue;
                const [, owner, repo] = m;
                if (RESERVED_OWNERS.has(owner.toLowerCase())) continue;
                
                // 排除掉侧边栏、顶部导航里误匹配的链接
                if (a.closest('nav, header, .AppHeader, .Sidebar')) continue;
                
                // 星标页通常有 h3 包着 a，或者类名里有 Link--primary
                if (a.closest('h3') || a.classList.contains('Link--primary') || a.parentElement?.tagName === 'H3') {
                    found = { owner, repo, link: a };
                    break;
                }
                // 如果没有 h3，就记下第一个匹配的作为兜底
                if (!found) found = { owner, repo, link: a };
            }
            if (!found) continue;

            const key = `${found.owner}/${found.repo}`.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);

            // 确保当前块里没有插入过 badge
            if (el.querySelector(`[${LIST_BADGE_ATTR}="${CSS.escape(key)}"]`)) continue;

            items.push({ ...found, containerEl: el, key });
        }
        return items;
    }

    function buildListBadge(sizeText, tokenSource, key) {
        const badge = document.createElement('span');
        badge.className = BADGE_CLASS;
        badge.setAttribute(LIST_BADGE_ATTR, key);
        badge.textContent = `· ${sizeText}`;
        badge.title = `仓库大小: ${sizeText}\n认证方式: ${tokenSource ? `Token (${tokenSource})` : '匿名请求'}`;
        badge.style.cssText = `
            display: inline-block; margin-left: 6px; padding: 1px 6px;
            font-size: 11px; font-weight: 500;
            color: var(--fgColor-muted, #656d76);
            background-color: var(--bgColor-neutral-muted, #f6f8fa);
            border-radius: 999px; vertical-align: middle; cursor: default;
        `;
        return badge;
    }

    // ==================== 主流程 ====================
    async function processSingleRepo(ctx) {
        const cacheKey = `${ctx.owner}/${ctx.repo}`.toLowerCase();

        const err = errorCache.get(cacheKey);
        if (err && Date.now() - err.timestamp < ERROR_CACHE_TTL) {
            showSingleErrorBadge(err.message);
            return;
        }

        try {
            const { sizeKB, tokenSource } = await fetchRepoSize(ctx.owner, ctx.repo);
            const sizeText = formatSize(sizeKB);
            if (!sizeText) return;
            removeAllBadges();
            
            // 由于 GitHub 页面有时渲染极慢，这里加一个重试机制
            let inserted = false;
            for (let i = 0; i < 5; i++) {
                inserted = placeSingleBadge(buildSingleBadge(sizeText, tokenSource));
                if (inserted) break;
                await sleep(500);
            }
            if (!inserted) console.debug('[GitHub Repo Size] 数据已获取，但尝试 5 次均无法定位标题插入点');
        } catch (e) {
            console.debug('[GitHub Repo Size]', e.message);
            errorCache.set(cacheKey, { message: e.message, timestamp: Date.now() });
            showSingleErrorBadge(e.message);
        }
    }

    async function processRepoList() {
        // 给列表页面留一点渲染时间
        await sleep(1000);
        const items = findRepoItemsInList();
        if (items.length === 0) return;

        const { source: firstSource } = getTokenForOwner(items[0].owner);
        const limit = firstSource ? items.length : Math.min(items.length, MAX_ANONYMOUS_LIST);
        
        const startUrl = location.href;
        for (let i = 0; i < limit; i++) {
            if (location.href !== startUrl) return;
            const item = items[i];
            try {
                const { sizeKB, tokenSource } = await fetchRepoSize(item.owner, item.repo);
                const sizeText = formatSize(sizeKB);
                // 再次检查页面上是否已经被插入了
                if (sizeText && !document.querySelector(`[${LIST_BADGE_ATTR}="${CSS.escape(item.key)}"]`)) {
                    item.link.insertAdjacentElement('afterend', buildListBadge(sizeText, tokenSource, item.key));
                }
            } catch (e) {
                // 忽略单个报错
            }
            await sleep(LIST_ITEM_DELAY);
        }
    }

    async function processPage() {
        try {
            const ctx = getPageContext();
            if (ctx.type === 'repo') {
                await processSingleRepo(ctx);
            } else if (ctx.type === 'repo-list' || ctx.type === 'star-list') {
                await processRepoList();
            }
        } catch (e) {
            console.error('[GitHub Repo Size] processPage 异常:', e);
        }
    }

    // ==================== 导航与观察者 ====================
    let lastUrl = location.href;

    function onNavigate() {
        if (location.href === lastUrl) return;
        lastUrl = location.href;
        removeAllBadges();
        setTimeout(processPage, 600);
    }

    document.addEventListener('turbo:load', onNavigate);
    document.addEventListener('pjax:end', onNavigate);

    const observer = new MutationObserver(() => {
        try {
            if (location.href !== lastUrl) { onNavigate(); return; }
            const ctx = getPageContext();
            if (ctx.type === 'repo') {
                if (!document.getElementById(SINGLE_BADGE_ID) && getRepoTitleElement(ctx.owner, ctx.repo)) {
                    clearTimeout(observer._timer);
                    observer._timer = setTimeout(processPage, 1000);
                }
            } else if (ctx.type === 'repo-list' || ctx.type === 'star-list') {
                // 列表页防抖
                clearTimeout(observer._listTimer);
                observer._listTimer = setTimeout(processPage, 2000);
            }
        } catch (e) { console.error(e); }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // 启动
    try { registerMenus(); } catch (e) { console.error(e); }
    processPage();
})();
