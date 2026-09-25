// M21: shared release-manifest v1 semantics with smart-srun/internal/update.
export const REPOSITORY = 'matthewlu070111/smart-srun'
export const VALIDATION = { build: '构建', elf: 'ELF 检查', emulated_core: '模拟器核心', openwrt_install: 'OpenWrt 安装', hardware_core: '真机核心', campus_auth: '校园认证' }
const name = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/
const hash = /^[a-f0-9]{64}$/
const family = /^\d{2}\.\d{2}$/
// Mirrors internal/update MaxPayloadBytes, raised from 10 MiB in 2.0.0rc1.
const MAX_PAYLOAD = 16 * 1024**2
const required = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key))

export function parseVersion(value) {
  if (typeof value !== 'string' || value.length > 64) throw Error('版本格式无效')
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:rc([1-9]\d*))?$/.exec(value)
  if (!match || match.slice(1).some(part => part !== undefined && (!Number.isSafeInteger(Number(part)) || Number(part) > 4294967295))) throw Error('版本格式无效')
  return [Number(match[1]), Number(match[2]), Number(match[3]), match[4] ? 0 : 1, Number(match[4] || 0)]
}

export function compareVersions(left, right) {
  const a = parseVersion(left), b = parseVersion(right)
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1
  return 0
}

export function assetFilename(asset, release) {
  const prefix = `https://github.com/${REPOSITORY}/releases/download/${release}/`
  if (typeof asset.url !== 'string' || !asset.url.startsWith(prefix)) throw Error('安装包来源无效')
  const file = asset.url.slice(prefix.length)
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.~+-]{0,199}$/.test(file) || !file.endsWith('.' + asset.format)) throw Error('安装包文件名无效')
  const packageName = {core:'smart-srun',luci:'luci-app-smart-srun',bundle:'luci-app-smart-srun-bundle'}[asset.kind]
  if (!file.startsWith(packageName + (asset.format === 'ipk' ? '_' : '-'))) throw Error('文件名与包型不匹配')
  return file
}

export function validateManifest(manifest) {
  if (!required(manifest, ['schema_version', 'release', 'channel', 'source_commit', 'assets'])) throw Error('发布清单字段无效')
  const version = parseVersion(manifest.release)
  if (manifest.schema_version !== 1 || version[0] < 2 || manifest.channel !== (version[3] ? 'stable' : 'rc') ||
      !/^[a-f0-9]{40}$/.test(manifest.source_commit) || !Array.isArray(manifest.assets) || !manifest.assets.length || manifest.assets.length > 256) throw Error('发布清单无效')
  const ids = new Set(), urls = new Set(), combinations = new Set()
  for (const asset of manifest.assets) {
    if (!required(asset, ['id','kind','package_manager','format','openwrt_arch','package_version','sdk_release','target','goos','goarch','url','sha256','bytes','installed_bytes','firmware_compat','validation']) ||
        ['id','kind','package_manager','format','openwrt_arch','package_version','sdk_release','target','goos','goarch','url','sha256'].some(key => typeof asset[key] !== 'string') ||
        !name.test(asset.id) || !name.test(asset.openwrt_arch) || !name.test(asset.goarch) ||
        !['core','luci','bundle'].includes(asset.kind) || !['opkg:ipk','apk:apk'].includes(asset.package_manager + ':' + asset.format) ||
        asset.goos !== 'linux' || !/^\d{2}\.\d{2}\.\d+$/.test(asset.sdk_release) || !/^[a-z0-9_-]+\/[a-z0-9_-]+$/.test(asset.target) ||
        !hash.test(asset.sha256) || !Number.isSafeInteger(asset.bytes) || asset.bytes <= 0 || asset.bytes > 16 * 1024**2 ||
        !Number.isSafeInteger(asset.installed_bytes) || asset.installed_bytes <= 0 || asset.installed_bytes > MAX_PAYLOAD ||
        !Array.isArray(asset.firmware_compat) || !asset.firmware_compat.length || asset.firmware_compat.length > 8 ||
        asset.firmware_compat.some(value => !family.test(value)) || new Set(asset.firmware_compat).size !== asset.firmware_compat.length ||
        !required(asset.validation, Object.keys(VALIDATION)) || Object.values(asset.validation).some(value => typeof value !== 'boolean')) throw Error('发布资产元数据无效')
    const arch = asset.package_manager === 'opkg' ? 'all' : 'noarch'
    if (asset.kind === 'luci' ? asset.openwrt_arch !== arch : ['all', 'noarch'].includes(asset.openwrt_arch)) throw Error('核心安装包必须使用实际架构')
    const nativeBase = manifest.release.replace('rc', asset.package_manager === 'opkg' ? '~rc' : '_rc')
    if (!asset.package_version.startsWith(nativeBase + '-r') || !/^[1-9]\d{0,8}$/.test(asset.package_version.slice(nativeBase.length + 2))) throw Error('原生包版本无效')
    assetFilename(asset, manifest.release)
    if (ids.has(asset.id) || urls.has(asset.url)) throw Error('重复发布资产')
    ids.add(asset.id); urls.add(asset.url)
    for (const compatible of asset.firmware_compat) {
      const key = [asset.package_manager, asset.kind, asset.openwrt_arch, compatible].join('/')
      if (combinations.has(key)) throw Error('发布资产适配范围冲突')
      combinations.add(key)
    }
  }
  return manifest
}

export function channelReleases(manifests, channel = 'stable') {
  return manifests.filter(item => channel === 'rc' || item.channel === 'stable').sort((a,b) => compareVersions(b.release,a.release))
}

