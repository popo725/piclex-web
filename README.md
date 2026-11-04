# 摄影学英语 Web

把眼前的生活，变成英语。一个无需登录的照片英语学习器。

[在线体验](https://piclex.v2fy.com/piclex-web/) · [GitHub Pages 镜像](https://zhaoolee.com/piclex-web/) · [iPhone App](https://apps.apple.com/app/id6808490052)

![摄影学英语 Web 首页](docs/home.png)

## 现在可以做什么

- 与 App 相同的品牌图标、原生图标和「拍摄、学习、设置」三个底部 Tab；拍摄可导入照片、填写词汇并制作本地卡组，未保存草稿在栏目切换时保留。
- 同一结构适配 320–1440 像素宽度：手机单列，平板双列卡组，桌面三列卡组和双列设置；学习页保持居中单列，矮屏保留输入与底部导航。
- 学习页按 App 结构排列：顶部薯薯头像／等级与卡组合为同一个控件，模块选中图标同源；PC 默认可点击键盘并同步实体按键；拼单词与全部自由听写难度在手机、平板、桌面均显示网页键盘，练习输入框从挂载起禁止系统键盘弹出。键盘与答题操作保留底部空间，短屏只滚动上方照片／题目，提示条不覆盖按键。拼词键盘统一为三行26字母，退格位于输入区。
- 正确字母渐入、波纹及经验粒子沿 App 路径飞入经验条；支持减少动态效果。
- 与 App 相同的等级公式、拼写／句子／跟读计分及薯薯求生经验收支；经典键盘音默认可用（LV3是更多音色的门槛，Web暂未新增其他音色）；LV6 快拼、LV7 粒子样式。
- 设置 → 实验室可玩薯薯求生；复用 App 游戏、素材、成就和存档，离开前保存。

- 复用现有 6 套公开卡组：Basic English 850、程序员工作英语、程序员 Vibe Coding、下班后去摄影、新概念英语第二册、经典英语歌曲；共 346 张卡片、1,941 个词条。歌曲卡组附52段原声片段，例句优先播放原声，单词继续使用英文朗读。
- 按移动端学习页组织拼单词、练听力、练口语；保留局部彩色光框、照片选题、快拼、逐字纠错和答对自动前进。
- 词块拼句、三档自由听写、随身听，分别保留草稿；跟读能力随浏览器支持情况提供。在线练习只加载轻量词条数据和当前图片，不预先下载完整卡组。
- 浏览器自动保存各卡组进度，支持刷新续练、重新练习和深浅外观。
- 分享公开卡组的独立链接；下载 `.piclexdeck` 在 iPhone App 中打开。
- 导入 App 或摄影学英语 Studio 导出的 `.piclexdeck`。照片和词汇保存在当前浏览器的 IndexedDB，不上传服务器。
- 重复导入完全相同的文件保留进度；损坏文件不覆盖已有卡组。

这是独立运行的公开体验版。现有手机局域网前端暂时仍在 PicLex 仓库维护。本仓库不需要 iPhone、API Key、模型服务或登录账号。

详细行为、原生来源与浏览器能力边界见 [学习页对齐说明](docs/native-learning-parity.md)。

## 本地运行

需要 Node.js 22.12+。依赖版本由 `package-lock.json` 固定。

```sh
npm ci
npm run content:build
npm run dev
```

打开终端给出的本机地址（默认 `http://127.0.0.1:18120/piclex-web/`）。

```sh
npm test                   # 练习状态、原有交互规则、卡组解析与校验
npm run build             # TypeScript + 独立静态产物 dist/
npm run preview           # 预览构建结果
npm run test:browser      # 桌面/手机宽度 Chrome 验收；须先 build，需安装 Chrome
```

`content/snapshot.json` 固定公开来源、卡组 ID、版本、大小与哈希。`npm run content:build` 只从已经公开的来源下载并验证内容，生成被 Git 忽略的 `apps/public/public/library/` 和来源清单。原始大包和课程内容不提交到源码仓库。后续更新卡组时先刷新并审查来源快照，再构建、验证和发布；本版本不是实时订阅同步。

原先的三个照片示例只保留为 `tests/fixtures/demo/` 中的测试夹具；`npm run decks:build` 用于重建这些夹具。

## 目录与迁移

```text
apps/public/              公开站入口、浏览器存储、生成的公开内容
apps/lan/                 后续迁入说明；当前没有伪装成可用的局域网入口
packages/learning-ui/     照片定位、拼写展示、例句遮罩、字符反馈、浏览器发音
packages/practice/        公开版练习状态机（局域网仍由手机判题）
packages/deck-format/     原生照片卡组 v1 读取与哈希校验
```

复用来源及指纹见 [extracted-files.json](docs/extracted-files.json)，阶段边界见 [迁移说明](docs/migration.md)。当前阶段不更改 PicLex App 的构建、局域网服务或手机数据。

## 发布

本项目是纯静态站点。`dist/` 可部署到 GitHub Pages 或其他静态托管；两个站点统一使用 `/piclex-web/` 与 hash 路由，同一份构建产物可直接部署到两处。

仓库的 GitHub Actions 校验逻辑与部署脚本、下载固定版本的公开内容、构建并运行 Chrome 浏览器验收，然后部署 GitHub Pages。仓库 Pages 的构建来源需设为 GitHub Actions。Fork 后应审查公开内容来源与使用范围，并更新产品链接。

公开来源协议地址为 `https://piclex.v2fy.com/piclex-web/source.json`，Pages 镜像对应 `https://zhaoolee.com/piclex-web/source.json`；都采用 `com.piclex.deck-source` v1 和站内绝对路径，原始卡组字节与哈希保持一致。付费卡组不进入公开构建。网页目前不提供自行添加来源或自动订阅更新 UI。

独立域名镜像的构建、验证与回滚见 [部署说明](deploy/README.md)。两个域名的浏览器进度分别保存。

## 支持范围

- 浏览器版单包上限 64 MB，解压后总量上限 96 MB，最多 500 张照片、5000 个词。
- 图片支持 JPEG、PNG；HEIC/HEIF 请先在 App/Studio 中转换。不会静默丢弃不支持的内容。
- 发音使用浏览器/系统提供的英语语音，音色和离线能力随环境变化。
- 不包含账号、跨设备学习进度同步、在线 AI 制卡或付费解锁。网页进度不会自动同步到 App。
- 本地卡组使用文件分享；独立网页链接只分享公开卡组，不能带走接收者访问不到的本地照片。
- 清理站点数据或浏览器回收存储可能移除进度与导入卡组，请保留原始文件。
- 默认不接入统计 SDK。不能用 GitHub Stars、访问量或本地统计冒充实际 App 转化；增长分析需另接经过明确选择的统计方案。

## 许可

代码与原创界面文案使用 [MIT](LICENSE)。现有卡组及其文字、图片不因公开访问或与代码一起分发而改为 MIT；内容权利以原来源为准。原测试夹具的照片许可见 [素材说明](ASSET_LICENSES.md)。

独立封面：公开卡组和本地导入包支持单独定制的横版、竖版封面。首页使用横版，卡组列表使用竖版；图片完整显示。旧卡组保留原封面回退。封面不参与学习内容指纹，更换封面时保留浏览器进度。协议约定见 [摄影学英语卡组来源协议](https://github.com/zhaoolee/PicLex/blob/main/docs/deck-source-protocol.md)。
