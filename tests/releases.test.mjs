import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { validateManifest, selectAssets, parseDeviceFacts, compareVersions, channelReleases, assetFilename } from '../scripts/releases.mjs'
import { parseStrictJSON } from '../scripts/strict-json.mjs'
import { publicRelease, refreshReleases } from '../scripts/sync-releases.mjs'
import { manifestFixture, factsFixture } from './release-fixtures.mjs'

test('numeric RC ordering and explicit channel selection', () => {
  assert.ok(compareVersions('2.0.0rc2','2.0.0rc10') < 0)
  assert.ok(compareVersions('2.0.0rc10','2.0.0') < 0)
  assert.equal(channelReleases([manifestFixture()]).length,0)
  assert.equal(channelReleases([manifestFixture()], 'rc').length,1)
  assert.throws(() => compareVersions('2.0.0rc0','2.0.0'))
})

test('Kwrt opkg, APK, MIPS endianness and absent assets', () => {
  const opkg = manifestFixture(), apk = manifestFixture('apk')
  assert.equal(selectAssets(opkg,factsFixture()).type,'Match')
  assert.equal(selectAssets(opkg,factsFixture()).assets[0].format,'ipk')
  assert.equal(selectAssets(apk,factsFixture('apk')).assets[0].format,'apk')
  assert.equal(selectAssets(opkg,factsFixture('apk')).type,'Unsupported')
  assert.equal(selectAssets(opkg,factsFixture('opkg','mipsel_24kc')).type,'Unsupported')
  assert.equal(selectAssets(opkg,{...factsFixture(),architectures:[]}).type,'NeedMoreInfo')
  assert.equal(selectAssets(opkg,factsFixture('opkg','x86_64')).type,'Unsupported')
})

test('package architecture priorities and equally compatible alternatives', () => {
  const manifest = manifestFixture()
  const generic = structuredClone(manifest.assets.find(item => item.kind === 'bundle'))
  generic.id+='-generic';generic.openwrt_arch='mips_generic';generic.url=generic.url.replace('mips_24kc','mips_generic')
  manifest.assets.push(generic)
  const facts={...factsFixture(),architectures:[{name:'mips_24kc',priority:10},{name:'mips_generic',priority:5}]}
  assert.equal(selectAssets(manifest,facts).assets[0].openwrt_arch,'mips_24kc')
  facts.architectures[1].priority=10
  assert.equal(selectAssets(manifest,facts).type,'Ambiguous')
})

test('split ownership requires exact versions and LuCI requires existing core', () => {
  const manifest = manifestFixture(), facts = factsFixture()
  assert.equal(selectAssets(manifest,facts,'split').assets.length,2)
  assert.equal(selectAssets(manifest,facts,'luci').type,'NeedMoreInfo')
  assert.equal(selectAssets(manifest,{...facts,coreVersion:manifest.assets[0].package_version},'luci').assets.length,1)
  manifest.assets[1].package_version='2.0.0~rc10-r2'
  assert.equal(selectAssets(manifest,facts,'split').type,'Unsupported')
})

test('malicious metadata, unvalidated targets and oversized combinations are rejected', () => {
  for (const mutation of [m=>m.assets[0].url='javascript:alert(1)',m=>m.assets[0].sha256='',m=>m.assets[0].id=null,
    m=>m.assets[0].openwrt_arch='all',m=>m.assets.push(structuredClone(m.assets[0])),m=>m.assets[0].bytes=-1,
    m=>m.assets[0].validation.elf='true',m=>m.assets[0].url=m.assets[0].url.replace('/smart-srun_', '/unrelated_')]) {
    const manifest=manifestFixture();mutation(manifest);assert.throws(()=>validateManifest(manifest))
  }
  const manifest=manifestFixture();manifest.assets[0].installed_bytes=10*1024**2
  assert.equal(selectAssets(manifest,factsFixture(),'split').type,'Unsupported')
  assert.equal(selectAssets(manifest,{...factsFixture(),coreVersion:manifest.assets[0].package_version},'luci').type,'Unsupported')
  manifest.assets.find(a=>a.kind==='bundle').validation.elf=false
  assert.equal(selectAssets(manifest,factsFixture()).type,'Unsupported')
  assert.throws(()=>parseStrictJSON('{"schema_version":1,"schema_version":2}'),/重复/)
  assert.throws(()=>parseStrictJSON('{"a":[{"x":1,"\\u0078":2}]}'),/重复/)
  assert.deepEqual(parseStrictJSON('{"a":["escaped\\\"value",{},true,null,12]}'),{a:['escaped"value',{},true,null,12]})
})

