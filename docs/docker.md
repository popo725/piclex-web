# Docker 部署

镜像：`zhaoolee/piclex-web`。一个容器提供 Web 页面、公开卡组、图片和声音；启动时不需要 Node.js、不需要数据库，也不重新下载卡组。镜像不包含 AI 模型或模型 Key。

## 首次启动：本机或局域网，二选一

命令在运行 Docker 的电脑或服务器上执行。已有同名容器请直接看下方“更新”，不要重复首次启动。

### 仅本机访问

```sh
docker pull zhaoolee/piclex-web:latest &&
docker run -d --name piclex-web \
  --restart unless-stopped -p 127.0.0.1:18120:8080 \
  zhaoolee/piclex-web:latest
```

在运行 Docker 的同一台电脑打开 <http://127.0.0.1:18120>，自动进入 `/piclex-web/`。绑定 `127.0.0.1` 的端口只能从本机访问，也适合由同机反向代理提供 HTTPS。

### 局域网其他设备访问

```sh
docker pull zhaoolee/piclex-web:latest &&
docker run -d --name piclex-web \
  --restart unless-stopped -p 18120:8080 \
  zhaoolee/piclex-web:latest
```

在手机或另一台电脑打开 `http://服务器的局域网IP:18120`（例如 `http://192.168.1.20:18120`，请替换实际 IP）。不要填 `127.0.0.1`，它指浏览器所在设备。此映射监听所有网络接口，请在防火墙中仅向需要访问的局域网放行 18120 端口。

首次拉取包含公开卡组，体积大于只含网页代码的镜像。支持 Linux AMD64 与 ARM64（包括 Apple Silicon 的 Docker 环境）。

### Compose

仓库 `compose.yaml` 默认映射 `127.0.0.1:18120:8080`，只供本机访问。需要局域网访问时，将 `ports` 中这一项改为 `18120:8080`，再执行：

```sh
docker compose pull && docker compose up -d
```

首次启动方式二选一，不要同时用 Compose 和 `docker run` 占用同一个 18120 端口；更新时继续使用原来的部署方式。

## 数据与 AI

- 照片、学习进度和设置仍保存在**浏览器**的 IndexedDB／OPFS／本地存储中，不在容器内，因此不需要挂载数据卷。更换域名、端口、协议或浏览器会进入另一份存储；迁移前在设置中导出完整备份，勿清空站点数据。
- 官方 AI 服务有来源域名限制，**自托管地址不支持直接使用官方模型**。在「设置 → AI配置 → 自定义模型」配置自己的 DeepSeek 或 OpenAI 兼容图片模型；提供方须支持浏览器 CORS。照片由浏览器直接发送，Key 保存在当前浏览器且未加密。不要将 Key 写进 Dockerfile、构建参数或镜像。
- 已有卡组学习与本地导入可直接使用；AI、远程卡组、WebDAV 和部分浏览器语音服务仍需网络。Docker 部署不增加云端账号；可在设置中配置 HTTPS WebDAV 自动同步等级与学习进度。
- 本机 `localhost`／`127.0.0.1` 是安全上下文例外；局域网 IP 的 HTTP 地址可学习、导入和同步进度，使用相机、麦克风或 OPFS 等安全上下文功能则需有效 HTTPS，并受浏览器授权和能力约束。

局域网 HTTP 访问也支持官方卡组学习、本地卡组导入和 WebDAV 等级/进度同步，并保留完整 SHA-256 校验。旧版在此环境可能提示 `Cannot read properties of undefined (reading 'digest')`，原因是浏览器未提供 `crypto.subtle`；更新镜像后刷新页面即可，无须清空站点数据。WebDAV 服务地址仍须使用 HTTPS，相机等安全上下文功能也仍需 HTTPS。

## 局域网与 HTTPS

局域网 HTTP 可直接学习、导入卡组和同步进度；需要相机、麦克风或其他安全上下文功能时，在反向代理配置有效 HTTPS。同机反向代理可继续使用仅绑定 `127.0.0.1` 的容器端口，无须改成对外监听。应用固定在 `/piclex-web/`；根地址会跳转，代理保留路径即可：

```nginx
location / {
    proxy_pass http://127.0.0.1:18120;
    proxy_set_header Host $host;
}
```

以上片段放在已配置 TLS 的 Nginx 站点中。若只由本机反向代理访问容器，继续使用默认的 `127.0.0.1` 端口绑定。无需配置 WebSocket 或容器上传目录。

## 更新

### 使用 docker run 部署

只执行与原部署方式对应的一组命令。先成功拉取镜像，再停止和删除自己启动的静态网页容器，最后按原端口映射重建。若拉取失败，`&&` 会阻止后续停服操作；自定义容器名、端口或反向代理请沿用原配置。

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

仅拉取镜像不会替换已有容器，`docker restart` 也不会让旧容器切换到新镜像。出现容器名已存在时，使用对应的更新步骤，不要重复 `docker run`。

### 使用 Compose 部署

在原 `compose.yaml` 所在目录执行，并保留原来的端口映射：

```sh
docker compose pull && docker compose up -d
```

### 保留数据与访问地址

保持浏览器访问的域名/IP、端口、协议不变，更新后刷新原页面即可。上述容器操作不清理浏览器中的照片、学习进度和设置，不需要清空站点数据。更换访问地址或浏览器会进入另一份存储，迁移前先导出完整备份。可将镜像标签改为 `sha-<提交前7位>` 固定版本。

## 从源码构建

```sh
git clone https://github.com/zhaoolee/piclex-web.git
cd piclex-web
docker build -t piclex-web:local .
docker run --rm -p 127.0.0.1:18120:8080 piclex-web:local
```

构建需要联网下载 npm 依赖、基础镜像及 `content/snapshot.json` 固定的公开卡组；包大小、SHA256 和词条数验证失败会停止构建。构建缓存复用下载内容，最终镜像只包含 Nginx、静态产物和许可证，不含源码、构建工具或本机配置。第三方卡组的授权不因打包进容器而改变，见 [素材说明](../ASSET_LICENSES.md)。

## 自动发布

正式镜像固定由 GitHub Actions 构建并推送；开发机只做本地验证。

在 GitHub 仓库 Settings → Secrets and variables → Actions 配置：

- `DOCKERHUB_USERNAME`：Docker Hub 用户名（本仓库为 `zhaoolee`）。
- `DOCKERHUB_TOKEN`：有该镜像仓库写入权限的 Docker Hub access token。

创建对应的公开仓库 `zhaoolee/piclex-web`。工作流 `Publish Docker image` 在 main 代码更新、`v*` 标签或手动运行时执行，先启动容器验证页面、静态资源、完整卡组图片、包大小和音频 Range，再发布 AMD64／ARM64 镜像。main 更新 `latest`，每次保留 `sha-*` 标签，版本标签单独发布；纯 README／文档修改不会重建镜像。

本地验证运行中的镜像：

```sh
node scripts/test-docker.mjs http://127.0.0.1:18120
```
