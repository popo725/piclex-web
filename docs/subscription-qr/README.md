# 卡组订阅分享图

在摄影学英语 App 的学习页，点击右上角按钮，用弹窗内的正方形窗口扫码。二维码只包含下表中的普通 URL，不需要系统相机唤醒。

| 卡组 | 原始订阅地址 | 分享图 | 纯二维码 |
| --- | --- | --- | --- |
| 新概念英语第二册 | https://piclex.v2fy.com/public/subscriptions/nce2/feed.json | [封面 PNG](nce2-poster.png) | [PNG](nce2.png) / [SVG](nce2.svg) |
| 经典英语歌曲 | https://piclex.v2fy.com/public/subscriptions/classic-english-songs/feed.json | [封面 PNG](classic-english-songs-poster.png) | [PNG](classic-english-songs.png) / [SVG](classic-english-songs.svg) |

两个来源可以继续更新，二维码保持不变。封面采用现有卡组展示图，二维码独立渲染并保留白边；不将课程内容的许可改为代码仓库 MIT 许可。

生成纯二维码：`node scripts/subscription-qr.mjs --examples --output 新目录`。

生成带封面的分享图（先 `npm run content:build`，需本机安装 Chrome）：`node scripts/subscription-posters.mjs --output 新目录`。

## 网页模板工具

打开[卡组分享封面工具](https://piclex.v2fy.com/piclex-web/subscribe/)，选择已有封面或上传自己的图片，填入订阅 URL 即可导出 1024 × 1536 PNG。可实时调整顶部文案、标题、三行指引、加粗词、配色、二维码位置和大小；图片与地址在浏览器本地处理，也可单独下载纯二维码。

默认顶部为 `App Store下载“摄影学英语”`，指引为“进入学习栏目 / 点击右上角按钮 / 扫码即可获取卡组”，加粗“学习”和“右上角”。不包含“第三方卡组”标签或离线／订阅宣传尾注。

网页与批量脚本共用 [Canvas 模板](../../packages/subscription/poster.mjs)，修改模板后可重新生成两个封面，无需重新生成背景图。背景图片完整显示，二维码保留白边。
