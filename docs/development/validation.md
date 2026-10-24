# 测试、热更新与发布

此页帮助选择验证层级；可以执行的完整 SDK、签名与部署步骤维护在源码仓，随实现一起更新。当前 `main` 为 Go，Python 1.x 的操作另见页面末尾的历史入口。

## Go 2.0 开发分支

这一旧锚点继续保留；Go 已是当前 `main` 的实现。修改核心时先运行相关回归，完整主机门禁为 `bash scripts/verify-go.sh`；它执行格式、vet、乱序测试、覆盖率与竞态检查。主机工具和 LuCI 检查从源码仓 [tests/README.md](https://github.com/matthewlu070111/smart-srun/blob/main/tests/README.md)选择。

| 已执行的检查 | 能说明什么 | 不能据此声称 |
| --- | --- | --- |
| 主机单元与契约测试 | 被覆盖的状态、输入和接口行为符合断言 | 真实无线和校园环境均通过 |
| SDK 构建与原生包核验 | 指定输入可构建，包元数据、签名、ELF/ABI 和载荷通过相应检查 | 包已在实际设备安装 |
| QEMU 版本命令 | 二进制在对应模拟环境可启动 | 全部核心功能或设备性能达标 |
| OpenWrt 安装验证 | 该包与该固件组合可安装和启动 | 学校认证及长测通过 |
| 真机、校园与长期运行 | 被记录的设备、环境、版本和时间范围 | 未测架构或其他学校也通过 |

[性能基准](/development/benchmarks)与下载页均保留测量和验收范围。未执行的检查应明确列出，不把构建成功提升成发布验收。

## 构建与发布入口

需要 SDK 输入、签名、公钥、发布清单或工作流参数时，读取源码仓[构建与发布手册](https://github.com/matthewlu070111/smart-srun/blob/main/doc/development/build-release.md)。`targets.json`、`Makefile` 和工作流是可执行来源；预览构建、正式签名、草稿创建及公开发布分别处理。

公开资产必须来自已校验的同一批不可变产物。测试构建不是公开发布许可，实验 APK 签名不能直接作为发布身份。不要在本站复制整套发布命令或密钥环境配置。

## 更新与热部署

首次安装使用设备原生包管理器，见[安装指南](/guide/install)。已经具备 `srunnet update inventory` 的 Go 设备可使用[开发部署与恢复手册](https://github.com/matthewlu070111/smart-srun/blob/main/doc/development/deployment.md)。

部署工具位于开发主机，设备不需要 Python。准备实际 SDK 包、精确版本恢复包后，按手册完成本地校验、只读探测、设备核验和安装。内置更新、恢复、热部署均要求原生受信验证；用户手动安装时的跳过签名选项不等于发布或部署验收通过。

## 1.x 本地检查

旧 Python、pytest 与 Ruff 命令只适用于旧树，见 [1.x 本地检查](/legacy/1.x/validation#_1-x-本地检查)。

## 1.x 路由器热更新

Paramiko 与显式 Python 文件覆盖流程只适用于旧安装，见 [1.x 热更新](/legacy/1.x/validation#_1-x-路由器热更新)。不得用于 Go 设备。

## 1.x 构建与发布

旧的空 `Build/Compile` 与历史工作流说明见 [1.x 构建与发布](/legacy/1.x/validation#_1-x-构建与发布)，对应源码固定到 `v1.6.1`。
