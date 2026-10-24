# 文档站工作入口

- 先读 [文档站维护](docs/development/documentation.md)中与改动对应的章节；开发任务从[上下文地图](docs/development/context.md)定位来源。
- 用户操作放 `docs/guide/`，字段与命令放 `docs/reference/`，任务路由放 `docs/development/`，Python 1.x 资料放 `docs/legacy/1.x/`。
- 插件源码、默认值、构建与部署步骤以源码仓为准；不要在本站再维护一份操作手册。当前 `main` 是 Go，历史源码链接使用版本标签或提交 SHA。
- 保留已有页面 URL 和锚点；不以关闭死链检查解决问题。引用文件名、符号和版本，不引用可漂移的行号。
- 预设、发布、设备数据通过 `scripts/sync-*.mjs` 显式同步。构建和浏览器不得隐式联网刷新；未知参数与验收等级不得推断。
- `npm test`、`npm run docs:build` 检查本站；跨仓指针或契约变化再运行 `npm run test:contract -- /path/to/smart-srun`。缺少源码 checkout 不算通过。
- 截图和样例只用合成数据。推送 `main` 会触发生产部署，编辑或验证文档本身不授权发布。
