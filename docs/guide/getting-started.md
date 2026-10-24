# 快速开始

智慧深澜为 OpenWrt 路由器提供深澜校园网认证、断线重连与账号管理。

## 安装

先在[下载与版本选择](/guide/download#先选版本)核对发布状态与适用范围，再按路由器实际架构、固件和包管理器选包。

- **Go 2.0**：使用[下载选择器](/guide/download)匹配安装包，依[安装指南](/guide/install)安装；从 1.6.1 升级前先[导出配置](/guide/backup-migration)。
- **继续使用 1.x**：保留对应版本的安装包与备份，操作见 [Python 1.x 安装指南](/legacy/1.x/install)。

在 LuCI **系统 → 软件包** 更新列表并上传安装，完成后重新登录。

## 配置校园网

1. 打开 **服务 → SMART SRun**，点击 **开始一键配置**。
2. 选择有线或无线接入；无线填写校园 SSID、选择加密方式，并按需填写 Wi-Fi 密码。学校预设可选。
3. 核对探测到的认证地址，选择学校提供的账号类型或填写后缀。
4. 填写校园账号与密码，核对完整登录名后保存。
5. 检查默认账号与 **启用** 状态；需要立即认证时点击 **立即登录**。

![智慧深澜界面，使用示例网络与账号](/images/smart-srun-overview.png)

当前文档对应仓库开发版本；已安装版本的功能以发布说明和实际界面为准。五步向导详解见 [一键配置](/guide/setup-wizard)。

## 后续设置

- [多账号、无线 AP 与多 WAN](/guide/accounts)
- [定时切换和运行状态](/guide/status)
- [备份与更新](/reference/configuration)
- [故障排查](/guide/troubleshooting)
- [贡献学校预设](/contribute/presets)
