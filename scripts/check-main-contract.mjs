import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { validateManifest } from './releases.mjs'
import { parseStrictJSON } from './strict-json.mjs'

const repository = process.argv[2]
if (!repository) throw Error('请指定主仓库 checkout 目录；缺少契约 fixture 不视为通过')
const cases = JSON.parse(readFileSync(join(resolve(repository),'core/internal/update/testdata/manifest-v1-contract.json'),'utf8'))
assert.ok(cases.length >= 5)
for (const entry of cases) {
  let accepted = false
  try { validateManifest(parseStrictJSON(entry.json)); accepted = true } catch {}
  assert.equal(accepted,entry.accept,entry.name)
}
console.log(`M21：主仓库 Go/发布器共享契约 ${cases.length} 项通过`)
