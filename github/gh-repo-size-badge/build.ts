// github/gh-repo-size-badge/build.ts
//
// One command: bun github/gh-repo-size-badge/build.ts. Assembles the ==UserScript== metadata as a
// banner around Bun's bundle and writes the committed distribution artifact. No dependencies.

const RAW = "https://raw.githubusercontent.com/bhxch/user-scripts/main";
const ARTIFACT = "github/gh-repo-size-badge/dist/gh-repo-size-badge.user.js";

const HEADER = `// ==UserScript==
// @name         GitHub Repo Size Viewer
// @name:zh-CN   GitHub 仓库体积徽标
// @namespace    bhxch.userscript.gh-repo-size-badge
// @version      2.7.0
// @description  Show repository size beside repo titles and repo lists on GitHub; supports per-owner fine-grained tokens.
// @description:zh-CN 在 GitHub 仓库页、仓库列表页与星标页显示仓库体积，支持按 Owner 配置 Fine-grained Token。
// @author       bhxch
// @homepageURL  https://github.com/bhxch/user-scripts
// @supportURL   https://github.com/bhxch/user-scripts/issues
// @match        https://github.com/*
// @exclude      https://github.com/settings*
// @exclude      https://github.com/notifications*
// @exclude      https://github.com/marketplace*
// @exclude      https://github.com/login*
// @exclude      https://github.com/signup*
// @exclude      https://github.com/join*
// @exclude      https://github.com/orgs/*/dashboard*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @connect      api.github.com
// @run-at       document-idle
// @noframes
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @license      MIT
// @downloadURL  ${RAW}/${ARTIFACT}
// @updateURL    ${RAW}/${ARTIFACT}
// ==/UserScript==
`;

const result = await Bun.build({
  entrypoints: ["./github/gh-repo-size-badge/src/main.ts"],
  target: "browser",
  minify: true,
  banner: HEADER,
  outdir: "./github/gh-repo-size-badge/dist",
  naming: { entry: "gh-repo-size-badge.user.[ext]" },
});

if (!result.success) {
  console.error(result.logs);
  process.exit(1);
}
console.log(`built ${ARTIFACT}`);
