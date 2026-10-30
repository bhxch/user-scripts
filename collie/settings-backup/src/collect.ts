// userscript/src/collect.ts
//
// The storage side of export and import. collectBackup reads the allowlist (plus the
// mirror-native prefix family) and the credential, all as raw strings. applySettings writes a
// file's settings back through the SAME allowlist — a hand-edited file cannot plant a key the
// export would never have produced, and keys it does not name are never touched (merge, never
// wipe). The credential is applied by main.ts only after verify.ts said ok.

import type { BackupCredential } from "./backup-file";
import { EXPIRES_KEY, PREFERENCE_KEYS, PREFERENCE_PREFIXES, TOKEN_KEY, isExportableKey } from "./keys";

export interface BackupSnapshot {
  credential?: BackupCredential;
  settings: Record<string, string>;
}

export function collectBackup(storage: Storage, includeCredential: boolean): BackupSnapshot {
  const settings: Record<string, string> = {};
  const seen = new Set<string>(PREFERENCE_KEYS);
  for (const key of PREFERENCE_KEYS) {
    const value = storage.getItem(key);
    if (value !== null) settings[key] = value;
  }
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key === null || seen.has(key)) continue;
    if (!PREFERENCE_PREFIXES.some((prefix) => key.startsWith(prefix))) continue;
    seen.add(key);
    const value = storage.getItem(key);
    if (value !== null) settings[key] = value;
  }
  let credential: BackupCredential | undefined;
  if (includeCredential) {
    const token = storage.getItem(TOKEN_KEY);
    if (token !== null) {
      const expires = storage.getItem(EXPIRES_KEY);
      credential = expires !== null ? { token, expires } : { token };
    }
  }
  return { credential, settings };
}

export function applySettings(storage: Storage, settings: Record<string, string>): string[] {
  const written: string[] = [];
  for (const [key, value] of Object.entries(settings)) {
    if (!isExportableKey(key)) continue;
    storage.setItem(key, value);
    written.push(key);
  }
  return written;
}
