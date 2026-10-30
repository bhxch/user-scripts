// userscript/src/probe.test.ts
import { describe, expect, it } from "bun:test";

import { isCollieHealth, isSettingsPath, mountPrefix, probeHealth, settingsPathname } from "./probe";

describe("mountPrefix", () => {
  it("turns the base meta content into a URL prefix", () => {
    expect(mountPrefix("/")).toBe("");
    expect(mountPrefix(null)).toBe("");
    expect(mountPrefix("")).toBe("");
    expect(mountPrefix("/collie/")).toBe("/collie");
    expect(mountPrefix("/collie")).toBe("/collie");
  });
});

describe("settingsPathname", () => {
  it("strips a mount prefix", () => {
    expect(settingsPathname("/collie", "/collie/settings/system")).toBe("/settings/system");
    expect(settingsPathname("/collie", "/collie/settings")).toBe("/settings");
    expect(settingsPathname("/collie/", "/collie/settings")).toBe("/settings");
    expect(settingsPathname("", "/settings")).toBe("/settings");
  });

  it("leaves an unmounted path alone", () => {
    expect(settingsPathname("/collie", "/settings")).toBe("/settings");
  });
});

describe("isSettingsPath", () => {
  it("accepts the index and the sections", () => {
    expect(isSettingsPath("/settings")).toBe(true);
    expect(isSettingsPath("/settings/system")).toBe(true);
  });

  it("refuses everything else", () => {
    expect(isSettingsPath("/settingsX")).toBe(false);
    expect(isSettingsPath("/")).toBe(false);
    expect(isSettingsPath("/pane/p1")).toBe(false);
  });
});

describe("isCollieHealth", () => {
  it("accepts the health shape", () => {
    expect(isCollieHealth({ ok: true, version: "1.14.2", deposed: false, mode: "solo" })).toBe(true);
    expect(isCollieHealth({ ok: true, version: "1.14.2+8a2f8d20" })).toBe(true);
  });

  it("refuses anything else", () => {
    expect(isCollieHealth({ ok: false, version: "1.14.2" })).toBe(false);
    expect(isCollieHealth({ ok: true, version: 3 })).toBe(false);
    expect(isCollieHealth({ ok: true, version: "latest" })).toBe(false);
    expect(isCollieHealth(null)).toBe(false);
  });
});

describe("probeHealth", () => {
  it("fetches the health route under the base and maps the body", async () => {
    const calls: string[] = [];
    const fetcher: typeof fetch = async (input) => {
      calls.push(String(input));
      return new Response(JSON.stringify({ ok: true, version: "1.14.2" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };
    expect(await probeHealth(fetcher, "/collie")).toBe(true);
    expect(calls[0]).toBe("/collie/api/health");
  });

  it("a non-JSON answer is false", async () => {
    const fetcher: typeof fetch = async () => new Response("<html>", { status: 200 });
    expect(await probeHealth(fetcher, "")).toBe(false);
  });

  it("a 500 answer is false even when the body has the health shape", async () => {
    const fetcher: typeof fetch = async () =>
      new Response(JSON.stringify({ ok: true, version: "1.14.2" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    expect(await probeHealth(fetcher, "")).toBe(false);
  });

  it("a network failure is false", async () => {
    const fetcher: typeof fetch = async () => {
      throw new Error("down");
    };
    expect(await probeHealth(fetcher, "")).toBe(false);
  });
});
