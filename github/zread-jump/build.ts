// github/zread-jump/build.ts
//
// One command: bun github/zread-jump/build.ts. Assembles the ==UserScript== metadata as a
// banner around Bun's bundle and writes the committed distribution artifact. No dependencies.

const HEADER = `// ==UserScript==
// @name         Zread ↔ GitHub Jump
// @name:zh-CN   Zread ↔ GitHub 互跳
// @namespace    bhxch.userscript.zread-jump
// @version      0.1.0
// @description  Cross-link GitHub repos with their Zread pages; any subpath, query or route leads to the other site's repo home.
// @description:zh-CN 在 GitHub 仓库页与 Zread 仓库页之间互相跳转：任意子路径、参数、路由都只取对方仓库首页。
// @author       bhxch
// @match        https://github.com/*
// @match        https://zread.ai/*
// @grant        none
// @run-at       document-idle
// @noframes
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zread.ai
// ==/UserScript==
// 本仓库暂无 git remote，@updateURL/@downloadURL 无处可指；确定托管地址后补回这两行。
`;

const result = await Bun.build({
  entrypoints: ["./github/zread-jump/src/main.ts"],
  target: "browser",
  minify: true,
  banner: HEADER,
  outdir: "./github/zread-jump/dist",
  naming: { entry: "zread-jump.user.[ext]" },
});

if (!result.success) {
  console.error(result.logs);
  process.exit(1);
}
console.log("built github/zread-jump/dist/zread-jump.user.js");
