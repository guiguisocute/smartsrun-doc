# 配置、备份与更新

本页适用于 Go 2.0 和当前源码仓 `main`。配置为 `schema_version: 2` 的类型化 JSON；1.x 的字符串配置与旧路径见[历史参考](/legacy/1.x/configuration)。

## Go 存储与字段契约

| 路径 | 内容 | 是否属于用户备份 |
| --- | --- | --- |
| `/etc/smart-srun/config.json` | 插件配置、账号与热点，包含凭据 | 是；优先使用版本化导出 |
| `/etc/smart-srun/user-presets.json` | 自建学校预设 | 是；单独备份 |
| `/usr/share/smart-srun/school-presets.json` | 随包公共学校预设 | 否 |
| `/tmp/smart-srun/presets-cache.json` | 远端预设缓存 | 否 |
| `/tmp/smart-srun/plugin.log` | 插件日志 | 否 |
| `/var/run/smart-srun/` | 控制 socket、状态与临时任务 | 否；重启设备会清除 |
| `/etc/smart-srun/recovery/` | 无线或安装恢复事务 | 不作为配置恢复材料 |

路径以 [daemon.Paths](https://github.com/matthewlu070111/smart-srun/blob/main/core/internal/daemon/paths.go) 为准。字段类型与默认值直接从已安装版本读取：

```sh
srunnet config schema
srunnet config defaults
srunnet config show
srunnet config get checks.interval_seconds
```

`schema` 和 `defaults` 可在服务停止时读取；`show`、`get` 隐藏密码，不是完整备份。布尔值使用 `true` / `false`，数值字段使用 JSON 数字，协议参数按字段定义保持字符串。完整字段以 [config.BuildSchema](https://github.com/matthewlu070111/smart-srun/blob/main/core/internal/config/schema.go) 与 [config.Defaults](https://github.com/matthewlu070111/smart-srun/blob/main/core/internal/config/defaults.go) 为准，本站不复制一份默认值表。

| 配置分组 | 用途 | 使用说明 |
| --- | --- | --- |
| `enabled`、`multi_wan_enabled` | 自动认证与多 WAN 总开关 | [账号与线路](/guide/accounts) |
| `campus_accounts`、`hotspot_profiles`、`selection` | 校园账号、热点、当前与默认项 | [账号管理](/guide/accounts#校园网账号与热点配置) |
| `quiet`、`retry`、`checks`、`failover` | 定时、重试、连通性与切网 | [状态与定时](/guide/status) |
| `log` | 日志等级与文件记录策略 | [日志](/guide/status#日志) |
| `preset_updates` | 每日公共预设更新时间 | [学校预设](/guide/schools) |
| `login_defaults`、账号 `login`、`school_extra` | 协议参数及策略声明的额外字段 | [认证策略](/guide/authentication) |

保存使用 `expected_revision` 防止覆盖他人的新配置。优先通过 LuCI 编辑；CLI 的交互编辑与 JSON 输入见[命令行参考](/reference/cli#配置与账号)。

## 1.x 存储与默认值

旧锚点继续指向版本明确的入口：[1.x 存储与默认值](/legacy/1.x/configuration#_1-x-存储与默认值)。旧 `config.json` 不能直接放到 Go 配置路径；使用[显式版本转换](/guide/backup-migration#从-1-6-1-转到-go)。

## 保留配置刷机与手动备份

推荐先在进阶设置[导出版本化备份](/guide/backup-migration)，自建预设单独保存。备份包含密码，不要提交到 Issue 或公开仓库。

Go 的 [keep.d 规则](https://github.com/matthewlu070111/smart-srun/blob/main/root/lib/upgrade/keep.d/smart-srun)只追加以下用户文件：

```text
/etc/smart-srun/config.json
/etc/smart-srun/user-presets.json
```

保留配置刷机前用 `sysupgrade -l` 检查本机实际清单；不存在的预设文件可能不出现在输出中。新固件没有插件时仍需安装匹配的包。清空配置、恢复出厂或重写磁盘不能依赖保留规则，提前下载备份。

配置导入、跨版本转换与预览确认统一见[备份与升级](/guide/backup-migration)，不要使用 1.x 的 `config set -f` 命令覆盖 Go 配置。

## 更新包来源与校验

Go 内置更新读取发布清单，按实际架构、固件系列与现有包型匹配安装包，下载摘要及原生验证必须通过。APK 内置更新和恢复需要设备已有受信公钥；手动安装时跳过签名不会自动安装公钥。

普通更新见[命令行在线更新](/reference/cli#在线更新)；开发设备上传、精确版本恢复与发布证据见[验证与部署入口](/development/validation)。配置备份与安装恢复包分别保留。
