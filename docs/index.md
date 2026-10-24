---
layout: home
hero:
  name: 智慧深澜
  text: 校园网络，由此连接
  tagline: OpenWrt 深澜认证插件的使用指南与开发文档
  image:
    src: /logo.svg
    alt: 智慧深澜
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 下载与版本选择
      link: /guide/download
    - theme: alt
      text: 贡献学校预设
      link: /contribute/presets
features:
  - title: 完成网络接入
    details: 选择有线或无线，通过一键配置确认认证参数并保存账号。
    link: /guide/setup-wizard
    linkText: 配置指南
  - title: 管理日常连接
    details: 了解账号管理、定时切换、连接状态与多 WAN 认证。
    link: /guide/accounts
    linkText: 账号与网络
  - title: 排查连接问题
    details: 从失败现象找到检查项，区分网络、认证和配置问题。
    link: /guide/troubleshooting
    linkText: 故障排查
  - title: 修改代码与文档
    details: 按任务找到源码、目录约束、验证工具和维护手册。
    link: /development/
    linkText: 开发维护
---

首次使用，从[版本与安装包选择](/guide/download)开始；已有账号，先看[备份与升级](/guide/backup-migration)。当前源码仓 `main` 为 Go 2.0，已发布功能与验证范围以[下载页](/guide/download)和 [Releases](https://github.com/matthewlu070111/smart-srun/releases) 为准；旧版说明保留在 [Python 1.x 历史资料](/legacy/1.x/)。

<div class="home-preview">
  <span class="preview-label">LuCI 界面</span>
  <h2>状态清晰，配置集中</h2>
  <p>主要状态直接可见，连接详情按需展开。</p>
  <img src="/images/smart-srun-overview.png" alt="智慧深澜 LuCI 界面，包含校园网账号与热点配置" width="1520" height="1729" />
</div>
