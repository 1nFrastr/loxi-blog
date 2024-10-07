// @ts-ignore
import { defineClientConfig } from 'vuepress/client'
// @ts-ignore
import RepoCard from 'vuepress-theme-plume/features/RepoCard.vue'

export default defineClientConfig({
  enhance({ app }) {
    app.component('RepoCard', RepoCard)
  },
})
