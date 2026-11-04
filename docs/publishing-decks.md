# 第三方卡组发布指南

摄影学英语的订阅二维码就是一个普通 HTTPS URL。作者可以使用自己的域名或静态托管；不需要绑定域名、注册 App Scheme、配置 Apple 关联文件或申请摄影学英语账号。

用户在 App 学习页右上角打开「下载第三方卡组」，将二维码放进正方形扫描窗口。识别成功相当于填入 URL 并点击下载。一个卡组自动下载，多个卡组显示选择列表。手动粘贴 URL 始终可用；本功能不提供 iOS 系统相机唤醒 App。

## 文件与协议

- [来源清单协议 v1](deck-source-protocol.md)：来源、卡组、版本、封面、同源与更新规则。
- [机器可读 JSON Schema](../protocol/deck-source-v1.schema.json)。Schema 检查结构，实际下载还检查同源、大小、哈希、重复 ID 与权限。
- [内容包格式](photo-archive-format.md)：`.piclexdeck` 内的 manifest、照片 JSON、原始图片。订阅包只含正常卡片，不能把备份中的回收站数据当作订阅发布。
- [来源生成及本地结构校验脚本](../scripts/make-deck-subscription.py)。仅本机生成，不自动上传。
- [二维码生成脚本](../scripts/subscription-qr.mjs)与[在线工具](https://piclex.v2fy.com/piclex-web/subscribe/)。二维码数据为输入 URL 本身，没有中转域名或专用封装。

协议标识 `com.piclex.deck-source`、包格式 `com.zhaoolee.piclex.photo-archive` 与扩展名 `.piclexdeck` 保持兼容。包内日期是 Unix epoch 毫秒，JSON 使用 UTF-8。两个格式都有各自的版本号，不能将 App 版本号填进去。

## 1. 制作卡组

最简单的方法是在 App 创建照片卡组并分享为 `.piclexdeck`，或在摄影学英语 Studio 导出免费卡组版本。也可以按内容包格式自行生成 ZIP：

```text
manifest.json
photos/<稳定的小写照片UUID>.json
photos/<同一个UUID>.jpg
```

`manifest.json` 指向照片 JSON 的路径和 SHA-256；每张照片 JSON 指向图片路径、字节数和 SHA-256，并包含单词、中文、坐标与例句。精确字段见内容包格式与下文学习扩展。保留照片 UUID；修正文案时不要重新生成编号。不要打包用户学习记录、API Key 或本机配置。

## 2. 生成来源清单

以下命令在公开仓库根目录即可运行，仅需 Python 3。真实发布时替换包文件、URL、作者和 UUID；一个系列的 deckID 生成一次后持续沿用。

```sh
python3 scripts/make-deck-subscription.py lesson-v1.piclexdeck \
  --package-url https://example.com/english/versions/1/deck.piclexdeck \
  --deck-id 84268cec-3f3e-4d8c-9d03-42688352df57 \
  --title '日常英语' --author '示例作者' --version 1 \
  --description '持续更新的生活场景' --output feed.json
```

脚本读取真实包，检查 ZIP 路径、重复文件/照片 ID、清单、照片 JSON/图片的大小与哈希，计算 photoCount、wordCount、packageBytes 和 packageSHA256。它不是 iOS 图像解码及所有可选扩展校验的替代品；发布前还需在 App 用样例来源验收。新清单固定包含 `format`、`schemaVersion`、`title`、`decks`；不要把示例中的虚构大小或哈希原样用于真实包。

现成的可重复试验素材在 `tests/fixtures/demo/decks/cafe.piclexdeck`。下面可生成一个完整的本地发布目录（输出目录须尚不存在）：

```sh
mkdir -p demo-subscription/versions/1
cp tests/fixtures/demo/decks/cafe.piclexdeck demo-subscription/versions/1/deck.piclexdeck
python3 scripts/make-deck-subscription.py demo-subscription/versions/1/deck.piclexdeck \
  --package-url https://example.com/english/versions/1/deck.piclexdeck \
  --deck-id 84268cec-3f3e-4d8c-9d03-42688352df57 \
  --title '咖啡馆的早晨' --author '示例作者' --version 1 \
  --output demo-subscription/feed.json
```

该样例照片归属及许可见 [素材说明](../ASSET_LICENSES.md)，发布时保留来源说明。`example.com` 只是占位域名，不是可下载订阅。

## 3. 托管到自己的 HTTPS 网站

```text
english/
  feed.json
  versions/1/deck.piclexdeck
  cover.jpg                 # 可选
```

订阅地址是 `https://你的域名/english/feed.json`。清单、包和封面必须同一 HTTPS origin（域名和有效端口相同）；可以使用 JSON 中的站内绝对路径 `/english/...`。不要让清单重定向到登录页，不要让静态资源跳转到另一个域名。使用有效 TLS 证书；清单响应建议 `application/json`，包响应可用 `application/octet-stream`。清单设为重新验证缓存，版本包保持不可变。

不同作者可以用完全不同的域名。这里的“同源”只要求一个来源内部的清单与资源同源，不要求与摄影学英语网站同域。iOS 原生下载不依赖浏览器 CORS；若另做浏览器直接下载，需要单独配置该浏览器的跨域访问权限。

原生订阅限制：清单 2 MiB、单包 134 MiB、解压后 512 MiB、最多 2001 个文件/1000 张照片。网页导入有自己的较小上限，见仓库 README，不要混用备份的 20 GiB 上限。

## 4. 生成普通 URL 二维码

```sh
npm ci
node scripts/subscription-qr.mjs \
  --source https://你的域名/english/feed.json --output new-qr-directory
```

输出 PNG、SVG 与 `links.json`；目录已存在时拒绝覆盖。任何标准二维码工具编码同一个 URL，效果相同。不能在 URL 外再加提示文字；URL 不能含用户名、密码、fragment 或控制字符。建议把二维码放在带卡组名称的分享封面中，保留四模块以上白边，不在码上叠加 Logo 或文字。

两个已有来源的二维码与封面在 [subscription-qr](subscription-qr/README.md)。重新生成纯二维码：

```sh
node scripts/subscription-qr.mjs --examples --output another-qr-directory
```

## 5. 更新与用户数据

更新时保持来源 URL、deckID、照片 UUID 和显式 `learning.occurrenceID` 不变，只提高整数 `version`。先上传新版本包及封面，核对大小/哈希，最后原子替换 feed.json。不要原地改写旧版本文件；同版本不同哈希或版本回退会被拒绝。

一个 feed 可含多个不同 deckID。要让一个二维码直接下载一个卡组，发布只含该卡组的 feed；二维码仍是普通 URL。来源中的同源及稳定 deckID 会延续订阅身份，不以名称去合并。普通 ZIP 历史导入副本不会自动并入订阅。

重复获取已安装同版本不重复建立卡组。订阅更新保留本机修改、删除状态及学习记录；作者移除条目不删除本地卡片；取消订阅仅停止更新。来源失败不清空已有内容。`public` 是公开可下载；`storekit` 不授予购买权益，付费内容必须使用既有官方授权入口。

## 学习字段与原音频

每个 label 可选 `learning` 对象，必填字段为 `partOfSpeech`、`relation`（`visible` / `scene_extension` / `hypothetical`）、`sceneConnection`、`association`、`collocation`、`example`、`exampleChinese`。需要保留重复词/句的独立练习项时，设置全局唯一且稳定的 `occurrenceID`，例如 `author-series-lesson01-sentence01`。可选 `targetEntryID`、`vocabularyFingerprint` 等属于目标词匹配信息，不需要的作者可省略。

可选 `learning.audio` 保存当前句子的原音频：`mediaType: "audio/mpeg"`、规范 `dataBase64`、`sha256`、`byteCount`、`durationSeconds`。音频为实际 MP3 字节，每段 1–262144 字节，时长大于 0 且不超过 60 秒；SHA-256 和大小必须与 Base64 解码后的字节一致。音频嵌在照片 JSON 中，不添加额外 ZIP 文件。旧客户端可忽略扩展；含原音频的卡组应说明所需客户端版本。双封面的完整扩展约定见来源协议。

## 发布验收

使用 App 内扫描窗口实扫发布二维码；确认名称、卡片、例句和可选音频。再以同一来源发布下一版本，检查更新后原练习进度保留。检查无相机权限时仍能粘贴 URL，网络失败可重试，多卡组来源可选择。二维码不会自动使内容获得任何官方认证；发布内容的来源与许可由作者标明。