// Paste is parsed locally. Recognize only firmware/version and architecture
// facts; never save or upload arbitrary diagnostic output.
export function parseDeviceFacts(text, manager) {
  if (typeof text !== 'string' || text.length > 16 * 1024) throw Error('查询输出过长')
  const facts = { packageManager: manager, firmwareFamily: '', architectures: [] }
  for (const line of text.split(/\r?\n/)) {
    const release = /^DISTRIB_RELEASE=['"]?(\d{2}\.\d{2})(?:[^\r\n]*)$/.exec(line.trim())
    if (release) facts.firmwareFamily = release[1]
    const architecture = manager === 'opkg' ? /^arch ([a-zA-Z0-9_.-]+) ([1-9]\d{0,5})$/.exec(line.trim()) : /^([a-zA-Z0-9][a-zA-Z0-9_.-]{0,127})$/.exec(line.trim())
    if (architecture && !['all','noarch'].includes(architecture[1])) facts.architectures.push({ name: architecture[1], priority: manager === 'opkg' ? Number(architecture[2]) : 1 })
  }
  return facts
}

export function selectAssets(manifest, facts = {}, mode = 'bundle') {
  try { validateManifest(manifest) } catch { return { type: 'Unsupported', message: '发布清单未通过校验，暂不提供下载推荐。' } }
  if (!facts || typeof facts !== 'object') return { type: 'NeedMoreInfo', message: '请填写设备信息。' }
  if (!['opkg','apk'].includes(facts.packageManager) || !family.test(facts.firmwareFamily) || !Array.isArray(facts.architectures) || !facts.architectures.length) {
    return { type: 'NeedMoreInfo', message: '请填写实际包管理器、固件系列和包架构。' }
  }
  if (!['bundle','core','split','luci'].includes(mode)) return { type: 'NeedMoreInfo', message: '请选择安装方式。' }
  const priorities = new Map()
  for (const arch of facts.architectures) {
    if (!arch || typeof arch.name !== 'string' || !name.test(arch.name) || ['all','noarch'].includes(arch.name) || !Number.isSafeInteger(arch.priority) || arch.priority < 1) return { type: 'NeedMoreInfo', message: '包架构或兼容优先级无效。' }
    if (priorities.has(arch.name) && priorities.get(arch.name) !== arch.priority) return { type: 'Ambiguous', message: '同一架构出现了不同优先级，请核对设备输出。' }
    priorities.set(arch.name, arch.priority)
  }
  const compatible = manifest.assets.filter(asset => asset.package_manager === facts.packageManager &&
    asset.firmware_compat.includes(facts.firmwareFamily) && asset.validation.build && (asset.kind === 'luci' || asset.validation.elf))
  const coreKind = mode === 'bundle' ? 'bundle' : 'core'
  const candidates = compatible.filter(asset => asset.kind === coreKind && priorities.has(asset.openwrt_arch))
  if (!candidates.length) {
    // reason lets the page point at the right workaround without guessing a link.
    if (compatible.some(asset => asset.kind === coreKind)) return { type: 'Unsupported', reason: 'architecture', message: '此版本没有该包架构、经过基本验证的安装包。' }
    return { type: 'Unsupported', reason: 'firmware', message: `此版本没有为 ${facts.firmwareFamily} 固件登记经过基本验证的 ${facts.packageManager} 安装包。` }
  }
  const priority = Math.max(...candidates.map(asset => priorities.get(asset.openwrt_arch)))
  const best = candidates.filter(asset => priorities.get(asset.openwrt_arch) === priority)
  if (best.length !== 1) return { type: 'Ambiguous', message: '存在多个同优先级安装包，无法自动选择。' }
  let assets = [best[0]]
  let installedBytes = best[0].installed_bytes
  if (mode === 'split' || mode === 'luci') {
    const luci = compatible.filter(asset => asset.kind === 'luci' && asset.package_version === best[0].package_version)
    if (luci.length !== 1) return { type: 'Unsupported', message: '缺少与核心版本完全一致的 LuCI 包。' }
    if (mode === 'luci' && facts.coreVersion !== best[0].package_version) return { type: 'NeedMoreInfo', message: '单独安装 LuCI 需要确认已安装核心的精确包版本。' }
    installedBytes += luci[0].installed_bytes
    assets = mode === 'luci' ? luci : [best[0], ...luci]
  }
  if (installedBytes > MAX_PAYLOAD) return { type: 'Unsupported', message: '安装组合超过当前载荷上限。' }
  return { type: 'Match', assets, release: manifest.release, mode }
}

// What one release offers for an install mode, grouped by package manager and
// firmware family, using the same basic-validation filter as selectAssets.
export function releaseCoverage(manifest, mode = 'bundle') {
  const kind = mode === 'bundle' ? 'bundle' : 'core', groups = new Map()
  for (const asset of manifest.assets) {
    if (asset.kind !== kind || !asset.validation.build || !asset.validation.elf) continue
    for (const firmware of asset.firmware_compat) {
      const key = asset.package_manager + '/' + firmware
      if (!groups.has(key)) groups.set(key, { packageManager: asset.package_manager, firmware, architectures: [] })
      groups.get(key).architectures.push(asset.openwrt_arch)
    }
  }
  return [...groups.values()].map(group => ({ ...group, architectures: group.architectures.sort() }))
    .sort((a,b) => b.firmware.localeCompare(a.firmware, 'en', { numeric: true }) || a.packageManager.localeCompare(b.packageManager))
}
