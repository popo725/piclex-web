# Web 与 App 的视觉依据

2026-11-04：以 PicLex 主目录现有生产源码和已保存的原生预览为依据，不启动模拟器。

| 区域 | App 依据 | Web 对应 |
| --- | --- | --- |
| 系统字体、浅深色 | `AppAppearance.swift` 默认 ChatGPT + 黑白强调色；surface 4.5%、elevated 8%、border 18% 混色 | `style.css` |
| 学习页头、模块 | `PracticeProgressBattery.swift`：50 点；`PracticeView.moduleTabs`：47 点、选中图标和下划线 | `practice.css`、`Experience.tsx` |
| 图片、释义、例句 | `PracticeScreenLayout.swift`：270／330、48、44 点 | `NativePractice.tsx`、`practice.css` |
| 输入与播放 | `PracticeView.answerArea`：50 点输入框、15 点圆角、44 点播放／操作按钮、8 点间距 | `practice.css` |
| 照片取色 | `PhotoCardPalette.swift`：64 像素采样、5 色聚类、4.6:1 对比度 | `usePhotoPalette.ts`；复用已解码训练图，不再次下载 |
| 拍立得相框 | `SimpleCameraChrome.swift`：3:4、14 点侧／上边、52 点下边、7 点圆角及双向浅阴影 | `capture.css` |
| 出片预览 | `CardReviewOverlay`／`CaptureCardLayout`：50% 黑遮罩、5% 白边、照片比例、外置控件和白色倒计时胶囊 | `Capture.tsx`、`capture.css` |

浏览器适配：PC 保留四排可点击键盘，手机仍调用系统键盘。短窗口无法容纳完整图片与输入区时整页滚动，不压扁照片、不裁掉释义与例句。图片最低保留 220 像素。现有独立卡组进度、自动识图保存、3 秒进入拼写、取消倒计时、拼写光边和粒子均保留。

能力差异不伪装：Web 卡组按钮沿用原生两行样式，进入现有卡组选择／导入；拍摄右侧保留现有学习入口。没有伪造尚未实现的第三方订阅或相机变焦控件。浏览器文本、系统键盘、授权弹窗由运行平台绘制，不能承诺逐像素一致。


## 2026-11-04 后续：实际效果与桌面预算

此前“样式对齐”并不包含完整出片/识别动画。此次直接对应：

| App 实现 | Web 对应 |
| --- | --- |
| IridescentProcessingHalo / RecognitionGlowFrame | RecognitionHalo.tsx；同调色板、波形、宽度/模糊/透明度与时间参数 |
| PolaroidCaptureOverlay / PolaroidFeedTiming | PolaroidPrint.tsx；固定出片口、整张相纸移动、3.8秒慢吐出、显影及0.72秒落到预览 |
| ProcessingDetailText / ProcessingOverlay | 简洁状态、文字扫光、关闭/取消识别；不使用估算百分比 |
| PosterRenderer.footerHeight / drawBrand | 34%照片宽度的固定页脚、App品牌图；完成识别不改变卡纸大小 |
| LabelEntranceState / CardReviewOverlay | 收到真实结果后渐显，完成后才开始3秒倒计时 |

PC保留照片→提示→输入→键盘的次序，播放和操作共用一行；按实测控件高度分配照片，完整原比例显示。极短屏幕仍可滚动。手机仍使用系统键盘。88px倍速控件预留文字和箭头空间。

浏览器限制：Web当前识别接口一次性返回，不能等同原生逐词流式返回；原生声音与触觉不在此次实现范围。浏览器字体及滤镜栅格也可能有像素差异，不宣称全平台逐像素完全相同。
