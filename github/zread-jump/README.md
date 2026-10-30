# 用户脚本：Zread ↔ GitHub 互跳

English docs in [README_EN.md](README_EN.md)。

在 GitHub 仓库页与 [Zread](https://zread.ai) 仓库页之间互相跳转：GitHub 侧在动作区加
"Zread" 按钮，Zread 侧在页头加 GitHub 图标。任意子路径、query、hash、SPA 路由都只取
`owner/repo` 两段，直接跳对方的仓库首页（如 `github.com/zai-org/ZCode` ↔
`zread.ai/zai-org/ZCode`）。

## 安装

Tampermonkey / Violentmonkey：把 `dist/zread-jump.user.js` 通过脚本管理器的"从文件安装"
导入（本仓库暂无 remote，脚本元数据未写 `@updateURL`/`@downloadURL`，仓库托管后补回）。
`@grant none`：脚本不依赖任何管理器 API。

## 构建

```sh
bun github/zread-jump/build.ts   # -> github/zread-jump/dist/zread-jump.user.js
```

## 测试

```sh
bun test github/zread-jump/      # URL 映射纯函数单测
```

## 功能

- **GitHub 仓库页**（概览 / tree）：Star 按钮旁出现 "Zread" 按钮；代码视图（blob 等无
  Star 按钮的页面）退而插在面包屑仓库名旁。样式自带浅色/深色（跟随系统）。
- **Zread 仓库页**：页头仓库名下拉旁的动作组里出现 GitHub 图标（`currentColor`，随主题
  明暗自适应）。
- **只认 `owner/repo`**：`/o/r/blob/main/src/x.ts?plain=1#L12`、Zread 的 `/o/r/chat/…`
  等一律跳对方 `/o/r`；GitHub 顶层固定路由（`/settings`、`/explore`、`/orgs/…`）与用户
  页固定子路由（`/u/repos`、`/u/packages` 等）、Zread 功能路由（`/login`、`/explore` 等）
  均排除。
- **SPA 路由感知**：GitHub（turbo/pjax）与 Zread（Next.js）都是单页应用，用
  MutationObserver + 短轮询兜底，切页即时更新按钮位置与链接；离开仓库页按钮自动消失。
- **安全降级**：GitHub 侧以 Star 按钮/面包屑锚点的存在为"确实是仓库页"的判据，站点改版
  找不到锚点时按钮隐藏，绝不误注入。

## 手动验证

1. 装好脚本打开 `github.com/zai-org/ZCode/blob/main/README.md`：面包屑出现 Zread 按钮，
   链接为 `https://zread.ai/zai-org/ZCode`；连续停留数秒无多余节点堆积。
2. 点面包屑仓库名回到树视图：按钮挪到 Star 按钮旁；再 `pushState` 到 `/explore`：按钮
   连同包裹节点一起消失。
3. 打开 `zread.ai/zai-org/ZCode`：页头动作组出现 GitHub 图标，指向
   `github.com/zai-org/ZCode`；打开 `zread.ai/` 首页与 `github.com/explore`：无按钮。

（以上场景已用 agent-browser 在真实页面回归通过；GitHub 改版后可按此清单重验。）
