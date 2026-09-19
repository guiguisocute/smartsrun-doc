<script setup>
import { computed, ref, watch } from 'vue'
import { data } from '../../guide/releases.data.js'
import { VALIDATION, assetFilename, channelReleases, parseDeviceFacts, selectAssets } from '../../../scripts/releases.mjs'

const channel = ref('stable'), version = ref(''), manager = ref(''), firmware = ref(''), architectures = ref(''), mode = ref('bundle'), coreVersion = ref('')
const pasted = ref(''), notice = ref('')
const releases = computed(() => channelReleases(data.releases.map(item => item.manifest), channel.value))
const manifest = computed(() => releases.value.find(item => item.release === version.value) || null)
watch(channel, () => { version.value = ''; notice.value = '' })
watch(version, () => { notice.value = '' })
const facts = computed(() => ({ packageManager: manager.value, firmwareFamily: firmware.value,
  coreVersion: coreVersion.value.trim(), architectures: architectures.value.split(/\r?\n/).filter(line => line.trim()).map(line => {
    const [name, priority = '1', extra] = line.trim().split(/\s+/)
    return { name, priority: extra ? NaN : Number(priority) }
  }) }))
const result = computed(() => manifest.value ? selectAssets(manifest.value, facts.value, mode.value) :
  { type: 'NeedMoreInfo', message: releases.value.length ? '请选择固定发布版本。' : '当前快照没有收录此通道的 Go 2.0 安装包。' })
function importFacts() {
  if (!manager.value) { notice.value = '请先选择设备实际使用的包管理器。'; return }
  try {
    const parsed = parseDeviceFacts(pasted.value, manager.value)
    firmware.value = parsed.firmwareFamily
    architectures.value = parsed.architectures.map(item => `${item.name} ${item.priority}`).join('\n')
    pasted.value = ''
    notice.value = '已在本页提取设备信息；请核对后选择安装方式。'
  } catch (error) { notice.value = error.message }
}
async function copyHash(hash) {
  try { await navigator.clipboard.writeText(hash); notice.value = '已复制 SHA256。' }
  catch { notice.value = '未能自动复制，请选中 SHA256 手动复制。' }
}
const size = bytes => `${(bytes / 1024 / 1024).toFixed(2)} MiB`
</script>

<template>
  <div class="download-selector">
    <p class="snapshot-note">{{ data.refreshed_at ? `快照更新时间：${data.refreshed_at}` : '尚未导入公开 Go 发布清单。' }} 本页只使用已核对的固定版本快照，不把内部构建列为可下载版本。</p>
    <fieldset>
      <legend>1. 选择发布版本</legend>
      <label for="release-channel">发布通道</label>
      <select id="release-channel" v-model="channel"><option value="stable">稳定版</option><option value="rc">候选版（RC，含正式版）</option></select>
      <p v-if="channel === 'rc'">Go 2.0 是有破坏性变更的重写版本，需要重新配置账号；1.x 配置不会自动导入。</p>
      <label for="release-version">固定版本</label>
      <select id="release-version" v-model="version"><option value="">{{ releases.length ? '请选择版本' : '此通道暂无已收录版本' }}</option><option v-for="release in releases" :key="release.release" :value="release.release">{{ release.release }}</option></select>
    </fieldset>
    <fieldset>
      <legend>2. 填写设备信息</legend>
      <label for="package-manager">实际包管理器</label>
      <select id="package-manager" v-model="manager"><option value="">请选择</option><option value="opkg">opkg（IPK）</option><option value="apk">apk（APK）</option></select>
      <label for="firmware-family">固件系列</label>
      <input id="firmware-family" v-model="firmware" placeholder="例如：24.10" maxlength="5" />
      <label for="package-architectures">包架构及优先级（每行一项）</label>
      <textarea id="package-architectures" v-model="architectures" rows="3" maxlength="4000" placeholder="例如：x86_64 10" aria-describedby="architecture-help"></textarea>
      <p id="architecture-help">使用包管理器给出的架构名称。opkg 保留查询结果中的优先级；单个 apk 架构可省略优先级。不要填写商品型号。</p>
      <details><summary>从只读命令输出填写</summary>
        <p>通过 SSH 读取 <code>cat /etc/openwrt_release</code>，再执行本机包管理器对应的架构查询：</p>
        <pre><code>opkg print-architecture
