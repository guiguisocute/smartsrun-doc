# 文档站维护

文档源代码位于 [guiguisocute/smartsrun-doc](https://github.com/guiguisocute/smartsrun-doc)，使用 [VitePress](https://vitepress.dev/) 和 Cloudflare Pages。插件仓库 README 仅保留最简使用入口，详细说明在本站维护。

## 本地编辑

使用 Node.js 22 或更新版本，先安装锁定依赖：

```sh
npm ci
npm run docs:dev
```

Markdown 位于 `docs/`。栏目导航配置在 `docs/.vitepress/config.mts`，主题样式在 `docs/.vitepress/theme/`，公开图片放入 `docs/public/images/`。站内链接使用 `/guide/setup-wizard` 形式，代码链接指向插件仓库。

```sh
npm run docs:build
npm run docs:preview
```

构建会检查站内死链；不要通过关闭死链检查掩盖迁移问题。提交前检查窄屏、深浅色、搜索结果和目录链接。截图必须使用示例账号与网络，不得包含真实凭据或会话信息。

当前锁定 VitePress 1.6.4，并通过 npm overrides 使用 Vite 6.4.3，避免旧开发服务器依赖的已知漏洞。升级后同时检查构建、预览、搜索和依赖审计。

## Cloudflare Pages

| 设置 | 值 |
| --- | --- |
| 项目 | `smartsrun-doc` |
| 生产分支 | `main` |
| 构建命令 | `npm run docs:build` |
| 输出目录 | `docs/.vitepress/dist` |
| Node.js | `22` |

Cloudflare 的 GitHub 集成负责生产与预览部署；GitHub Actions 负责 PR 的构建检查。Pages API 令牌不存入仓库，日常改文档无需分发令牌。设置方式参见 [Cloudflare VitePress 部署指南](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vitepress-site/)。

## 更新约定

- 使用指南描述用户操作；配置字段和实现约束放在参考或开发栏目。
- 按源代码核对行为，区分开发版本、发布版本与未实现计划。
- 认证策略、学校预设、账号类型使用一致术语；未知后缀不补齐为运营商猜测值。
- 公共预设 JSON 仍在插件仓库维护，文档站不复制另一份可编辑目录。
- 旧文档入口保留跳转说明；独立油猴脚本归档后不再推荐安装。
- 修改发布模板、离线手册或旧入口时同步链接，保留贡献者署名与验证范围。
