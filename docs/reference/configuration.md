# 配置、备份与更新

## 存储与默认值

| 路径 | 内容 |
| --- | --- |
| `/usr/lib/smart_srun/config.json` | 校园账号、热点、认证策略和插件设置；包含凭据 |
| `/usr/lib/smart_srun/user_presets.json` | 用户自建预设与账号类型快捷项 |
| `/usr/lib/smart_srun/defaults.json` | 随包默认值，不是用户备份 |
| `/usr/lib/smart_srun/school_presets_cache.json` | 公共预设缓存 |
| `/usr/lib/smart_srun/school_presets_fallback.json` | 随包公共预设 |
| `/var/run/smart_srun/` | 状态、动作与更新、无线配置临时任务 |
| `/var/log/smart_srun.log` | 插件日志 |
| `/etc/config/smart_srun` | LuCI CBI 的 UCI 节点，不是完整账号配置 |

持久化布尔值和数字通常使用 UCI 风格字符串，例如 `"0"`、`"1"`、`"60"`。完整默认值以 [defaults.json](https://github.com/matthewlu070111/smart-srun/blob/main/root/usr/lib/smart_srun/defaults.json) 为准，已有配置不应被随包默认值覆盖。

| 配置 | 当前随包默认值 | 作用 |
| --- | --- | --- |
| `enabled` / `multi_wan_enabled` | `0` / `0` | 自动认证及多 WAN 总开关 |
| `school` | `default` | 认证策略标识 |
| `interval` / `log_level` | `60` / `INFO` | 检测间隔及日志等级 |
| `quiet_hours_enabled` | `1` | 定时时段开关，受总开关控制 |
| `quiet_start` / `quiet_end` | `00:00` / `06:00` | 北京时间下线时段 |
| `force_logout_in_quiet` / `failover_enabled` | `1` / `1` | 定时强制登出及热点切换 |
| `connectivity_check_mode` | `internet` | 在线判断依据 |
| `backoff_enable` / `backoff_max_retries` | `1` / `4` | 登录失败退避及最大重试次数；次数 `0` 表示无限 |
| `retry_cooldown_seconds` / `retry_max_cooldown_seconds` | `10` / `60` | 重试等待范围 |
| `switch_ready_timeout_seconds` | `30` | 切网等待时间 |
| `manual_terminal_check_max_attempts` / `manual_terminal_check_interval_seconds` | `5` / `2` | 手动动作终态检查 |
| `hotspot_failback_enabled` | `1` | 热点切换失败时回退 |

账号高级登录字段为 `n`、`type`、`enc`、`info_prefix`、`double_stack`、`login_os`、`login_name`。账号值优先；`n/type/enc` 再兼容旧全局配置，其余缺省字段使用内置默认。不要将某账号解析后的值作为另一账号的默认值。

`_legacy_login_shape` 和 `_multi_wan_strict_bind` 只用于运行态，不可持久化。`school_extra` 由认证策略的字段描述符归一化，未知键会被丢弃。

## 保留配置刷机与手动备份

当前包中的 [keep.d 规则](https://github.com/matthewlu070111/smart-srun/blob/main/root/lib/upgrade/keep.d/smart-srun) 包含：

```text
/usr/lib/smart_srun/config.json
/usr/lib/smart_srun/user_presets.json
```

在刷机前更新插件并检查本机实际清单；尚未创建的用户预设文件可能不会出现在输出中：

```sh
sysupgrade -l | grep -E '^/usr/lib/smart_srun/(config|user_presets)\.json$'
```

然后在 **系统 → 备份/升级** 下载备份，升级时选择保留配置。新固件没有插件时仍需重新安装程序；程序会读取恢复的 JSON 文件。公共预设缓存、程序、默认值和临时运行状态不属于本插件追加的备份项。参见 [OpenWrt 备份与恢复](https://openwrt.org/docs/guide-user/troubleshooting/backup_restore)。

清空配置刷机、恢复出厂或重写磁盘镜像不能依赖保留规则。应提前将上述两份文件下载到电脑；不存在的 `user_presets.json` 可以跳过。重装后将主配置上传为 `/tmp/smart-srun-config.json`，导入并重启：

```sh
srunnet config set -f /tmp/smart-srun-config.json
/etc/init.d/smart_srun restart
```

用户预设需单独恢复到 `/usr/lib/smart_srun/user_presets.json`，不是通过 `config set -f` 导入。保留原文件内容、限制文件权限，刷新 LuCI 后查看。备份含账号与密码；路由器 `/tmp` 中的副本重启后会丢失。

## 更新包来源与校验

在线更新保留当前 bundle / split 包型。bundle 来自 Release 资产；分体压缩包从 `downloads` 分支获取。更新器会使用可用的 SHA-256 信息校验下载；历史资产可能没有摘要或旁注，不能把兼容回退描述为所有旧包都经过签名或摘要验证。
