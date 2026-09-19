// Explicit maintainer refresh. Fetch only the selected official release trees;
// publish one atomic snapshot after every source has validated successfully.
import { createHash } from 'node:crypto'
import { writeFileSync, renameSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseStrictJSON } from './strict-json.mjs'
import { validateDevices } from './devices.mjs'

export const FIRMWARE = [{release:'25.12.2', manager:'apk'}, {release:'24.10.8', manager:'opkg'}]
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
async function download(url, request) {
  if (!/^https:\/\/downloads\.openwrt\.org\/releases\/\d{2}\.\d{2}\.\d+\/(?:\.overview\.json|targets\/[a-z0-9_-]+\/[a-z0-9_-]+\/profiles\.json)$/.test(url)) throw Error('设备数据来源无效')
  const response = await request(url, {redirect:'error', signal:AbortSignal.timeout(30000)})
  if (!response.ok) { await response.body?.cancel(); throw Error(`设备目录读取失败：HTTP ${response.status}`) }
  const chunks = []; let count = 0
  for await (const chunk of response.body) {
    count += chunk.length
    if (count > 4 * 1024**2) throw Error('设备数据超过大小上限')
    chunks.push(chunk)
  }
  const bytes = Buffer.concat(chunks)
  return {json:parseStrictJSON(bytes.toString('utf8'),4*1024**2), sha256:sha256(bytes)}
}

export function addProfiles(catalogue, source, document, expectedProfiles) {
  if (document.version_number !== source.release || document.target !== source.target || !document.profiles || Array.isArray(document.profiles) || typeof document.profiles !== 'object') throw Error('型号数据与固定固件版本不符')
  source.architecture = document.arch_packages
  catalogue.sources.push(source)
  for (const profile of expectedProfiles) {
    const details = document.profiles[profile]
    if (!details || !Array.isArray(details.titles) || !details.titles.length) throw Error('官方概览中的型号缺少详细映射')
    // Generic targets sometimes supply a single free-form title.
    const titles = details.titles.map(title => ({
      ...(title.vendor ? {vendor:title.vendor} : {}), model:title.model || title.title,
      ...(title.variant ? {variant:title.variant} : {})
    }))
    const id = `${source.target}/${profile}`
    let device = catalogue.devices.find(item => item.id === id)
    if (!device) { device = {id,profile,target:source.target,titles:[],sources:[]}; catalogue.devices.push(device) }
    for (const title of titles) if (!device.titles.some(existing => JSON.stringify(existing) === JSON.stringify(title))) device.titles.push(title)
    device.sources.push(source.id)
  }
}

export async function refreshDevices(destination, request = fetch, firmware = FIRMWARE) {
  const catalogue = {schema_version:1,refreshed_at:new Date().toISOString(),sources:[],devices:[]}
  for (const {release, manager} of firmware) {
    const overview = await download(`https://downloads.openwrt.org/releases/${release}/.overview.json`, request)
    if (overview.json.release !== release || !Array.isArray(overview.json.profiles) || overview.json.profiles.length > 10000) throw Error('官方设备概览无效')
    const targets = new Map()
    for (const profile of overview.json.profiles) {
      if (!/^[a-z0-9_-]+\/[a-z0-9_-]+$/.test(profile.target) || !/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.test(profile.id)) throw Error('官方设备标识无效')
      if (!targets.has(profile.target)) targets.set(profile.target, new Set())
      targets.get(profile.target).add(profile.id)
    }
    if (!targets.size || targets.size > 128) throw Error('目标数量超限')
    const work = [...targets.entries()]; let index = 0
    // At most four concurrent read-only downloads; browser visitors never fetch.
    await Promise.all(Array.from({length:4}, async () => {
      while (index < work.length) {
        const [target, profiles] = work[index++]
        const url = `https://downloads.openwrt.org/releases/${release}/targets/${target}/profiles.json`
        const result = await download(url, request)
        addProfiles(catalogue, {id:`${release}/${target}`,release,target,package_manager:manager,url,sha256:result.sha256}, result.json, profiles)
      }
    }))
  }
  catalogue.sources.sort((a,b) => a.id.localeCompare(b.id))
  catalogue.devices.sort((a,b) => a.id.localeCompare(b.id))
  for (const device of catalogue.devices) { device.sources.sort(); device.titles.sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b))) }
  validateDevices(catalogue)
  const bytes = JSON.stringify(catalogue) + '\n'
  if (Buffer.byteLength(bytes) > 4 * 1024**2) throw Error('设备快照过大')
  const temporary = destination + '.tmp'
  try { writeFileSync(temporary,bytes,{flag:'wx'}); renameSync(temporary,destination) }
  finally { rmSync(temporary,{force:true}) }
  return catalogue
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await refreshDevices(fileURLToPath(new URL('../data/devices.json',import.meta.url)))
  console.log(`已核对 ${result.devices.length} 个设备条目、${result.sources.length} 个固定固件目标。`)
}
