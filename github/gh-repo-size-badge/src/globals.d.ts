// github/gh-repo-size-badge/src/globals.d.ts
//
// Tampermonkey / Violentmonkey 注入的 GM_* 接口的最小声明。
// 脚本以这些接口为唯一的宿主依赖，没有其它全局。

interface GmRequestDetails {
  method: string;
  url: string;
  headers: Record<string, string>;
  timeout?: number;
  onload?: (response: { status: number; responseText: string }) => void;
  onerror?: () => void;
  ontimeout?: () => void;
}

declare function GM_xmlhttpRequest(details: GmRequestDetails): void;
declare function GM_getValue<T>(key: string, fallback: T): T;
declare function GM_setValue(key: string, value: unknown): void;
declare function GM_registerMenuCommand(caption: string, handler: () => void): void;
