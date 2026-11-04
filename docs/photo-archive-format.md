# 照片 ZIP 备份格式 v1

从设置页「数据管理」进入「照片数据」，其中「导入与导出」将本机照片打包，使用系统「文件」保存和选择 ZIP；「已拍照片」和「回收站」也集中在该页面。设置页不向用户展示备份格式、容量限制或实现版本说明；相关信息仅保留在本文档中。格式版本是解析依据，与 App 发布版本分别维护。当前导出器、导入器版本均为 `1.3.0`，支持格式 `1`。

## 文件布局

一次导出产生两个同名文件，保存时请保留二者：

```text
PicLex-photos-v1-YYYYMMDD-HHmmss.zip
PicLex-photos-v1-YYYYMMDD-HHmmss.version.json
```

包外的 `.version.json` 包含 `zipFilename`、整包 `zipSHA256`、`formatIdentifier`、`formatVersion`、`exporterVersion`、`importerVersion`、`appVersion`、`exportedAt`、`photoCount` 和 `trashCount`。不打开 ZIP 也能读取其格式。导入 ZIP 不依赖旁边的版本文件，版本文件丢失不影响恢复。

ZIP 内为：

```text
manifest.json
photos/<小写 UUID>.jpg     # 或 png / heic / heif，与现存图像类型一致
photos/<同一个 UUID>.json
...
```

所有 JSON 为 UTF-8。日期采用自 Unix epoch 起的毫秒数，保留小数，允许独立工具精确往返。可空字段未写入时视为 `null`。

## 清单与照片数据

`manifest.json`：

| 字段 | 含义 |
| --- | --- |
| `formatIdentifier` | 固定 `com.zhaoolee.piclex.photo-archive` |
| `formatVersion` | 数据结构版本，当前整数 `1` |
| `exporterVersion` / `importerVersion` | 导出此文件时的导出器与导入器实现版本，当前 `1.3.0` |
| `appVersion` | 导出时的 App 版本，仅用于排查 |
| `exportedAt` | 导出时间 |
| `photoCount` / `trashCount` | 总照片数（包含回收站）及回收站照片数 |
| `photos` | 每项含 `id`、`jsonPath`、对应 JSON 原始字节的 `jsonSHA256` |

每张照片的 JSON：

| 字段 | 含义 |
| --- | --- |
| `formatVersion`, `id` | 格式版本、稳定照片 UUID |
| `createdAt`, `deletedAt` | 拍摄/保存时间、进入回收站的时间；后者为空代表正常照片 |
| `recognitionCompleted` | 可选布尔值。`true` 表示识别已完成，即使用户删除全部标签也保留完整照片/诗句卡片；缺失时沿用旧版规则，由非空标签推断完成状态 |
| `imagePath`, `imageByteCount`, `imageSHA256` | 对应图片的包内路径、原始字节数、SHA-256 小写十六进制摘要 |
| `labels` | `x`、`y`、`english`、`chinese`、`phoneticUS`、`phoneticUK`、`backgroundColor`、`textColor`、可空的 `boundingBox`、`bubblePosition`、`anchorPosition`、`suggestedBubblePosition` |
| `quote` | `chinese`、`english`、`source`、可空的 `sourceURL`、`provenance`（`web` / `model` / `builtIn` / `none`） |

可选的 `suggestedBubblePosition` 保存模型在同一次识别中通过 `label_center=[x,y]` 推荐的气泡中心，使用照片区域的 0–1000 坐标，兼容格式 v1。模型负责选择留白、避开人脸和重要细节；本地按实际文字尺寸检查照片边界、其他自动标签和原始指向点，在建议附近调整。手动 `bubblePosition` 优先；撤销手动调整后恢复模型建议布局。缺失、空值或模型返回无效建议时继续使用原有自动布局，不丢弃物体、不为标签位置追加请求。模型建议不是不遮挡的保证，用户仍可拖动。旧卡片不自动重新上传识别；旧版可忽略此字段，旧版再导出可能丢失建议位置。

