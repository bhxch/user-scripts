// userscript/src/backup-file.ts
//
// The collie-backup file: build, name and parse. Settings values travel as the raw localStorage
// strings — no parse/re-serialize round trip. Parsing is strict on what import acts on (kind,
// version, settings, credential) and lenient on what it merely displays (exportedAt, origin).

import type { JsonObject, JsonValue } from "./json";

export interface BackupCredential {
  token: string;
  expires?: string;
}

export interface BackupFile {
  kind: "collie-backup";
  version: 1;
  exportedAt: string;
  origin: string;
  credential?: BackupCredential;
  settings: Record<string, string>;
}

const KIND = "collie-backup";
const VERSION = 1;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function backupFileName(now: Date): string {
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `collie-backup-${date}-${time}.json`;
}

export function buildBackupFile(input: {
  exportedAt: string;
  origin: string;
  credential?: BackupCredential;
  settings: Record<string, string>;
}): BackupFile {
  const file: BackupFile = {
    kind: KIND,
    version: VERSION,
    exportedAt: input.exportedAt,
    origin: input.origin,
    settings: input.settings,
  };
  if (input.credential !== undefined) file.credential = input.credential;
  return file;
}

export type ParseResult =
  | { ok: true; value: BackupFile }
  | { ok: false; reason: "not-json" | "wrong-kind" | "wrong-version" | "bad-shape" };

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringRecord(value: JsonValue | undefined): value is Record<string, string> {
  return isJsonObject(value) && Object.values(value).every((entry) => typeof entry === "string");
}

function parseCredential(value: JsonValue | undefined): BackupCredential | undefined {
  if (value === undefined) return undefined;
  if (!isJsonObject(value) || typeof value["token"] !== "string") throw new Error("bad-shape");
  const credential: BackupCredential = { token: value["token"] };
  if (value["expires"] !== undefined) {
    if (typeof value["expires"] !== "string") throw new Error("bad-shape");
    credential.expires = value["expires"];
  }
  return credential;
}

export function parseBackupFile(text: string): ParseResult {
  let data: JsonValue;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, reason: "not-json" };
  }
  if (!isJsonObject(data)) return { ok: false, reason: "wrong-kind" };
  if (data["kind"] !== KIND) return { ok: false, reason: "wrong-kind" };
  if (data["version"] !== VERSION) return { ok: false, reason: "wrong-version" };
  try {
    const settingsRaw = data["settings"];
    if (!isStringRecord(settingsRaw)) throw new Error("bad-shape");
    const settings = settingsRaw;
    const value: BackupFile = {
      kind: KIND,
      version: VERSION,
      exportedAt: typeof data["exportedAt"] === "string" ? data["exportedAt"] : "",
      origin: typeof data["origin"] === "string" ? data["origin"] : "",
      settings,
    };
    const credential = parseCredential(data["credential"]);
    if (credential !== undefined) value.credential = credential;
    return { ok: true, value };
  } catch {
    return { ok: false, reason: "bad-shape" };
  }
}