test('pasted diagnostics retain package facts only, without inferring firmware manager', () => {
  const facts=parseDeviceFacts("DISTRIB_RELEASE='25.12-SNAPSHOT'\nDISTRIB_DESCRIPTION='Kwrt'\narch all 1\narch mips_24kc 10\nSSID=private\nMAC=secret",'opkg')
  assert.deepEqual(facts,factsFixture())
  assert.deepEqual(parseDeviceFacts("DISTRIB_RELEASE='25.12.2'\nx86_64",'apk').architectures,[{name:'x86_64',priority:1}])
})

function publicFixture(version='2.0.0rc10') {
  const manifest=manifestFixture('opkg','mips_24kc',version), bytes=Buffer.from(JSON.stringify(manifest))
  const sha=buffer=>createHash('sha256').update(buffer).digest('hex')
  const base=`https://github.com/matthewlu070111/smart-srun/releases/download/${manifest.release}/`
  const sums=Buffer.from(`${sha(bytes)}  release-manifest.json\n`+manifest.assets.map(a=>`${a.sha256}  ${assetFilename(a,manifest.release)}\n`).join(''))
  const item=(name,size,digest)=>({name,size,digest:'sha256:'+digest,state:'uploaded',browser_download_url:base+name})
  const api={tag_name:manifest.release,draft:false,prerelease:version.includes('rc'),assets:[item('release-manifest.json',bytes.length,sha(bytes)),item('SHA256SUMS',sums.length,sha(sums)),...manifest.assets.map(a=>item(assetFilename(a,manifest.release),a.bytes,a.sha256))]}
  const request=async url=>new Response(url.includes('/releases/tags/')?JSON.stringify(api):url.endsWith('SHA256SUMS')?sums:bytes)
  return {manifest,api,request}
}

test('refresh imports only published assets with matching immutable checksum evidence', async () => {
  const {manifest,api,request}=publicFixture()
  assert.equal((await publicRelease(manifest.release,request)).manifest.release,manifest.release)
  api.draft=true
  await assert.rejects(publicRelease(manifest.release,request),/公开/)
  api.draft=false;api.assets.pop()
  await assert.rejects(publicRelease(manifest.release,request),/缺少/)
})

test('network or checksum failure leaves the prior published snapshot intact', async () => {
  const directory=mkdtempSync(join(tmpdir(),'smart-srun-releases-')), destination=join(directory,'releases.json')
  try {
    writeFileSync(destination,JSON.stringify({schema_version:1,releases:[]}))
    const {manifest,api,request}=publicFixture()
    await refreshReleases([manifest.release],destination,request)
    const before=readFileSync(destination)
    api.assets[2].digest='sha256:'+'c'.repeat(64)
    await assert.rejects(refreshReleases([manifest.release],destination,request),/摘要/)
    assert.deepEqual(readFileSync(destination),before)
    await assert.rejects(refreshReleases([manifest.release],destination,async()=>{throw Error('offline')}),/offline/)
    assert.deepEqual(readFileSync(destination),before)
  } finally { rmSync(directory,{recursive:true,force:true}) }
})

test('importing a new RC preserves an already verified stable snapshot', async () => {
  const directory=mkdtempSync(join(tmpdir(),'smart-srun-retained-releases-')), destination=join(directory,'releases.json')
  try {
    const stable=publicFixture('2.0.0'), rc=publicFixture('2.1.0rc1')
    await refreshReleases([stable.manifest.release],destination,stable.request)
    await refreshReleases([rc.manifest.release],destination,rc.request)
    const snapshot=JSON.parse(readFileSync(destination,'utf8'))
    assert.equal(snapshot.releases.length,2)
    assert.equal(channelReleases(snapshot.releases.map(item=>item.manifest))[0].release,'2.0.0')
  } finally { rmSync(directory,{recursive:true,force:true}) }
})
