import { defineThemeConfig } from 'vuepress-theme-plume'
import { navbarEn, navbarZh } from './navbar'

/**
 * @see https://theme-plume.vuejs.press/config/basic/
 */
export default defineThemeConfig({
  logo: '/logo.jpg',
  docsRepo: 'https://github.com/1nFrastr/loxi-blog',
  docsDir: 'docs',

  appearance: true,

  profile: {
    avatar: '/logo.jpg',
    name: 'Freddy',
    circle: true,
  },

  social: [
    { icon: 'github', link: 'https://github.com/1nFrastr' },
    { icon: 'x', link: 'https://x.com/therealfreddyx' },
    {
      icon: {
        name: 'cursor',
        svg: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Cursor</title><path fill="currentColor" d="M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23"/></svg>',
      },
      link: 'https://cursor.com/@freddyzhou',
    },
  ],
  navbarSocialInclude: ['github', 'x', 'cursor'],
  footer: {
    message: 'Powered by <a target="_blank" href="https://theme-plume.vuejs.press">vuepress-theme-plume</a>',
    copyright: '© 2024-present 1nFrastr',
  },

  locales: {
    '/': {
      selectLanguageName: 'English',
      selectLanguageText: 'Languages',
      navbar: navbarEn,
      profile: {
        avatar: '/logo.jpg',
        name: 'Freddy',
        circle: true,
      },
      collections: [
        {
          type: 'post',
          dir: 'blog',
          title: 'Blog',
          postList: true,
          link: '/blog/',
          categories: true,
          categoriesLink: '/blog/categories/',
          categoriesText: 'Categories',
          archives: true,
          archivesLink: '/blog/archives/',
          archivesText: 'Archives',
          tags: true,
          tagsLink: '/blog/tags/',
          tagsText: 'Tags',
        },
      ],
    },
    '/zh/': {
      selectLanguageName: '简体中文',
      selectLanguageText: '选择语言',
      navbar: navbarZh,
      profile: {
        avatar: '/logo.jpg',
        name: '阿凯 Freddy',
        circle: true,
      },
      collections: [
        {
          type: 'post',
          dir: 'blog',
          title: '博客',
          postList: true,
          link: '/zh/blog/',
          categories: true,
          categoriesLink: '/zh/blog/categories/',
          categoriesText: '分类',
          archives: true,
          archivesLink: '/zh/blog/archives/',
          archivesText: '归档',
          tags: true,
          tagsLink: '/zh/blog/tags/',
          tagsText: '标签',
        },
      ],
    },
  },
})
