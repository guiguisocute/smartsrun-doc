# 智慧深澜文档

[访问文档站](https://smartsrun-doc.pages.dev) · [插件仓库](https://github.com/matthewlu070111/smart-srun)

使用指南、配置参考与开发维护文档，基于 VitePress。需要 Node.js 22 或更新版本。

```sh
npm ci
npm run docs:dev
```

发布前执行 `npm run docs:build`。Cloudflare Pages 从 `main` 自动构建，输出目录 `docs/.vitepress/dist`。详细约定见 [文档站维护](docs/development/documentation.md)。
