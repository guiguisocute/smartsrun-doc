---
outline: false
---

<script setup>
import SchoolCatalogue from '../.vitepress/theme/SchoolCatalogue.vue'
</script>

# 学校预设

预设用于填写认证地址、接入参数和已知后缀。请选择与你的校区和接入方式相符的条目，再通过插件向导验证自己的环境。

目录状态与验证记录分别展示。`active` 仅表示常用可选条目；某个账号、校区或版本的成功记录，不能推广到全校、所有套餐或其他插件版本。

<SchoolCatalogue />

## 验证与贡献

空后缀表示直接使用账号；`??` 表示真实后缀待确认；没有字段表示未记录。页面不会从运营商名称推测后缀。

通过[一键配置](/guide/setup-wizard)核对环境后，可以预览并自行提交预设 Issue。请说明校区、接入方式、账号类型、插件版本与测试日期，不要上传密码、账号或设备标识。参见[贡献学校预设](/contribute/presets)。
