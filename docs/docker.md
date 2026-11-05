# Docker 部署

镜像：`zhaoolee/piclex-web`。一个容器提供 Web 页面、公开卡组、图片和声音；启动时不需要 Node.js、不需要数据库，也不重新下载卡组。镜像不包含 AI 模型或模型 Key。

## 使用 Docker Hub 镜像

```sh
docker run -d --name piclex-web \
  --restart unless-stopped \
  -p 127.0.0.1:18120:8080 \
  zhaoolee/piclex-web:latest
```

打开 <http://127.0.0.1:18120>，自动进入 `/piclex-web/`。首次拉取包含公开卡组，体积大于只含网页代码的镜像。支持 Linux AMD64 与 ARM64（包括 Apple Silicon 的 Docker 环境）。

也可下载仓库的 `compose.yaml` 后执行：

```sh
docker compose up -d
```

## 数据与 AI

- 照片、学习进度和设置仍保存在**浏览器**的 IndexedDB／OPFS／本地存储中，不在容器内，因此不需要挂载数据卷。更换域名、端口、协议或浏览器会进入另一份存储；迁移前在设置中导出完整备份，勿清空站点数据。
- 官方 AI 服务有来源域名限制，**自托管地址不支持直接使用官方模型**。在「设置 → AI配置 → 自定义模型」配置自己的 DeepSeek 或 OpenAI 兼容图片模型；提供方须支持浏览器 CORS。照片由浏览器直接发送，Key 保存在当前浏览器且未加密。不要将 Key 写进 Dockerfile、构建参数或镜像。
- 已有卡组学习与本地导入可直接使用；AI、远程卡组、WebDAV 和部分浏览器语音服务仍需网络。Docker 部署不增加云端账号或多设备自动同步。
- 本机 `localhost`／`127.0.0.1` 可使用相机等安全上下文功能；其他设备通过局域网 IP 访问时，请配置有效 HTTPS，麦克风、相机、OPFS 等功能受浏览器权限和能力约束。

## 局域网与 HTTPS

局域网提供服务时将端口映射改为 `-p 18120:8080`，并在反向代理提供 HTTPS。应用固定在 `/piclex-web/`；根地址会跳转，代理保留路径即可：

```nginx
location / {
    proxy_pass http://127.0.0.1:18120;
    proxy_set_header Host $host;
}
```

以上片段放在已配置 TLS 的 Nginx 站点中。若只由本机反向代理访问容器，继续使用默认的 `127.0.0.1` 端口绑定。无需配置 WebSocket 或容器上传目录。

## 更新

Compose 部署：

```sh
docker compose pull
docker compose up -d
```

`docker run` 部署：先 `docker pull zhaoolee/piclex-web:latest`，再停止并删除自己启动的 `piclex-web` 容器，使用原命令重新创建。保持浏览器访问地址不变；这些容器操作不清理浏览器数据。可改用 `sha-<提交前7位>` 标签固定版本。

## 从源码构建

```sh
git clone https://github.com/zhaoolee/piclex-web.git
cd piclex-web
docker build -t piclex-web:local .
docker run --rm -p 127.0.0.1:18120:8080 piclex-web:local
```

构建需要联网下载 npm 依赖、基础镜像及 `content/snapshot.json` 固定的公开卡组；包大小、SHA256 和词条数验证失败会停止构建。构建缓存复用下载内容，最终镜像只包含 Nginx、静态产物和许可证，不含源码、构建工具或本机配置。第三方卡组的授权不因打包进容器而改变，见 [素材说明](../ASSET_LICENSES.md)。

## 自动发布

在 GitHub 仓库 Settings → Secrets and variables → Actions 配置：

- `DOCKERHUB_USERNAME`：Docker Hub 用户名（本仓库为 `zhaoolee`）。
- `DOCKERHUB_TOKEN`：有该镜像仓库写入权限的 Docker Hub access token。

创建对应的公开仓库 `zhaoolee/piclex-web`。工作流 `Publish Docker image` 在 main 代码更新、`v*` 标签或手动运行时执行，先启动容器验证页面、静态资源、完整卡组图片、包大小和音频 Range，再发布 AMD64／ARM64 镜像。main 更新 `latest`，每次保留 `sha-*` 标签，版本标签单独发布；纯 README／文档修改不会重建镜像。

本地验证运行中的镜像：

```sh
node scripts/test-docker.mjs http://127.0.0.1:18120
```
