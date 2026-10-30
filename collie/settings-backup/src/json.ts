// userscript/src/json.ts
//
// The one name for "a value that came out of JSON.parse", so the userscript's boundary readers
// (the collie-backup file, /api/health, /api/devices) take a domain type instead of `unknown`:
// everything reachable inside a parsed document IS one of these, by construction. Mirrors
// bridge/json.ts.

/** Any value JSON can carry. */
export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;

/** A JSON object. Optional properties are allowed; `JSON.stringify` omits them. */
export type JsonObject = { [key: string]: JsonValue | undefined };
