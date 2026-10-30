// userscript/src/keys.ts
//
// The export allowlist. It mirrors the `kept` rows of web/src/lib/storage-keys.test.ts — the
// line the app itself draws: preferences are "how this phone likes to look, never what a
// session said". When that table gains a kept key, move the row here too. The credential keys
// are named here but are NOT part of isExportableKey: the export gathers them separately, and
// the import applies them only after a verified probe.

export const TOKEN_KEY = "collie:device-token";
export const EXPIRES_KEY = "collie:pairing-expires";

const EXACT_KEYS: readonly string[] = [
  "collie:theme:v1",
  "collie:design:v1",
  "collie:themes:v1",
  "collie:key-board:v1",
  "collie:display-prefs:v4",
  "collie:dash-prefs:v1",
  "collie:locale:v1",
  "collie:haptics:v1",
  "collie:harness-bar:v1",
  "collie:harness-prefs:v1",
  "collie:strips-collapsed:v1",
  "collie:stt-hands-free:v1",
  "collie:stt-engine:v1",
  "collie:zen-enabled:v1",
  "collie:auto-zen-enabled:v1",
  "collie:pins:v1",
  "collie:pin-hint:v1",
  "collie:masked-hint:v1",
  "collie:hidden-machines:v1",
  "collie:tour:v1",
  "collie:new-page:kind:v1",
  "collie:push-disabled",
];

const PREFIX_KEYS: readonly string[] = ["collie:mirror-native:"];

export const PREFERENCE_KEYS = EXACT_KEYS;
export const PREFERENCE_PREFIXES = PREFIX_KEYS;

export function isExportableKey(key: string): boolean {
  if (EXACT_KEYS.includes(key)) return true;
  return PREFIX_KEYS.some((prefix) => key.startsWith(prefix));
}
