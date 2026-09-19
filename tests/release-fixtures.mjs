// Synthetic contract data only. Never imported by a data loader or page.
export function manifestFixture(manager = 'opkg', arch = 'mips_24kc', version = '2.0.0rc10') {
  const format = manager === 'opkg' ? 'ipk' : 'apk'
  const native = version.replace('rc', manager === 'opkg' ? '~rc' : '_rc') + '-r1'
  return { schema_version:1, release:version, channel: version.includes('rc') ? 'rc' : 'stable', source_commit:'a'.repeat(40),
    assets:['core','luci','bundle'].map(kind => {
      const architecture = kind === 'luci' ? manager === 'opkg' ? 'all' : 'noarch' : arch
      const packageName = {core:'smart-srun',luci:'luci-app-smart-srun',bundle:'luci-app-smart-srun-bundle'}[kind]
      const filename = manager === 'opkg' ? `${packageName}_${native}_${architecture}.ipk` : `${packageName}-${native}.apk`
      return { id:`${kind}-${manager}-${architecture}`,kind,package_manager:manager,format,openwrt_arch:architecture,
        package_version:native,sdk_release:manager==='opkg'?'24.10.8':'25.12.2',target:'x86/64',goos:'linux',goarch:'mips',
        url:`https://github.com/matthewlu070111/smart-srun/releases/download/${version}/${filename}`,
        sha256:'b'.repeat(64),bytes:100,installed_bytes:kind==='luci'?100:1000,firmware_compat:manager==='opkg'?['24.10','25.12']:['25.12'],
        validation:{build:true,elf:kind!=='luci',emulated_core:false,openwrt_install:false,hardware_core:false,campus_auth:false} }
    }) }
}
export const factsFixture = (packageManager='opkg', name='mips_24kc', firmwareFamily='25.12') =>
  ({packageManager,firmwareFamily,architectures:[{name,priority:10}]})
