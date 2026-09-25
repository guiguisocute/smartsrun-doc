---
outline: false
---

<script setup>
import DownloadSelector from '../.vitepress/theme/DownloadSelector.vue'
</script>

# 下载与版本选择

搜索并选择路由器型号，再选当前固件，即可匹配安装包。型号目录来自 OpenWrt 官方设备数据，包含硬件版本差异；使用第三方固件或找不到型号时，可通过设备查询补充匹配信息。

## 先选版本

| 版本 | 状态 | 适合 |
| --- | --- | --- |
| **Go 2.0.0rc1** | 候选版（预发布），2026-09-25 公开 | 愿意测试新版本，且设备架构有对应安装包 |
| **1.6.1** | 稳定版，按目前计划是最后一个 Python 版本 | 求稳，或设备暂时没有 Go 安装包 |

Go 2.0 暂无稳定版，所以选择器默认的「稳定版」通道为空。安装 2.0.0rc1 时，在第 2 步把发布通道改为**候选版**，再选择固定版本。选择器只收录带发布清单的 Go 2.0；1.6.1 请到[官方 Releases](https://github.com/matthewlu070111/smart-srun/releases) 下载，并参照 [1.x 安装指引](/guide/install)。

Go 2.0 的核心包和 bundle 按 CPU 架构区分，只有纯 LuCI 包与架构无关。2.0.0rc1 为 OpenWrt 24.10 提供 12 种架构的 IPK，为 25.12 只提供 `aarch64_cortex-a53` 与 `x86_64` 的 APK；选定版本后，可在选择器底部展开完整列表。

从 1.6.1 升级不会自动带走配置。安装前先在 1.6.1 的**进阶设置 → 配置备份**导出 JSON，并保留 1.6.1 安装包，步骤见[备份与升级到 Go](/guide/backup-migration)。回退时使用保留的 1.6.1 安装包和 1.6.1 备份；1.6.1 不能导入 2.0 导出的备份。

## 匹配安装包

<DownloadSelector />

### 填写说明

- **路由器型号**：按机身标签搜索品牌和型号，并核对硬件版本（如 v1、v2）。
- **当前固件**：选择路由器正在运行的固件。刷过 Kwrt、ImmortalWrt 等第三方固件或不确定时，选「其他固件或不确定」，再粘贴设备查询结果；设备实际信息优先于型号推断。
- **发布通道**：「稳定版」只列正式版；「候选版」同时列出候选版和正式版。
- **安装方式**：第一次安装选 bundle；只需要命令行时选「仅核心与 CLI」；需要分开升级网页界面时选分体包。bundle 与分体包互斥。

查询输出中，`DISTRIB_RELEASE` 的前两段是固件系列（如 `24.10`）。能执行 `opkg` 的设备安装 IPK，能执行 `apk` 的设备安装 APK；以实际命令为准，不要只看固件名称。

## 安装与校验

安装前备份现有配置，核对文件的 SHA256、精确包版本、架构及固件系列。核心包必须匹配实际架构；只有 LuCI 文件包使用 `all` / `noarch`。bundle 与核心、LuCI 分体包互斥，不要混装。

通过设备原生包管理器安装选择器列出的文件，不要安装整个下载目录中的其他架构包。分体安装先装核心，再装同版本 LuCI。首次安装 Go 2.0 后，可以[导入 1.6.1 配置备份](/guide/backup-migration)或重新填写账号；默认不会启用自动认证。

### APK 快速安装

公钥是可选安装项。将选择器匹配的包上传到路由器 `/tmp`，核对官方 Release 的 SHA256 后，可以通过 SSH 手动跳过签名验证。下面的文件名需换成实际下载的文件名，只执行所选包型的命令：

```sh
apk update
# bundle：只安装这一个文件
apk add --allow-untrusted /tmp/实际的-bundle-文件名.apk
# 分体：核心与同版本 LuCI 一起安装
apk add --allow-untrusted /tmp/实际的-smart-srun-文件名.apk /tmp/实际的-luci-app-smart-srun-文件名.apk
```

`--allow-untrusted` 会跳过本次安装的签名验证，无法验证包的发布者；只对你确认来源的文件使用。它不会解决架构、固件、依赖或包型不匹配。LuCI 上传提示 `UNTRUSTED signature` 时，也可使用这组 SSH 命令。参见 [OpenWrt 本地 APK 安装说明](https://openwrt.org/docs/guide-user/additional-software/apk)。

### 可选：安装公钥

需要原生签名校验或使用插件内置更新器时，安装一次项目公钥即可。下载同一官方 Release 附带的 `smart-srun-apk.pem`，按发布说明中的公钥指纹或 `SHA256SUMS` 核对后，上传到路由器 `/tmp` 并执行：

```sh
mkdir -p /etc/apk/keys
cp /tmp/smart-srun-apk.pem /etc/apk/keys/smart-srun-apk.pem
chmod 0644 /etc/apk/keys/smart-srun-apk.pem
# 将文件名换成所选 bundle；此时无需跳过验证
apk add /tmp/实际的-bundle-文件名.apk
```

公钥不会包含私钥，也不需要填写账号。发布包仍会签名；选择跳过验证不会自动安装公钥。HTTPS 与 SHA256 用于来源和完整性核对，不等于 IPK 已具有独立包签名。

已经安装 Go 2.0 时，可以使用 `srunnet update check` 检查兼容更新，按返回的计划 ID 启动更新；`srunnet update status` 查看独立安装任务状态。内置更新器的 APK 安装和恢复会验证受信签名，因此首次选择快速安装的用户，需要先按上面步骤补装公钥。失败时保留状态和恢复包，按提示使用 `srunnet update recover`；包恢复与配置备份分开处理。

## 没有匹配的安装包

输入不足、多种 SDK 变体同样匹配、此版本缺少对应架构资产或校验信息时，本页不会给出推测链接。先展开选择器底部的「此版本提供的架构」，核对包管理器、固件系列和包架构。构建、模拟器、OpenWrt 安装、真机及校园认证是不同验证层级。

### 稳定版通道没有版本

Go 2.0 暂无正式版。改选「候选版」安装 2.0.0rc1，或继续使用 1.6.1。

### 25.12 固件没有对应 APK

2.0.0rc1 只为 25.12 提供 `aarch64_cortex-a53` 与 `x86_64` 的 APK。其他架构的官方 25.12 设备暂时没有 Go 安装包，可以继续使用 1.6.1 或等待后续版本。24.10 的 IPK 不能装到使用 apk 的固件上。

### 25.12 固件仍使用 opkg

部分 Kwrt / ImmortalWrt 分支的版本号已是 25.12，包管理器仍是 opkg。2.0.0rc1 的 IPK 只登记了 24.10 固件系列，所以按设备实际信息匹配时会提示没有安装包。

发布说明允许这类设备手动安装同架构、用 24.10 SDK 构建的 IPK，这种组合已在真机上完成装机验证。在选择器的「手动填写或校正」中把固件系列改为 `24.10`，即可查到对应文件，核对 SHA256 后安装。内置更新暂时不会为这类设备匹配安装包；在清单登记这种组合之前，后续版本也需要手动安装。

### 设备架构不在列表中

此版本没有为该架构构建 Go 安装包。可以继续使用 1.6.1（包架构为 `all`，但需要 Python 依赖），或在 [Issues](https://github.com/matthewlu070111/smart-srun/issues) 提交型号、固件以及 `opkg print-architecture` 或 `apk --print-arch` 的输出，申请增加构建目标。
