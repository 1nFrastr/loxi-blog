import { defineThemeConfig } from 'vuepress-theme-plume'
import { navbar } from './navbar'
import { notes } from './notes'

/**
 * @see https://theme-plume.vuejs.press/config/basic/
 */
export default defineThemeConfig({
  logo: '/logo.jpg',
  // your git repo url
  docsRepo: '',
  docsDir: 'docs',

  appearance: true,

  profile: {
    avatar: '/logo.jpg',
    name: '阿凯呵',
    description: '',
    circle: true,
    // location: '',
    // organization: '',
  },

  navbar,
  notes,

  // 博客集合：生成 /blog/、/blog/categories/、/blog/archives/、/blog/tags/
  collections: [
    {
      type: 'post',
      dir: 'blog',
      title: '博客',
      postList: true,
      link: '/blog/',
      categories: true,
      categoriesLink: '/blog/categories/',
      categoriesText: '分类',
      archives: true,
      archivesLink: '/blog/archives/',
      archivesText: '归档',
      tags: true,
      tagsLink: '/blog/tags/',
      tagsText: '标签',
    },
  ],

  social: [
    { icon: 'github', link: 'https://github.com/1nFrastr' },
    { icon: 'bilibili', link: 'https://space.bilibili.com/36022612' },
  ],
  navbarSocialInclude: ['github', 'bilibili'],
  footer: {
    message: 'Power by <a target="_blank" href="https://theme-plume.vuejs.press">vuepress-theme-plume</a>',
    copyright: '© 2024-present 1nFrastr <a target="_blank" href="http://beian.miit.gov.cn/">粤ICP备2021066979号</a>',
  }
})
