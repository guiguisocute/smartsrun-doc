<script setup>
import { computed, ref, watch } from 'vue'
import { data } from '../../guide/releases.data.js'
import { data as devices } from '../../guide/devices.data.js'
import { VALIDATION, assetFilename, channelReleases, parseDeviceFacts, selectAssets } from '../../../scripts/releases.mjs'
import { deviceLabel, searchDevices, deviceFirmware, factsForDevice } from '../../../scripts/devices.mjs'

const channel = ref('stable'), version = ref(''), manager = ref(''), firmware = ref(''), architectures = ref(''), mode = ref('bundle'), coreVersion = ref('')
const pasted = ref(''), notice = ref('')
const deviceQuery = ref(''), deviceID = ref(''), firmwareChoice = ref(''), useActual = ref(false)
const matches = computed(() => searchDevices(devices.devices, deviceQuery.value))
const selectedDevice = computed(() => devices.devices.find(item => item.id === deviceID.value))
const firmwareOptions = computed(() => deviceFirmware(devices, deviceID.value).slice().sort((a,b) => b.release.localeCompare(a.release, 'en', {numeric:true})))
const selectedSource = computed(() => firmwareOptions.value.find(item => item.id === firmwareChoice.value))
const releases = computed(() => channelReleases(data.releases.map(item => item.manifest), channel.value))
const manifest = computed(() => releases.value.find(item => item.release === version.value) || null)
watch(channel, () => { version.value = ''; notice.value = '' })
watch(version, () => { notice.value = '' })
const actualFacts = computed(() => ({ packageManager: manager.value, firmwareFamily: firmware.value,
  architectures: architectures.value.split(/\r?\n/).filter(line => line.trim()).map(line => {
    const [name, priority = '1', extra] = line.trim().split(/\s+/)
    return { name, priority: extra ? NaN : Number(priority) }
  }) }))
