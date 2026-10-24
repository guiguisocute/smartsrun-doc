# 文档站维护

文档源代码位于 [guiguisocute/smartsrun-doc](https://github.com/guiguisocute/smartsrun-doc)，使用 [VitePress](https://vitepress.dev/) 和 Cloudflare Pages。用户指南在本站维护；与源码同步变化的构建、发布和部署手册保留在插件仓库，本站提供任务入口。

## 内容放在哪里

| 内容 | 归属 |
| --- | --- |
| 安装、配置向导、日常使用和故障排查 | `docs/guide/` |
| 当前版本字段和 CLI 的使用参考 | `docs/reference/`；链接源码契约，不复制完整默认值表 |
| 开发任务路由、架构说明与测量结果 | `docs/development/` |
| 预设贡献、来源和署名 | `docs/contribute/` |
| Python 1.x 的旧路径、接口和工具 | `docs/legacy/1.x/`；源码链接固定 `v1.6.1` |
| SDK、签名、更新与设备部署的完整步骤 | 插件源码仓 `doc/development/` |

指令入口仅保留全局约束和指针；目录导航只展示当前任务域。跨域查阅使用页面中的明确链接，完整事实来源见[上下文地图](/development/context)。

## 本地编辑

使用 Node.js 22 或更新版本，先安装锁定依赖：

```sh
npm ci
npm run docs:dev
```

Markdown 位于 `docs/`。栏目导航配置在 `docs/.vitepress/config.mts`，主题样式在 `docs/.vitepress/theme/`，公开图片放入 `docs/public/images/`。站内链接使用 `/guide/setup-wizard` 形式，代码链接指向插件仓库。

```sh
npm test
npm run test:contract -- /path/to/smart-srun
npm run docs:build
npm run docs:preview
```

构建会检查站内页面死链，并通过 `scripts/check-doc-links.mjs` 核对生成页面的内部链接与锚点；不要通过关闭死链检查掩盖迁移问题。`test:contract` 用指定的源码 checkout 检查发布清单契约及指向 `main` 的源码文件/目录是否存在；不访问 GitHub，也不证明远端已经合入。涉及跨仓新增链接时，两仓一起提交审查，在源码目标合入后再发布本站，避免新手册出现短暂 404。历史 tag、外部网站和跨站锚点仍需单独核对。

提交前检查窄屏、深浅色、搜索结果和目录链接。预览服务器在重新构建后需重启，避免资源清单缓存指向已替换的文件。截图必须使用示例账号与网络，不得包含真实凭据或会话信息。

当前锁定 VitePress 1.6.4，并通过 npm overrides 使用 Vite 6.4.3，避免旧开发服务器依赖的已知漏洞。升级后同时检查构建、预览、搜索和依赖审计。

## 显式同步数据快照

站点构建和浏览器只读取保存的快照，不自动抓取预设、GitHub Release 或 OpenWrt 设备目录。同步脚本只在维护者主动更新数据时运行；新增依赖仅属于文档站，不进入路由器安装包。

### 学校目录

`/guide/schools` 消费 `data/school-presets.json`。参数源始终是插件仓库的 `doc/school-presets.json`，通过固定提交与 SHA256 核对后同步：

```sh
node scripts/sync-presets.mjs /path/to/smart-srun <完整提交SHA>
```

`data/school-verification.json` 只维护有来源的验证范围，不复制学校参数。`active` 不等于已经验证；`verified` 需要审阅来源、插件版本、接入方式和日期。未提供证据保持未验证。

### Go 公开版本

`/guide/download` 消费 `data/release-catalogue.json`，只收录已公开并通过资产核对的不可变版本。维护者将下面的版本替换为需要导入的完整发布标签：

```sh
node scripts/sync-releases.mjs 2.0.0rc1
```

脚本核对 Release 状态、清单摘要、真实资产与 `SHA256SUMS`，全部通过才替换快照；网络或校验错误保留原文件。已有版本摘要不可修改，新增版本保留旧版本。导入本地实验包不属于该流程。

修改发布清单消费者时，在本站运行跨仓契约检查；源码仓对应门禁为 `cd core && go test ./internal/update -run TestManifestV1ConsumerContract`。

### OpenWrt 设备目录

`data/devices.json` 保存官方设备型号、硬件版本、固定固件目标与包架构映射。来源版本、URL 和原始摘要由同步脚本记录，不从商品型号推断第三方固件的包管理器。

```sh
node scripts/sync-devices.mjs
```

该脚本读取固定版本概览与各目标的 `profiles.json`，核对后原子替换快照，失败保留原文件。设备被收录不等于项目已有对应安装包或完成真机验收。

## Cloudflare Pages

| 设置 | 值 |
| --- | --- |
| 项目 | `smartsrun-doc` |
| 文档域名 | `https://srun-doc.guiguisocute.com/` |
| 生产分支 | `main` |
| 构建命令 | `npm run docs:build` |
| 输出目录 | `docs/.vitepress/dist` |
| Node.js | `22` |

Cloudflare 的 GitHub 集成负责生产与预览部署；GitHub Actions 负责 PR 的构建检查。自定义域名在 Pages 项目中绑定，DNS 使用指向 `smartsrun-doc.pages.dev` 的 CNAME；站点地图和对外文档链接统一使用 `https://srun-doc.guiguisocute.com/`。Pages API 令牌不存入仓库，日常改文档无需分发令牌。设置方式参见 [Cloudflare VitePress 部署指南](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vitepress-site/)。

## 更新约定

- 使用指南描述用户操作；字段参考指向可读契约，目录约束留在所属源码的指令文件。
- 按源代码核对行为，区分开发版本、发布版本与未实现计划。
- 认证策略、学校预设、账号类型使用一致术语；未知后缀不补齐为运营商猜测值。
- 公共预设 JSON 仍在插件仓库维护，文档站不复制另一份可编辑目录。
- 文档入口与插件内链接保持一致。
- 保留已有页面 URL 和锚点。内容移动后原入口给出明确的版本说明与新链接，勿让旧链接落到另一版本的安装命令。
- 修改发布模板、离线手册或旧入口时同步链接，保留贡献者署名与验证范围。
