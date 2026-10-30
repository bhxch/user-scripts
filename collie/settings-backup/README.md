# 用户脚本：Collie 备份与恢复

英文说明见 [README_EN.md](README_EN.md)。

在任意官方发布的 Collie 上，为设置页增加基于文件的配对凭据与本地偏好导出/导入功能，
是应用内置剪贴板备份/恢复的补充，不改动应用本体与桥。迁自 collie 仓库的
`feat/userscript-settings-backup` 分支。

## 安装

Violentmonkey / Tampermonkey / Greasemonkey：把 `dist/collie-backup.user.js` 通过脚本管理器
的"从文件安装"导入（本仓库暂无 remote，脚本元数据未写 `@updateURL`/`@downloadURL`，
仓库托管后补回）。`@grant none`：脚本不依赖任何管理器 API。

## 构建

```sh
bun collie/settings-backup/build.ts   # -> collie/settings-backup/dist/collie-backup.user.js
```

## 测试

```sh
bun test collie/settings-backup/
```

## 功能

- 路径以 `/settings` 结尾（经 `<meta name="collie-base">` 兼容 basePath 挂载），且主机的
  `/api/health` 应答符合 Collie 形状时，右下角出现 `Collie` 浮动按钮。
- **导出**下载 `collie-backup-YYYYMMDD-HHmmss.json`：包含配对凭据（`collie:device-token` +
  `collie:pairing-expires`，可经复选框选择是否携带）与应用 wipe 时保留的全部偏好键。
  导出文件含有效凭据，等同密码，请妥善保管。
- **导入**解析文件，写入前先向桥验证凭据（被拒或不可达的凭据只做报告，绝不落盘），并按
  同一允许清单合并偏好（文件未涉及的键不动）。重新加载页面后，偏好（主题、语言）在绘制
  前生效。
- 面板跟随应用语言（`zh*` → 中文，其余英文）。

## 手动验证

1. 起一个 Collie（dev lane `next` 端口 8788，或已部署实例），在装好脚本的浏览器打开
   `https://<host>/settings`：浮钮出现。
2. 进入其它面板再返回：浮钮消失又出现（SPA 路由监听）。
3. 勾选复选框导出：JSON 同时含 `credential` 与 `settings`；不勾则无 `credential` 字段。
4. 清空站点 localStorage（或用全新 profile）后导入文件：凭据经桥验证（重载后状态行变为
   已配对），偏好恢复。
5. 导入被篡改的文件（`kind` 不对，或用了无关桥的 token）：报告说明原因，且不写入任何内容。

`src/keys.ts` 的键清单镜像 collie 主仓库 `web/src/lib/storage-keys.test.ts` 的 `kept` 行；
那张表新增键时，同步挪到这里。
