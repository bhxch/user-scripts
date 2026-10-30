// userscript/src/keys.test.ts
import { describe, expect, it } from "bun:test";

import { EXPIRES_KEY, TOKEN_KEY, isExportableKey } from "./keys";

describe("the export filter", () => {
  it("names the credential keys", () => {
    expect(TOKEN_KEY).toBe("collie:device-token");
    expect(EXPIRES_KEY).toBe("collie:pairing-expires");
  });

  it("accepts the kept preference keys, prefix included", () => {
    for (const key of [
      "collie:locale:v1",
      "collie:design:v1",
      "collie:themes:v1",
      "collie:display-prefs:v4",
      "collie:dash-prefs:v1",
      "collie:push-disabled",
      "collie:mirror-native:pane-1",
    ]) {
      expect(isExportableKey(key)).toBe(true);
    }
  });

  it("refuses credential, session and pairing content", () => {
    for (const key of [
      "collie:device-token",
      "collie:pairing-expires",
      "collie:draft:v2:pane-1",
      "collie:push-endpoint",
      "collie:no-prompts-confirmed:v1",
      "collie:new-sheet:again:v1",
      "collie:wipe-pending",
      "collie:wipe-last",
      "collie.nav.trail",
      "collie:preload-reload",
      "collie:pwa:guardReload:v1",
      "collie:last-pane:p1",
      "collie:last-snapshot:home",
      "locale:v1",
      "",
    ]) {
      expect(isExportableKey(key)).toBe(false);
    }
  });

  it("refuses an unknown collie key (conservative against future app keys)", () => {
    expect(isExportableKey("collie:something-new:v1")).toBe(false);
  });
});
