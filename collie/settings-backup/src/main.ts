// userscript/src/main.ts
//
// Entry: watch for a Collie settings screen, then mount the panel. The page is not trusted:
// the path check and the open /api/health route decide everything, and the script reads and
// writes only the localStorage keys the allowlist names. Export downloads a JSON file; import
// verifies the credential before any write and merges preferences through the allowlist.

import { backupFileName, buildBackupFile, parseBackupFile, type ParseResult } from "./backup-file";
import { applySettings, collectBackup } from "./collect";
import { EXPIRES_KEY, TOKEN_KEY } from "./keys";
import { isSettingsPath, mountPrefix, probeHealth, settingsPathname } from "./probe";
import { mountPanel, pickTexts } from "./ui";
import { verifyCredential } from "./verify";

const BASE_META = 'meta[name="collie-base"]';
const PROBE_INTERVAL_MS = 5000;

function mountBase(): string {
  return mountPrefix(document.querySelector(BASE_META)?.getAttribute("content") ?? null);
}

function buttonVisible(visible: boolean, handle: { hide(): void; show(): void }): void {
  if (visible) handle.show();
  else handle.hide();
}

function download(json: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function main(): Promise<void> {
  const texts = pickTexts(localStorage.getItem("collie:locale:v1"));
  const panel = mountPanel(document, texts, {
    onExport,
    onImport,
  });
  const token = localStorage.getItem(TOKEN_KEY);
  const count = Object.keys(collectBackup(localStorage, false).settings).length;
  panel.status(`${token !== null ? texts.statusPaired : texts.statusUnpaired} · ${texts.prefCount(count)}`);

  let lastProbe = 0;
  let confirmed = false;

  async function refresh(): Promise<void> {
    const wanted = isSettingsPath(settingsPathname(mountBase(), location.pathname));
    if (wanted && !confirmed && Date.now() - lastProbe > PROBE_INTERVAL_MS) {
      lastProbe = Date.now();
      confirmed = await probeHealth(fetch, mountBase());
    }
    const visible = wanted && confirmed;
    buttonVisible(visible, panel);
  }

  // The wrappers patch the history methods once and re-run refresh() on every SPA route write,
  // so the panel follows the router without a MutationObserver.
  const originalPush = history.pushState.bind(history);
  history.pushState = (...args) => {
    originalPush(...args);
    void refresh();
  };
  const originalReplace = history.replaceState.bind(history);
  history.replaceState = (...args) => {
    originalReplace(...args);
    void refresh();
  };
  window.addEventListener("popstate", () => void refresh());
  void refresh();

  function onExport(includeCredential: boolean): void {
    const { credential, settings } = collectBackup(localStorage, includeCredential);
    const file = buildBackupFile({
      exportedAt: new Date().toISOString(),
      origin: location.origin,
      credential,
      settings,
    });
    download(JSON.stringify(file, null, 2), backupFileName(new Date()));
    panel.report([texts.prefCount(Object.keys(settings).length)]);
  }

  async function onImport(file: File): Promise<void> {
    let parsed: ParseResult;
    try {
      parsed = parseBackupFile(await file.text());
    } catch {
      panel.report([texts.invalidFile]);
      return;
    }
    if (!parsed.ok) {
      panel.report([texts.badFile(parsed.reason)]);
      return;
    }
    const lines: string[] = [];
    const { credential, settings } = parsed.value;
    if (credential !== undefined) {
      const verdict = await verifyCredential(credential.token, fetch, mountBase());
      if (verdict === "ok") {
        localStorage.setItem(TOKEN_KEY, credential.token);
        if (credential.expires !== undefined) localStorage.setItem(EXPIRES_KEY, credential.expires);
        lines.push(texts.credOk);
      } else if (verdict === "refused") {
        lines.push(texts.credRefused);
      } else {
        lines.push(texts.credUnreachable);
      }
    }
    const written = applySettings(localStorage, settings);
    lines.push(texts.reportImported(written.length));
    panel.report(lines);
    panel.showReload();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => void main());
} else {
  void main();
}
