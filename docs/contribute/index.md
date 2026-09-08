# 文档维护与贡献者

README 仅保留最简安装与使用入口；技术说明与描述性文档统一维护在 [smartsrun-doc](https://github.com/guiguisocute/smartsrun-doc) 文档仓库。`doc/default.md` 保留为认证策略文档入口，Issue 模板、离线手册与 Release 模板应链接到当前文档。封面使用现行界面和示例数据，不显示真实账号或凭据。

配置数据仍以 `doc/school-presets.json` 为准，不因整理文档修改未知参数或提升验证状态。内部计划、一次性脚本和验收记录保存在本地 `.codex/`；历史计划不是当前功能清单，也不是版本承诺。

提交文档修改请向文档仓库发起 PR，构建方式见 [文档站维护](/development/documentation)。功能修复与学校参数数据的 PR 提交到插件仓库。说明具体问题、修改后的行为与验证结果，避免把内部工作记录写入面向用户的页面。

集成贡献时保留原作者署名，核对 Git 作者邮箱与 GitHub 账号对应关系，不改写已发布历史；已合并功能的说明保留原始 PR 链接。

感谢 [@guiguisocute](https://github.com/guiguisocute) 的协助及 [LINUX DO](https://linux.do/) 社区支持；感谢 [@haohaoget](https://github.com/haohaoget) 提供多 WAN 并行认证（[#31](https://github.com/matthewlu070111/smart-srun/pull/31)），以及 [@shijia257](https://github.com/shijia257) 提供校园账号绑定接口（[#32](https://github.com/matthewlu070111/smart-srun/pull/32)）。配置与维护支持包括 [@matthewlu070111](https://github.com/matthewlu070111) 和上述贡献者。

更多记录见 [已合并 PR](https://github.com/matthewlu070111/smart-srun/pulls?q=is%3Apr+is%3Amerged)、[贡献者列表](https://github.com/matthewlu070111/smart-srun/graphs/contributors)、对应 Issue 和学校预设的来源字段。项目使用 [WTFPL](https://github.com/matthewlu070111/smart-srun/blob/main/LICENSE) 许可。
