// github/gh-repo-size-badge/src/size.test.ts
import { describe, expect, test } from "bun:test";
import { formatSize } from "./size";

describe("formatSize", () => {
  test("0 字节", () => {
    expect(formatSize(0)).toBe("0 KB");
  });

  test("KB 级", () => {
    expect(formatSize(1)).toBe("1.0 KB");
    expect(formatSize(512)).toBe("512.0 KB");
  });

  test("MB 级", () => {
    expect(formatSize(1024)).toBe("1.0 MB");
    expect(formatSize(1536)).toBe("1.5 MB");
  });

  test("GB 级", () => {
    expect(formatSize(1024 * 1024)).toBe("1.0 GB");
  });

  test("上限单位 TB", () => {
    expect(formatSize(1024 * 1024 * 1024)).toBe("1.0 TB");
    expect(formatSize(1024 * 1024 * 1024 * 1024)).toBe("1024.0 TB");
  });

  test("非法输入返回 null", () => {
    expect(formatSize(null)).toBeNull();
    expect(formatSize(undefined)).toBeNull();
    expect(formatSize(Number.NaN)).toBeNull();
    expect(formatSize(Number.POSITIVE_INFINITY)).toBeNull();
    expect(formatSize(-1)).toBeNull();
  });
});
