// userscript/src/backup-file.test.ts
import { describe, expect, it } from "bun:test";

import { backupFileName, buildBackupFile, parseBackupFile } from "./backup-file";

describe("backupFileName", () => {
  it("stamps the local time", () => {
    expect(backupFileName(new Date(2026, 9, 24, 9, 8, 7))).toBe("collie-backup-20261024-090807.json");
  });

  it("pads single digits", () => {
    expect(backupFileName(new Date(2026, 0, 2, 3, 4, 5))).toBe("collie-backup-20260102-030405.json");
  });
});

describe("buildBackupFile", () => {
  it("fills kind and version and keeps values raw", () => {
    const file = buildBackupFile({
      exportedAt: "2026-10-24T09:08:07.000Z",
      origin: "https://c.example.net",
      credential: { token: "collie-abc", expires: "1790" },
      settings: { "collie:locale:v1": "zh" },
    });
    expect(file.kind).toBe("collie-backup");
    expect(file.version).toBe(1);
    expect(file.credential).toEqual({ token: "collie-abc", expires: "1790" });
    expect(file.settings["collie:locale:v1"]).toBe("zh");
  });

  it("omits the credential when none is given", () => {
    const file = buildBackupFile({ exportedAt: "x", origin: "o", settings: {} });
    expect(file.credential).toBeUndefined();
  });
});

describe("parseBackupFile", () => {
  const round = buildBackupFile({ exportedAt: "x", origin: "o", settings: { "collie:locale:v1": "zh" } });

  it("accepts what build made", () => {
    const parsed = parseBackupFile(JSON.stringify(round));
    expect(parsed).toEqual({ ok: true, value: round });
  });

  it("rejects non-JSON", () => {
    expect(parseBackupFile("nope")).toEqual({ ok: false, reason: "not-json" });
  });

  it("rejects a wrong kind and a wrong version", () => {
    expect(parseBackupFile(JSON.stringify({ kind: "other", version: 1, settings: {} }))).toEqual({
      ok: false,
      reason: "wrong-kind",
    });
    expect(parseBackupFile(JSON.stringify({ ...round, version: 2 }))).toEqual({
      ok: false,
      reason: "wrong-version",
    });
  });

  it("rejects a missing or non-string-valued settings record", () => {
    expect(parseBackupFile(JSON.stringify({ kind: "collie-backup", version: 1 }))).toEqual({
      ok: false,
      reason: "bad-shape",
    });
    expect(parseBackupFile(JSON.stringify({ kind: "collie-backup", version: 1, settings: "x" })).ok).toBe(false);
    expect(
      parseBackupFile(JSON.stringify({ kind: "collie-backup", version: 1, settings: { "collie:locale:v1": 3 } })).ok,
    ).toBe(false);
  });

  it("rejects a credential without a token", () => {
    const bad = JSON.stringify({ kind: "collie-backup", version: 1, credential: { expires: "1" }, settings: {} });
    expect(parseBackupFile(bad).ok).toBe(false);
  });

  it("accepts a hand-made file without exportedAt or origin", () => {
    const hand = JSON.stringify({ kind: "collie-backup", version: 1, settings: {} });
    expect(parseBackupFile(hand).ok).toBe(true);
  });
});
