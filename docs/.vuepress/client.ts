import { defineAsyncComponent, onMounted, watch } from 'vue'
// @ts-ignore
import { defineClientConfig, resolveRoute, useRoutePath } from 'vuepress/client'

// English reading stack: Source Sans 3 (UI) + Source Serif 4 (article body)
import '@fontsource/source-sans-3/latin-400.css'
import '@fontsource/source-sans-3/latin-500.css'
import '@fontsource/source-sans-3/latin-600.css'
import '@fontsource/source-sans-3/latin-700.css'
import '@fontsource/source-serif-4/latin-400.css'
import '@fontsource/source-serif-4/latin-400-italic.css'
import '@fontsource/source-serif-4/latin-600.css'
import '@fontsource/source-serif-4/latin-700.css'

import './theme/styles/custom.css'

/** 首页最可能点击的路径：想法 / 博客 / 关于（含中英 locale） */
const PREFETCH_PATHS = [
  '/thoughts/',
  '/blog/',
  '/article/9zuwfov4/',
  '/zh/thoughts/',
  '/zh/blog/',
  '/zh/article/9zuwfov4/',
] as const
const X_POST_DETAIL_RE = /^\/(?:zh\/)?thoughts\/x\/[^/]+\/?$/

function syncXPostDetailRouteClass(path: string): void {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('x-post-detail-route', X_POST_DETAIL_RE.test(path))
}

function prefetchXPostChunks(): void {
  void import('./theme/components/XPostSolo.vue')
  void import('./theme/components/XPostWall.vue')
}

function runWhenIdle(task: () => void): void {
  if (typeof window === 'undefined') return
  const ric = window.requestIdleCallback
  if (typeof ric === 'function') {
    ric(() => task(), { timeout: 2500 })
  }
  else {
    window.setTimeout(task, 1200)
  }
}

export default defineClientConfig({
  enhance({ app }) {
    // 异步拆包：避免 x-posts / 视频墙 / repo 数据打进全站 app.js
    app.component(
      'RepoCard',
      defineAsyncComponent(() => import('./theme/components/RepoCard.vue')),
    )
    app.component(
      'VideoWall',
      defineAsyncComponent(() => import('./theme/components/VideoWall.vue')),
    )
    app.component(
      'XPostWall',
      defineAsyncComponent(() => import('./theme/components/XPostWall.vue')),
    )
    app.component(
      'XPostSolo',
      defineAsyncComponent(() => import('./theme/components/XPostSolo.vue')),
    )
  },

  setup() {
    const routePath = useRoutePath()

    watch(routePath, (path) => {
      syncXPostDetailRouteClass(path)
    }, { immediate: true })

    onMounted(() => {
      // 仅首屏落在首页（EN/ZH）时静默预取；SPA 内后续导航不再重复
      if (routePath.value !== '/' && routePath.value !== '/zh/') return

      // Ctrl+K 搜索常直达想法详情，勿等 idle 再拉 chunk
      prefetchXPostChunks()

      const onSearchHotkey = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') prefetchXPostChunks()
      }
      window.addEventListener('keydown', onSearchHotkey, { passive: true })

      runWhenIdle(() => {
        for (const path of PREFETCH_PATHS) {
          const route = resolveRoute(path)
          if (!route.notFound) void route.loader()
        }
        void import('./theme/components/VideoWall.vue')
      })
    })
  },
})
