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
    // circle: true,
    // location: '',
    // organization: '',
  },

  navbar,
  notes,
  social: [
    { icon: 'github', link: 'https://github.com/1nFrastr' },
    { icon: 'bilibili', link: 'https://space.bilibili.com/36022612' },
  ],
  navbarSocialInclude: ['github', 'bilibili'],
})
