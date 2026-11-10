// github/gh-repo-size-badge/src/api.ts
//
// 调 GitHub REST API 取仓库体积（repos 接口的 size 字段，单位 KB），带 TTL 缓存。
// 请求函数由外部注入：生产环境传 GM_xmlhttpRequest，单测传假实现。

export interface SizeResult {
  sizeKB: number;
  tokenSource: string | null;
}

export interface RequestDetails {
  method: string;
  url: string;
  headers: Record<string, string>;
  timeout?: number;
  onload?: (response: { status: number; responseText: string }) => void;
  onerror?: () => void;
  ontimeout?: () => void;
}

export type RequestFn = (details: RequestDetails) => void;

export interface RepoSizeClientOptions {
  request: RequestFn;
  now?: () => number;
  cacheTtlMs?: number;
  timeoutMs?: number;
}

interface CacheEntry {
  sizeKB: number;
  tokenSource: string | null;
  timestamp: number;
}

export interface RepoSizeClient {
  fetchRepoSize(owner: string, repo: string, tokenSource: { token: string; source: string | null }): Promise<SizeResult>;
  clearCache(): void;
}

export function createRepoSizeClient(options: RepoSizeClientOptions): RepoSizeClient {
  const { request } = options;
  const now = options.now ?? (() => Date.now());
  const cacheTtl = options.cacheTtlMs ?? 5 * 60 * 1000;
  const timeout = options.timeoutMs ?? 15000;
  const cache = new Map<string, CacheEntry>();

  function fetchRepoSize(
    owner: string,
    repo: string,
    tokenSource: { token: string; source: string | null },
  ): Promise<SizeResult> {
    const cacheKey = `${owner}/${repo}`.toLowerCase();
    const cached = cache.get(cacheKey);
    if (cached && now() - cached.timestamp < cacheTtl) {
      return Promise.resolve({ sizeKB: cached.sizeKB, tokenSource: cached.tokenSource });
    }

    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    if (tokenSource.token) headers.Authorization = `Bearer ${tokenSource.token}`;

    return new Promise((resolve, reject) => {
      request({
        method: "GET",
        url,
        headers,
        timeout,
        onload: (response) => {
          const status = response.status;
          if (status === 200) {
            let data: unknown;
            try {
              data = JSON.parse(response.responseText);
            } catch {
              reject(new Error("解析 API 响应失败"));
              return;
            }
            const sizeKB = (data as { size?: unknown }).size;
            if (typeof sizeKB !== "number") {
              reject(new Error("API 响应中缺少 size 字段"));
              return;
            }
            cache.set(cacheKey, { sizeKB, tokenSource: tokenSource.source, timestamp: now() });
            resolve({ sizeKB, tokenSource: tokenSource.source });
            return;
          }
          if (status === 404) {
            reject(new Error(tokenSource.source
              ? `仓库不存在，或 Owner "${tokenSource.source}" 的 Token 无权访问`
              : `仓库不存在，或为私有仓库（请为 Owner "${owner}" 配置 Token）`));
            return;
          }
          if (status === 403 || status === 429) {
            reject(new Error(`API 速率限制${tokenSource.source ? `（Token: ${tokenSource.source}）` : "（匿名）"}`));
            return;
          }
          if (status === 401) {
            reject(new Error(`Token 无效或已过期（来源: ${tokenSource.source ?? "匿名"}）`));
            return;
          }
          reject(new Error(`API 请求失败: HTTP ${status}`));
        },
        onerror: () => reject(new Error("网络请求失败")),
        ontimeout: () => reject(new Error("请求超时")),
      });
    });
  }

  return {
    fetchRepoSize,
    clearCache: () => cache.clear(),
  };
}
