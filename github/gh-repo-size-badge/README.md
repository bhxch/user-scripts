# 用户脚本：GitHub 仓库体积徽标

English docs in [README_EN.md](README_EN.md)。

在 GitHub 仓库页、仓库列表页（用户/组织的 `repositories`）与星标页（`stars`）上，
把仓库体积以小徽标的形式显示在仓库名旁边。体积取自 GitHub REST API 的
`repos/{owner}/{repo}` 接口的 `size` 字段（单位 KB）。

## 安装

Tampermonkey / Violentmonkey：把 `dist/gh-repo-size-badge.user.js` 通过脚本管理器的
"从文件安装"导入；或直接打开下面的地址安装：

```
https://raw.githubusercontent.com/bhxch/user-scripts/main/github/gh-repo-size-badge/dist/gh-repo-size-badge.user.js
```

脚本元数据里已写 `@downloadURL` / `@updateURL`，装好后脚本管理器会按版本号自动更新。

## 构建

```sh
bun github/gh-repo-size-badge/build.ts   # -> github/gh-repo-size-badge/dist/gh-repo-size-badge.user.js
```

## 测试

```sh
bun test github/gh-repo-size-badge/      # 页面解析、体积格式化、Token 解析、API 错误映射
```

## 功能

- **仓库页**：仓库标题旁出现 `· 12.4 MB` 形式的徽标，鼠标悬停显示体积与认证方式
  （`Token (owner)` 或"匿名请求"）。
- **列表页 / 星标页**：每个仓库条目旁插入同样的小徽标，样式更紧凑。
- **多 Owner Token**：按 Owner（用户名或组织名，大小写不敏感）配置 Fine-grained PAT，
  未命中的 Owner 依次回退到 `*` 兜底 Token，再退到匿名请求。菜单里可设置/删除/查看
  （查看时 Token 打码显示）。
- **限流保护**：成功结果缓存 5 分钟；匿名请求在列表页最多发 10 个，配了 Token 的仓库
  不受此限制；失败结果缓存 60 秒，避免同一错误反复请求。
- **错误提示**：取不到体积时显示红色 `· ?`，悬停给出具体原因（仓库不存在/私有、
  Token 失效、API 速率限制、网络错误等）。
- **SPA 感知**：GitHub 是 turbo/pjax 单页应用，脚本用 turbo/pjax 事件 + MutationObserver
  感知路由与 DOM 变化，切页后徽标会自动重算；GitHub 渲染标题慢时会重试插入点。
- **菜单**：脚本管理器菜单里有 Token 设置、删除、查看与"诊断当前页面"（打印页面类型、
  标题锚点、Token 来源与一次 API 结果）。

## 手动验证

1. 装好脚本打开 `github.com/zai-org/ZCode`：仓库标题旁出现体积徽标，悬停显示
   `仓库大小` 与 `认证方式`。
2. 打开 `github.com/zai-org?tab=repositories` 与 `?tab=stars`：列表条目旁出现小徽标。
3. 不配 Token 时打开一个私有仓库：显示红色 `· ?`，悬停提示"仓库不存在，或为私有仓库"。
4. 菜单里给 `zai-org` 配一个 Token：徽标恢复显示，悬停显示 `Token (zai-org)`。
5. 打开 `github.com/settings/profile`：无任何徽标（该路径在 `@exclude` 内）。

（以上场景需在真实页面回归；GitHub 改版后可按此清单重验。）
