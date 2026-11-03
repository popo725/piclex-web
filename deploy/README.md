# piclex.v2fy.com 镜像部署

同一份公开 Web 在两个域名的 `/piclex-web/` 提供相同入口，根域名 `/` 跳转到该目录，构建资源、示例照片、卡组与来源清单放在 `/piclex-web/`。现有 `/v1/`、`/healthz`、`/decks/`、`/public/` 保持原配置。代码、图片和示例下载不需要访问 GitHub；GitHub/App Store/素材来源仍是用户主动打开的外链。

## 构建

```sh
npm ci
npm run test:deploy
npm run content:build
npm run mirror:build
```

产物在 `dist-mirror/`：`piclex-web/` 静态资源与 `release.json` 文件哈希清单。脚本拒绝覆盖旧目录；后续重建前只删除自己生成且已不使用的 `dist-mirror/`。复用 Pages 的同一份 `dist/`；所有来源地址采用站内绝对路径。镜像来源为 `https://piclex.v2fy.com/piclex-web/source.json`，全部公开包的字节与 SHA256 保持一致。

## 上传与验证

将整个产物放入服务器 `/home/hermes/piclex-web/releases/<releaseID>/`，`releaseID` 取自清单。将本目录的 Python 脚本放到 `/home/hermes/piclex-web/deploy/`。所有发布文件须可由 Nginx 用户读取；只上传公开构建产物，不上传 .env、源代码或用户文件。

```sh
python3 -B /home/hermes/piclex-web/deploy/check-mirror.py --release /home/hermes/piclex-web/releases/<releaseID>
python3 -B /home/hermes/piclex-web/deploy/activate.py --release /home/hermes/piclex-web/releases/<releaseID>
```

第一条在临时回环端口启动独立 Nginx，校验 HTML、JS/CSS MIME、公开卡组/图片/哈希、同源来源和禁止目录列举/写入/隐藏文件。退出时停止该临时进程并删除临时文件。第二条仅显示正式配置的精确差异，不修改生产状态。

## 激活与回滚

部署账号目前没有免密码 sudo。完成上述验证后，管理员在服务器执行一条命令：

```sh
sudo python3 -B /home/hermes/piclex-web/deploy/activate.py --release /home/hermes/piclex-web/releases/<releaseID> --apply
```

脚本验证完整文件清单、保留原首页文件、备份现有配置和旧版本指针，原子切换 `current`，执行 `nginx -t` 后 reload。配置测试或 reload 失败会恢复原配置和指针，并重新加载旧配置。成功时输出备份目录与精确回滚命令。手动回滚会先检查生产配置和指针是否仍对应该次发布，避免覆盖后续改动。

激活后需核对公网根首页、`/web/source.json`、所有直接下载 URL、`/healthz` 与官方卡组目录，并在真实 HTTPS 页面检查进入练习。仅上传和隔离验收通过不等于已上线。各域名浏览器存储互相独立，原 Pages 学习进度不会自动迁移。

## 本轮状态

2026-11-03：部署工具与镜像构建完成；8 项部署测试和本机浏览器首页/进入练习/拼对判定通过。服务器上传、隔离验收和正式激活结果记录于 `memory/2026-11-03.md`。

最新CI已通过并发布Pages；自有域名新路径的361文件发布包已上传、隔离验收通过，当前等待用户执行已提供的管理员切换命令。没有等待定时任务，也没有配置后台自动发布。
