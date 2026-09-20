<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { data } from '../../guide/schools.data.js'
import { EVIDENCE_LABELS, filterSchools, suffixLabel, safeLink } from '../../../scripts/catalogue.mjs'

const query = ref('')
const drafts = ref(false)
const mounted = ref(false)
const schools = computed(() => filterSchools(data.schools, query.value, drafts.value))
const activeCount = data.schools.filter(item => item.status === 'active').length
function readQuery() {
  const params = new URLSearchParams(window.location.search)
  query.value = (params.get('q') || '').slice(0, 200)
  drafts.value = params.get('draft') === '1'
}
onMounted(() => { readQuery(); mounted.value = true; window.addEventListener('popstate', readQuery) })
onUnmounted(() => { window.removeEventListener('popstate', readQuery) })
watch([query, drafts], () => {
  if (!mounted.value) return
  const url = new URL(window.location.href)
  query.value ? url.searchParams.set('q', query.value) : url.searchParams.delete('q')
  drafts.value ? url.searchParams.set('draft', '1') : url.searchParams.delete('draft')
  window.history.replaceState(null, '', url)
})
const parameters = item => Object.entries({ ...(item.defaults || {}), ...(item.observed_login_shape || {}) })
  .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
</script>

<template>
  <div class="school-catalogue">
    <p class="catalogue-meta">目录更新：{{ data.updatedAt }} · {{ data.schools.length }} 个预设条目（{{ activeCount }} 个常用，{{ data.schools.length - activeCount }} 个草稿）。同一学校的不同校区可能分别记录。</p>
    <div class="catalogue-filters">
      <label for="school-search">搜索学校、校区、预设 ID 或运营商</label>
      <input id="school-search" v-model="query" type="search" maxlength="200" placeholder="例如：江西师范大学" />
      <label class="draft-switch"><input v-model="drafts" type="checkbox" /> 显示草稿</label>
    </div>
    <p role="status" aria-live="polite">找到 {{ schools.length }} 个条目</p>
    <p v-if="!schools.length">没有匹配的预设。可以调整搜索，或<a href="/contribute/presets">贡献学校参数</a>。</p>
    <article v-for="school in schools" :key="school.id" class="school-entry">
      <h2 :id="school.id">{{ school.name }}</h2>
      <p class="entry-meta"><code>{{ school.id }}</code> · {{ school.status === 'draft' ? '草稿，尚未确认可用' : '常用目录条目（active）' }}</p>
      <p v-if="school.description">{{ school.description }}</p>
      <p>接入方式：{{ school.defaults?.access_mode === 'wired' ? '有线' : school.defaults?.access_mode === 'wifi' ? '无线' : '未记录' }}</p>
      <ul class="suffix-list">
        <li v-for="(operator, index) in school.operators" :key="index">{{ operator.label }}：<code>{{ suffixLabel(operator) }}</code></li>
      </ul>
      <p v-if="!school.operators?.length">认证后缀：未记录</p>
      <details>
        <summary>已记录的认证参数</summary>
        <dl class="parameter-list"><template v-for="[key, value] in parameters(school)" :key="key"><dt>{{ key }}</dt><dd>{{ value === '' ? '空值' : value }}</dd></template></dl>
        <p v-if="!parameters(school).length">未记录</p>
      </details>
      <div class="verification-records">
        <p v-if="!school.evidence.length">{{ EVIDENCE_LABELS.unverified }}。目录中可选不代表已完成本项目测试，也不表示 Go 2.0 已兼容。</p>
        <p v-for="(record, index) in school.evidence" :key="index">
          {{ EVIDENCE_LABELS[record.status] }} · {{ record.tested_plugin_version }} · {{ record.date }} · {{ record.access_mode === 'wired' ? '有线' : '无线' }} · 后缀 {{ suffixLabel({ suffix: record.operator_suffix }) }}<br />
          {{ record.scope_note }} <a :href="safeLink(record.source_url)" rel="noopener noreferrer">来源</a>
          <a v-if="record.review_url" :href="safeLink(record.review_url)" rel="noopener noreferrer">审阅记录</a>
        </p>
      </div>
      <p class="entry-meta">
        <a v-if="school.sourceLink" :href="school.sourceLink" rel="noopener noreferrer">来源 Issue</a>
        <span v-if="school.sourceLink && school.docLink"> · </span>
        <a v-if="school.docLink" :href="school.docLink" rel="noopener noreferrer">相关说明</a>
        <span v-if="!school.sourceLink && !school.docLink">未提供独立来源链接</span>
      </p>
      <p v-if="school.contributors?.length" class="entry-meta">贡献者：{{ school.contributors.join('、') }}</p>
    </article>
    <p class="catalogue-meta">本页使用固定提交的目录快照，浏览时无需连接 GitHub。
      <a :href="`https://github.com/${data.source.repository}/blob/${data.source.commit}/doc/school-presets.json`">查看原始目录</a>。
    </p>
  </div>
</template>

<style scoped>
.catalogue-meta, .entry-meta { color: var(--vp-c-text-2); font-size: .9rem; }
.catalogue-filters { display: grid; gap: .6rem; padding: 1rem; border: 1px solid var(--vp-c-divider); border-radius: 8px; }
.catalogue-filters input[type=search] { width: 100%; padding: .6rem .75rem; border: 1px solid var(--vp-c-divider); border-radius: 6px; background: var(--vp-c-bg); color: var(--vp-c-text-1); }
.draft-switch { display: flex; align-items: center; gap: .5rem; }
.school-entry { border-top: 1px solid var(--vp-c-divider); margin-top: 1.8rem; padding-top: .5rem; overflow-wrap: anywhere; }
.school-entry h2 { border: 0; padding-top: 0; margin-top: 1rem; }
.school-entry details { padding: .7rem 1rem; background: var(--vp-c-bg-soft); border-radius: 6px; }
.school-entry summary { cursor: pointer; }
.parameter-list { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); gap: .3rem 1rem; }
.parameter-list dt { color: var(--vp-c-text-2); }
.parameter-list dd { margin: 0; white-space: pre-wrap; }
.verification-records { border-left: 3px solid var(--vp-c-divider); padding-left: 1rem; }
</style>
