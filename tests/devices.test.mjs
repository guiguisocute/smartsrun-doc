import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { validateDevices, searchDevices, factsForDevice, deviceFirmware } from '../scripts/devices.mjs'
import { refreshDevices } from '../scripts/sync-devices.mjs'
import { selectAssets, parseDeviceFacts } from '../scripts/releases.mjs'
import { manifestFixture } from './release-fixtures.mjs'

const catalogue = validateDevices(JSON.parse(readFileSync(new URL('../data/devices.json',import.meta.url),'utf8')))
const device = profile => catalogue.devices.find(item => item.profile === profile)
const facts = (profile, release='25.12.2') => factsForDevice(catalogue, device(profile).id, `${release}/${device(profile).target}`)

test('official model search preserves hardware variants and supports Chinese brand search', () => {
  assert.ok(catalogue.devices.length > 1800)
  const tr = searchDevices(catalogue.devices,'tr3000')
  assert.equal(tr.length,3)
  assert.equal(new Set(tr.map(item => item.id)).size,3)
  assert.ok(searchDevices(catalogue.devices,'小米 AX6000').length >= 2)
  assert.equal(searchDevices(catalogue.devices,'gl mt3000')[0].profile,'glinet_gl-mt3000')
  assert.equal(searchDevices(catalogue.devices,'unknown-model-123456').length,0)
})

test('model and selected official firmware supply exact architecture and package format', () => {
  assert.deepEqual(facts('cudy_tr3000-v1'), {packageManager:'apk',firmwareFamily:'25.12',architectures:[{name:'aarch64_cortex-a53',priority:1}]})
  assert.equal(facts('cudy_tr3000-v1','24.10.8').packageManager,'opkg')
  assert.equal(facts('tplink_archer-c7-v2').architectures[0].name,'mips_24kc')
  assert.equal(facts('d-team_newifi-d2').architectures[0].name,'mipsel_24kc')
  assert.equal(selectAssets(manifestFixture('apk','aarch64_cortex-a53'),facts('cudy_tr3000-v1')).type,'Match')
  assert.equal(selectAssets(manifestFixture('apk','mipsel_24kc'),facts('tplink_archer-c7-v2')).type,'Unsupported')
})

test('custom and unknown firmware never inherit official assumptions; device facts take priority', () => {
  const id = device('cudy_tr3000-v1').id
  for (const choice of ['','custom','24.10.8/x86/64']) assert.equal(factsForDevice(catalogue,id,choice).architectures.length,0)
  assert.equal(deviceFirmware(catalogue,'unknown').length,0)
  const observed = parseDeviceFacts("DISTRIB_RELEASE='25.12-SNAPSHOT'\narch all 1\narch mipsel_24kc 10",'opkg')
  const selected = factsForDevice(catalogue,id,'25.12.2/mediatek/filogic',observed)
  assert.deepEqual(selected,observed)
  assert.equal(selectAssets(manifestFixture('opkg','mipsel_24kc'),selected).type,'Match')
  assert.equal(factsForDevice(catalogue,id,'custom',{architectures:[]}).packageManager,undefined)
})

test('malformed and duplicate source mappings are rejected without inventing a generic architecture', () => {
  for (const mutate of [c => { c.sources[0].architecture='all' }, c => { c.sources[0].architecture=null },
    c => { c.sources[0].url='https://example.com/profiles.json' }, c => { c.devices.push(c.devices[0]) },
    c => { c.devices[0].sources=['missing'] }, c => { c.devices[0].titles=[{model:null}] }]) {
    const value = structuredClone(catalogue); mutate(value); assert.throws(() => validateDevices(value))
  }
})

test('a partial or mismatched official refresh retains the last complete device snapshot', async () => {
  const dir = mkdtempSync(join(tmpdir(),'srun-devices-')), path=join(dir,'devices.json')
  const firmware=[{release:'25.12.2',manager:'apk'}]
  const request = fail => async url => new Response(JSON.stringify(url.endsWith('.overview.json') ?
    {release:'25.12.2',profiles:[{id:'router_v1',target:'mediatek/filogic'}]} :
    {version_number:fail?'24.10.8':'25.12.2',target:'mediatek/filogic',arch_packages:'aarch64_cortex-a53',profiles:{router_v1:{titles:[{vendor:'Test',model:'Router',variant:'v1'}]}}}),{status:200})
  try {
    writeFileSync(path,'original snapshot')
    await assert.rejects(refreshDevices(path,request(true),firmware))
    assert.equal(readFileSync(path,'utf8'),'original snapshot')
    const result = await refreshDevices(path,request(false),firmware)
    assert.equal(result.devices.length,1)
    assert.equal(validateDevices(JSON.parse(readFileSync(path,'utf8'))).sources[0].architecture,'aarch64_cortex-a53')
  } finally { rmSync(dir,{recursive:true,force:true}) }
})