标注坐标与边界框使用 0–1000 归一化整数；边界框有 `left`、`top`、`right`、`bottom`。可选的 `bubblePosition` 保存用户拖动后的气泡中心，包含 0–1000 范围内的有限数值 `x`、`y`，支持小数；其坐标只相对于照片区域，不包含底栏。缺失或为空时沿用自动排版。它不改变物体锚点 `x`、`y` 或训练区域 `boundingBox`。可选的 `anchorPosition` 使用相同坐标规则，保存手动校正的物体指向点；卡片显示和分享的圆点优先使用校正值，原始 `x`、`y` 保留用于标签身份和自动气泡布局，因此单独校正圆点不会让气泡重新排版。两个字段均兼容格式 v1，旧版本可忽略，旧版本再次导出时可能丢失手动位置。拼写训练的照片只显示彩色物体框，按 `boundingBox` 聚焦，不显示气泡、连线或指向点，也不为手动标注扩大取景范围；缺少边界框的旧数据仍使用校正指向点附近的参考范围。手动位置继续保留在源数据中，用于卡片预览、编辑、分享和备份。

照片文件直接复制数据库中的 `originalImageData` 字节，不重编码、不叠加单词或卡片边框。现有拍照流程保存的是经过尺寸和 JPEG 处理的来源图；导出不能恢复之前未保存的传感器原片。旧合成海报缓存不导出，导入后按原图、标注和例句重新渲染。

标签配色在显示和保存时进行本地近色检查；重复、过近或灰白黑颜色会分配成不同色相，气泡、连线及圆点保持一致。新卡片与编辑后的卡片把结果保存到原有颜色字段；旧卡片打开时仅应用显示规则，未编辑的 ZIP 导出仍保留原有颜色数据，重新导入/显示时得到相同配色。颜色调整不改变单词、音标、物体框或任何标注位置，格式仍为 v1。

拖到诗句区删除标签后，源数据的 `labels` 会移除该项，保留原图与诗句，并将 `recognitionCompleted` 设为 `true`；其他气泡按当前显示位置固定，避免重新排版。标签移动、指向点移动和删除共用当前页面内的撤销顺序；撤销会自动写回源数据，备份导出撤销后的当前状态，不保存撤销历史。旧版本导入时会忽略完成标记，空标签卡片可能显示为待识别；新版可正确恢复。

仅备份照片数据，包括回收站。不包含模型配置、API Key、声音/相机设置、全局训练进度；不把设备验证信息放入备份。

## 导入规则

1. 先读取清单的格式标识与格式版本。只有格式 v1 被接受；更高或不支持的版本提示升级，不能按当前结构猜测解析。导入器实现版本仅供排查，不作为数据格式分支。
2. 校验每个 ZIP 条目的 CRC、实际解压字节数、JSON 和照片 SHA-256、照片实际编码与尺寸，以及照片/JSON/清单的对应关系。拒绝链接、不安全路径、重复路径/UUID、清单外文件、缺失原图、损坏 JSON 和无效标注。
3. 只接受规范 `photos/<小写 UUID>.<扩展名>`。暂存文件路径由导入器生成，不使用包内路径直接解压至文件系统。
4. 所有内容检查通过后，使用独立 SwiftData 上下文一次保存。取消或保存失败回滚本次新增；不清空现有图库。
5. 本机已有相同 UUID 时跳过，保留本机较新的标注和回收站状态；不同 UUID 即使画面相同也作为独立照片保留。新照片保留备份中的 UUID、日期及回收站状态。
6. 当前容量限制：ZIP 文件及解压后的全部内容各不超过 20 GiB（界面简写为 20 GB），不另设照片张数或单张照片文件大小上限。单张 JSON 不超过 2 MiB、清单不超过 8 MiB；照片必须能够安全解码，最长边不超过 30000 像素且总像素不超过 1 亿。导出为 ZIP 头和清单预留空间，超出范围明确失败。

## 版本维护

不兼容的布局、字段意义或必填项变化必须增加 `formatVersion`，并保留旧版本解析分支或明确拒绝。兼容的实现修复增加导入器/导出器版本；App 版本独立变化。改动时同步更新包内清单、包外说明和本文档，并保留往返、拒绝未知版本、无部分导入、重复 UUID 测试。

ZIP 依赖固定为 [ZIPFoundation 0.9.20](https://github.com/weichsel/ZIPFoundation/tree/0.9.20)，使用其 MIT 许可。系统「文件」可以直接解压查看图片和 JSON。
