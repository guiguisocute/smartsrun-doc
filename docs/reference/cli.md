# 命令行参考

本页适用于 Go 2.0。先执行 `srunnet version` 确认版本，使用 `srunnet help` 或 `srunnet man` 查看该包支持的命令。旧版字符串设置和 `--payload` 示例见 [1.x 命令行](/legacy/1.x/cli)。

```sh
srunnet status
srunnet version
srunnet login
srunnet logout
srunnet relogin
srunnet enable
srunnet disable
srunnet switch hotspot
srunnet switch campus
srunnet log -n 80
srunnet log runtime
```

无参数等同 `status`。`login / logout / relogin` 可追加账号 ID；省略时使用当前校园账号。认证和切网会执行真实操作，默认等待动作结束；支持的异步选项见本机帮助。

`enable / disable` 保存自动认证开关，和 procd 的开机启动设置不同。状态及配置读取不会自动启动服务，需要时显式运行 `srunnet service ensure-running`。手动登出暂停该账号的自动认证，语义见[认证说明](/guide/authentication#go-2-0-开发版的手动登出与热点切换)。

## 配置与账号

```sh
srunnet config schema
srunnet config defaults
srunnet config show
srunnet config get checks.interval_seconds
srunnet config account list
srunnet config account add --interactive
srunnet config account edit campus-1 --interactive
srunnet config hotspot list
srunnet config hotspot add --interactive
```

将 `campus-1` 替换为列表返回的真实 ID。交互编辑需要终端，密码不回显，编辑时留空保留原密码。配置读取会隐藏凭据，不能作为完整备份。

`config set` 从标准输入读取 JSON。先从 `config show` 获取 `revision`，再将下面的 `0` 替换为刚读取的值：

```sh
printf '%s\n' '{"expected_revision":0,"settings":{"enabled":false}}' | srunnet config set
```

冲突后重新读取配置；不要盲目复用旧修订号。账号或热点的非交互写入也使用 JSON，请从 `srunnet man` 查询输入格式。备份导出、导入预览与提交命令集中在[配置备份](/guide/backup-migration#命令行)。

## 策略、预设与探测

```sh
# 已编译的认证策略；不访问远端
srunnet schools list
srunnet schools inspect default

# 本地预设；刷新时必须指定真实出口
srunnet presets list
srunnet presets refresh --iface wan

# 只读环境、认证地址与公开后缀探测
srunnet detect env --access-mode wired --iface wan
srunnet detect acid --access-mode wired --iface wan --base-url 'http://portal.example.test/srun_portal_pc?ac_id=1'
srunnet detect operators --access-mode wired --iface wan --base-url http://portal.example.test --ac-id 1
```

接口、地址与账号 ID 需替换为实际环境。`presets list` 读本地目录；`refresh` 才请求远端。读取页面不会刷新公共预设。

`detect identity` 用于只读在线身份识别；`detect operator|verify --stdin` 接收包含凭据的 JSON，可能发起真实登录。只提交已知后缀，空字符串表示明确不加后缀；不要将密码写在命令行参数或公开记录中。日常操作优先使用[五步向导](/guide/setup-wizard)。

`detect wifi` 会临时修改网络，包含启动、查询、取消与确认流程，通常通过向导操作。底层任务接口以 [cli/help.go](https://github.com/matthewlu070111/smart-srun/blob/main/core/internal/cli/help.go) 和相邻命令实现为准，不沿用旧 Python 的 `--payload`、`--commit` 参数。

## 在线更新

```sh
srunnet update inventory
srunnet update check --channel stable
# 测试候选版时：srunnet update check --channel rc
srunnet update run PLAN_ID
srunnet update status
```

将 `PLAN_ID` 替换为检查返回的已验证计划 ID；不要无参数执行 `update run`。`run --background` 的完整形式为 `srunnet update run PLAN_ID --background`。安装前备份配置；独立 worker 开始安装后，停止主服务不会中断安装。

更新失败先读取 `update status` 与实际包版本，再按提示使用 `srunnet update recover`。APK 更新和恢复必须通过受信签名验证；公钥设置见[下载页](/guide/download#可选-安装公钥)，开发上传与恢复操作见[部署入口](/development/validation#更新与热部署)。
