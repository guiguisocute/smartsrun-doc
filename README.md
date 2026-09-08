<p align="center">
  <a href="https://srun-doc.guiguisocute.com/"><img src="docs/public/logo.svg" width="96" height="96" alt="智慧深澜 Logo"></a>
</p>

<h1 align="center">智慧深澜文档</h1>

<p align="center">
  <a href="https://srun-doc.guiguisocute.com/"><strong>访问文档站</strong></a> ·
  <a href="https://github.com/matthewlu070111/smart-srun">插件仓库</a>
</p>

使用指南、配置参考与开发维护文档，基于 VitePress。需要 Node.js 22 或更新版本。

```sh
npm ci
npm run docs:dev
```

发布前执行 `npm run docs:build`。Cloudflare Pages 从 `main` 自动构建，输出目录 `docs/.vitepress/dist`。详细约定见 [文档站维护](docs/development/documentation.md)。
