# browser-user-scripts

个人自用的浏览器用户脚本集合，适用于 Tampermonkey / Violentmonkey。

## 脚本一览

| 脚本 | 路径 | 功能说明 |
|------|------|----------|
| Collie Backup & Restore | `collie/settings-backup/` | 在 Collie 设置页将配对凭据与本地偏好导出为 JSON 文件，或从文件导入（凭据先经 bridge 验证再写入） |

安装：把 `collie/settings-backup/dist/collie-backup.user.js` 通过脚本管理器的"从文件安装"导入。
构建：`bun collie/settings-backup/build.ts`；测试：`bun test collie/settings-backup/`。
脚本详情见 [collie/settings-backup/README.md](collie/settings-backup/README.md)。
