export const EVIDENCE_LABELS = { unverified: '尚无审阅验证记录', contributor_reported: '贡献者报告', verified: '已审阅的验证记录' }

export function safeLink(value) {
  if (typeof value !== 'string' || value.length > 2048) return null
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null
  } catch { return null }
}

export function validateCatalogue(data) {
  if (data?.schema_version !== 1 || !/^\d{4}-\d{2}-\d{2}$/.test(data.updated_at) ||
      !Array.isArray(data.schools) || !data.schools.length || data.schools.length > 512) throw Error('学校目录格式无效')
  const ids = new Set()
  for (const item of data.schools) {
    if (!item || typeof item.id !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,127}$/.test(item.id) || ids.has(item.id) ||
        typeof item.name !== 'string' || !item.name.trim() || item.name.length > 200 ||
        !['active', 'draft'].includes(item.status) || (item.operators !== undefined && !Array.isArray(item.operators)) ||
        (item.contributors !== undefined && (!Array.isArray(item.contributors) || item.contributors.some(name => typeof name !== 'string'))) ||
        (item.defaults !== undefined && (!item.defaults || Array.isArray(item.defaults) || typeof item.defaults !== 'object'))) throw Error('学校条目格式无效')
    ids.add(item.id)
    for (const operator of item.operators || []) {
      if (!operator || typeof operator.label !== 'string' || operator.label.length > 200 ||
          (operator.suffix !== undefined && typeof operator.suffix !== 'string') ||
          (operator.id !== undefined && typeof operator.id !== 'string')) throw Error('后缀选项格式无效')
    }
  }
  return data
}

export function validateEvidence(data, catalogue) {
  if (data?.schema_version !== 1 || !Array.isArray(data.records)) throw Error('验证记录格式无效')
  const ids = new Set(catalogue.schools.map(item => item.id))
  for (const item of data.records) {
    if (!ids.has(item.preset_id) || !['contributor_reported', 'verified'].includes(item.status) ||
        !safeLink(item.source_url) || !item.tested_plugin_version || !item.scope_note ||
        !/^\d{4}-\d{2}-\d{2}$/.test(item.date) || !['wired', 'wifi'].includes(item.access_mode) ||
        typeof item.operator_suffix !== 'string' || (item.status === 'verified' && !safeLink(item.review_url))) throw Error('验证记录缺少来源、范围或审阅链接')
  }
  return data
}

export function suffixLabel(operator) {
  const suffix = operator.suffix ?? operator.id
  return suffix === undefined ? '未记录' : suffix === '' ? '无后缀' : suffix === '??' ? '待确认' : suffix
}

export function filterSchools(schools, query = '', includeDrafts = false) {
  const needle = query.trim().toLocaleLowerCase()
  return schools.filter(item => (includeDrafts || item.status === 'active') &&
    (!needle || [item.id, item.name, item.description || '', ...(item.operators || []).map(op => op.label)].join(' ').toLocaleLowerCase().includes(needle)))
}

export function catalogueView(catalogue, evidence) {
  validateCatalogue(catalogue)
  validateEvidence(evidence, catalogue)
  return catalogue.schools.map(item => ({ ...item,
    evidence: evidence.records.filter(record => record.preset_id === item.id),
    sourceLink: safeLink(item.source_issue), docLink: safeLink(item.doc_url)
  }))
}
