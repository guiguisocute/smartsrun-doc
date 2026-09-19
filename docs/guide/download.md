---
outline: false
---

<script setup>
import DownloadSelector from '../.vitepress/theme/DownloadSelector.vue'
</script>

# 下载与版本选择

搜索并选择路由器型号，再选当前固件，即可匹配安装包。型号目录来自 OpenWrt 官方设备数据，包含硬件版本差异；使用第三方固件或找不到型号时，可通过设备查询补充匹配信息。

本页选择器面向带有发布清单的 **Go 2.0**。已有 1.x 版本请到[官方 Releases](https://github.com/matthewlu070111/smart-srun/releases)查看版本说明，并参照[1.x 安装指引](/guide/install)。

<DownloadSelector />

## 安装与校验

安装前备份现有配置，核对文件的 SHA256、精确包版本、架构及固件系列。核心包必须匹配实际架构；只有 LuCI 文件包使用 `all` / `noarch`。bundle 与核心、LuCI 分体包互斥，不要混装。

通过设备原生包管理器安装选择器列出的文件，不要安装整个下载目录中的其他架构包。分体安装先装核心，再装同版本 LuCI。首次安装 Go 2.0 后，需要重新填写账号；默认不会启用自动认证。

APK 必须通过系统受信公钥验证。首次公开发布需要同时提供项目公钥、指纹和信任引导，未核对之前不要绕过签名验证。HTTPS 与 SHA256 用于来源和完整性核对，不等于 IPK 已具有独立包签名。

已经安装 Go 2.0 时，可以使用 `srunnet update check` 检查兼容更新，按返回的计划 ID 启动更新；`srunnet update status` 查看独立安装任务状态。失败时保留状态和恢复包，按提示使用 `srunnet update recover`；包恢复与配置备份分开处理。

## 没有匹配的安装包

输入不足、多种 SDK 变体同样匹配、此版本缺少对应架构资产或校验信息时，本页不会给出推测链接。可以核对设备查询结果，或在官方版本说明中查看实际支持范围。构建、模拟器、OpenWrt 安装、真机及校园认证是不同验证层级。
