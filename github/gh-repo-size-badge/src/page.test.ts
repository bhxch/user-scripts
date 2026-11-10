// github/gh-repo-size-badge/src/page.test.ts
import { describe, expect, test } from "bun:test";
import { getPageContext, parseRepoFromPath } from "./page";

describe("parseRepoFromPath", () => {
  test("仓库首页与子路径", () => {
    expect(parseRepoFromPath("/zai-org/ZCode")).toEqual({ owner: "zai-org", repo: "ZCode" });
    expect(parseRepoFromPath("/zai-org/ZCode/blob/main/src/main.ts")).toEqual({ owner: "zai-org", repo: "ZCode" });
  });

  test("大小写原样保留", () => {
    expect(parseRepoFromPath("/Zai-Org/ZCode")).toEqual({ owner: "Zai-Org", repo: "ZCode" });
  });

  test("单段不是仓库", () => {
    expect(parseRepoFromPath("/zai-org")).toBeNull();
    expect(parseRepoFromPath("/")).toBeNull();
  });

  test("顶层固定路由不是 owner", () => {
    expect(parseRepoFromPath("/settings/profile")).toBeNull();
    expect(parseRepoFromPath("/explore")).toBeNull();
    expect(parseRepoFromPath("/marketplace/actions")).toBeNull();
    expect(parseRepoFromPath("/orgs/zai-org")).toBeNull();
  });
});

describe("getPageContext", () => {
  test("仓库页", () => {
    expect(getPageContext("/zai-org/ZCode", "")).toEqual({ type: "repo", owner: "zai-org", repo: "ZCode" });
    expect(getPageContext("/zai-org/ZCode/issues", "?q=is%3Aopen")).toEqual({
      type: "repo",
      owner: "zai-org",
      repo: "ZCode",
    });
  });

  test("用户主页的 repositories 标签页", () => {
    expect(getPageContext("/zai-org", "?tab=repositories")).toEqual({ type: "repo-list", user: "zai-org" });
  });

  test("用户主页的 stars 标签页", () => {
    expect(getPageContext("/zai-org", "?tab=stars")).toEqual({ type: "star-list", user: "zai-org" });
  });

  test("组织的 repositories 列表页", () => {
    expect(getPageContext("/orgs/zai-org/repositories", "")).toEqual({ type: "repo-list", user: "zai-org" });
  });

  test("组织页带 repositories 查询参数", () => {
    expect(getPageContext("/orgs/zai-org", "?tab=repositories")).toEqual({ type: "repo-list", user: "zai-org" });
  });

  test("其它页面不处理", () => {
    expect(getPageContext("/settings/profile", "")).toEqual({ type: "unknown" });
    expect(getPageContext("/explore", "")).toEqual({ type: "unknown" });
    expect(getPageContext("/zai-org", "")).toEqual({ type: "unknown" });
    expect(getPageContext("/orgs/zai-org/dashboard", "")).toEqual({ type: "unknown" });
  });
});
