// github/gh-repo-size-badge/src/tokens.test.ts
import { describe, expect, test } from "bun:test";
import { normalizeConfig, resolveToken } from "./tokens";

describe("normalizeConfig", () => {
  test("空配置", () => {
    expect(normalizeConfig(null)).toEqual({ tokens: {} });
    expect(normalizeConfig(undefined)).toEqual({ tokens: {} });
    expect(normalizeConfig("nope")).toEqual({ tokens: {} });
    expect(normalizeConfig({ tokens: "nope" })).toEqual({ tokens: {} });
  });

  test("键统一小写、值去空白", () => {
    expect(normalizeConfig({ tokens: { "Zai-Org": "  ghp_x  " } })).toEqual({ tokens: { "zai-org": "ghp_x" } });
  });

  test("丢弃非字符串与空值", () => {
    expect(normalizeConfig({ tokens: { a: 123, b: "", c: "keep" } })).toEqual({ tokens: { c: "keep" } });
  });
});

describe("resolveToken", () => {
  const tokens = { "zai-org": "token-org", "*": "token-fallback" };

  test("owner 精确匹配优先", () => {
    expect(resolveToken(tokens, "zai-org")).toEqual({ token: "token-org", source: "zai-org" });
  });

  test("owner 大小写不敏感", () => {
    expect(resolveToken(tokens, "ZAI-ORG")).toEqual({ token: "token-org", source: "zai-org" });
  });

  test("未命中时用 * 兜底", () => {
    expect(resolveToken(tokens, "other")).toEqual({ token: "token-fallback", source: "*" });
  });

  test("没有任何配置则匿名", () => {
    expect(resolveToken({}, "zai-org")).toEqual({ token: "", source: null });
  });
});
