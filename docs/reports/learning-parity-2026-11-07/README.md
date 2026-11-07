# 学习与等级交互核对（2026-11-07）

基于 App 当前生产源码，而非旧本地 Web。此次只修改独立 Web；没有启动模拟器、操作手机或改写用户数据。

| 检查项 | App 依据 | 结果 |
| --- | --- | --- |
| 头像与设置等级页的游戏入口 | UserLevelView / laboratoryGameEntry | 两入口接入现有薯薯求生；使用当前卡组，退出回到原页面；准备失败保留入口并可返回 |
| 等级奖励与历史 | UserLevelContent / UserLevelFeatureInfoView | 奖励网格、说明、解锁进度、学习及已有设置入口；展示已有等级里程碑，经验消费不删历史；摘要固定、下部独立滚动 |
| 听力答案目标区 | SentenceDictationView.chunkBoard | 恢复 surface 底色，浅深均区别于页面；已选词块采用强调色描边，44px 点击高度，不再深色反色整块 |
| 自由听写输入区 | DictationUnifiedInput | 简单、中等、困难的输入区均恢复 surface 底色；虚拟键盘保持原有新拟态面 |
| 拼词、例句、发音与反馈 | PracticeView / PlaybackControls | 复用完整学习/交互/背景声回归；实体与触摸输入、成功/揭晓、重播、倍速、退出停声与保存通过 |
| 词块、听写与随身听 | SentenceDictation / SentenceListening | 选入/撤回/调整、自动判断、错误修正、独立草稿、三档听写、播放控制通过 |
| 跟读 | ReadingOverlay | 主动开启麦克风、示范与录音互斥、部分匹配累计、完成继续与退出释放通过（浏览器受控语音接口） |
| 卡组与设置 | PracticeDeck / SettingsHomeContent | 切卡组、照片选择、下载失败/取消、默认声音、解锁与设置层级回归通过 |

273 项逻辑、30 项部署、85 项相邻浏览器、最终15项专项通过。浏览器为 Mac Chrome/触摸 Chrome/WebKit，不冒充 iPhone 真机或 Linux 完整验收；发布后补精确 CI 记录。截图已目视检查。

本报告不声称整个 iOS App 的系统能力均已移植。既有 Web 仍将学习目标、相机外观和闭眼语音拼字标注为 App 功能；平台后台音频、系统触感及浏览器语音能力维持既有边界。
