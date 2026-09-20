import { readFileSync } from 'node:fs'
import { validateManifest } from '../../scripts/releases.mjs'
import { canonicalHash } from '../../scripts/sync-releases.mjs'
import { parseStrictJSON } from '../../scripts/strict-json.mjs'

export default {
  watch: ['../../data/release-catalogue.json'],
  load() {
    const raw = readFileSync(new URL('../../data/release-catalogue.json', import.meta.url))
    if (raw.length > 2 * 1024**2) throw Error('发布快照过大')
    const snapshot = parseStrictJSON(raw.toString('utf8'), 2 * 1024**2)
    if (snapshot.schema_version !== 1 || !Array.isArray(snapshot.releases) || snapshot.releases.length > 20) throw Error('发布快照格式无效')
    const versions = new Set()
    for (const release of snapshot.releases) {
      validateManifest(release.manifest)
      if (versions.has(release.manifest.release) || !release.verified_public_at || !/^[a-f0-9]{64}$/.test(release.manifest_sha256) || canonicalHash(release.manifest) !== release.canonical_sha256) throw Error('缺少公开发布核对记录、快照摘要不符或版本重复')
      versions.add(release.manifest.release)
    }
    return snapshot
  }
}
