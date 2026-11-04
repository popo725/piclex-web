# 摄影学英语卡组来源协议 v1

官方目录、作者订阅和 Studio 导出使用同一内容协议。备份与恢复保持独立；旧 ZIP 分享包仍可一次性导入，没有清单时不推断更新关系。

## 清单

固定 HTTPS URL 返回 JSON，最多 2 MiB，不重定向。`format` 为 `com.piclex.deck-source`，`schemaVersion` 为 `1`，`title` 为来源名称（1–120 字符），`decks` 为 0–1000 个卡组描述。一个卡组的来源也使用相同数组结构。重复 deckID 拒绝，卡组可独立选择和订阅；来源暂时为空或移除卡组不会删除用户数据。

每个描述包含：

| 字段 | 规则 |
| --- | --- |
| deckID | 稳定 UUID；后续版本继续使用 |
| title / author / description | 标题 1–80、作者 1–120、说明最多 2000 字符 |
| version | 1–999999999 的递增整数 |
| photoCount / wordCount | 1–1000 张照片；0–1000000 个 labels 出现项 |
| packageURL | 同源 HTTPS 绝对地址，或 `/` 开头的站内绝对路径 |
| packageBytes / packageSHA256 | 实际包字节数（最多 134 MiB）和 64 位小写 SHA-256 |
| coverURL | 可选；同源封面，客户端最多下载 4 MiB |
| minimumIOS | 可选的系统版本，如 `17.0` |
| access | `public` 或 `storekit` |
| productID | `storekit` 必须提供现有商品 ID；`public` 不设置 |

清单、包与封面必须在同一 HTTPS origin；默认 443 端口视为同源。禁止嵌入用户名／密码、fragment、控制字符和 `//host` 路径。官方购买下载仍走现有授权请求，不能用静态公开导出来替代。

机器可读 JSON Schema：[`deck-source-v1.schema.json`](../protocol/deck-source-v1.schema.json)。同源、商品权限对应关系、重复 ID、文件大小／哈希与实际内容一致性需要运行时校验，Schema 本身不授予任何权限。Studio 的 `validateDeckSource` 同时执行这些清单语义规则。

```json
{
  "format": "com.piclex.deck-source",
  "schemaVersion": 1,
  "title": "学习系列",
  "decks": [{
    "deckID": "84268cec-3f3e-4d8c-9d03-42688352df57",
    "title": "生活英语",
    "author": "作者",
    "description": "持续更新的学习卡片",
    "version": 1,
    "photoCount": 8,
    "wordCount": 45,
    "packageURL": "https://example.com/series/versions/1/deck.piclexdeck",
    "packageBytes": 123456,
    "packageSHA256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "access": "public"
  }]
}
```

示例哈希／大小仅说明字段，真实值必须由导出器计算。

## Studio 和跨项目 CLI

`node /绝对路径/deck-workbench/scripts/workbench-cli.mjs schema` 返回 `schemas.deckSource` 和 `cardSourceProtocol`；`status` 查询运行中的服务能力，需包含 `deckSourceProtocol>=1`、`deckSourceExport>=1`。服务的 `GET /api/deck-source/schema` 返回相同 Schema。旧服务不支持时 CLI 返回 `server_upgrade_required`，不生成貌似成功的旧格式文件。

使用现有 Studio 草稿生成不可变内容版本后，在任意项目执行：

```sh
CLI=/path/to/PicLex/deck-workbench/scripts/workbench-cli.mjs
node "$CLI" status
node "$CLI" schema
node "$CLI" sources export --deck 卡组UUID --release 1 \
  --base-url https://example.com/series/ --author 作者 \
  --output /绝对路径/新的订阅包.zip
```

网页“版本与发布”中的免费版本也提供“导出订阅包”，与 CLI 共用同一服务实现。导出的 ZIP 内含 `feed.json`、`versions/<版本>/deck-<摘要前16位>.piclexdeck` 和带摘要的封面。内容包原字节与稳定编号保留，输出路径不得已存在。此操作只下载本地 ZIP，不上传、不修改草稿或旧发布版本。付费内容继续使用原官方发布／购买流程，公开订阅导出会拒绝付费版本。

把解压后的目录放到指定 HTTPS 托管目录。每次先上传并校验新版本文件，最后原子替换 `feed.json`。已发布版本文件不原地改写；来源地址不变。直接从已有 `.piclexdeck` 制作清单也可用 `scripts/make-deck-subscription.py`，默认输出新协议，`--legacy` 显式输出旧客户端需要的单卡组清单。

