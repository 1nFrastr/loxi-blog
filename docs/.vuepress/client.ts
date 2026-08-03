// @ts-ignore
import { defineClientConfig } from 'vuepress/client'
import RepoCard from './theme/components/RepoCard.vue'
import VideoWall from './theme/components/VideoWall.vue'
import XPostWall from './theme/components/XPostWall.vue'

export default defineClientConfig({
  enhance({ app }) {
    // 使用构建时静态数据的 RepoCard，避免依赖运行时第三方 GitHub 代理
    app.component('RepoCard', RepoCard)
    app.component('VideoWall', VideoWall)
    app.component('XPostWall', XPostWall)
  },
})
