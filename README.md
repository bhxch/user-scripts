# browser-user-scripts

个人自用的浏览器用户脚本集合，适用于 Tampermonkey / Violentmonkey。

## 脚本一览

| 脚本 | 路径 | 功能说明 |
|------|------|----------|
| Collie Backup & Restore | `collie/settings-backup/` | 在 Collie 设置页将配对凭据与本地偏好导出为 JSON 文件，或从文件导入（凭据先经 bridge 验证再写入） |
| Zread ↔ GitHub Jump | `github/zread-jump/` | GitHub 仓库页与 Zread 仓库页互相加跳转按钮，任意子路径/参数/路由只取对方仓库首页 |

安装：把对应脚本目录下的 `dist/*.user.js` 通过脚本管理器的"从文件安装"导入。
构建：`bun <脚本目录>/build.ts`；测试：`bun test <脚本目录>/`。
详情见各脚本目录下的 README（[collie/settings-backup](collie/settings-backup/README.md)、
[github/zread-jump](github/zread-jump/README.md)）。
