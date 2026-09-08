# 架构与认证策略扩展

## 源码布局

本仓库是 OpenWrt 包源码。`root/` 是随包文件；`tests/`、`scripts/`、文档为开发材料，具体安装路径以 [Makefile](https://github.com/matthewlu070111/smart-srun/blob/main/Makefile) 为准。

| 路径 | 职责 |
| --- | --- |
| `root/usr/bin/srunnet` | CLI 包装入口 |
| `root/usr/lib/smart_srun/client.py → cli.py → daemon.py` | 命令分发与守护入口 |
| `config.py` / `defaults.json` | 配置迁移、归一化及默认值 |
| `network.py` / `wireless.py` / `wireless_ap.py` | 网络请求、接口与 AP 管理 |
| `portal_detect.py` / `wifi_setup.py` | 线路/认证参数探测与临时无线任务 |
| `crypto.py` / `srun_auth.py` | SRun 编码与默认认证流程 |
| `school_runtime.py` / `schools/` | 已安装认证策略及兼容适配器 |
| `school_presets.py` | 公共学校参数目录加载 |
| `logger.py` / `updater.py` | 日志与在线更新 |
| `root/usr/lib/lua/luci/controller/smart_srun.lua` | HTTP 端点、动作及日志翻译 |
| `root/usr/lib/lua/luci/model/cbi/smart_srun.lua` | CBI 页面及首屏 HTML |
| `root/usr/lib/lua/luci/smart_srun/schema.lua` | Lua 共享配置契约 |
| `root/www/luci-static/resources/smart_srun.js` | 手写 DOM / XHR 的 ES5 前端 |
| `root/etc/init.d/smart_srun` | procd 服务 |

设备端 Python 必须保持标准库依赖，新增 import 时核对 OpenWrt 的标准库拆包。模块使用裸 import，入口负责配置 `sys.path`，不要改为包相对导入。前端无 bundler、转译器或 Node 运行时依赖。

## 扩展选择

1. 参数差异：先使用账号高级字段或学校预设。
2. API 路径、字母表或解析细节差异：可以使用 legacy `Profile`。
3. 完整认证、在线检测、守护钩子或私有命令差异：实现 full runtime。

扩展模块位于 `root/usr/lib/smart_srun/schools/`。运行时解析顺序固定为 `build_runtime(core_api, cfg)` → `Runtime(core_api, cfg)` → legacy `Profile` → 内置 default。

`SCHOOL_METADATA` 是稳定元数据契约，支持 `short_name`、`name`、`description`、`contributors`、`operators`、`doc_url`、`capabilities` 及 `school_extra` / `school_extra_descriptors`。`short_name` 对应配置键 `school`。策略文档 URL 使用 HTTP/HTTPS；学校私有字段由描述符声明，未知键会被配置归一化丢弃。

legacy Profile 的最小示例：

```python
from _base import SchoolProfile


class Profile(SchoolProfile):
    NAME = "示例认证策略"
    SHORT_NAME = "example"
    DEFAULT_BASE_URL = "http://portal.example.test"
    DEFAULT_AC_ID = "1"
    OPERATORS = ({"suffix": "students.example.edu", "label": "学生用户"},)
```

可按需覆盖 `build_urls()`、`build_login_params()`、`parse_login_response()`、`parse_online_status()`；不要为了普通账号字段复制认证流程。默认行为以 [基类](https://github.com/matthewlu070111/smart-srun/blob/main/root/usr/lib/smart_srun/schools/_base.py) 为准。

full runtime 的最小骨架：

```python
from school_runtime import RUNTIME_API_VERSION

SCHOOL_METADATA = {
    "short_name": "example-runtime",
    "name": "示例认证策略",
    "operators": [{"suffix": "students.example.edu", "label": "学生用户"}],
    "capabilities": ["status", "daemon"],
    "school_extra": [],
}


class Runtime(object):
    def __init__(self, core_api, cfg):
        self.core_api = core_api
        self.runtime_api_version = RUNTIME_API_VERSION

    def login_once(self, app_ctx):
        return app_ctx["core_api"]["default_login_once"](app_ctx)

    def query_online_status(self, app_ctx, expected_username=None, bind_ip=None):
        return app_ctx["core_api"]["default_query_online_status"](
            app_ctx, expected_username=expected_username, bind_ip=bind_ip
        )

    def daemon_before_tick(self, app_ctx, state, interval):
        return None
```

CLI 钩子返回 `(handled, exit_code, message)`，守护钩子返回 `(ok, message)` 或 `None`，runtime action 返回 `(ok, message)`。不得注册同名保留命令：`status / login / logout / relogin / daemon / schools / config / switch / log / enable / disable / help / man / update / presets / detect`。完整 API 以 [school_runtime.py](https://github.com/matthewlu070111/smart-srun/blob/main/root/usr/lib/smart_srun/school_runtime.py) 及 `tests/test_school_runtime_*.py` 为准。

## LuCI 与任务状态契约

- `action_log_tail()` 同时服务日志页与动作进度弹窗，默认 `channel=plugin` 和 `since` 语义必须兼容。
- controller 的 `friendly_line()` / `friendly_log_text()` 供前端与 CBI 首屏复用；新增结构化事件时同步 `event_zh`。JS 颜色依赖中文等级前缀。
- `last_action_message` / `last_action_portal_url` 属于动作终态，守护概况不得覆盖，新动作应清除旧结果；日志不输出原始认证响应。
- 向导的后缀发现、在线身份识别、真实验证与保存相互独立。重新读取认证页不携带凭据，修改输入应清除不再有效的验证结果。
- 无线任务的暂存、确认、回滚与账号保存需要保持一致，不得将临时状态当作已持久化配置。
