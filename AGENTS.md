# 项目规则

本项目为个人自用的浏览器用户脚本（userscript）集合，适用于 Tampermonkey / Violentmonkey。

## 脚本管理
1. 脚本必须分门别类保存到不同目录：按功能/用途建立类别子目录，脚本放入对应类别目录，不得散落在仓库根目录。
2. 新增脚本时必须及时维护 README.md：登记脚本名称、所在路径和功能说明，保证 README 与目录结构始终保持一致。

## 目录结构
每个脚本一个目录，固定布局如下（`github/gh-repo-size-badge/` 为例）：

```
github/gh-repo-size-badge/
├── build.ts                       # 打包脚本：组装 ==UserScript== 元数据横幅 + 调 Bun 打包
├── src/                           # TypeScript 源码，入口 main.ts
│   ├── main.ts                    # 入口：只做装配，逻辑拆到各模块
│   ├── <模块>.ts                  # 纯函数/可注入依赖的模块，便于单测
│   ├── <模块>.test.ts             # 与模块同名的单测
│   └── globals.d.ts               # GM_* 等宿主接口的最小类型声明（仅在用到时建）
├── dist/gh-repo-size-badge.user.js # 打包产物，必须提交入库
├── README.md                      # 中文说明（默认）
└── README_EN.md                   # 英文说明，与 README.md 互链
```

- 逻辑能写成纯函数就写成纯函数并配单测；DOM、请求、时间等副作用从外部注入，测试里传假实现。
- 单测文件与被测模块同名同目录，`bun test <脚本目录>/` 一次跑全。

## 元数据
元数据统一写在 `build.ts` 的 HEADER 横幅里，由打包注入产物，不手写进 `src/`：

- `@name` / `@name:zh-CN`、`@description` / `@description:zh-CN` 成对写，中文描述说明实际行为。
- `@namespace` 用 `bhxch.userscript.<脚本名>`；不得留 `your-username` 之类占位。迁入的历史脚本保留原 namespace。
- `@author`、`@version`（行为有变就升版本）、`@homepageURL`、`@supportURL`（均指向本仓库）。
- `@downloadURL` 与 `@updateURL` 都指向
  `https://raw.githubusercontent.com/bhxch/user-scripts/main/<脚本目录>/dist/<文件名>.user.js`。
- `@noframes` 必写，避免脚本在页面内嵌 iframe 里重复执行。
- `@icon` 用站点 favicon（`https://www.google.com/s2/favicons?sz=64&domain=<域名>`）；域名不确定就不写，别乱指。
- `@license MIT`（仓库根目录有 LICENSE 支撑）。
- `@grant` 按需申请，不用的管理器 API 不要声明；用到 GM_* 时在 `src/globals.d.ts` 补最小声明。

## 构建与发布
- 构建：`bun <脚本目录>/build.ts`，产物落在 `<脚本目录>/dist/`。
- 测试：`bun test <脚本目录>/`。
- **改完 `src/` 必须重新构建并把 `dist/` 产物一并提交**：raw URL 直接取 main 分支上的产物，不提交则安装/更新拿到的还是旧版。
- 产物应可复现：同样源码重建应无差异。
- README 的安装说明写清 raw 地址与"装好后自动更新"。

## 文档
- 中文是默认版本，英文版改名 `README_EN.md`，两版互链（中文版顶部链英文版，英文版顶部链中文版）。
- README 至少覆盖：安装、构建、测试、功能要点、手动验证清单。
- 根 README 的脚本表登记脚本名称、路径、功能说明，与目录结构保持一致。
