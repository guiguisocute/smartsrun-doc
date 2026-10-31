# 智慧深澜文档

[访问文档站](https://srun-doc.guiguisocute.com/) · [插件源码](https://github.com/matthewlu070111/smart-srun) · [维护入口](docs/development/documentation.md)

本站按用户任务提供使用指南、参考和开发导航。Go 2.x 已正式发布；最新版本、安装包与验证范围统一见[下载页](https://srun-doc.guiguisocute.com/guide/download)。Python 1.x 的历史说明集中在 [legacy/1.x](docs/legacy/1.x/index.md)。

需要 Node.js 22 或更新版本：

```sh
npm ci
npm run docs:dev
```

提交前运行 `npm test` 和 `npm run docs:build`；涉及源码链接或发布契约时运行 `npm run test:contract -- /path/to/smart-srun`。快照同步、内容归属和部署设置只在[文档站维护](docs/development/documentation.md)维护。

Cloudflare Pages 从 `main` 自动部署；本地构建不会部署。
