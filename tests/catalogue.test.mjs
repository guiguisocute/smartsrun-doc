import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { catalogueView, filterSchools, suffixLabel, safeLink, validateEvidence } from '../scripts/catalogue.mjs'
import { saveSnapshot } from '../scripts/sync-presets.mjs'
import { loadSchools } from '../scripts/snapshots.mjs'

const catalogue = { schema_version: 1, updated_at: '2026-09-03', schools: [
  { id: 'north', name: '示例大学（北校区）', status: 'active', operators: [{ label: '校园网', suffix: '' }, { label: '运营商', suffix: '??' }, { label: '未收录' }] },
  { id: 'south', name: '示例大学（南校区）', status: 'draft', operators: [], source_issue: 'javascript:alert(1)' },
  { id: 'other', name: '<img src=x onerror=alert(1)>', status: 'active' }
] }
const evidence = { schema_version: 1, records: [] }

test('directory availability never implies review or Go compatibility', () => {
  const view = catalogueView(catalogue, evidence)
  assert.equal(view.length, 3)
  assert.deepEqual(view[0].evidence, [])
  assert.equal(view[1].sourceLink, null)
  assert.equal(view[2].name, '<img src=x onerror=alert(1)>')
  assert.equal(filterSchools(view).length, 2)
  assert.equal(filterSchools(view, '示例大学').length, 1)
  assert.equal(filterSchools(view, '示例大学', true).length, 2)
  assert.equal(filterSchools(view, 'NORTH').length, 1)
  assert.equal(filterSchools(view, '运营商').length, 1)
})

test('unknown, missing and intentionally empty suffixes remain distinct', () => {
  assert.deepEqual(catalogue.schools[0].operators.map(suffixLabel), ['无后缀', '待确认', '未记录'])
  assert.equal(suffixLabel({ suffix: '', id: 'legacy' }), '无后缀')
  assert.equal(suffixLabel({ id: 'legacy' }), 'legacy')
  assert.equal(safeLink('data:text/html,bad'), null)
  assert.equal(safeLink('https://user:secret@example.com/'), null)
})

test('verified evidence needs precise version, access scope and a review source', () => {
  const record = { preset_id: 'north', status: 'verified', source_url: 'https://example.com/issue', date: '2026-09-03',
    tested_plugin_version: '1.6.0', access_mode: 'wifi', operator_suffix: '', scope_note: '北校区 Wi-Fi，一个账号' }
  assert.throws(() => validateEvidence({ ...evidence, records: [record] }, catalogue))
  record.review_url = 'https://example.com/review'
  assert.equal(validateEvidence({ ...evidence, records: [record] }, catalogue).records[0].tested_plugin_version, '1.6.0')
})

test('invalid refresh retains valid snapshot; corrupted cache fails build', () => {
  const directory = mkdtempSync(join(tmpdir(), 'smart-srun-catalogue-'))
  try {
    saveSnapshot(Buffer.from(JSON.stringify(catalogue)), 'a'.repeat(40), directory)
    writeFileSync(join(directory, 'school-verification.json'), JSON.stringify(evidence))
    const url = pathToFileURL(directory + '/')
    assert.equal(loadSchools(url).schools.length, 3)
    const before = readFileSync(join(directory, 'school-presets.json'))
    assert.throws(() => saveSnapshot(Buffer.from('{"schema_version":1,"schools":[]}'), 'b'.repeat(40), directory))
    assert.deepEqual(readFileSync(join(directory, 'school-presets.json')), before)
    writeFileSync(join(directory, 'school-presets.json'), before.toString().replace('北校区', '东校区'))
    assert.throws(() => loadSchools(url), /哈希/)
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

test('checked-in source is complete and all missing evidence stays unverified', () => {
  const snapshot = loadSchools(new URL('../data/', import.meta.url))
  assert.equal(snapshot.schools.length, 12)
  assert.equal(filterSchools(snapshot.schools).length, 9)
  assert.equal(snapshot.schools.filter(item => item.status === 'draft').length, 3)
  assert.ok(snapshot.schools.every(item => !item.evidence.length))
})
