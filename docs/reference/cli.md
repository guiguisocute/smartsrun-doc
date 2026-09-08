# 命令行参考

安装后执行 `srunnet help` 查看当前版本支持的命令；`srunnet help config` 查看子命令，`srunnet man` 查看离线手册。无参数等同 `srunnet status`。

```sh
srunnet status
srunnet --version
srunnet login
srunnet logout
srunnet relogin
srunnet enable
srunnet disable
srunnet switch hotspot
srunnet switch campus
srunnet log
srunnet log -n 80
srunnet log runtime
```

`enable / disable` 修改 `enabled`，不等同于 procd 的开机启动设置。认证与切网命令会执行真实操作。

## 配置与账号

```sh
srunnet config show
srunnet config get interval
srunnet config set interval=30 log_level=INFO
srunnet config set -f /tmp/smart-srun-config.json
srunnet config account
srunnet config account add
srunnet config account edit campus-1
srunnet config account rm campus-2
srunnet config account default campus-1
srunnet config hotspot
srunnet config hotspot add
srunnet config hotspot edit hotspot-1
srunnet config hotspot rm hotspot-2
srunnet config hotspot default hotspot-1
```

`config show` 是便于阅读的摘要，不是可直接导入的完整 JSON 备份。ID 应使用列表返回的真实值。账号与热点通过交互式命令编辑，完整导入使用 JSON 文件。

## 策略、预设与探测

```sh
# 已安装的认证策略及当前策略诊断
srunnet schools
srunnet schools inspect --selected

# 公共学校预设：list 读本地，refresh 请求远端
srunnet presets list
srunnet presets refresh

# 只读探测示例；地址、SSID 与接口应替换为自己的环境
srunnet detect env --access-mode wired --iface wan
srunnet detect env --access-mode wifi --ssid CampusWiFi --base-url http://portal.example.test
srunnet detect acid 'http://portal.example.test/srun_portal_pc?ac_id=1'
srunnet detect operators http://portal.example.test --ac-id 1 --access-mode wired --iface wan
```

`detect env` 也支持 `--school` 指定学校预设；这里的 `--school` 表示预设 ID，与全局 `school` 认证策略标识的用途不同。`detect acid` 可使用 `--reality-url` 检查会发生门户跳转的 HTTP 地址；有完整 URL 时应加引号，避免 `&` 等字符被 shell 解释。

`detect operator --payload FILE` 用于识别在线账号或验证已知后缀。JSON 文件字段包括 `base_url`、`ac_id`、`user_id`、`password`、`candidates`、`max_attempts`、`access_mode`、`iface`、`ssid` 与可选 `login_shape`。空密码只做在线身份识别；提供密码可能真实登录。文件会在读取后删除，凭据不要直接放进命令行。

`detect wifi` 是向导无线任务的底层接口，支持 `--payload` 启动、`--status` 查询、`--cancel` 回滚、`--commit` 保留和 `--account` 读取任务对应的无线字段。它会修改 UCI，通常应通过 LuCI 向导操作。接口契约见当前版本的 `cli.py` 与 `wifi_setup.py`。

## 在线更新

```sh
srunnet update check
srunnet update run
srunnet update status
```

`update check` 查询最新正式发布；`run` 下载并安装与现有包型及包管理器匹配的更新，`run --background` 启动后台任务。安装前备份配置，更新状态以 `update status` 或 LuCI 提示为准。
