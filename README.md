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

## 学校目录与 Go 发布数据

`/guide/schools` 在构建时读取 `data/school-presets.json`，通过固定主仓库提交和 SHA256 核对来源。浏览器不请求预设 API；离线构建沿用已保存的快照。维护者显式更新目录：

```sh
node scripts/sync-presets.mjs /path/to/smart-srun <完整提交SHA>
```

`data/school-verification.json` 仅记录有来源的验证范围，不复制主目录参数。`active` 不等于已验证；`verified` 必须提供审阅来源、插件版本、接入方式和日期，缺省保持未验证。

`/guide/download` 仅消费已公开、已核对资产的 Go 发布清单。首次公开 Go 版本导入前，页面明确显示未收录，不展示本地实验包。导入不可变公开版本：

```sh
node scripts/sync-releases.mjs 2.0.0rc1
```

脚本核对 GitHub Release 状态、原始清单摘要、真实资产清单及 `SHA256SUMS`，全部成功才替换快照。已导入版本保持原摘要，网络或校验错误保留旧快照；新增版本保留先前版本。构建不自动访问 GitHub，也不自动部署。

测试与跨仓库 M21 契约：

```sh
npm test
npm run test:contract -- /path/to/smart-srun
npm run docs:build
# 主仓库内
cd core && go test ./internal/update -run TestManifestV1ConsumerContract
```

预览服务器在重新构建后需重启，避免静态资源清单缓存指向已替换的文件。页面的移动端、暗色和键盘交互仍需浏览器检查。新增依赖只属于文档站，不进入路由器安装包。
