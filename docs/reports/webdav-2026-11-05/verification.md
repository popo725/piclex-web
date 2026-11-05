# Web 与 App 共用完整备份（2026-11-05）

入口：设置 → 照片数据 → 数据备份与恢复 → 本地文件 / 远程 WebDAV。

## 兼容范围

- 使用 App 的 `PicLex/PicLex-Backup-*` 文件夹和三个原生文件：`backup.json`、`photos.piclexdeck`、`learning-progress.json`。本地导出 ZIP，App 选择解压后的文件夹恢复。
- 原图、照片 UUID、创建/删除时间、原始标注、回收站保留；不支持网页练习的照片仍保存原始字节。照片同 ID 保留本机数据；练习记录仅采用严格较新的记录；FSRS 卡片与复习日志逐字节保留；事件 UUID 去重，跟读允许同词数的经验补差。
- Web 新学习记录保存原生格式所需的词键、事件与时间。旧 Web 已完成记录尽量由原有答题草稿、照片标注及经验时间恢复；没有保留的历史统计和词数无法完整重建，不虚构完整历史。
- 仅主动完整备份，不包含 App 后台增量同步。网页每个文件上限 64 MB、解压总量上限 96 MB；超过限制明确拒绝，不截断备份。不同网站域名的浏览器数据仍独立。
- Web 原生进度与照片在同一个 IndexedDB 事务中合并；经验账本为既有独立数据库，后续事务失败会提示可安全重试，不能声称跨库原子提交。

## WebDAV 连接

- HTTPS，浏览器直接连接，禁止 URL 中携带密码，禁止重定向转发认证；密码默认仅当前会话保留，勾选后才持久保存，不进入备份或分享 URL。
- WebDAV 服务须允许网页所在 Origin 的 CORS：`OPTIONS, PROPFIND, GET, HEAD, MKCOL, PUT, MOVE, DELETE`；请求头包括 `Authorization, Content-Type, Depth, Destination, Overwrite, If-None-Match`。不要把 `Authorization` 仅用允许头 `*` 代替。HEAD 长度与 GET 内容均用于校验。
- 上传使用随机暂存文件夹，完整上传后以 `MOVE / Overwrite:F` 发布，再读回校验 SHA256。失败只清理本次暂存目录；不覆盖/删除已有备份。已经发布但读回校验失败的文件夹保留供诊断，不误报成功。

## 验证方式

- Mac headless Chrome、移动 Chrome、WebKit，测试 WebDAV 服务器使用合成账号与合成照片；没有访问用户真实 WebDAV。
- 覆盖完整恢复、重复恢复、后续拼词和重新备份、本地 ZIP、回收站、旧 Web 进度、损坏文件、507 上传失败清理、读回损坏、认证重定向隔离及 320/390/844/1440 布局。
- Mac 编译 App 实际 `ProgressArchive.swift`、`UserLevel.swift`、`ProgressArchiveDomainValidator` 以及锁定的 Swift-FSRS 模型，验证浏览器导出的进度；另用原生 `PhotoArchiveManifest/Metadata`、`SceneLabel/VocabularyLearning`、ImageIO 和 SHA256 校验实际导出图片包。未启动 iOS 模拟器，未改动手机数据；不能替代真实 WebDAV 供应商和真机验收。
- `native-progress.json` 与 `native-fsrs-fractional.json` 是实际 Swift 编码生成的合成测试夹具，后者覆盖亚毫秒时间与 FSRS 卡片。

## 本地结果

221项单元测试通过；备份定向23通过、1跳过（WebKit的Playwright协议不支持伪造302，Chrome及独立请求策略测试覆盖）。其余设置、完成音、资源预热21项通过。首次完整回归暴露刷新竞态及工具302限制，修正后重跑备份全流程通过。