const facts = computed(() => ({ ...factsForDevice(devices, deviceID.value, firmwareChoice.value, useActual.value ? actualFacts.value : null), coreVersion: coreVersion.value.trim() }))
function resetDevice() {
  deviceID.value = ''; firmwareChoice.value = ''; useActual.value = false
  manager.value = ''; firmware.value = ''; architectures.value = ''; pasted.value = ''; notice.value = ''
}
function chooseDevice(device) { resetDevice(); deviceID.value = device.id }
function chooseFirmware() {
  useActual.value = firmwareChoice.value === 'custom'
  manager.value = ''; firmware.value = ''; architectures.value = ''; pasted.value = ''; notice.value = ''
}
const result = computed(() => {
  if (!manifest.value) return { type: 'NeedMoreInfo', message: releases.value.length ? '请选择固定发布版本。' : '当前快照没有收录此通道的 Go 2.0 安装包。' }
  if (!useActual.value && !selectedSource.value) return { type:'NeedMoreInfo', message:'请选择路由器型号和当前固件。' }
  return selectAssets(manifest.value, facts.value, mode.value)
})
function importFacts() {
  if (!manager.value) { notice.value = '请先选择设备实际使用的包管理器。'; return }
  try {
    const parsed = parseDeviceFacts(pasted.value, manager.value)
    firmware.value = parsed.firmwareFamily
    architectures.value = parsed.architectures.map(item => `${item.name} ${item.priority}`).join('\n')
    useActual.value = true
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
      <legend>1. 选择路由器型号</legend>
      <label for="router-search">搜索品牌或型号</label>
      <input id="router-search" v-model="deviceQuery" type="search" placeholder="例如：TR3000、GL-MT3000、小米 AX6000" maxlength="120" @input="resetDevice" />
      <p class="snapshot-note">已收录 {{ devices.devices.length }} 个设备条目。请选择与机身标签一致的型号和硬件版本。</p>
      <template v-if="!selectedDevice && deviceQuery.trim()">
        <p role="status">{{ matches.length ? `找到 ${matches.length} 个条目` : '暂未找到此型号。可尝试英文品牌、缩短型号，或使用下方设备查询。' }}</p>
        <ul class="device-matches"><li v-for="device in matches.slice(0,20)" :key="device.id"><button type="button" @click="chooseDevice(device)">{{ deviceLabel(device) }}</button></li></ul>
        <p v-if="matches.length > 20">显示前 20 项，请补充型号或硬件版本缩小范围。</p>
      </template>
      <div v-if="selectedDevice" class="selected-device">
        <strong>已选：{{ deviceLabel(selectedDevice) }}</strong>
        <button type="button" @click="resetDevice">更换型号</button>
        <label for="device-firmware">路由器当前运行的固件</label>
        <select id="device-firmware" v-model="firmwareChoice" @change="chooseFirmware"><option value="">请选择当前固件</option><option v-for="source in firmwareOptions" :key="source.id" :value="source.id">OpenWrt {{ source.release.split('.').slice(0,2).join('.') }}（官方固件）</option><option value="custom">Kwrt / ImmortalWrt / 其他固件或不确定</option></select>
        <p v-if="selectedSource && !useActual">已根据型号和固件匹配安装包架构。</p>
        <p v-if="firmwareChoice === 'custom'">第三方固件可能采用不同的包格式。请在下方粘贴设备查询结果，用本机信息完成匹配。</p>
      </div>
      <details :open="useActual">
        <summary>找不到型号 / 第三方固件 / 高级匹配</summary>
        <label class="actual-toggle"><input v-model="useActual" type="checkbox" /> 使用设备实际信息匹配</label>
        <p>通过 SSH 执行以下只读查询：</p>
        <pre><code>cat /etc/openwrt_release
command -v opkg &amp;&amp; opkg print-architecture
command -v apk &amp;&amp; apk --print-arch</code></pre>
        <label for="package-manager">设备包管理器</label>
        <select id="package-manager" v-model="manager" @change="useActual = true; firmware = ''; architectures = ''; pasted = ''"><option value="">请选择</option><option value="opkg">opkg（IPK）</option><option value="apk">apk（APK）</option></select>
        <label for="device-query">粘贴查询输出（仅在本页解析）</label>
        <textarea id="device-query" v-model="pasted" maxlength="16384" rows="5" @input="useActual = true; firmware = ''; architectures = ''"></textarea>
        <button type="button" @click="importFacts">识别设备信息</button>
        <details><summary>手动填写或校正</summary>
          <label for="firmware-family">固件系列</label><input id="firmware-family" v-model="firmware" placeholder="例如：24.10" maxlength="5" @input="useActual = true" />
          <label for="package-architectures">包架构及优先级（每行一项）</label>
          <textarea id="package-architectures" v-model="architectures" rows="3" maxlength="4000" placeholder="例如：x86_64 10" @input="useActual = true"></textarea>
        </details>
        <p v-if="selectedSource">型号参考：<a :href="selectedSource.url">OpenWrt {{ selectedSource.release }} 设备数据</a> · {{ selectedSource.architecture }}。设备查询结果优先。</p>
      </details>
    </fieldset>
    <fieldset>
      <legend>2. 选择发布版本</legend>
      <label for="release-channel">发布通道</label>
      <select id="release-channel" v-model="channel"><option value="stable">稳定版</option><option value="rc">候选版（RC，含正式版）</option></select>
      <p v-if="channel === 'rc'">Go 2.0 是有破坏性变更的重写版本，需要重新配置账号；1.x 配置不会自动导入。</p>
      <label for="release-version">固定版本</label>
      <select id="release-version" v-model="version"><option value="">{{ releases.length ? '请选择版本' : '此通道暂无已收录版本' }}</option><option v-for="release in releases" :key="release.release" :value="release.release">{{ release.release }}</option></select>
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
.snapshot-note { color: var(--vp-c-text-2); font-size: .9rem; }
.device-matches { list-style: none; padding: 0; margin: 0; display: grid; gap: .4rem; }
.device-matches button { width: 100%; text-align: left; overflow-wrap: anywhere; }
.selected-device { display: grid; gap: .65rem; border-left: 3px solid var(--vp-c-brand-1); padding-left: .8rem; }
.selected-device > button { justify-self: start; }
.actual-toggle { display: flex; align-items: center; gap: .5rem; margin: .8rem 0; }
.actual-toggle input { width: auto; }
details > input, details > select, details > textarea { margin: .5rem 0; }
pre { overflow: auto; font-size: .85rem; }
.download-result { border-left: 3px solid var(--vp-c-brand-1); padding: .3rem 1rem; overflow-wrap: anywhere; }
.release-asset { border-top: 1px solid var(--vp-c-divider); padding-bottom: 1rem; }
.asset-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; }
.checksum code { white-space: normal; word-break: break-all; }
.input-notice { min-height: 1.8rem; }
</style>
