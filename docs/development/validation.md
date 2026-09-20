# 测试、热更新与发布

## Go 2.0 开发分支

Go 树与 1.x 的构建、设备运行时和热更新方式不同。以下流程适用于 Go 开发分支，不能把开发包的构建成功视为正式发布或设备验收通过。

```sh
scripts/verify-go.sh
```

门禁执行格式、vet、乱序测试、覆盖率和竞态检查。按功能批次推进时，先做构建、相关回归与危险副作用检查；独立审查、设备负载、真实无线/校园与长期稳定性仍需在发布前完成。

SDK 输入由 `targets.json` 固定，`scripts/build_go_sdk.py` 构建实际架构包，`scripts/verify_go_sdk.py` 核验原生签名、ELF/ABI 和完整安装载荷。构建、版本命令运行、安装、完整测试和真实设备验收分别记录，下载页按已提供的证据显示状态。

Go 树的 `scripts/hot_update.py` 使用开发主机上的 Python 与 OpenSSH，上传实际 SDK 包及当前精确版本的恢复包，由设备上的独立更新进程安装。设备必须已支持 `srunnet update inventory`；首次安装使用原生包管理器。设备不需要 Python，也不接收旧 Python 运行时的文件覆盖。

```sh
python3 scripts/hot_update.py --host router \
  --manifest new/release-manifest.json --assets new \
  --recovery-manifest old/release-manifest.json --recovery-assets old \
  --probe
```

`--dry-run` 校验本地文件；`--probe` 仅读取设备环境；`--prepare` 上传并完成设备端核验但不安装。去掉这些参数才执行更新。APK 必须通过设备信任密钥的原生验证，不使用安装信任绕过。实验签名包不能直接作为公共发布包。

## 1.x 本地检查

开发环境安装 Python、Node.js 与 Lua 5.1；Python 工具版本应与 [CI](https://github.com/matthewlu070111/smart-srun/blob/main/.github/workflows/ci.yml) 保持一致：

```sh
python -m pip install pytest "ruff==0.16.5" paramiko
python -m pytest tests/ -v
ruff check root/usr/lib/smart_srun/
node --check root/www/luci-static/resources/smart_srun.js
python -m pytest tests/test_lua_syntax.py -v
```

按修改范围运行针对性测试，例如 `tests/test_setup_wizard_ui.py`、`tests/test_operator_discovery.py`、`tests/test_wifi_setup.py`、`tests/test_ap_selection_ui.py`，策略扩展运行 `python -m pytest tests/ -k runtime -v`。

Lua/JS 源码契约与 Node 小型 DOM 测试是本仓库常用验证方式；无线驱动和真实校园策略仍需设备验证。Windows 上缺少 Linux 专用能力的测试会跳过，不应据此宣称覆盖所有路由器行为。

学校门户测试占位值集中在 `tests/_portal_urls.py`，可用 `SMARTSRUN_TEST_PORTAL_ORIGIN`、`SMARTSRUN_TEST_PORTAL_HTTPS_ORIGIN`、`SMARTSRUN_TEST_PORTAL_IPV4_ORIGIN`、`SMARTSRUN_TEST_PORTAL_BARE_HOST`、`SMARTSRUN_TEST_WIRED_BIND_IP` 修改测试字符串。真实校园地址保留在预设清单，不散落到业务测试。Ruff 版本和 `ruff.toml` 规则显式固定，不因工具升级顺带扩大规则集。

具备 root 与 iproute2 的 Linux 开发机可运行隔离出口验证：

```sh
sudo python3 scripts/test_network_namespaces.py --output-dir /tmp/smart-srun-netns-check
```

该脚本创建并清理自己的 namespace / veth，验证绑定、相同 IP、DHCP 换址、断线和 DNS，不替代真实校园网与无线测试。

## 1.x 路由器热更新

`scripts/hot_update.py` 使用 Paramiko 与显式文件列表。必须设置 `SMARTSRUN_ROUTER_HOST` 和 `SMARTSRUN_ROUTER_PASSWORD`；`SMARTSRUN_ROUTER_USER` 与 `SMARTSRUN_LUCI_BASE_URL` 可选。工具没有默认目标地址。不要将实际密码写入文档或提交文件。

```sh
python scripts/hot_update.py --dry-run
python scripts/hot_update.py --probe
python scripts/hot_update.py
```

`--dry-run` 只展示计划；`--probe` 上传到临时目录做远端语法/import 检查；无参数会覆盖生产文件、清理缓存并重启相关服务。目标与凭据应事先配置，生产操作前保存备份。新增随包文件必须更新显式上传列表。

## 1.x 构建与发布

| 工作流 | 作用 |
| --- | --- |
| [ci.yml](https://github.com/matthewlu070111/smart-srun/blob/main/.github/workflows/ci.yml) | Python、JS、Lua 与测试检查 |
| [build-prerelease.yml](https://github.com/matthewlu070111/smart-srun/blob/main/.github/workflows/build-prerelease.yml) | 预览构建，可选发布预发布版本 |
| [build-release.yml](https://github.com/matthewlu070111/smart-srun/blob/main/.github/workflows/build-release.yml) | 正式构建并生成草稿 Release |

工作流将本仓库放入 OpenWrt SDK 的 `package/luci-app-smart-srun/` 并执行 `make package/luci-app-smart-srun/{clean,compile} -j1 V=s`。`Build/Compile` 为空，脚本文件无需编译；`Makefile` 的版本保持 `0.0.0`，构建时注入版本。

[release_assets.py](https://github.com/matthewlu070111/smart-srun/blob/main/scripts/release_assets.py) 为 ipk / apk 分别整理 bundle 与分体包。Release 提供对应 bundle；分体 zip 及 SHA-256 旁注按工作流发布到 `downloads`。不要将两个格式的 zip 数量或命名混为一个固定文件。

APK 后端的包互斥通过 `BuildPackage` 之后追加负依赖表达；IPK 保留 `CONFLICTS`。修改打包逻辑时运行包冲突与 Release 资产测试，并检查实际包元数据。
