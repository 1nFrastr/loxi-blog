import { defineNavbarConfig } from 'vuepress-theme-plume'

export const navbarEn = defineNavbarConfig([
  { text: 'Home', link: '/' },
  { text: 'Thoughts', link: '/thoughts/' },
  { text: 'Blog', link: '/blog/' },
  { text: 'Categories', link: '/blog/categories/' },
  { text: 'Archives', link: '/blog/archives/' },
  { text: 'About', link: '/article/9zuwfov4/' },
])

export const navbarZh = defineNavbarConfig([
  { text: '首页', link: '/zh/' },
  { text: '想法', link: '/zh/thoughts/' },
  { text: '博客', link: '/zh/blog/' },
  { text: '分类', link: '/zh/blog/categories/' },
  { text: '归档', link: '/zh/blog/archives/' },
  { text: '关于', link: '/zh/article/9zuwfov4/' },
])

/** @deprecated use navbarEn / navbarZh via theme locales */
export const navbar = navbarEn
