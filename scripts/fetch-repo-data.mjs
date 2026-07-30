#!/usr/bin/env node
/**
 * 构建前扫描 docs 中的 <RepoCard />，从 GitHub API 拉取元数据并写成静态 JSON。
 * 前端只读本地数据，不再依赖运行时第三方代理。
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DOCS_DIR = path.join(ROOT, 'docs')
const OUT_FILE = path.join(ROOT, 'docs/.vuepress/client/repo-data.json')
const LANGUAGE_COLORS_URL =
  'https://raw.githubusercontent.com/ozh/github-colors/master/colors.json'

const REPO_CARD_RE =
  /<RepoCard\b([^>]*)\/?>/g
const REPO_ATTR_RE = /\brepo=["']([^"']+)["']/
const PROVIDER_ATTR_RE = /\bprovider=["']([^"']+)["']/

function convertThousand(num) {
  if (num < 1000) return num
  return `${(num / 1000).toFixed(1)}k`
}

async function walkMarkdown(dir, files = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await walkMarkdown(full, files)
    } else if (/\.mdx?$/.test(entry.name)) {
      files.push(full)
    }
  }
  return files
}

async function collectRepos() {
  const files = await walkMarkdown(DOCS_DIR)
  const repos = new Map()

  for (const file of files) {
    const text = await fs.readFile(file, 'utf8')
    for (const match of text.matchAll(REPO_CARD_RE)) {
      const attrs = match[1] || ''
      const repo = attrs.match(REPO_ATTR_RE)?.[1]
      if (!repo) continue
      const provider = attrs.match(PROVIDER_ATTR_RE)?.[1] || 'github'
      if (provider !== 'github') {
        console.warn(`[fetch-repo-data] skip unsupported provider "${provider}" for ${repo}`)
        continue
      }
      repos.set(repo, provider)
    }
  }

  return [...repos.keys()].sort()
}

async function fetchLanguageColors() {
  try {
    const res = await fetch(LANGUAGE_COLORS_URL)
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    const data = await res.json()
    const colors = {}
    for (const [lang, meta] of Object.entries(data)) {
      if (meta?.color) colors[lang] = meta.color
    }
    return colors
  } catch (err) {
    console.warn('[fetch-repo-data] language colors fallback:', err.message)
    return {
      TypeScript: '#3178c6',
      JavaScript: '#f1e05a',
      Vue: '#41b883',
      PHP: '#4F5D95',
      Python: '#3572A5',
      Go: '#00ADD8',
      Rust: '#dea584',
      CSS: '#563d7c',
      HTML: '#e34c26',
      Shell: '#89e051',
    }
  }
}

async function fetchRepo(fullName, languageColors, token) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'loxi-blog-fetch-repo-data',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`https://api.github.com/repos/${fullName}`, { headers })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`GitHub ${res.status} for ${fullName}: ${body.slice(0, 200)}`)
  }

  const data = await res.json()
  const stars = data.stargazers_count ?? 0
  const forks = data.forks_count ?? 0
  const language = data.language || ''

  return {
    name: data.name,
    fullName: data.full_name,
    description: data.description || '',
    url: data.html_url,
    stars,
    forks,
    convertStars: convertThousand(stars),
    convertForks: convertThousand(forks),
    watchers: data.watchers_count ?? 0,
    language,
    languageColor: (language && languageColors[language]) || '#8b949e',
    archived: Boolean(data.archived),
    visibility: data.private ? 'Private' : 'Public',
    template: Boolean(data.is_template),
    ownerType: data.owner?.type === 'Organization' ? 'Organization' : 'User',
    license: data.license
      ? {
          name: data.license.spdx_id || data.license.name || 'License',
          url: data.license.html_url || data.license.url || '',
        }
      : null,
  }
}

async function loadExisting() {
  try {
    const raw = await fs.readFile(OUT_FILE, 'utf8')
    return JSON.parse(raw)
  } catch {
    return { updatedAt: null, repos: {} }
  }
}

async function main() {
  const repos = await collectRepos()
  if (!repos.length) {
    console.log('[fetch-repo-data] no RepoCard found')
    return
  }

  console.log(`[fetch-repo-data] found ${repos.length} repos`)
  const languageColors = await fetchLanguageColors()
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || ''
  const existing = await loadExisting()
  const next = { ...existing.repos }

  let failed = 0
  for (const fullName of repos) {
    try {
      next[fullName] = await fetchRepo(fullName, languageColors, token)
      console.log(`  ✓ ${fullName}`)
    } catch (err) {
      failed += 1
      if (next[fullName]?.name) {
        console.warn(`  ⚠ ${fullName} keep cached: ${err.message}`)
      } else {
        console.error(`  ✗ ${fullName}: ${err.message}`)
      }
    }
  }

  // Drop entries no longer referenced
  for (const key of Object.keys(next)) {
    if (!repos.includes(key)) delete next[key]
  }

  const missing = repos.filter((r) => !next[r]?.name)
  if (missing.length) {
    console.error(`[fetch-repo-data] missing data for: ${missing.join(', ')}`)
    if (!Object.keys(existing.repos || {}).length) {
      process.exitCode = 1
      return
    }
  }

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true })
  const payload = {
    updatedAt: new Date().toISOString(),
    repos: next,
  }
  await fs.writeFile(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  console.log(`[fetch-repo-data] wrote ${OUT_FILE}${failed ? ` (${failed} fetch failures, used cache where possible)` : ''}`)
}

main().catch((err) => {
  console.error('[fetch-repo-data] fatal:', err)
  process.exit(1)
})
