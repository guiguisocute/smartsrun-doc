import { loadSchools } from '../../scripts/snapshots.mjs'

export default {
  watch: ['../../data/school-*.json'],
  load() { return loadSchools(new URL('../../data/', import.meta.url)) }
}
