import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

function filesAt(root, extension) {
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') return []
    const path = join(root, entry.name)
    return entry.isDirectory() ? filesAt(path, extension) : path.endsWith(extension) ? [path] : []
  })
}

export function checkSourceLinks(docs, repository) {
  const errors = []
  const root = resolve(repository)
  for (const file of filesAt(docs, '.md')) {
    const source = readFileSync(file, 'utf8')
    const links = source.matchAll(/https:\/\/github\.com\/(?:matthewlu070111|guiguisocute)\/smart-srun\/(?:blob|tree)\/main\/[^\s)<>"#]+/g)
    for (const [link] of links) {
      const path = decodeURIComponent(new URL(link).pathname.split('/main/')[1])
      const target = resolve(root, path)
      if (relative(root, target).startsWith('..') || !existsSync(target)) {
        errors.push(`${relative(docs, file)}: missing source target ${path}`)
      }
    }
  }
  return [...new Set(errors)]
}

export function checkSiteLinks(dist) {
  const root = resolve(dist)
  const pages = filesAt(root, '.html')
  const ids = new Map(pages.map(file => [file, new Set(
    [...readFileSync(file, 'utf8').matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1])
  )]))
  const errors = []
  for (const file of pages) {
    const source = readFileSync(file, 'utf8')
    const base = new URL(relative(root, file).replaceAll('\\', '/'), 'https://local.invalid/')
    for (const [, raw] of source.matchAll(/\bhref=["']([^"']+)["']/g)) {
      const url = new URL(raw.replaceAll('&amp;', '&'), base)
      if (url.origin !== base.origin) continue
      let target = resolve(root, '.' + decodeURIComponent(url.pathname))
      if (relative(root, target).startsWith('..')) {
        errors.push(`${relative(root, file)}: link outside build ${raw}`)
        continue
      }
      if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html')
      if (!existsSync(target) && !extname(target)) target += '.html'
      if (!existsSync(target)) {
        errors.push(`${relative(root, file)}: missing page or asset ${raw}`)
      } else if (url.hash && ids.has(target) && !ids.get(target).has(decodeURIComponent(url.hash.slice(1)))) {
        errors.push(`${relative(root, file)}: missing anchor ${raw}`)
      }
    }
  }
  return [...new Set(errors)]
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../docs/.vitepress/dist')
  const errors = checkSiteLinks(dist)
  if (errors.length) {
    console.error(errors.join('\n'))
    process.exitCode = 1
  } else console.log('Built documentation links and anchors checked.')
}
