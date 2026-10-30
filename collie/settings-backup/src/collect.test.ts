// userscript/src/collect.test.ts
import { describe, expect, it } from "bun:test";

import { collectBackup, applySettings } from "./collect";
import { EXPIRES_KEY, TOKEN_KEY } from "./keys";

function fakeStorage(entries: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(entries));
  const keys = () => [...map.keys()];
  const storage: Storage = {
    get length() {
      return map.size;
    },
    key: (index: number) => keys()[index] ?? null,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, String(value));
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    clear: () => {
      map.clear();
    },
  };
  return storage;
}

describe("collectBackup", () => {
  it("gathers kept preferences and skips absent keys", () => {
    const storage = fakeStorage({ "collie:locale:v1": "zh", "collie:draft:v2:pane-1": "hello" });
    const { settings } = collectBackup(storage, false);
    expect(settings).toEqual({ "collie:locale:v1": "zh" });
  });

  it("gathers mirror-native prefix keys", () => {
    const storage = fakeStorage({ "collie:mirror-native:p1": "dark" });
    const { settings } = collectBackup(storage, false);
    expect(settings).toEqual({ "collie:mirror-native:p1": "dark" });
  });

  it("takes the credential only when asked, and never into settings", () => {
    const storage = fakeStorage({ [TOKEN_KEY]: "collie-abc", [EXPIRES_KEY]: "1790" });
    expect(collectBackup(storage, false).credential).toBeUndefined();
    expect(collectBackup(storage, false).settings[TOKEN_KEY]).toBeUndefined();
    expect(collectBackup(storage, true).credential).toEqual({ token: "collie-abc", expires: "1790" });
  });

  it("no token held means no credential", () => {
    const storage = fakeStorage({ [EXPIRES_KEY]: "1790" });
    expect(collectBackup(storage, true).credential).toBeUndefined();
  });

  it("a credential without an expiry omits expires", () => {
    const storage = fakeStorage({ [TOKEN_KEY]: "collie-abc" });
    expect(collectBackup(storage, true).credential).toEqual({ token: "collie-abc" });
  });
});

describe("applySettings", () => {
  it("writes only exportable keys and returns what it wrote", () => {
    const storage = fakeStorage({ "collie:locale:v1": "en" });
    const written = applySettings(storage, {
      "collie:locale:v1": "zh",
      "collie:design:v1": "{}",
      "collie:evil": "x",
    });
    expect(written).toEqual(["collie:locale:v1", "collie:design:v1"]);
    expect(storage.getItem("collie:locale:v1")).toBe("zh");
    expect(storage.getItem("collie:evil")).toBeNull();
  });

  it("merges: keys absent from the file keep their value", () => {
    const storage = fakeStorage({ "collie:pins:v1": "[]" });
    applySettings(storage, { "collie:locale:v1": "zh" });
    expect(storage.getItem("collie:pins:v1")).toBe("[]");
  });
});
