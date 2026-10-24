# 开发与维护入口

先确定要改的行为，再加载对应说明。当前源码仓 `main` 是 Go 2.0，设备包不包含 Python；1.x 的旧接口见[历史资料](/legacy/1.x/)。源码版本与已发布版本可能不同。

| 要完成的任务 | 从这里开始 | 修改与验证的事实来源 |
| --- | --- | --- |
| 调整认证、状态或网络行为 | [架构地图](/development/architecture) | 源码仓 `core/AGENTS.md` 与对应 Go 包 |
| 修改 LuCI 表单、日志或向导 | [界面与任务状态](/development/architecture#luci-与任务状态契约) | 源码仓 `root/AGENTS.md` 与现有契约测试 |
| 新增学校或修正后缀 | [贡献学校预设](/contribute/presets) | 源码仓 `doc/school-presets.json` |
| 运行测试、准备 SDK 包 | [验证与发布入口](/development/validation) | 源码仓构建与发布手册 |
| 更新开发设备或恢复安装 | [部署入口](/development/validation#更新与热部署) | 源码仓部署手册 |
| 更新本站内容或数据快照 | [文档站维护](/development/documentation) | 本站同步脚本、测试和锁文件 |
| 了解性能结果 | [Go 性能基准](/development/benchmarks) | 固定版本、下载原始结果与测量边界 |

为人或 Agent 准备任务上下文时，使用[上下文地图](/development/context)。它说明哪些知识应随目录加载、哪些说明只在任务需要时读取，以及如何依据 diff 找到检查入口。
