import { strict as assert } from 'node:assert';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { test } from 'node:test';

test('benchmark downloads match their published checksums after checkout', async () => {
  const root = new URL('../docs/public/benchmarks/', import.meta.url);
  const folders = await readdir(root, { withFileTypes: true });
  let checked = 0;
  for (const folder of folders.filter(entry => entry.isDirectory())) {
    const directory = new URL(`${folder.name}/`, root);
    const sums = await readFile(new URL('SHA256SUMS.txt', directory), 'utf8');
    for (const line of sums.trim().split(/\r?\n/)) {
      const match = /^([0-9a-f]{64})  ([\w.-]+)$/.exec(line);
      assert.ok(match, `Invalid checksum entry: ${line}`);
      const bytes = await readFile(new URL(match[2], directory));
      assert.equal(createHash('sha256').update(bytes).digest('hex'), match[1],
        `${folder.name}/${match[2]} must retain the exact downloadable bytes`);
      checked++;
    }
  }
  assert.ok(checked > 0, 'At least one downloadable result must be verified');
});
