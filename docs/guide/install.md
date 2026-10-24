# 安装与兼容性

先在[下载与版本选择](/guide/download)确定版本并匹配设备。本页以 Go 2.0 为主；继续使用 1.x 时见 [Python 1.x 安装指南](/legacy/1.x/install)。

## 适用范围

智慧深澜（smart-srun）为 OpenWrt 路由器提供深澜 SRun 网页认证、`srunnet` 命令行和 LuCI 界面。Go 核心与 bundle 使用实际 CPU 架构包，设备不需要 Python；纯 LuCI 包与架构无关。

以路由器实际的固件系列、包管理器和包架构匹配下载文件。LuCI 使用 Lua CBI，需要固件提供相应兼容模块；bundle 不包含 LuCI 本身。无线自动配置还需要可用的驱动、扫描能力和标准 network / firewall 配置。

企业 Wi-Fi、PPPoE、非深澜认证或特殊门户流程不属于通用向导的自动适配保证。多 WAN 功能负责逐线路认证，不负责负载均衡或带宽叠加。

## 安装包

| 包名 | 内容 | 使用场景 |
| --- | --- | --- |
| `smart-srun` | Go 程序、守护服务与 CLI | 仅命令行，或分体安装的基础包 |
| `luci-app-smart-srun` | LuCI 页面与静态资源 | 配合同版本核心包 |
| `luci-app-smart-srun-bundle` | 核心、CLI 与本插件的 LuCI 文件 | 一次安装，首次使用可选 |

bundle 与分体包互斥。更换包型或从 1.x 升级前先[导出配置](/guide/backup-migration)，保留原版本安装包；Go 不在启动时自动读取旧 Python 配置。

## 安装方式

[下载选择器](/guide/download#匹配安装包)提供匹配文件；[安装与校验](/guide/download#安装与校验)集中维护文件核对、APK 快速安装及可选公钥步骤。使用设备对应的原生包管理器，勿将其他架构的文件一起安装。

IPK 设备可将匹配的包上传到 `/tmp` 后执行（替换为实际文件名）：

```sh
opkg update
opkg install /tmp/实际的-bundle-文件名.ipk
```

也可在 LuCI **系统 → 软件包** 更新列表并上传安装包。APK 上传遇到 `UNTRUSTED signature` 时，按[APK 安装说明](/guide/download#apk-快速安装)选择已知来源的手动安装或先安装公钥；跳过签名无法验证发布者，内置更新仍需要受信公钥。

完成后重新登录 LuCI，进入 **服务 → SMART SRun**。先通过[一键配置](/guide/setup-wizard)保存账号，或[导入备份](/guide/backup-migration)，核对后再启用自动认证。

需要管理服务时：

```sh
/etc/init.d/smart_srun enable
/etc/init.d/smart_srun restart
```

服务的 `enable` 设置开机启动；插件 `enabled` 设置控制自动认证。后台服务可保持运行以响应页面与配置操作，而自动认证保持关闭。
