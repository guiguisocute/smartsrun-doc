# 学校预设维护

## 从插件提交

1. 完成一键配置并保存账号。
2. 在成功页面填写学校与校区；确认网络可用后勾选 **已确认校园网可正常使用**。
3. 展开 **预览提交内容**，核对网关、SSID、账号类型与后缀。
4. 点击 **创建预设 Issue**，在 GitHub 确认并提交。内容过长时，按提示复制草稿到新 Issue。

Issue 草稿不包含账号和密码，也不会自动提交。若使用的插件版本尚无此入口，可在 [Issue](https://github.com/matthewlu070111/smart-srun/issues/new/choose) 中手动填写上述信息。

保存、密码验证、实际联网是不同结果，应如实说明。记录自己实际使用的账号类型；认证页中的其他选项只能标为“页面发现”，不要推断已验证。预设草稿使用 `draft` 状态，由维护者核查后合并。

## 维护目录

主文件为 [doc/school-presets.json](https://github.com/matthewlu070111/smart-srun/blob/main/doc/school-presets.json)，随包兜底为 [school_presets_fallback.json](https://github.com/matthewlu070111/smart-srun/blob/main/root/usr/lib/smart_srun/school_presets_fallback.json)。普通 `presets list` 读取本地并合并随包数据；刷新依次尝试：

1. `https://srun.guiguisocute.com/school-presets.json`
2. `https://smart-srun--cloudflare-pages.pages.dev/school-presets.json`
3. `https://raw.githubusercontent.com/matthewlu070111/smart-srun/main/doc/school-presets.json`
4. `https://srun.edu-publish.site/school-presets.json`（旧兼容来源）
5. 本地缓存与随包清单。

无效 JSON 或不兼容 schema 也应继续尝试后续来源。不得用日期更旧的远端覆盖有效缓存，同日修正应生效。数据按学校 ID 合并，公共列表仅展示 `active` 项；`draft / deprecated` 保留在原始清单或缓存中，用户自建预设独立存储。

## 字段规则

- `operators[].suffix` 是真实认证后缀，`label` 使用学校页面的账号类型名称；兼容读取旧 `id`，新数据写 `suffix`。
- 已确认无后缀使用 `""`；只知道类型存在但真实后缀未确认可由维护者标记 `"??"`。向导不将未知值作为已知候选，账号归一化不会拼出 `user@??`。
- 不新增 `defaults.operator`、`defaults.operator_suffix`、`no_suffix_operators`；空后缀写为 `""`。真实后缀保留大小写，`xn` 仅在旧版 `operator` 字段中作为历史占位符迁移。
- `defaults` 记录已知 `base_url / ac_id / ssid / access_mode`。未知内容保持缺失，不为补齐格式造值。
- `observed_login_shape` 只记录真实捕获的 `n / type / enc / info_prefix / double_stack / os / name`；账号字段对应 `login_os / login_name`。
- 保留 `source_issue`、贡献者及验证范围。历史可用数据可以保留原状态；失败样本与未确认场景不能因格式整理升级为已适配。

合法的特殊后缀示例：

```json
{"suffix": "students.example.edu", "label": "学生用户"}
```

不要在示例或运行时中默认补齐三家运营商。保持主文件既有字段顺序、缩进及紧凑/展开写法；修改后同步并检查：

```sh
python scripts/sync_school_presets.py --write
python scripts/sync_school_presets.py --check
```

同步脚本按原文复制，仅替换顶层 `source`，不重排主清单。镜像站维护于 [独立 Pages 仓库](https://github.com/guiguisocute/smart_srun-_cloudflare_pages)；该镜像分发参数数据，本文档站提供使用与开发说明。
