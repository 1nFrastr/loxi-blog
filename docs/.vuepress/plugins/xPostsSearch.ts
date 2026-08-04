import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vuepress/core'
import { path } from 'vuepress/utils'

interface XPost {
  id: string
  text?: string
}

interface XPostsData {
  posts?: XPost[]
}

const ROOT = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)))
const POSTS_JSON = path.resolve(ROOT, 'docs/.vuepress/client/x-posts.json')
const OUT_DIR = path.resolve(ROOT, 'docs/thoughts/x')

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** 正文首行，供搜索结果标题使用 */
function postHeading(post: XPost): string {
  const firstLine = (post.text || '')
    .split('\n')
    .map(l => l.trim())
    // 跳过纯符号分隔行，避免空锚点与页面 permalink 冲突
    .find(l => l && !/^[\s\-_=*.~]+$/.test(l)) || `想法 ${post.id.slice(-6)}`
  return firstLine.length > 48 ? `${firstLine.slice(0, 48)}…` : firstLine
}

function loadPosts(): XPost[] {
  try {
    const data = JSON.parse(readFileSync(POSTS_JSON, 'utf8')) as XPostsData
    return (data.posts || []).filter(p => p.id && (p.text || '').trim())
  }
  catch (err) {
    console.warn('[x-posts-search] failed to load x-posts.json:', err)
    return []
  }
}

function buildMarkdown(post: XPost): string {
  const heading = postHeading(post)
  const description = (post.text || '').replace(/\s+/g, ' ').slice(0, 120)
  const body = escapeHtml((post.text || '').trim()).replace(/\n/g, '<br>\n')

  // title=小想法 → 搜索面包屑父级；## heading → 搜索主标题 → 「小想法 > xxx」
  // 索引正文用单行 HTML，避免 markdown 把 --- 解析成 setext 标题
  return [
    '---',
    'title: 小想法',
    `description: ${JSON.stringify(description)}`,
    `permalink: /thoughts/x/${post.id}/`,
    'pageLayout: page',
    'readingTime: false',
    'createTime: false',
    'comment: false',
    `xPostId: ${JSON.stringify(post.id)}`,
    '---',
    '',
    `## ${heading.replace(/#/g, '')}`,
    '',
    '<XPostSolo />',
    '',
    '<!-- 以下隐藏正文仅供 Ctrl+K 本地搜索建索引 -->',
    `<div class="x-post-search-index" hidden aria-hidden="true">${body}</div>`,
    '',
  ].join('\n')
}

/**
 * 把每条推文落成真实 markdown 页，供路由与本地搜索使用。
 * 在配置加载时同步写入，确保早于 VuePress 扫描 pages。
 */
function syncPostPages(): void {
  const posts = loadPosts()
  mkdirSync(OUT_DIR, { recursive: true })

  const keep = new Set(posts.map(p => `${p.id}.md`))
  for (const name of readdirSync(OUT_DIR)) {
    if (!name.endsWith('.md')) continue
    if (!keep.has(name)) unlinkSync(path.join(OUT_DIR, name))
  }

  for (const post of posts) {
    const file = path.join(OUT_DIR, `${post.id}.md`)
    const next = buildMarkdown(post)
    if (existsSync(file) && readFileSync(file, 'utf8') === next) continue
    writeFileSync(file, next, 'utf8')
  }
}

/**
 * 小想法接入主题 Ctrl+K：搜索命中后进入独立卡片页 `/thoughts/x/{id}/`。
 */
export function xPostsSearchPlugin(): Plugin {
  syncPostPages()

  return {
    name: 'x-posts-search',
  }
}
