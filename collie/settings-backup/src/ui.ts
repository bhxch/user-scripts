// userscript/src/ui.ts
//
// The floating panel: a bottom-right pill button and a small card, styled by one <style>
// element under the collie-bak- class prefix. The script owns no React DOM, so nothing here
// anchors on the app's markup; only the callbacks move data. mountPanel is thin DOM wiring,
// exercised by hand; pickTexts carries the panel's two languages and is unit tested.

export interface PanelTexts {
  title: string;
  statusPaired: string;
  statusUnpaired: string;
  prefCount: (n: number) => string;
  exportLabel: string;
  includeCred: string;
  importLabel: string;
  reload: string;
  warn: string;
  reportImported: (n: number) => string;
  credOk: string;
  credRefused: string;
  credUnreachable: string;
  badFile: (reason: string) => string;
  invalidFile: string;
}

const EN: PanelTexts = {
  title: "Collie backup",
  statusPaired: "Paired",
  statusUnpaired: "Not paired",
  prefCount: (n) => `${n} preference keys`,
  exportLabel: "Export file",
  includeCred: "include credential",
  importLabel: "Import from file",
  reload: "Reload to apply",
  warn: "The export file carries your pairing credential. Treat it like a password.",
  reportImported: (n) => `Wrote ${n} preference keys.`,
  credOk: "Credential restored (verified by the bridge).",
  credRefused: "Credential refused by the bridge; nothing written.",
  credUnreachable: "Bridge unreachable; credential not written.",
  badFile: (reason) => `Invalid file (${reason}).`,
  invalidFile: "Could not read the file.",
};

const ZH: PanelTexts = {
  title: "Collie 备份与恢复",
  statusPaired: "已配对",
  statusUnpaired: "未配对",
  prefCount: (n) => `${n} 项偏好`,
  exportLabel: "导出文件",
  includeCred: "含配对凭据",
  importLabel: "从文件导入",
  reload: "重新加载页面生效",
  warn: "导出文件含配对凭据，等同密码，请妥善保管。",
  reportImported: (n) => `已写入 ${n} 项偏好。`,
  credOk: "凭据已恢复（桥验证通过）。",
  credRefused: "凭据被桥拒绝，未写入。",
  credUnreachable: "桥不可达，凭据未写入。",
  badFile: (reason) => `文件无效（${reason}）。`,
  invalidFile: "无法读取文件。",
};

export function pickTexts(locale: string | null): PanelTexts {
  return locale !== null && locale.startsWith("zh") ? ZH : EN;
}

export interface PanelCallbacks {
  onExport(includeCredential: boolean): void;
  onImport(file: File): void;
}

export interface PanelHandle {
  show(): void;
  hide(): void;
  report(lines: string[]): void;
  showReload(): void;
  status(line: string): void;
}

export function mountPanel(host: Document, texts: PanelTexts, callbacks: PanelCallbacks): PanelHandle {
  const style = host.createElement("style");
  style.textContent = `
.collie-bak-button{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0));z-index:2147483000;
  padding:10px 14px;border-radius:9999px;border:1px solid rgba(128,128,128,.4);background:rgba(20,20,20,.85);
  color:#fff;font:13px/1.2 system-ui,sans-serif;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.35)}
.collie-bak-panel{position:fixed;right:16px;bottom:calc(60px + env(safe-area-inset-bottom,0));z-index:2147483000;
  width:280px;padding:14px;border-radius:12px;border:1px solid rgba(128,128,128,.4);background:rgba(20,20,20,.92);
  color:#fff;font:13px/1.5 system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.4);display:none}
.collie-bak-panel.collie-bak-open{display:block}
.collie-bak-panel h3{margin:0 0 8px;font-size:14px}
.collie-bak-status{margin:0 0 8px;opacity:.8}
.collie-bak-warn{margin:8px 0;padding:6px 8px;border-radius:6px;background:rgba(255,176,32,.15);font-size:12px}
.collie-bak-row{display:flex;gap:8px;align-items:center;margin:6px 0}
.collie-bak-act{flex:1;padding:8px 10px;border-radius:8px;border:1px solid rgba(128,128,128,.4);
  background:transparent;color:inherit;font:inherit;cursor:pointer;text-align:center}
.collie-bak-act:active{opacity:.7}
.collie-bak-report{margin:8px 0 0;white-space:pre-wrap;font-size:12px;opacity:.9}
.collie-bak-reload{display:none;margin-top:8px;width:100%}
.collie-bak-reload.collie-bak-show{display:block}
`;
  host.head.appendChild(style);

  const button = host.createElement("button");
  button.className = "collie-bak-button";
  button.type = "button";
  button.textContent = "Collie";
  button.style.display = "none";

  const panel = host.createElement("div");
  panel.className = "collie-bak-panel";

  const heading = host.createElement("h3");
  heading.textContent = texts.title;

  const status = host.createElement("p");
  status.className = "collie-bak-status";

  const exportButton = host.createElement("button");
  exportButton.className = "collie-bak-act";
  exportButton.type = "button";
  exportButton.textContent = texts.exportLabel;

  const includeCred = host.createElement("input");
  includeCred.type = "checkbox";
  includeCred.checked = true;
  const includeCredLabel = host.createElement("label");
  includeCredLabel.className = "collie-bak-row";
  includeCredLabel.appendChild(includeCred);
  includeCredLabel.appendChild(host.createTextNode(texts.includeCred));

  const importButton = host.createElement("button");
  importButton.className = "collie-bak-act";
  importButton.type = "button";
  importButton.textContent = texts.importLabel;

  const fileInput = host.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "application/json,.json";
  fileInput.style.display = "none";

  const warn = host.createElement("p");
  warn.className = "collie-bak-warn";
  warn.textContent = texts.warn;

  const report = host.createElement("div");
  report.className = "collie-bak-report";

  const reloadButton = host.createElement("button");
  reloadButton.className = "collie-bak-act collie-bak-reload";
  reloadButton.type = "button";
  reloadButton.textContent = texts.reload;

  panel.appendChild(heading);
  panel.appendChild(status);
  panel.appendChild(exportButton);
  panel.appendChild(includeCredLabel);
  panel.appendChild(importButton);
  panel.appendChild(fileInput);
  panel.appendChild(warn);
  panel.appendChild(report);
  panel.appendChild(reloadButton);
  host.body.appendChild(button);
  host.body.appendChild(panel);

  button.addEventListener("click", () => panel.classList.toggle("collie-bak-open"));
  exportButton.addEventListener("click", () => callbacks.onExport(includeCred.checked));
  importButton.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (file) callbacks.onImport(file);
    fileInput.value = "";
  });
  reloadButton.addEventListener("click", () => host.defaultView?.location.reload());

  return {
    show() {
      button.style.display = "";
    },
    hide() {
      button.style.display = "none";
      panel.classList.remove("collie-bak-open");
    },
    report(lines: string[]) {
      report.textContent = lines.join("\n");
    },
    showReload() {
      reloadButton.classList.add("collie-bak-show");
    },
    status(line: string) {
      status.textContent = line;
    },
  };
}
