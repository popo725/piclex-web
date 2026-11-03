# PicLex Web

把眼前的生活，变成英语。一个无需登录的照片英语学习器。

[在线体验](https://zhaoolee.com/piclex-web/) · [iPhone App](https://apps.apple.com/app/id6808490052)

![PicLex Web 首页](docs/home.png)

## 现在可以做什么

- 三个场景、18 个词：看图拼词、逐字纠错、发音、例句和本轮统计。
- 浏览器自动保存各卡组进度，支持刷新续练、重新练习和深浅外观。
- 分享示例卡组的独立链接；下载 `.piclexdeck` 在 iPhone App 中打开。
- 导入 App 或 PicLex Studio 导出的 `.piclexdeck`。照片和词汇保存在当前浏览器的 IndexedDB，不上传服务器。
- 重复导入完全相同的文件保留进度；损坏文件不覆盖已有卡组。

这是独立运行的公开体验版。现有手机局域网前端暂时仍在 PicLex 仓库维护。本仓库不需要 iPhone、API Key、模型服务或登录账号。

## 本地运行

需要 Node.js 22.12+。依赖版本由 `package-lock.json` 固定。

```sh
npm ci
npm run dev
```

打开终端给出的本机地址（默认 `http://127.0.0.1:18120`）。

```sh
npm test                   # 练习状态、原有交互规则、卡组解析与校验
npm run build             # TypeScript + 独立静态产物 dist/
npm run preview           # 预览构建结果
npm run test:browser      # 桌面/手机宽度 Chrome 验收；须先 build，需安装 Chrome
```

示例包和照片已随仓库提供。修改示例内容后运行 `npm run decks:build`。该命令使用确定性日期生成包，保留卡组、照片 ID；发布内容变更时还应递增来源清单的卡组版本。

## 目录与迁移

```text
apps/public/              公开站入口、浏览器存储、示例内容
apps/lan/                 后续迁入说明；当前没有伪装成可用的局域网入口
packages/learning-ui/     照片定位、拼写展示、例句遮罩、字符反馈、浏览器发音
packages/practice/        公开版练习状态机（局域网仍由手机判题）
packages/deck-format/     原生照片卡组 v1 读取与哈希校验
```

复用来源及指纹见 [extracted-files.json](docs/extracted-files.json)，阶段边界见 [迁移说明](docs/migration.md)。当前阶段不更改 PicLex App 的构建、局域网服务或手机数据。

## 发布

本项目是纯静态站点。`dist/` 可部署到 GitHub Pages 或其他静态托管；使用相对资源路径和 hash 路由，支持子目录部署。

仓库的 GitHub Actions 执行单元检查、构建、Chrome 浏览器验收，再部署 GitHub Pages。仓库 Pages 的构建来源需设为 GitHub Actions。Fork 后请更新 App/GitHub 链接及 `scripts/build-demo-decks.mjs` 中的公开订阅地址，然后重建示例。

公开示例来源协议地址为 `https://zhaoolee.com/piclex-web/source.json`，采用现有 `com.piclex.deck-source` v1 协议。此地址须在 Pages 发布完成后使用。网页内目前仅提供示例和文件导入，不提供远程来源订阅或自动更新 UI。

独立域名镜像的构建、验证与回滚见 [部署说明](deploy/README.md)。两个域名的浏览器进度分别保存。

## 支持范围

- 浏览器版单包上限 32 MB，解压后总量上限 96 MB，最多 500 张照片、5000 个词。
- 图片支持 JPEG、PNG；HEIC/HEIF 请先在 App/Studio 中转换。不会静默丢弃不支持的内容。
- 发音使用浏览器/系统提供的英语语音，音色和离线能力随环境变化。
- 不包含账号、跨设备学习进度同步、在线 AI 制卡或付费解锁。网页进度不会自动同步到 App。
- 本地卡组使用文件分享；独立网页链接只分享公开示例，不能带走接收者访问不到的本地照片。
- 清理站点数据或浏览器回收存储可能移除进度与导入卡组，请保留原始文件。
- 默认不接入统计 SDK。不能用 GitHub Stars、访问量或本地统计冒充实际 App 转化；增长分析需另接经过明确选择的统计方案。

## 许可

代码与原创例句使用 [MIT](LICENSE)。照片使用各自许可，并不因与代码一起分发而改为 MIT；来源、作者与适用许可见 [素材说明](ASSET_LICENSES.md)。
