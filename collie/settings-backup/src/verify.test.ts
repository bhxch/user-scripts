// userscript/src/verify.test.ts
import { describe, expect, it } from "bun:test";

import { interpretVerify, verifyCredential } from "./verify";

describe("interpretVerify", () => {
  it("200 with a current device is ok", () => {
    expect(interpretVerify(200, { current: "me", devices: [] })).toBe("ok");
  });

  it("a 2xx that names no current device is refused", () => {
    expect(interpretVerify(200, {})).toBe("refused");
    expect(interpretVerify(200, null)).toBe("refused");
    expect(interpretVerify(204, null)).toBe("refused");
  });

  it("403 is refused, whatever the body", () => {
    expect(interpretVerify(403, "device not paired")).toBe("refused");
    expect(interpretVerify(403, null)).toBe("refused");
  });

  it("anything outside 2xx is unreachable", () => {
    expect(interpretVerify(500, null)).toBe("unreachable");
    expect(interpretVerify(503, "pairing unavailable")).toBe("unreachable");
  });
});

describe("verifyCredential", () => {
  function fetcherOf(status: number, body: string) {
    const calls: { url: string; init?: RequestInit }[] = [];
    const fetcher: typeof fetch = async (input, init) => {
      calls.push({ url: String(input), init });
      return new Response(body, { status, headers: { "content-type": "application/json" } });
    };
    return { fetcher, calls };
  }

  it("sends the token as a bearer and maps a 200", async () => {
    const { fetcher, calls } = fetcherOf(200, JSON.stringify({ current: "me" }));
    expect(await verifyCredential("collie-abc", fetcher, "")).toBe("ok");
    expect(calls[0]?.url).toBe("/api/devices");
    expect(new Headers(calls[0]?.init?.headers).get("authorization")).toBe("Bearer collie-abc");
  });

  it("respects the base path", async () => {
    const { fetcher, calls } = fetcherOf(200, JSON.stringify({ current: "me" }));
    await verifyCredential("collie-abc", fetcher, "/collie");
    expect(calls[0]?.url).toBe("/collie/api/devices");
  });

  it("a 403 body maps to refused", async () => {
    const { fetcher } = fetcherOf(403, "device not paired");
    expect(await verifyCredential("collie-abc", fetcher, "")).toBe("refused");
  });

  it("a network failure is unreachable", async () => {
    const failing: typeof fetch = async () => {
      throw new Error("down");
    };
    expect(await verifyCredential("collie-abc", failing, "")).toBe("unreachable");
  });
});
