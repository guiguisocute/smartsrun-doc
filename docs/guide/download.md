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

需要原生签名校验或使用插件内置更新器时，安装一次项目公钥即可。下载同一官方 Release 附带的 `smart-srun-apk.pem`，按该版本的公钥指纹或 `SHA256SUMS` 核对后，上传到路由器 `/tmp` 并执行：

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

输入不足、多种 SDK 变体同样匹配、此版本缺少对应架构资产或校验信息时，本页不会给出推测链接。可以核对设备查询结果，或在官方版本说明中查看实际支持范围。构建、模拟器、OpenWrt 安装、真机及校园认证是不同验证层级。
