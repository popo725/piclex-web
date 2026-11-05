# piclex.v2fy.com 镜像部署

同一份公开 Web 在两个域名的 `/piclex-web/` 提供相同入口，`piclex.v2fy.com` 的根路径 `/` 跳转到该目录，构建资源、公开照片、卡组与来源清单放在 `/piclex-web/`。现有 `/v1/`、`/healthz`、`/decks/`、`/public/` 保持原配置。代码、图片和卡组下载不需要访问 GitHub；GitHub/App Store/素材来源仍是用户主动打开的外链。

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

## 发布、验证与自动清理

服务器统一使用 `/home/hermes/piclex-web/deploy/activate.py`。同步本目录的 `activate.py`、`release_lifecycle.py` 和 `check-mirror.py`，不再复制旧版脚本另行切换 `current`。

```sh
sudo python3 -B /home/hermes/piclex-web/deploy/activate.py --release /home/hermes/piclex-web/releases/<releaseID> --apply
```

这条命令在统一发布锁内依次执行：完整 SHA256 清单验证、独立 Nginx 验收、原子切换与重载、源站及公网 HTTPS 验证，最后自动清理旧发布包。HTTPS 验证覆盖首页、存在的订阅／游戏入口及它们引用的 JS/CSS、来源／词库索引和 `/healthz`。只有全部通过才开始删除旧版；验证或重载失败会恢复原指针和配置，旧包不删。

**成功发布只保留当前版本，不保留历史或回滚包。** 历史源码由 GitHub 保存，之后需要旧版时重新构建发布；配置备份保留用于诊断，不代表旧发布包仍可用。仅上传或 `nginx -t` 通过不算发布成功。

清理仅扫描 `/home/hermes/piclex-web/releases/` 的直接子目录，要求目录名称、发布清单和每个公开文件的 SHA256 一致。符号链接、挂载点、清单外文件、活动进程／容器／服务配置引用都阻止删除；最近一小时内的非前任候选包视为可能正在上传，保留并报错。数据库、上传照片、Docker 卷、服务配置、其他项目与通用 `/tmp` 不属于清理范围。当前版本会在删除前后复验，硬链接只解除旧目录引用。

若旧包因在使用等原因未清理，命令会返回失败并明确区分“新版已验证上线、清理未完成”；不会回滚到可能已经删除的旧包。详情写入 `reports/last-release-cleanup.json`。解除占用后用同一入口重新验证并完成清理，不必重新切换或重载：

```sh
sudo python3 -B /home/hermes/piclex-web/deploy/activate.py --finalize-current --apply
```

不带 `--apply` 只预览，不联网验证、不切换、不删除。上传前仍需检查磁盘余量；候选包先放 `incoming/` 或任务独有的暂存目录，完成上传后再移入 `releases/`，避免把尚在写入的目录当作正式候选。不要用保留大量历史包代替 GitHub，也不要原地改写被硬链接复用的文件；替换候选文件须先断开候选链接。

浏览器行为回归仍在发布前完成；脚本的 HTTPS 检查验证实际资源和后端健康，不冒充真机人工验收。各域名浏览器存储互相独立，原 Pages 学习进度不会自动迁移。

## 本轮状态

2026-11-03：部署工具与镜像构建完成；8 项部署测试和本机浏览器首页/进入练习/拼对判定通过。服务器上传、隔离验收和正式激活结果记录于 `memory/2026-11-03.md`。

两个入口已上线，用户执行管理员切换后完成公网页面/学习资源、源站完整包、公网分段下载及旧业务接口核验。根入口自动跳转到 `/piclex-web/`。完整结果与网络验收边界见 `docs/reports/2026-11-03-mirror-verification.json`；没有配置后台自动发布。
