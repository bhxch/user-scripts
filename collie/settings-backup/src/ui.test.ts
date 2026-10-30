// userscript/src/ui.test.ts
import { describe, expect, it } from "bun:test";

import { pickTexts } from "./ui";

describe("pickTexts", () => {
  it("Chinese locales get the Chinese panel", () => {
    expect(pickTexts("zh").exportLabel).toBe("导出文件");
    expect(pickTexts("zh-CN").title).toContain("Collie");
  });

  it("anything else, including null, gets English", () => {
    expect(pickTexts(null).exportLabel).toBe(pickTexts("en").exportLabel);
    expect(pickTexts("fr").title).toBe(pickTexts("en").title);
  });

  it("interpolates counts and reasons", () => {
    expect(pickTexts("en").prefCount(12)).toContain("12");
    expect(pickTexts("zh").reportImported(3)).toContain("3");
    expect(pickTexts("en").badFile("not-json")).toContain("not-json");
  });

  it("has a status line for the paired state", () => {
    expect(pickTexts("en").statusPaired.length).toBeGreaterThan(0);
  });
});
