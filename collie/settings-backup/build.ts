// collie/settings-backup/build.ts
//
// One command: bun collie/settings-backup/build.ts. Assembles the ==UserScript== metadata as a
// banner around Bun's bundle and writes the committed distribution artifact. No dependencies.

const HEADER = `// ==UserScript==
// @name         Collie Backup & Restore
// @name:zh-CN   Collie 备份与恢复
// @namespace    altans.collie.userscript
// @version      0.1.0
// @description  Export/import your Collie pairing credential and local preferences as a file, from the Settings screen.
// @description:zh-CN 在 Collie 设置页将配对凭据与本地偏好导出为文件，或从文件导入。
// @author       Collie contributors
// @match        *://*/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
// 本仓库暂无 git remote，@updateURL/@downloadURL 无处可指；确定托管地址后补回这两行。
`;

const result = await Bun.build({
  entrypoints: ["./collie/settings-backup/src/main.ts"],
  target: "browser",
  minify: true,
  banner: HEADER,
  outdir: "./collie/settings-backup/dist",
  naming: { entry: "collie-backup.user.[ext]" },
});

if (!result.success) {
  console.error(result.logs);
  process.exit(1);
}
console.log("built collie/settings-backup/dist/collie-backup.user.js");
