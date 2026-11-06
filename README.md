# 摄影学英语 Web

**把眼前的生活，变成英语。** 用经典电影画面练拼写、听力和口语，也能拍照制作自己的卡片。打开浏览器即可开始，无需登录。

[在线体验](https://piclex.v2fy.com/piclex-web/) · [GitHub Pages 镜像](https://zhaoolee.com/piclex-web/) · [iPhone App](https://apps.apple.com/cn/app/id6808490052)

## 从喜欢的电影，记住一句英语

《阿甘正传》《教父》《星球大战》……在熟悉的画面里记单词，用经典台词练听说。

<p align="center">
  <a href="https://piclex.v2fy.com/piclex-web/#/deck/b33417a7-0f7e-4081-be35-2fe44d9d30c4?module=listening&amp;mode=listening&amp;photo=1">
    <img src="docs/readme/movie-hero.png" width="800" alt="经典电影台词卡组：《阿甘正传》电影画面、双语台词与听力播放控件">
  </a>
</p>

[打开「经典电影台词」卡组](https://piclex.v2fy.com/piclex-web/#/deck/b33417a7-0f7e-4081-be35-2fe44d9d30c4) · 100 张电影卡片，100 个目标词。

电影示例为 2026-11-06 在线 Web 实际界面截图；其余截图摄于 2026-11-04～05。

## 看图拼词，听句子，开口说

<table>
  <tr><th>《阿甘正传》· 拼单词</th><th>《教父》· 练听力</th><th>《星球大战》· 练口语</th></tr>
  <tr>
    <td><img src="docs/readme/movie-spelling.png" width="260" alt="《阿甘正传》巧克力场景、台词填空与拼写键盘"></td>
    <td><img src="docs/readme/movie-listening.png" width="260" alt="《教父》电影画面与双语台词，支持循环和倍速播放"></td>
    <td><img src="docs/readme/movie-speaking.png" width="260" alt="《星球大战》愿原力与你同在：听示范、麦克风跟读与逐词进度"></td>
  </tr>
</table>

## 选一套喜欢的卡组

从经典电影台词开始，也有经典英语歌曲、日常生活、程序员英语、摄影等主题。支持导入自己的 `.piclexdeck`，或分享公开卡组的练习链接。

<table>
  <tr><th>电影卡组 · 浅色</th><th>电影卡组 · 深色</th></tr>
  <tr>
    <td><img src="docs/readme/movie-gallery-light.png" width="320" alt="浅色经典电影卡组：浏览电影画面并选择练习照片"></td>
    <td><img src="docs/readme/movie-gallery-dark.png" width="320" alt="深色经典电影卡组：浏览电影画面并选择练习照片"></td>
  </tr>
</table>

## 一张照片，就是一页英语

也可以从自己的生活出发：拍摄或导入 → 双语标签与场景例句 → 开始练习。

<p align="center">
  <img src="docs/reports/ai-settings-2026-11-05/live-official-recognition.png" width="800" alt="早餐照片生成的英语卡片，包含双语物品标签、场景词与诗句">
</p>

## 白天、夜晚，都有喜欢的样子

浅色、深色、自定义配色，搭配喜欢的键盘音。

<table>
  <tr><th>浅色相机</th><th>深色相机</th></tr>
  <tr>
    <td><img src="docs/readme/capture-light.png" width="320" alt="浅色相机：金色取景背景、相册入口和快门"></td>
    <td><img src="docs/readme/capture-dark.png" width="320" alt="深色相机：黑色取景背景与底部导航"></td>
  </tr>
</table>

进度与导入内容保存在当前浏览器；配置 WebDAV 后可跨设备自动同步等级与学习进度，照片和卡组不随轻量进度同步自动传输。AI 制卡会将照片发送给所选服务；自带 Key 保存在浏览器且未加密。相机和语音功能依赖浏览器支持与授权。

## Docker 启动与更新

**一行启动**（在运行 Docker 的电脑或服务器上执行）：

```sh
docker run --pull always -d --name piclex-web --restart unless-stopped -p 18120:8080 zhaoolee/piclex-web:latest
```

本机打开 <http://127.0.0.1:18120>；手机或其他局域网设备打开 `http://服务器IP:18120`（换成实际 IP，并确保端口可达）。

**已部署？一行更新：**

```sh
docker pull zhaoolee/piclex-web:latest && docker stop piclex-web && docker rm piclex-web && docker run -d --name piclex-web --restart unless-stopped -p 18120:8080 zhaoolee/piclex-web:latest
```

照片和进度保存在浏览器，更新容器不会清除它们；请保持原访问地址，自定义容器名或端口映射沿用原值。[仅本机绑定、HTTPS、Compose 等详细说明](docs/docker.md)。

[使用与开发说明](docs/web-guide.md) · [发布自己的卡组](docs/publishing-decks.md) · [部署说明](deploy/README.md) · [二维码分享封面](docs/subscription-qr/README.md)

代码使用 [MIT](LICENSE)；卡组内容按原来源授权，详见[素材说明](ASSET_LICENSES.md)。
