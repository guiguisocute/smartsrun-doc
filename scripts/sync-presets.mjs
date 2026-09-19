// Explicit maintainer refresh from a fixed main-repository commit. Builds only
// read the checked-in snapshot and remain usable without GitHub connectivity.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync, renameSync, rmSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateCatalogue } from './catalogue.mjs'

export function saveSnapshot(raw, commit, destination) {
  if (!/^[a-f0-9]{40}$/.test(commit || '') || raw.length > 512 * 1024) throw Error('目录来源或大小无效')
  validateCatalogue(JSON.parse(raw.toString('utf8')))
  mkdirSync(destination, { recursive: true })
  const source = { schema_version: 1, repository: 'matthewlu070111/smart-srun', commit,
    sha256: createHash('sha256').update(raw).digest('hex'), captured_at: new Date().toISOString() }
  // Validate the entire new source before replacing either file. Interrupted
  // replacement fails the build hash check instead of publishing mixed data.
  for (const [name, value] of [['school-presets.json', raw], ['school-source.json', JSON.stringify(source, null, 2) + '\n']]) {
    const temporary = join(destination, '.' + name + '.tmp')
    try { writeFileSync(temporary, value, { flag: 'wx' }); renameSync(temporary, join(destination, name)) }
    finally { rmSync(temporary, { force: true }) }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [repository, commit] = process.argv.slice(2)
  if (!repository || !/^[a-f0-9]{40}$/.test(commit || '')) throw Error('用法：node scripts/sync-presets.mjs 主仓库目录 完整提交SHA')
  const raw = execFileSync('git', ['-C', resolve(repository), 'show', `${commit}:doc/school-presets.json`], { maxBuffer: 512 * 1024 })
  saveSnapshot(raw, commit, fileURLToPath(new URL('../data/', import.meta.url)))
  console.log(`已保存固定提交 ${commit} 的学校目录`)
}
