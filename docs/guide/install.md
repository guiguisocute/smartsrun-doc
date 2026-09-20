# 安装与兼容性

本页介绍已有 **1.x Python 版本**。Go 2.0 的实际架构包、发布清单与受信签名要求见[下载与版本选择](/guide/download)，不要把下面的 1.x 无架构包说明或签名绕过方式用于 Go 2.0。

## 适用范围

智慧深澜（smart-srun）面向 OpenWrt 上常见的深澜 SRun 网页认证环境，提供 Python 守护进程、`srunnet` 命令行和 LuCI 界面。支持有线与无线接入、多个校园账号、热点切换及多 WAN 认证。

程序使用脚本实现，包架构为 `all`，但仍需要兼容的 OpenWrt、Python 标准库拆分包和 LuCI 环境。包架构无关不代表任意固件都能直接运行。LuCI 部分使用 Lua CBI，固件需具备相应兼容模块；本项目没有将 LuCI 本身打进 bundle。

自动配置无线需要无线驱动、扫描能力以及常规的 OpenWrt network / firewall 配置。企业 Wi-Fi、PPPoE、非深澜认证或特殊门户流程不属于通用向导的自动适配保证范围。多 WAN 功能负责逐线路认证，不负责负载均衡、带宽叠加或多设备检测处理。

## 安装包

| 包名 | 内容 | 使用场景 |
| --- | --- | --- |
| `smart-srun` | Python 运行时、守护进程、CLI | 仅命令行，或分体安装的基础包 |
| `luci-app-smart-srun` | LuCI 页面与静态资源 | 与 `smart-srun` 配套安装 |
| `luci-app-smart-srun-bundle` | 运行时、CLI 与本插件的 LuCI 文件 | 手动安装，推荐使用 |

运行时依赖 `python3-light`、`python3-urllib`、`python3-codecs`、`python3-openssl`。bundle 与两个分体包互斥；在二者之间切换前，先备份并移除原包型。

从 [Releases](https://github.com/matthewlu070111/smart-srun/releases) 下载安装包。以设备实际包管理器为准：`opkg` 使用 `.ipk`，`apk` 使用 `.apk`，不要仅根据第三方固件的版本名称判断。相关命令见 [OpenWrt 包管理说明](https://openwrt.org/docs/guide-user/additional-software/managing_packages)。

## 安装方式

安装前让路由器能够访问软件源，以便下载依赖。LuCI 中可进入 **系统 → 软件包**，更新列表后上传安装包。安装成功后重新登录 LuCI，进入 **服务 → SMART SRun**。

也可以将包上传到路由器 `/tmp` 后通过 SSH 安装，只执行与本机包管理器对应的一组：

```sh
# opkg：安装 bundle
opkg update
opkg install /tmp/luci-app-smart-srun-bundle_*.ipk
```

```sh
# apk：安装已确认来源的本地 bundle
apk update
apk add --allow-untrusted /tmp/luci-app-smart-srun-bundle-*.apk
```

`--allow-untrusted` 用于本地包没有受信任签名的情况；它不会解决依赖不匹配或格式错误。若 LuCI 上传出现 `UNTRUSTED signature`，可使用上述 SSH 命令。参见 [OpenWrt apk 文档](https://openwrt.org/docs/guide-user/additional-software/apk) 与 [相关 LuCI 问题](https://github.com/openwrt/luci/issues/8482)。

分体包从 Release 说明中的分体下载入口获取。进入**仅包含所需分体包**的解压目录后执行对应命令；仅需 CLI 时只安装 `smart-srun`：

```sh
opkg install ./smart-srun_*.ipk ./luci-app-smart-srun_*.ipk
```

```sh
apk add --allow-untrusted ./smart-srun-*.apk ./luci-app-smart-srun-*.apk
```

安装后配置账号，再启用后台认证。通过 SSH 管理服务时：

```sh
/etc/init.d/smart_srun enable
/etc/init.d/smart_srun restart
```

这里的 `enable` 设置开机启动；插件的 `enabled` 配置控制自动认证，两者含义不同。
