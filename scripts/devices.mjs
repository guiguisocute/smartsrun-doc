// Device names are a discovery aid. A mapping describes one published firmware
// build, not every third-party firmware that can run on the same hardware.
const token = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/
const targetName = /^[a-z0-9_-]+\/[a-z0-9_-]+$/
const titleText = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 200 && !/[\x00-\x1f]/.test(value)
export const deviceLabel = device => device.titles.map(title => [title.vendor, title.model, title.variant].filter(Boolean).join(' ')).join(' / ')
const normalized = value => value.toLowerCase().replace(/小米/g, 'xiaomi').replace(/红米/g, 'redmi').replace(/[\s_.,()（）-]/g, '')

export function searchDevices(devices, query) {
  const terms = query.trim().split(/\s+/).filter(Boolean).map(normalized)
  if (!terms.length) return []
  return devices.filter(device => {
    const text = normalized(deviceLabel(device) + ' ' + device.profile)
    return terms.every(term => text.includes(term))
  }).sort((a,b) => deviceLabel(a).localeCompare(deviceLabel(b), 'en'))
}

export function validateDevices(catalogue) {
  if (catalogue?.schema_version !== 1 || !Array.isArray(catalogue.devices) || !catalogue.devices.length || catalogue.devices.length > 10000 ||
      !Array.isArray(catalogue.sources) || !catalogue.sources.length || catalogue.sources.length > 256 || !Number.isFinite(Date.parse(catalogue.refreshed_at))) throw Error('设备目录格式无效')
  const sources = new Map(), ids = new Set()
  for (const source of catalogue.sources) {
    if (!source || ['release','target','architecture','package_manager','sha256','url','id'].some(key => typeof source[key] !== 'string') ||
        !/^\d{2}\.\d{2}\.\d+$/.test(source.release) || !targetName.test(source.target) || !token.test(source.architecture) || ['all','noarch'].includes(source.architecture) ||
        !['opkg','apk'].includes(source.package_manager) || !/^[a-f0-9]{64}$/.test(source.sha256) ||
        source.url !== `https://downloads.openwrt.org/releases/${source.release}/targets/${source.target}/profiles.json` ||
        source.id !== `${source.release}/${source.target}` || sources.has(source.id)) throw Error('设备目录来源无效')
    sources.set(source.id, source)
  }
  for (const device of catalogue.devices) {
    if (!device || ['profile','target','id'].some(key => typeof device[key] !== 'string') || !token.test(device.profile) || !targetName.test(device.target) || device.id !== `${device.target}/${device.profile}` || ids.has(device.id) ||
        !Array.isArray(device.titles) || !device.titles.length || device.titles.length > 16 || device.titles.some(title =>
          !title || !titleText(title.model) || (title.vendor !== undefined && !titleText(title.vendor)) || (title.variant !== undefined && !titleText(title.variant))) ||
        !Array.isArray(device.sources) || !device.sources.length || device.sources.length > 8 || new Set(device.sources).size !== device.sources.length ||
        device.sources.some(id => !sources.has(id) || sources.get(id).target !== device.target)) throw Error('设备型号映射无效')
    ids.add(device.id)
  }
  return catalogue
}

export function deviceFirmware(catalogue, deviceID) {
  const device = catalogue.devices.find(item => item.id === deviceID)
  return device ? device.sources.map(id => catalogue.sources.find(source => source.id === id)) : []
}

export function factsForDevice(catalogue, deviceID, sourceID, observed = null) {
  // Explicit device output wins, including on custom firmware or when a model
  // is absent from the catalogue. Never combine half an observation with guesses.
  if (observed) return observed
  const source = deviceFirmware(catalogue, deviceID).find(item => item.id === sourceID)
  if (!source) return { packageManager: '', firmwareFamily: '', architectures: [] }
  return { packageManager: source.package_manager, firmwareFamily: source.release.split('.').slice(0,2).join('.'),
    architectures: [{ name: source.architecture, priority: 1 }] }
}
