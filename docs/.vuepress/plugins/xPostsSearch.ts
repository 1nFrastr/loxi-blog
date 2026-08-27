import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vuepress/core'
import { path } from 'vuepress/utils'

interface XPost {
  id: string
  text?: string
  text_en?: string
}

interface XPostsData {
  posts?: XPost[]
}

type Locale = 'en' | 'zh'

const ROOT = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)))
const POSTS_JSON = path.resolve(ROOT, 'docs/.vuepress/client/x-posts.json')
const OUT_DIRS: Record<Locale, string> = {
  en: path.resolve(ROOT, 'docs/thoughts/x'),
  zh: path.resolve(ROOT, 'docs/zh/thoughts/x'),
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function postText(post: XPost, locale: Locale): string {
  if (locale === 'en')
    return (post.text_en || post.text || '').trim()
  return (post.text || '').trim()
}

/** First line of body — used as the search result title */
function postHeading(post: XPost, locale: Locale): string {
  const fallback = locale === 'en'
    ? `Thought ${post.id.slice(-6)}`
    : `想法 ${post.id.slice(-6)}`
  const firstLine = postText(post, locale)
    .split('\n')
    .map(l => l.trim())
    // skip pure separator lines so we don't create empty anchors that clash with permalinks
    .find(l => l && !/^[\s\-_=*.~]+$/.test(l)) || fallback
  return firstLine.length > 48 ? `${firstLine.slice(0, 48)}…` : firstLine
}

function loadPosts(): XPost[] {
  try {
    const data = JSON.parse(readFileSync(POSTS_JSON, 'utf8')) as XPostsData
    return (data.posts || []).filter(p => p.id && (p.text || p.text_en || '').trim())
  }
  catch (err) {
    console.warn('[x-posts-search] failed to load x-posts.json:', err)
    return []
  }
}

function buildMarkdown(post: XPost, locale: Locale): string {
  const text = postText(post, locale)
  const heading = postHeading(post, locale)
  const description = text.replace(/\s+/g, ' ').slice(0, 120)
  const body = escapeHtml(text).replace(/\n/g, '<br>\n')
  const title = locale === 'en' ? 'Thoughts' : '小想法'
  const permalink = locale === 'en'
    ? `/thoughts/x/${post.id}/`
    : `/zh/thoughts/x/${post.id}/`

  // title → search breadcrumb parent; ## heading → search primary title
  // index body is single-line HTML so markdown does not parse --- as a setext heading
  return [
    '---',
    `title: ${title}`,
    `description: ${JSON.stringify(description)}`,
    `permalink: ${permalink}`,
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
    '<!-- hidden body for Ctrl+K local search indexing only -->',
    `<div class="x-post-search-index" hidden aria-hidden="true">${body}</div>`,
    '',
  ].join('\n')
}

/**
 * Materialize each tweet as a real markdown page for routing + local search.
 * Sync write on config load so pages exist before VuePress scans.
 */
function syncPostPages(): void {
  const posts = loadPosts()

  for (const locale of ['en', 'zh'] as Locale[]) {
    const outDir = OUT_DIRS[locale]
    mkdirSync(outDir, { recursive: true })

    const keep = new Set(posts.map(p => `${p.id}.md`))
    for (const name of readdirSync(outDir)) {
      if (!name.endsWith('.md')) continue
      if (!keep.has(name)) unlinkSync(path.join(outDir, name))
    }

    for (const post of posts) {
      const file = path.join(outDir, `${post.id}.md`)
      const next = buildMarkdown(post, locale)
      if (existsSync(file) && readFileSync(file, 'utf8') === next) continue
      writeFileSync(file, next, 'utf8')
    }
  }
}

/**
 * Thoughts ↔ theme Ctrl+K: hits open standalone card pages at
 * `/thoughts/x/{id}/` (EN) and `/zh/thoughts/x/{id}/` (ZH).
 */
export function xPostsSearchPlugin(): Plugin {
  syncPostPages()

  return {
    name: 'x-posts-search',
  }
}