# 或 apk 3：
apk --print-arch</code></pre>
        <label for="device-query">粘贴上述输出（仅在浏览器本地解析）</label>
        <textarea id="device-query" v-model="pasted" maxlength="16384" rows="5"></textarea>
        <button type="button" @click="importFacts">填写设备信息</button>
      </details>
    </fieldset>
    <fieldset>
      <legend>3. 选择安装方式</legend>
      <label for="install-mode">安装方式</label>
      <select id="install-mode" v-model="mode"><option value="bundle">完整包（bundle，推荐）</option><option value="core">仅核心与 CLI</option><option value="split">核心 + LuCI 分体包</option><option value="luci">已有同版本核心，仅加装 LuCI</option></select>
      <template v-if="mode === 'luci'"><label for="installed-core-version">已安装核心的精确包版本</label><input id="installed-core-version" v-model="coreVersion" placeholder="从包管理器读取的完整版本" maxlength="80" /></template>
    </fieldset>
    <div aria-live="polite" class="download-result">
      <p v-if="result.type !== 'Match'">{{ result.message }}</p>
      <template v-else>
        <h2>适合此设备的 {{ result.release }} 安装包</h2>
        <p v-if="mode === 'split'">同时下载两个文件，先安装核心，再安装同版本 LuCI。</p>
        <article v-for="asset in result.assets" :key="asset.id" class="release-asset">
          <h3>{{ assetFilename(asset, result.release) }}</h3>
          <p>{{ asset.openwrt_arch }} · {{ asset.package_version }} · 下载 {{ size(asset.bytes) }} · 安装载荷 {{ size(asset.installed_bytes) }}</p>
          <p>适配固件系列：{{ asset.firmware_compat.join('、') }} · {{ asset.package_manager }}</p>
          <p>已有验证：{{ Object.keys(VALIDATION).filter(key => asset.validation[key]).map(key => VALIDATION[key]).join('、') || '未提供' }}。</p>
          <p v-if="!asset.validation.campus_auth">没有此资产的校园认证验收记录。</p>
          <p class="checksum"><strong>SHA256</strong><br /><code>{{ asset.sha256 }}</code></p>
          <div class="asset-actions"><a :href="asset.url">下载此安装包</a><button type="button" @click="copyHash(asset.sha256)">复制 SHA256</button></div>
        </article>
        <p><a :href="`https://github.com/matthewlu070111/smart-srun/releases/download/${result.release}/SHA256SUMS`">下载校验和清单</a> · <a href="/guide/download#安装与校验">安装与校验说明</a></p>
      </template>
    </div>
    <p role="status" class="input-notice">{{ notice }}</p>
  </div>
</template>

<style scoped>
fieldset { display: grid; gap: .55rem; border: 1px solid var(--vp-c-divider); border-radius: 8px; margin: 1.5rem 0; padding: 1rem; min-width: 0; }
legend { font-weight: 600; padding: 0 .4rem; }
input, select, textarea { display: block; box-sizing: border-box; width: 100%; min-width: 0; border: 1px solid var(--vp-c-divider); border-radius: 5px; padding: .55rem .65rem; background: var(--vp-c-bg); color: var(--vp-c-text-1); font: inherit; }
textarea { resize: vertical; }
button { border: 1px solid var(--vp-c-divider); border-radius: 5px; padding: .4rem .75rem; cursor: pointer; }
summary { cursor: pointer; }
.snapshot-note, #architecture-help { color: var(--vp-c-text-2); font-size: .9rem; }
.download-result { border-left: 3px solid var(--vp-c-brand-1); padding: .3rem 1rem; overflow-wrap: anywhere; }
.release-asset { border-top: 1px solid var(--vp-c-divider); padding-bottom: 1rem; }
.asset-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; }
.checksum code { white-space: normal; word-break: break-all; }
.input-notice { min-height: 1.8rem; }
</style>
