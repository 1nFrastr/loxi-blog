import { viteBundler } from '@vuepress/bundler-vite'
import { defineUserConfig } from 'vuepress'
import { plumeTheme } from 'vuepress-theme-plume'
import { baiduAnalyticsPlugin } from '@vuepress/plugin-baidu-analytics'
import { getDirname, path } from 'vuepress/utils'

const __dirname = getDirname(import.meta.url)

export default defineUserConfig({
  base: '/',
  lang: 'zh-CN',
  title: '阿凯 Freddy',
  description: '阿凯 Freddy 的技术博客：全栈开发、工程化与产品设计实践',
  dest: 'dist',

  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/favicon.png' }],
    ['link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }],
  ],

  bundler: viteBundler(),

  // 想法墙 / 视频墙 / RepoCard 由首页 idle prefetch 按需预热，避免每个 HTML 都盲拉
  shouldPrefetch: (file) =>
    !/XPostWall|VideoWall|RepoCard/.test(file),

  alias: {
    '@theme/Posts/VPPostsAside.vue': path.resolve(__dirname, './theme/components/VPPostsAside.vue'),
  },

  plugins: [
    baiduAnalyticsPlugin({
      id: '19bfdea461908cd747594faa21540509'
    }),
  ],

  theme: plumeTheme({
    hostname: 'https://freddyx.pages.dev',

    markdown: {
      pdf: true,
    },

    // @see https://theme-plume.vuejs.press/guide/features/changelog/
    changelog: {
      maxCount: 10,
      repoUrl: 'https://github.com/1nFrastr/loxi-blog',
    },

    llmstxt: true,

    plugins: {
      shiki: {
        languages: ['shell', 'bash', 'typescript', 'javascript', 'php', 'vue'],
      },
    },
  }),
})
