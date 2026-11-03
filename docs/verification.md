# 2026-11-03 验证

- `npm test`：22 项通过。包括从局域网前端带来的定位、拼写、字符反馈，以及新增会话恢复、过期操作、重复出现词、损坏卡组、路径与解压上限、内容哈希检查。
- `npm run build`：TypeScript 检查与 Vite 静态构建通过。生产入口不依赖 PicLex 仓库或手机 API。
- `npm run test:browser`：6 条流程通过，使用独立 Chrome，1440×1000 与 390×844 两种视口。覆盖完成一轮、错字纠正、刷新续练、导入持久化、重复导入、坏包保留旧数据、深色记忆、直接链接与不存在卡组恢复。
- 桌面与窄屏截图已人工查看，存放于 `docs/home.png`、`docs/mobile.png`、`docs/practice.png`。修正了窄屏推广区文字挤压与照片初始定位过渡。
- `python3 scripts/check-native-format.py --piclex-root <PicLex checkout>`：三个示例均通过实际生产 Swift 模型解码、标注验证、JSON/图片 SHA-256 与图片类型验证。校验程序在 Mac 临时目录运行并自动清理，没有启动设备或模拟器。
- 原局域网提取文件的 SHA-256 与提取时相同，未修改原有局域网源码或 App 构建。
- 示例包在本地时区与 UTC 下重建字节完全相同。

限制：浏览器移动视口不是 iPhone 触摸/键盘验收；未宣称做过手机安装或导入。系统发音音色与真实听感仍依赖浏览器环境。局域网入口迁移和 App 打包切换尚未执行。

线上：首次 GitHub Actions 构建与部署均成功（run 41572088517，提交 9533691）。GitHub Pages 继承账户现有域名；HTTPS 实际站点为 https://zhaoolee.com/piclex-web/，github.io 地址会跳转。示例来源清单已改为同源直接地址，避免原生下载器拒绝重定向。
