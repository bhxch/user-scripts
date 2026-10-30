// github/zread-jump/src/url-map.test.ts
import { describe, expect, test } from "bun:test";
import { githubUrl, parseGitHubRepo, parseZreadRepo, zreadUrl } from "./url-map";

describe("parseGitHubRepo", () => {
  test("仓库首页", () => {
    expect(parseGitHubRepo("/zai-org/ZCode")).toEqual({ owner: "zai-org", repo: "ZCode" });
  });

  test("trailing slash", () => {
    expect(parseGitHubRepo("/zai-org/ZCode/")).toEqual({ owner: "zai-org", repo: "ZCode" });
  });

  test("blob 子路径", () => {
    expect(parseGitHubRepo("/zai-org/ZCode/blob/main/src/main.ts")).toEqual({ owner: "zai-org", repo: "ZCode" });
  });

  test("issues / pull 子路径", () => {
    expect(parseGitHubRepo("/zai-org/ZCode/issues/42")).toEqual({ owner: "zai-org", repo: "ZCode" });
    expect(parseGitHubRepo("/zai-org/ZCode/pull/7")).toEqual({ owner: "zai-org", repo: "ZCode" });
  });

  test("repo 名含点号", () => {
    expect(parseGitHubRepo("/vercel/next.js/canary/docs/basic-features.md")).toEqual({ owner: "vercel", repo: "next.js" });
  });

  test("单段是用户主页，不算仓库", () => {
    expect(parseGitHubRepo("/torvalds")).toBeNull();
    expect(parseGitHubRepo("/torvalds/")).toBeNull();
  });

  test("用户页固定子路由不算仓库", () => {
    expect(parseGitHubRepo("/torvalds/repos")).toBeNull();
    expect(parseGitHubRepo("/org-X/packages")).toBeNull();
    expect(parseGitHubRepo("/org-X/projects")).toBeNull();
  });

  test("GitHub 顶层固定路由不算仓库", () => {
    expect(parseGitHubRepo("/settings/profile")).toBeNull();
    expect(parseGitHubRepo("/explore")).toBeNull();
    expect(parseGitHubRepo("/marketplace/actions")).toBeNull();
    expect(parseGitHubRepo("/orgs/zai-org/repositories")).toBeNull();
  });

  test("根路径与空路径", () => {
    expect(parseGitHubRepo("/")).toBeNull();
    expect(parseGitHubRepo("")).toBeNull();
  });
});

describe("parseZreadRepo", () => {
  test("仓库首页", () => {
    expect(parseZreadRepo("/zai-org/ZCode")).toEqual({ owner: "zai-org", repo: "ZCode" });
  });

  test("仓库子路由（chat 等）只取前两段", () => {
    expect(parseZreadRepo("/zai-org/ZCode/chat/abc-123")).toEqual({ owner: "zai-org", repo: "ZCode" });
  });

  test("第二段是保留词不影响（Zread 无用户页子路由）", () => {
    expect(parseZreadRepo("/o/packages")).toEqual({ owner: "o", repo: "packages" });
  });

  test("Zread 功能路由不算仓库", () => {
    expect(parseZreadRepo("/explore")).toBeNull();
    expect(parseZreadRepo("/login")).toBeNull();
    expect(parseZreadRepo("/settings/profile")).toBeNull();
  });

  test("根路径与空路径", () => {
    expect(parseZreadRepo("/")).toBeNull();
    expect(parseZreadRepo("")).toBeNull();
  });
});

describe("目标 URL 构造", () => {
  test("互相指到对方仓库首页", () => {
    expect(zreadUrl({ owner: "zai-org", repo: "ZCode" })).toBe("https://zread.ai/zai-org/ZCode");
    expect(githubUrl({ owner: "zai-org", repo: "ZCode" })).toBe("https://github.com/zai-org/ZCode");
  });

  test("端到端：GitHub 深层子页 → Zread 首页", () => {
    const ref = parseGitHubRepo("/zai-org/ZCode/blob/main/packages/core/src/index.ts?plain=1#L12");
    expect(ref).not.toBeNull();
    expect(zreadUrl(ref!)).toBe("https://zread.ai/zai-org/ZCode");
  });

  test("端到端：Zread 子路由 → GitHub 首页", () => {
    const ref = parseZreadRepo("/zai-org/ZCode/chat/abc");
    expect(ref).not.toBeNull();
    expect(githubUrl(ref!)).toBe("https://github.com/zai-org/ZCode");
  });
});
