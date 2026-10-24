import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { checkSiteLinks, checkSourceLinks } from '../scripts/check-doc-links.mjs'

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'smart-srun-docs-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  return { root, write(path, content) {
    const file = join(root, path)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, content)
  } }
}

test('built clean URLs, directory indexes and encoded anchors resolve', t => {
  const { root, write } = fixture(t)
  write('index.html', '<a href="/guide/one#%E4%B8%AD%E6%96%87">one</a><a href="/development/">dev</a>')
  write('guide/one.html', '<h2 id="中文">Heading</h2><a href="../">home</a><a href="https://example.invalid/missing">external</a>')
  write('development/index.html', '<a href="/guide/one?view=1#中文">one</a>')
  assert.deepEqual(checkSiteLinks(root), [])
})

test('missing pages and moved section anchors fail validation', t => {
  const { root, write } = fixture(t)
  write('index.html', '<a href="/removed">page</a><a href="/guide#old">section</a>')
  write('guide.html', '<h2 id="new">New heading</h2>')
  const errors = checkSiteLinks(root)
  assert.equal(errors.length, 2)
  assert.ok(errors.some(error => error.includes('missing page')))
  assert.ok(errors.some(error => error.includes('missing anchor')))
})

test('cross-repository pointers use the supplied source tree, not network or historical tags', t => {
  const { root, write } = fixture(t)
  write('source/core/present.go', '// fixture')
  write('docs/guide.md', [
    '[File](https://github.com/matthewlu070111/smart-srun/blob/main/core/present.go#Symbol)',
    '[Directory](https://github.com/matthewlu070111/smart-srun/tree/main/core/)',
    '[Missing](https://github.com/matthewlu070111/smart-srun/blob/main/core/removed.go)',
    '[Historical](https://github.com/matthewlu070111/smart-srun/blob/v1.6.1/retired.py)'
  ].join('\n'))
  const errors = checkSourceLinks(join(root, 'docs'), join(root, 'source'))
  assert.deepEqual(errors, ['guide.md: missing source target core/removed.go'])
})
