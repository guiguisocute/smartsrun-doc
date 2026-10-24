# 上下文地图与事实来源

根说明负责指出入口，目录说明记录本域约束，命令与测试验证可执行的规则。开始任务时先定位变更文件，再读取相关上下文；无需把全部架构和发布步骤放进一次会话。

## 先按改动路径定位

| 变更范围 | 先读的源码仓指令 | 继续查找 |
| --- | --- | --- |
| Go 核心 `core/` | [core/AGENTS.md](https://github.com/matthewlu070111/smart-srun/blob/main/core/AGENTS.md) | 对应包、接口与回归测试 |
| LuCI、服务与随包文件 `root/` | [root/AGENTS.md](https://github.com/matthewlu070111/smart-srun/blob/main/root/AGENTS.md) | 控制器、表单、ES5 前端及 Makefile 安装规则 |
| 构建、校验与部署工具 `scripts/` | [scripts/AGENTS.md](https://github.com/matthewlu070111/smart-srun/blob/main/scripts/AGENTS.md) | 工具 `--help` 与构建/部署手册 |
| 公共预设与开发手册 `doc/` | [doc/AGENTS.md](https://github.com/matthewlu070111/smart-srun/blob/main/doc/AGENTS.md) | 目录源数据及预设契约 |
| 主机与 LuCI 测试 `tests/` | [tests/AGENTS.md](https://github.com/matthewlu070111/smart-srun/blob/main/tests/AGENTS.md) | 测试索引与固定 fixture |
| CI 和发布工作流 `.github/` | [.github/AGENTS.md](https://github.com/matthewlu070111/smart-srun/blob/main/.github/AGENTS.md) | 权限、签名环境与发布入口 |

跨目录任务取各域的必要上下文。根规则与源码仓的 [CONTRIBUTING.md](https://github.com/matthewlu070111/smart-srun/blob/main/CONTRIBUTING.md) 是导航；具体约束在其归属目录维护。

## 每类事实只维护一个来源

| 信息 | 权威来源 | 本站的作用 |
| --- | --- | --- |
| 字段类型、默认值与命令 | `srunnet config schema`、`config defaults`、`help` 及实现 | 解释用途，链接来源，提供少量可操作示例 |
| 包内容、SDK 与发布操作 | 源码仓 `Makefile`、`targets.json` 与[构建发布手册](https://github.com/matthewlu070111/smart-srun/blob/main/doc/development/build-release.md) | 按任务引导，不复制手册 |
| 更新和开发设备操作 | 源码仓[部署手册](https://github.com/matthewlu070111/smart-srun/blob/main/doc/development/deployment.md) | 说明前置条件与验收边界 |
| 学校预设参数 | 源码仓 `doc/school-presets.json` | 展示经来源校验的构建快照 |
| 已公开包和验收证据 | 固定版本 Release 清单与摘要 | 下载匹配与验证范围展示 |
| 文档构建和快照更新 | 本站[维护说明](/development/documentation) | 完整操作说明只维护在此 |

历史说明链接固定 tag 或提交 SHA；当前说明引用文件和符号名，不引用会漂移的行号。旧 URL 和锚点保留为版本明确的入口。

## 让改动选择上下文

源码仓的[上下文与检查工具说明](https://github.com/matthewlu070111/smart-srun/blob/main/doc/development/context.md)提供 diff 驱动的入口与检查建议。工具按变更路径选择规则和验证，输出供开发者与 Agent 阅读的导航，不会自动注入上下文或执行建议命令。

本站验证也按影响范围触发：Markdown 和导航改动运行构建；快照或组件逻辑改动运行测试；指向源码的链接或发布格式变化运行跨仓契约检查。完整命令见[本地编辑](/development/documentation#本地编辑)。

复杂而低频的任务只在开始构建、部署、数据同步时读取对应手册。已有工具能直接检查的规则放入工具；不为一次性任务增加常驻 Skill 描述或复制长提示词。
