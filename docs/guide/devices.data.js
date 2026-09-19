import { readFileSync } from 'node:fs'
import { validateDevices } from '../../scripts/devices.mjs'
import { parseStrictJSON } from '../../scripts/strict-json.mjs'

export default {
  watch: ['../../data/devices.json'],
  load() {
    return validateDevices(parseStrictJSON(readFileSync(new URL('../../data/devices.json',import.meta.url),'utf8'),4*1024**2))
  }
}
