# userscript: Collie backup & restore

A userscript that adds file-based export/import of the pairing credential and local preferences
to Collie's Settings screen, on any official release. Complements the built-in clipboard
backup/restore without touching the app or the bridge. Brought over from the collie repo's
`feat/userscript-settings-backup` branch.

## Install

Violentmonkey / Tampermonkey / Greasemonkey: drop `dist/collie-backup.user.js` into the
manager's "install from file" (this repo has no remote yet, so the metadata carries no
`@updateURL`/`@downloadURL`; add them back once the repo is hosted). `@grant none`: the script
needs no manager APIs.

## Build

```sh
bun collie/settings-backup/build.ts   # -> collie/settings-backup/dist/collie-backup.user.js
```

## Test

```sh
bun test collie/settings-backup/
```

## What it does

- On a path ending in `/settings` (basePath mounts honored via `<meta name="collie-base">`) whose
  host answers `/api/health` with the Collie shape, a floating `Collie` pill appears bottom-right.
- **Export** downloads `collie-backup-YYYYMMDD-HHmmss.json`: the pairing credential
  (`collie:device-token` + `collie:pairing-expires`, optional via the checkbox) and every
  preference key the app's wipe keeps. The file carries a live credential; treat it like a
  password.
- **Import** parses the file, verifies the credential against the bridge before writing it
  (refused or unreachable credentials are reported, never stored), and merges preferences
  through the same allowlist (keys absent from the file are untouched). A reload applies
  pre-paint preferences (theme, locale).
- The panel follows the app's locale (`zh*` → Chinese, else English).

## Verify by hand

1. Serve any Collie (dev lane `next` on port 8788, or a deployed instance) and open
   `https://<host>/settings` in a browser with the script installed: the pill shows.
2. Navigate to a pane and back: the pill disappears and returns (SPA route watch).
3. Export with the checkbox on: the JSON holds `credential` and `settings`; with it off, no
   `credential` field.
4. Clear the site's localStorage (or use a fresh profile), import the file: the credential is
   verified (status line flips to paired after reload) and the preferences return.
5. Import a tampered file (wrong `kind`, or a token from an unrelated bridge): the report says
   so and nothing is written.

The key list in `src/keys.ts` mirrors the `kept` rows of `web/src/lib/storage-keys.test.ts` in
the collie main repo; when that table gains a key, move it here too.
