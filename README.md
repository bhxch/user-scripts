# browser-user-scripts

个人自用的浏览器用户脚本集合，适用于 Tampermonkey / Violentmonkey。

## 脚本一览

| 脚本 | 路径 | 功能说明 |
|------|------|----------|
| Collie Backup & Restore | `collie/settings-backup/` | 在 Collie 设置页将配对凭据与本地偏好导出为 JSON 文件，或从文件导入（凭据先经 bridge 验证再写入） |
| Zread ↔ GitHub Jump | `github/zread-jump/` | GitHub 仓库页与 Zread 仓库页互相加跳转按钮，任意子路径/参数/路由只取对方仓库首页 |
| GitHub Repo Size Badge | `github/gh-repo-size-badge/` | 在 GitHub 仓库页、仓库列表页与星标页显示仓库体积，支持按 Owner 配置 Fine-grained Token |

安装：把对应脚本目录下的 `dist/*.user.js` 通过脚本管理器的"从文件安装"导入，或直接打开
仓库里的 raw 地址安装：

```
https://raw.githubusercontent.com/bhxch/user-scripts/main/<脚本目录>/dist/<文件名>.user.js
```

所有脚本的元数据都写了 `@updateURL` / `@downloadURL`，装好后由脚本管理器按版本号自动更新。
构建：`bun <脚本目录>/build.ts`；测试：`bun test <脚本目录>/`。
详情见各脚本目录下的 README（[collie/settings-backup](collie/settings-backup/README.md)、
[github/zread-jump](github/zread-jump/README.md)、
[github/gh-repo-size-badge](github/gh-repo-size-badge/README.md)）。
