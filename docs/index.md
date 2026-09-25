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
  - title: 扩展学校适配
    details: 区分认证策略与学校预设，提交实际参数和验证结果。
    link: /development/architecture
    linkText: 开发维护
---

Go 2.0.0rc1 候选版已公开，可在[下载与版本选择](/guide/download)按路由器型号选包；它提供 1.6.1 配置导入和每日学校预设更新。候选版本的命令耗时、资源改进与测量边界见 [Go 性能基准](/development/benchmarks)，发布状态以 [Releases](https://github.com/matthewlu070111/smart-srun/releases) 为准。

<div class="home-preview">
  <span class="preview-label">LuCI 界面</span>
  <h2>状态清晰，配置集中</h2>
  <p>主要状态直接可见，连接详情按需展开。</p>
  <img src="/images/smart-srun-overview.png" alt="智慧深澜 LuCI 界面，包含校园网账号与热点配置" width="1520" height="1729" />
</div>
