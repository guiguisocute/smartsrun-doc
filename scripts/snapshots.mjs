import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { validateCatalogue, validateEvidence, catalogueView } from './catalogue.mjs'

export function loadSchools(directory) {
  const raw = readFileSync(new URL('school-presets.json', directory))
  if (raw.length > 512 * 1024) throw Error('学校目录过大')
  const source = JSON.parse(readFileSync(new URL('school-source.json', directory), 'utf8'))
  if (source.repository !== 'matthewlu070111/smart-srun' || !/^[a-f0-9]{40}$/.test(source.commit) ||
      source.sha256 !== createHash('sha256').update(raw).digest('hex')) throw Error('学校目录快照来源或哈希不匹配')
  const catalogue = validateCatalogue(JSON.parse(raw.toString('utf8')))
  const evidence = validateEvidence(JSON.parse(readFileSync(new URL('school-verification.json', directory), 'utf8')), catalogue)
  return { updatedAt: catalogue.updated_at, source, schools: catalogueView(catalogue, evidence) }
}
