# 架构与认证策略扩展

本页描述当前 `main` 的 Go 2.0。旧 Python `Profile`、`Runtime` 和 `school_runtime.py` 接口保留在 [1.x 架构资料](/legacy/1.x/architecture)，不能用于 Go 包。

## 源码布局

OpenWrt 安装内容由 [Makefile](https://github.com/matthewlu070111/smart-srun/blob/main/Makefile) 决定。`core/` 编译为设备上的 `srunnet`；`root/` 提供 LuCI、服务及静态资源；`scripts/` 和 `tests/` 是开发主机材料。

按一次用户操作的流向查找源码：

| 阶段 | 源码入口 | 职责 |
| --- | --- | --- |
| CLI 或 LuCI 发起操作 | [cli](https://github.com/matthewlu070111/smart-srun/tree/main/core/internal/cli)、[LuCI controller](https://github.com/matthewlu070111/smart-srun/blob/main/root/usr/lib/lua/luci/controller/smart_srun.lua) | 解析输入、显示结果 |
| 本地控制协议 | [control](https://github.com/matthewlu070111/smart-srun/tree/main/core/internal/control) | Unix socket 请求与响应 |
| 服务协调 | [daemon](https://github.com/matthewlu070111/smart-srun/tree/main/core/internal/daemon)、[application](https://github.com/matthewlu070111/smart-srun/tree/main/core/internal/application) | 配置、互斥任务、调度及状态投影 |
| 领域与配置 | [domain](https://github.com/matthewlu070111/smart-srun/tree/main/core/internal/domain)、[config](https://github.com/matthewlu070111/smart-srun/tree/main/core/internal/config)、[policy](https://github.com/matthewlu070111/smart-srun/tree/main/core/internal/policy) | 类型、默认值、校验和决策 |
| 认证与门户 | [auth](https://github.com/matthewlu070111/smart-srun/tree/main/core/internal/auth)、[protocol](https://github.com/matthewlu070111/smart-srun/tree/main/core/internal/protocol)、[portal](https://github.com/matthewlu070111/smart-srun/tree/main/core/internal/portal) | 协议编码、认证事务和门户解析 |
| 设备与网络边界 | [openwrt](https://github.com/matthewlu070111/smart-srun/tree/main/core/internal/openwrt)、[transport](https://github.com/matthewlu070111/smart-srun/tree/main/core/internal/transport)、[wireless](https://github.com/matthewlu070111/smart-srun/tree/main/core/internal/wireless)、[wifi](https://github.com/matthewlu070111/smart-srun/tree/main/core/internal/wifi) | 接口绑定、设备调用及无线事务 |
| 参数与安装 | [presets](https://github.com/matthewlu070111/smart-srun/tree/main/core/internal/presets)、[strategy](https://github.com/matthewlu070111/smart-srun/tree/main/core/internal/strategy)、[update](https://github.com/matthewlu070111/smart-srun/tree/main/core/internal/update) | 参数目录、编译期策略声明、独立更新与恢复 |

`core/cmd/srunnet/main.go` 是程序入口，`root/etc/init.d/smart_srun` 由 procd 管理主服务。更新使用独立 worker；停止主服务不会取消已开始的原生安装。配置和运行态的路径区别见[配置参考](/reference/configuration)。

## 扩展选择

学校之间只有网关、`AC_ID`、SSID、后缀或登录参数不同，先修改预设或逐账号参数，见[预设贡献](/contribute/presets)。先检查字段契约和现有协议实现，再决定是否需要代码变化。

Go 的认证策略由 [strategy.Strategy 与 Registry](https://github.com/matthewlu070111/smart-srun/blob/main/core/internal/strategy/strategy.go)静态声明并编译进程序，不动态加载 Python 模块。策略描述额外字段和扩展命令，不能自行绕过统一网络边界；保留命令清单以该文件的 `ReservedCommands` 为准。

账号 `operator_suffix` 决定实际登录名；空字符串是明确的不加后缀，不等于尚未选择。`school` 选择认证策略，预设 ID 仅记录参数来源；刷新预设不能覆盖用户已保存的账号参数。对字段类型和默认行为的修改应通过 `config.BuildSchema`、`config.Defaults` 与对应回归检查保持一致。

## LuCI 与任务状态契约

界面由 Lua controller、CBI 和 ES5 的 [smart_srun.js](https://github.com/matthewlu070111/smart-srun/blob/main/root/www/luci-static/resources/smart_srun.js) 组成，无前端 bundler 或设备端 Node 依赖。页面布局、中文文案和五步向导按源码仓 [root/AGENTS.md](https://github.com/matthewlu070111/smart-srun/blob/main/root/AGENTS.md) 的兼容约束维护。

页面读取、远端刷新、真实验证与保存是不同动作。日志查询同时服务主面板和进度弹窗；修改日志格式时核对控制器的翻译与前端等级识别。动作终态不能被日常状态轮询覆盖，无线暂存连接必须能确认或回滚。完整约束在对应目录维护，不在本站复制另一套接口规范。
