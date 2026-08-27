# SGSYEN 阿里云部署与回滚手册

本文档描述 SGSYEN Web/API 从 GCP 迁移到阿里云的目标部署方式。它不授权
创建付费资源、修改 DNS、停止 Cloud Run 或删除 GCS 数据。上述生产动作必须在
数据校验、影子环境验收和用户确认后单独执行。

## 目标边界

SGSYEN 属于 GSYEN 业务空间，部署在 `/srv/gsyen`，不使用 HalfSphere 的用户、
端口、数据库凭据、OSS 前缀或备份目录：

```text
用户 -> Caddy -> SGSYEN Web  127.0.0.1:18082
              -> SGSYEN API  127.0.0.1:18084
                                |-- PostgreSQL/Supabase（迁移期间保留）
                                `-- OSS（目标对象存储）
```

生产域名预期为 `soulshock.net`/`sgsyen.com` 和 `api.soulshock.net`。在正式切换
窗口前，Caddy 候选配置必须使用独立的影子域名，且不得替换现有 DNS 记录。

系统级模板、资源限制、备份和回滚约束统一位于仓库根目录的
`deploy/aliyun/`。关键文件如下：

- `systemd/sgsyen-web.service`：Web，端口 `18082`；
- `systemd/sgsyen-api.service`：API，端口 `18084`；
- `env/sgsyen-*.env.example`：不含真实 Secret 的配置契约；
- `caddy/gsyen.Caddyfile.template`：仅供渲染和审核的候选入口；
- `install-foundation.sh`：默认只检查，应用前要求快照审批标记。

## 构建

使用锁文件安装依赖，不在构建日志输出环境变量：

```sh
cd sgsyen-api
npm ci
npm run typecheck
npm test
npm run build

cd ../sgsyen-web
npm ci
npm test
npm run typecheck
npm run lint
VITE_SGSYEN_API_URL=https://api-shadow.example.invalid npm run build
```

`VITE_SGSYEN_API_URL` 会进入前端产物，只能放公开 HTTPS 地址，不能放 Token 或私网凭据。
影子构建通过后，正式构建再使用经批准的 `https://api.soulshock.net`。

## 对象存储切换

API 必须显式配置存储 provider：

```dotenv
OBJECT_STORAGE_PROVIDER=oss
OSS_AUTH_MODE=ecs_ram_role
OSS_REGION=oss-cn-beijing
OSS_BUCKET=__REQUIRED__
OSS_ENDPOINT=https://oss-cn-beijing-internal.aliyuncs.com
OSS_PUBLIC_ENDPOINT=https://oss-cn-beijing.aliyuncs.com
OSS_RAM_ROLE=__REQUIRED__
```

生产强制使用独立 ECS RAM Role 与 IMDSv2 临时 STS 凭证，不把长期 AccessKey
写入 Git、镜像或环境文件。服务端正文读取走北京内网 endpoint；发给浏览器的
V4 签名下载 URL 必须走公网 endpoint。OSS bucket、RAM Role 和最小权限策略尚未
创建时，不得启用该服务。`gcs` provider 只在数据切换和回滚观察期保留；完成
GCP-off 验证后再移除其依赖。

切换前至少校验：对象总数、总字节数、每个对象键和 SHA-256、报告元数据与对象
映射、签名 URL 的权限/有效期，以及中文文件名和下载响应头。

## ECS 影子部署

在已有 ECS 上首次应用基础模板前，必须有已核验的云盘快照和文件级备份。先在
本地或候选主机执行只读检查：

```sh
bash deploy/aliyun/tests/validate-templates.sh
bash deploy/aliyun/install-foundation.sh --check
```

生产主机上的 `--apply`、systemd unit 启用、Caddy import/reload 均是独立变更，
不得由构建任务自动触发。应用目录和环境文件分别为：

```text
/srv/gsyen/apps/sgsyen-web/current
/srv/gsyen/apps/sgsyen-api/current
/srv/gsyen/config/sgsyen-web.env
/srv/gsyen/config/sgsyen-api.env
```

每个 app 的实际 payload 位于 `releases/<release-id>`，并由 root-only 的
stage/promote 哈希审批标记原子切换 `current`；命令和单服务回滚流程见
`deploy/aliyun/README.md`。不得用覆盖式复制更新 `current` 指向的 release。

真实环境文件必须为 `root:gsyen`、权限 `0640`。服务必须只监听 loopback，并由
unit 中的启动后检查再次确认；公网入口只能经 Caddy。

## 业务验收

“进程正在运行”不算验收。影子环境至少需要完成：

1. Web 首页、中文内容、报告列表和详情页；
2. API `/health`、鉴权失败码、跨域允许/拒绝路径；
3. 报告读取、OSS 签名下载、过期 URL 和越权对象访问；
4. 数据库行数、UUID、时间字段、外键及抽样业务结果；
5. 服务重启、ECS 重启、自恢复和资源上限；
6. 备份恢复到隔离目录，并复核数据库与对象哈希；
7. 日志中不存在 `run.app`、GCS、Cloud SQL 或其他 GCP 生产请求。

## 独立回滚

切换窗口内 SGSYEN 可以单独回滚，不要求 HalfSphere 同时回滚：

1. 恢复 SGSYEN 原 DNS/Caddy 路由；
2. 停止 `sgsyen-web`、`sgsyen-api` 候选 unit；
3. 恢复切换前数据库写入策略；
4. 在观察期内继续保留 GCP 数据和 GCS provider；
5. 对回滚后的业务、数据增量和第三方回调重新验收。

未取得明确确认前，不停止 Cloud Run、不禁用部署身份、不删除 Cloud SQL/GCS/
Artifact Registry/Secret，也不修改生产 DNS。
