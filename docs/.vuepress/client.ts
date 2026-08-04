import { defineAsyncComponent, onMounted } from 'vue'
// @ts-ignore
import { defineClientConfig, resolveRoute, useRoutePath } from 'vuepress/client'

/** 首页最可能点击的路径：想法 / 博客 / 关于 */
const PREFETCH_PATHS = ['/thoughts/', '/blog/', '/article/9zuwfov4/'] as const

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

    onMounted(() => {
      // 仅首屏落在首页时静默预取；SPA 内后续导航不再重复
      if (routePath.value !== '/') return

      runWhenIdle(() => {
        for (const path of PREFETCH_PATHS) {
          const route = resolveRoute(path)
          if (!route.notFound) void route.loader()
        }
        // 想法页 chunk 很小，重数据在 XPostWall；关于页依赖 VideoWall
        void import('./theme/components/XPostWall.vue')
        void import('./theme/components/VideoWall.vue')
      })
    })
  },
})
