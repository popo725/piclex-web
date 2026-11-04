# 公开卡组与测试素材

生产网页使用 `content/snapshot.json` 记录的现有公开卡组；生成的照片、词条、完整包不加入 Git。公开访问不代表授予 MIT 许可；代码许可不覆盖卡组内容，内容权利以原来源为准。

以下照片现仅用于 `tests/fixtures/demo/` 的历史测试夹具，不再作为生产首页卡组。

# 示例素材

代码的 MIT 许可不改变以下照片各自的许可。照片已下载为本地 JPEG，示例不依赖第三方图片请求。所有照片均来自公开图库，不包含用户的私人照片。

| 文件 | 作者 | 原始页面 | 许可 |
| --- | --- | --- | --- |
| cafe.jpg | Kawin Harasai | [Rustic Cafe Table](https://commons.wikimedia.org/wiki/File:Rustic_Cafe_Table_(Unsplash).jpg) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)；Commons 页面记录其于 Unsplash 许可变更前发布 |
| travel.jpg | My Spain Visa | [Ready for a trip](https://unsplash.com/photos/C082gaOEDyM) | [Unsplash License](https://unsplash.com/license) |
| home.jpg | Puscas Adryan | [Desk with open book, plant, and lamp](https://unsplash.com/photos/w6VGEybp5wc) | [Unsplash License](https://unsplash.com/license) |

来源核对：2026-11-03。照片由来源 CDN 输出适合网页展示的 JPEG 尺寸。示例包内保留相同图片字节；没有将素材许可改写为 MIT。新增或替换素材时应更新此表和公开站 credits.html。

示例词汇释义与例句为本项目编写，不使用教材课程正文。摄影图标复用 App 的生产绘制。第三方软件依赖许可由各包提供，根 package-lock.json 锁定版本。

## 薯薯求生与学习反馈

Web 复用摄影学英语 App 的 `local-web/src/lab` 游戏引擎、角色／道具美术、合成音效及经典按键声音。音标子集来自 [ipa-dict](https://github.com/open-dict-data/ipa-dict)，版权与完整 MIT 许可保存在 `apps/public/public/lab/EnglishPronunciations-LICENSE.txt` 和源文件。游戏素材沿用项目资产，不把公开卡组照片的许可改为代码 MIT 许可。

## 品牌标志

`brand/app-icon.png` 与摄影学英语 App 的 `AppIcon.appiconset/AppIcon.png` 字节一致。黑色 Download on the App Store 徽章来自 [Apple 官方营销素材](https://developer.apple.com/app-store/marketing/guidelines/) 的 [英文黑色 SVG](https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83)，仅用于链接已上架 App，不属于项目 MIT 代码许可。

`icons/tab-*.png` 来自 App 的 `PracticeEntryIcon.swift` 原绘制与动画；其余界面符号由 App 所用 UIKit/SF Symbols 渲染，不将 Apple 的系统符号重新授权为项目原创 MIT 美术。来源和摘要保存在 `docs/native-icons.json`。

- 经典英语歌曲公开卡组来自 https://piclex.v2fy.com/public/subscriptions/classic-english-songs/feed.json ，快照固定v4、8张卡片、52句及52段MP3。公开可访问不代表MIT授权；歌词、原音频及图片权利由原来源保留，不属于代码许可。
