// Explicit refresh of immutable, already-public Go releases. No upload/publish,
// no auth tokens, and failed retrieval leaves the checked-in snapshot intact.
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { REPOSITORY, parseVersion, validateManifest, assetFilename, compareVersions } from './releases.mjs'
import { parseStrictJSON } from './strict-json.mjs'

const digest = bytes => createHash('sha256').update(bytes).digest('hex')
export const canonicalHash = manifest => digest(JSON.stringify(manifest))

async function download(url, limit, request = fetch) {
  for (let redirects = 0; redirects < 5; redirects++) {
    const target = new URL(url)
    if (target.protocol !== 'https:' || target.username || target.password || target.port || target.hash ||
        !['api.github.com','github.com','release-assets.githubusercontent.com','objects.githubusercontent.com'].includes(target.hostname)) throw Error('发布下载重定向无效')
    if ((target.hostname === 'github.com' && !target.pathname.startsWith(`/${REPOSITORY}/releases/download/`)) ||
        (target.hostname === 'api.github.com' && !target.pathname.startsWith(`/repos/${REPOSITORY}/releases/tags/`))) throw Error('发布来源不属于主仓库')
    const response = await request(url, { redirect: 'manual', signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'smart-srun-doc-snapshot', 'Accept-Encoding': 'identity' } })
    if ([301,302,303,307,308].includes(response.status)) {
      const location = response.headers.get('location')
      await response.body?.cancel()
      if (!location) throw Error('缺少发布下载地址')
      url = new URL(location, url).href; continue
    }
    if (!response.ok) { await response.body?.cancel(); throw Error(`读取公开发布失败：HTTP ${response.status}`) }
    const chunks = []; let length = 0
    for await (const chunk of response.body) {
      length += chunk.length
      if (length > limit) throw Error('发布响应超过大小上限')
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
  }
  throw Error('发布下载重定向过多')
}

export async function publicRelease(version, request = fetch) {
  if (parseVersion(version)[0] < 2) throw Error('仅接收 Go 2.0 发布清单')
  const api = parseStrictJSON((await download(`https://api.github.com/repos/${REPOSITORY}/releases/tags/${version}`, 2 * 1024**2, request)).toString('utf8'), 2 * 1024**2)
  if (api.draft !== false || api.tag_name !== version || api.prerelease !== version.includes('rc') || !Array.isArray(api.assets)) throw Error('版本尚未公开或通道不一致')
  const base = `https://github.com/${REPOSITORY}/releases/download/${version}/`
  const released = filename => {
    const matches = api.assets.filter(asset => asset.name === filename && asset.state === 'uploaded' && asset.browser_download_url === base + filename)
    if (matches.length !== 1) throw Error('公开发布缺少唯一资产：' + filename)
    return matches[0]
  }
  const metadata = released('release-manifest.json')
  const bytes = await download(base + 'release-manifest.json', 256 * 1024, request)
  if (metadata.size !== bytes.length || (metadata.digest && metadata.digest !== 'sha256:' + digest(bytes))) throw Error('公开清单大小或摘要不匹配')
  const manifest = validateManifest(parseStrictJSON(bytes.toString('utf8')))
  if (manifest.release !== version) throw Error('公开清单版本不一致')
  for (const asset of manifest.assets) {
    const actual = released(assetFilename(asset, version))
    if (actual.size !== asset.bytes || (actual.digest && actual.digest !== 'sha256:' + asset.sha256)) throw Error('安装包大小或摘要与公开资产不一致')
  }
  const sumsAsset = released('SHA256SUMS')
  const sumsBytes = await download(base + 'SHA256SUMS', 64 * 1024, request)
  if (sumsAsset.size !== sumsBytes.length || (sumsAsset.digest && sumsAsset.digest !== 'sha256:' + digest(sumsBytes))) throw Error('校验和文件大小或摘要不一致')
  const sums = new Map()
  for (const line of sumsBytes.toString('utf8').trim().split(/\r?\n/)) {
    const entry = /^([a-f0-9]{64})  ([a-zA-Z0-9][a-zA-Z0-9_.~+-]{0,199})$/.exec(line)
    if (!entry || sums.has(entry[2])) throw Error('校验和记录无效或重复')
    sums.set(entry[2], entry[1])
  }
  if (sums.get('release-manifest.json') !== digest(bytes) || manifest.assets.some(asset => sums.get(assetFilename(asset,version)) !== asset.sha256)) throw Error('公开校验和与发布清单不一致')
  return { manifest, manifest_sha256: digest(bytes), canonical_sha256: canonicalHash(manifest), verified_public_at: new Date().toISOString() }
}

export async function refreshReleases(versions, destination, request = fetch) {
  if (!versions.length || versions.length > 20 || new Set(versions).size !== versions.length) throw Error('请指定 1–20 个不同的固定 Go 发布版本')
  const releases = []
  for (const version of versions) releases.push(await publicRelease(version, request))
  // Require explicit continuity for retained versions; public bytes may not be
  // silently replaced under an existing version label.
  let prior
  try { prior = JSON.parse(readFileSync(destination, 'utf8')) } catch (error) { if (error.code !== 'ENOENT') throw error }
  for (const old of prior?.releases || []) {
    validateManifest(old.manifest)
    if (old.canonical_sha256 !== canonicalHash(old.manifest)) throw Error('已有发布快照摘要不符')
    const next = releases.find(item => item.manifest.release === old.manifest.release)
    if (next && next.manifest_sha256 !== old.manifest_sha256) throw Error('同版本的公开清单发生变化，保留原快照')
    if (!next) releases.push(old)
  }
  if (releases.length > 20) throw Error('保留的固定版本超过 20 个，请先审阅快照中的保留范围')
  releases.sort((a,b) => compareVersions(b.manifest.release,a.manifest.release))
  const snapshot = JSON.stringify({ schema_version: 1, refreshed_at: new Date().toISOString(), releases }, null, 2) + '\n'
  if (Buffer.byteLength(snapshot) > 2 * 1024**2) throw Error('发布快照超过大小上限')
  const temporary = destination + '.tmp'
  try { writeFileSync(temporary, snapshot, { flag: 'wx' }); renameSync(temporary, destination) }
  finally { rmSync(temporary, { force: true }) }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await refreshReleases(process.argv.slice(2), fileURLToPath(new URL('../data/release-catalogue.json', import.meta.url)))
  console.log('已核对公开资产并保存发布快照；没有执行部署。')
}
