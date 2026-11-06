# 摄影学英语 Web

**把眼前的生活，变成英语。** 拍照制卡，用照片练拼写、听力和口语。打开浏览器即可开始，无需登录。

[在线体验](https://piclex.v2fy.com/piclex-web/) · [GitHub Pages 镜像](https://zhaoolee.com/piclex-web/) · [iPhone App](https://apps.apple.com/cn/app/id6808490052)

## 一张照片，就是一页英语

拍摄或导入 → 双语标签与场景例句 → 开始练习。

<p align="center">
  <img src="docs/reports/ai-settings-2026-11-05/live-official-recognition.png" width="800" alt="早餐照片生成的英语卡片，包含双语物品标签、场景词与诗句">
</p>

本页均为 Web 界面截图，摄于 2026-11-04～05。

## 看图拼词，听句子，开口说

<table>
  <tr><th>拼单词</th><th>练听力</th><th>练口语</th></tr>
  <tr>
    <td><img src="docs/reports/viewport-2026-11-05/chrome-spelling.png" width="260" alt="照片语境、例句填空与拼写键盘"></td>
    <td><img src="docs/reports/layout-2026-11-04/listening-light-390x844.png" width="260" alt="看图听双语例句，支持循环和倍速"></td>
    <td><img src="docs/reports/layout-2026-11-04/speaking-light-390x844.png" width="260" alt="听示范、麦克风跟读与逐词进度"></td>
  </tr>
</table>

## 选一套喜欢的卡组

日常生活、程序员英语、摄影……也能导入自己的 `.piclexdeck`，或分享公开卡组的练习链接。

<table>
  <tr><th>浅色卡组</th><th>深色卡组</th></tr>
  <tr>
    <td><img src="docs/reports/deck-grid-2026-11-05/decks-light.png" width="320" alt="浅色照片卡组库与主题封面"></td>
    <td><img src="docs/reports/deck-grid-2026-11-05/decks-dark.png" width="320" alt="深色照片卡组库与主题封面"></td>
  </tr>
</table>

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

支持 Linux AMD64 与 ARM64。以下命令在**运行 Docker 的电脑或服务器上**执行。

### 首次启动：仅本机访问

```sh
docker pull zhaoolee/piclex-web:latest &&
docker run -d --name piclex-web \
  --restart unless-stopped -p 127.0.0.1:18120:8080 \
  zhaoolee/piclex-web:latest
```

在运行 Docker 的同一台电脑上打开 <http://127.0.0.1:18120>，会自动进入 `/piclex-web/`。此方式只绑定本机回环地址，适合本机使用或由同机反向代理提供访问；其他设备不能直接访问该端口。

### 首次启动：局域网其他设备访问

```sh
docker pull zhaoolee/piclex-web:latest &&
docker run -d --name piclex-web \
  --restart unless-stopped -p 18120:8080 \
  zhaoolee/piclex-web:latest
```

在手机或另一台电脑上打开 `http://服务器的局域网IP:18120`，例如 `http://192.168.1.20:18120`，把示例 IP 换成实际运行 Docker 的机器地址。`127.0.0.1` 永远指浏览器所在设备，不能用它访问另一台机器。此映射监听所有网络接口，请在防火墙中仅向需要访问的局域网放行 18120 端口。

**两种首次启动方式二选一。** 它们使用同一个容器名 `piclex-web`；如果已启动过，或出现容器名已存在的提示，请使用下面的更新步骤，不要重复执行首次启动命令。

### 更新已有容器

先拉取新镜像，再停止、删除旧静态网页容器并按原方式重建。下面的 `&&` 确保前一步成功后才继续；拉取失败时不会停止旧服务。**只执行与原部署方式对应的一组命令。** 如果改过容器名、端口或反向代理，请沿用自己的原配置。

**原来仅本机访问：**

```sh
docker pull zhaoolee/piclex-web:latest &&
docker stop piclex-web &&
docker rm piclex-web &&
docker run -d --name piclex-web \
  --restart unless-stopped -p 127.0.0.1:18120:8080 \
  zhaoolee/piclex-web:latest
```

**原来供局域网访问：**

```sh
docker pull zhaoolee/piclex-web:latest &&
docker stop piclex-web &&
docker rm piclex-web &&
docker run -d --name piclex-web \
  --restart unless-stopped -p 18120:8080 \
  zhaoolee/piclex-web:latest
```

仅执行 `docker pull` 不会替换运行中的容器，`docker restart` 也仍使用旧镜像。更新后刷新原页面即可；旧版的 `Cannot read properties of undefined (reading 'digest')` 报错已修复，需要拉取并重建容器才能用到修复。

### 数据与浏览器功能

- 照片、学习进度和设置保存在**当前浏览器**，不是容器中；替换上述静态容器不会清除这些数据。保持原来的访问域名/IP、端口和协议，不要清除站点数据。更换访问地址或浏览器会进入另一份存储，迁移前请先导出完整备份。
- 局域网 HTTP 可用于卡组学习、本地导入和等级/进度同步；相机、麦克风及部分大文件备份能力仍需有效 HTTPS 和浏览器授权。本机 `localhost`／`127.0.0.1` 是浏览器认可的安全上下文例外。WebDAV **服务地址本身**仍须使用 HTTPS。
- 自托管 AI 制卡需在设置中配置自己的模型；镜像不包含模型 Key。配置 WebDAV 后可自动同步等级与学习进度，照片和卡组不会随轻量进度同步自动传输。

[Compose、HTTPS 与详细部署说明](docs/docker.md)。

[使用与开发说明](docs/web-guide.md) · [发布自己的卡组](docs/publishing-decks.md) · [部署说明](deploy/README.md) · [二维码分享封面](docs/subscription-qr/README.md)

代码使用 [MIT](LICENSE)；卡组内容按原来源授权，详见[素材说明](ASSET_LICENSES.md)。
