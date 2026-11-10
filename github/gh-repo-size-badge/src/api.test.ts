// github/gh-repo-size-badge/src/api.test.ts
import { describe, expect, test } from "bun:test";
import { createRepoSizeClient, type RequestDetails } from "./api";

/** 记录请求并按预设脚本回放响应。 */
function fakeRequest(reply: (details: RequestDetails) => void) {
  const seen: RequestDetails[] = [];
  const request = (details: RequestDetails): void => {
    seen.push(details);
    reply(details);
  };
  return { request, seen };
}

const ANON = { token: "", source: null };

describe("createRepoSizeClient", () => {
  test("解析 size 字段并带上认证头", async () => {
    const { request, seen } = fakeRequest((details) => {
      details.onload?.({ status: 200, responseText: JSON.stringify({ size: 2048 }) });
    });
    const client = createRepoSizeClient({ request });

    const result = await client.fetchRepoSize("zai-org", "ZCode", { token: "ghp_x", source: "zai-org" });
    expect(result).toEqual({ sizeKB: 2048, tokenSource: "zai-org" });

    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe("https://api.github.com/repos/zai-org/ZCode");
    expect(seen[0].headers.Authorization).toBe("Bearer ghp_x");
    expect(seen[0].headers["X-GitHub-Api-Version"]).toBe("2022-11-28");
  });

  test("匿名请求不带 Authorization", async () => {
    const { request, seen } = fakeRequest((details) => {
      details.onload?.({ status: 200, responseText: JSON.stringify({ size: 1 }) });
    });
    const client = createRepoSizeClient({ request });

    await client.fetchRepoSize("zai-org", "ZCode", ANON);
    expect(seen[0].headers.Authorization).toBeUndefined();
  });

  test("缓存命中不再发请求", async () => {
    let calls = 0;
    const { request } = fakeRequest((details) => {
      calls += 1;
      details.onload?.({ status: 200, responseText: JSON.stringify({ size: 1024 }) });
    });
    const client = createRepoSizeClient({ request });

    await client.fetchRepoSize("zai-org", "ZCode", ANON);
    await client.fetchRepoSize("ZAI-ORG", "zcode", ANON);
    expect(calls).toBe(1);

    client.clearCache();
    await client.fetchRepoSize("zai-org", "ZCode", ANON);
    expect(calls).toBe(2);
  });

  test("缓存过期后重新请求", async () => {
    let calls = 0;
    let clock = 1000;
    const { request } = fakeRequest((details) => {
      calls += 1;
      details.onload?.({ status: 200, responseText: JSON.stringify({ size: 1024 }) });
    });
    const client = createRepoSizeClient({ request, now: () => clock, cacheTtlMs: 500 });

    await client.fetchRepoSize("zai-org", "ZCode", ANON);
    clock += 600;
    await client.fetchRepoSize("zai-org", "ZCode", ANON);
    expect(calls).toBe(2);
  });

  test("404 提示私有仓库", async () => {
    const { request } = fakeRequest((details) => {
      details.onload?.({ status: 404, responseText: "" });
    });
    const client = createRepoSizeClient({ request });

    await expect(client.fetchRepoSize("zai-org", "ZCode", ANON)).rejects.toThrow(/私有仓库/);
  });

  test("401 提示 Token 失效", async () => {
    const { request } = fakeRequest((details) => {
      details.onload?.({ status: 401, responseText: "" });
    });
    const client = createRepoSizeClient({ request });

    await expect(client.fetchRepoSize("zai-org", "ZCode", { token: "t", source: "zai-org" })).rejects.toThrow(/已过期/);
  });

  test("429 提示速率限制", async () => {
    const { request } = fakeRequest((details) => {
      details.onload?.({ status: 429, responseText: "" });
    });
    const client = createRepoSizeClient({ request });

    await expect(client.fetchRepoSize("zai-org", "ZCode", ANON)).rejects.toThrow(/速率限制/);
  });

  test("响应不是合法 JSON", async () => {
    const { request } = fakeRequest((details) => {
      details.onload?.({ status: 200, responseText: "<html>" });
    });
    const client = createRepoSizeClient({ request });

    await expect(client.fetchRepoSize("zai-org", "ZCode", ANON)).rejects.toThrow(/解析 API 响应失败/);
  });

  test("响应缺少 size 字段", async () => {
    const { request } = fakeRequest((details) => {
      details.onload?.({ status: 200, responseText: JSON.stringify({ name: "ZCode" }) });
    });
    const client = createRepoSizeClient({ request });

    await expect(client.fetchRepoSize("zai-org", "ZCode", ANON)).rejects.toThrow(/缺少 size 字段/);
  });

  test("网络错误与超时", async () => {
    const erroring = fakeRequest((details) => details.onerror?.());
    const errorClient = createRepoSizeClient({ request: erroring.request });
    await expect(errorClient.fetchRepoSize("zai-org", "ZCode", ANON)).rejects.toThrow(/网络请求失败/);

    const timingOut = fakeRequest((details) => details.ontimeout?.());
    const timeoutClient = createRepoSizeClient({ request: timingOut.request });
    await expect(timeoutClient.fetchRepoSize("zai-org", "ZCode", ANON)).rejects.toThrow(/请求超时/);
  });
});