## 兼容、身份与权益

- App 兼容旧 `com.piclex.deck-subscription` 和旧官方 catalog，读入后转换为同一描述；未知格式／版本拒绝。现有《新概念2》`/public/subscriptions/nce2/feed.json` 保持原内容及地址，可被新旧 App 读取。
- 官方接口 `/decks/source.json` 返回新协议；`/decks/catalog.json?format=deck-source` 提供内容协商。没有该参数时仍返回旧 catalog，旧 App 和发布工具继续工作。新 App 能读取尚未升级服务器返回的旧 catalog。
- 官方信任来自 App 配置的官方入口；同一域名下的其他 public 文件也不会自动获得官方身份。`access`、`productID` 和 `purchasesAvailable` 都不能自行建立购买权益。
- 既有官方安装记录、商品 ID、卡片 UUID、源到本地的映射、学习进度全部原样保留。个人来源仍使用 HTTPS origin＋deckID 识别；官方保留已有官方命名空间。协议统一不重建数据库或导入副本。
- 新版内容继续保留照片 ID 和 `learning.occurrenceID`。个人订阅更新保留用户修改、删除状态和作者移除的本地卡片；取消订阅仅停止更新。官方内容更新仍采用原有内容和购买策略。
- 同版本不同哈希、版本回退、损坏文件和重复编号均拒绝，保留旧安装。没有可信来源记录的历史 ZIP 导入内容保持本地卡组，不根据名称合并。

## 独立横竖封面（2026-11-03，可选扩展）

产品显示名称为「摄影学英语」。为兼容既有文件与客户端，协议标识、`.piclexdeck` 扩展名及仓库名保留。

卡组可有独立于学习照片的 `covers.landscape` 与 `covers.portrait`。两张图分别设计；客户端按展示容器方向选择对应图，保持完整画面。没有该扩展时继续使用 `coverURL` 或原有卡片封面，封面不增加 `photoCount`、词汇或学习进度。

来源清单中的每张封面包含 `url`、`mimeType: "image/jpeg"`、`width`、`height`、`bytes`、`sha256`。URL 遵循与内容包相同的 HTTPS 同源规则，图片必须通过字节数、SHA-256、实际尺寸和方向校验；单张不超过 2 MiB，边长 64–4096，横版宽大于高，竖版高大于宽。Studio 推荐 3:2 / 2:3，上传后无裁剪压缩至最长边 1600；草稿可暂存单张，生成版本前需补齐两张和版权说明。

`.piclexdeck` 的 `manifest.json` 可选 `covers` 使用相同元数据，但以 `dataBase64` 代替 `url`，保存有界的 JPEG 字节。清单上限 8 MiB。仍使用 `formatVersion: 1`，ZIP 内仍只有原来的清单和 `photos/` 学习文件；已安装旧客户端忽略未知清单字段，因此不会把封面误认作照片，也不因增加 ZIP 条目拒绝导入。新客户端验证后单独保存展示。

发布目录额外保存 `cover-landscape.jpg`、`cover-portrait.jpg`；`release.json` 的 `covers` 使用 `filename` 引用它们。传统 `cover.jpg` 同步为竖版，旧 App 仍可显示。公开封面不改变卡组权限：付费内容包仍受原有购买／管理鉴权保护。订阅导出包将两张封面按内容摘要命名并写入 `covers`。

Studio「卡组信息」支持独立上传、更换、移除和版权来源编辑；CLI 对应 `covers set/remove`。已有版本可选择「仅更新封面」，或 `releases create --covers-only-from 最新版本号`：读取该不可变版本的学习内容、仅合并当前草稿的封面，历史照片文件逐字节保留，当前草稿的未发布照片和编辑不会随之发布。生成新版本仍需使用原发布流程，不能改写历史版本。

Web 为学习内容单独计算指纹（有序照片编号／图片摘要和词条），封面变化不改变此指纹。迁移旧公开卡组时，构建快照同时固定学习内容摘要及原进度指纹；内容不符即停止构建，避免把不相干版本的进度合并。

## 普通 URL 二维码入口

二维码直接编码来源 HTTPS URL，不包裹专用 Scheme，不要求作者域名与 App 关联。在 App 学习页「下载第三方卡组」的方形窗口扫描，等同于粘贴链接并下载。单卡组直接下载，多卡组沿用选择列表。完整操作见[第三方卡组发布指南](publishing-decks.md)。
