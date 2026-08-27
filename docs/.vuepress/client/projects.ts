/**
 * Homepage / about video wall data.
 * Put preview clips under docs/.vuepress/public/video/, then register them here.
 *
 * English fields are the default; *Zh fields keep the Chinese copy for locale switching.
 */
export interface ProjectVideo {
  id: string
  /** English title (default locale) */
  title: string
  titleZh?: string
  /** English description (default locale) */
  description: string
  descriptionZh?: string
  /** public path, e.g. /video/xxx.mp4 */
  video: string
  poster?: string
  repo?: string
  /** Locale-aware article path; keep as /article/... */
  article?: string
  /** Spans two columns — for featured work */
  featured?: boolean
  /** English tags (default locale) */
  tags?: string[]
  tagsZh?: string[]
}

export const projectVideos: ProjectVideo[] = [
  {
    id: 'roadmate',
    title: 'RoadMate',
    titleZh: 'RoadMate 路友',
    description:
      'A lightweight stranger-social concept: a three-stage pipeline that turns social posts into conversation-ready interest tags.',
    descriptionZh: '陌生人轻社交概念产品：三阶段流水线从社媒帖子提取可开口的兴趣标签。',
    video: '/video/roadmate-show2_compressed.mp4',
    repo: 'https://github.com/1nFrastr/roadmate',
    article: '/article/8710aee9/',
    featured: true,
    tags: ['Product Design', 'AI'],
    tagsZh: ['产品设计', 'AI'],
  },
  {
    id: 'claude-code-desktop',
    title: 'Claude Code Desktop',
    titleZh: 'Claude Code Desktop',
    description:
      'A desktop GUI wrapper around the Claude Code CLI — turn terminal workflows into visual interaction.',
    descriptionZh: 'Claude Code CLI 的桌面 GUI 封装，把终端工作流变成可视化交互。',
    video: '/video/cc-desktop-show.mp4',
    repo: 'https://github.com/1nFrastr/claude-code-desktop',
    tags: ['Desktop', 'Claude'],
    tagsZh: ['Desktop', 'Claude'],
  },
  {
    id: 'baby-lovable-workflow',
    title: 'Baby Lovable · Durable Workflow',
    titleZh: 'Baby Lovable · Durable Workflow',
    description:
      'Durable Agent workflows on serverless: observable, resumable, and retryable — refresh without losing progress.',
    descriptionZh: 'Serverless 上的持久 Agent Workflow：任务可观测、可恢复、可重试，刷新不断。',
    video: '/video/baby-lovable-durable-workflow-show.mp4',
    repo: 'https://github.com/1nFrastr/baby-lovable',
    tags: ['Baby Lovable', 'Workflow'],
    tagsZh: ['Baby Lovable', 'Workflow'],
  },
  {
    id: 'super-words',
    title: 'Super Words · AI Vocab Trainer',
    titleZh: 'Super Words · AI 超级单词表',
    description:
      'Immersive English vocab typing practice: local word banks plus AI scene generation — turn memorizing words into a level-up game.',
    descriptionZh: '沉浸式英语单词打字练习：本地词库 + AI 场景生成，把背单词做成闯关游戏。',
    video: '/video/super-words-show.mp4',
    repo: 'https://github.com/1nFrastr/super-words',
    tags: ['Next.js', 'AI'],
    tagsZh: ['Next.js', 'AI'],
  },
  {
    id: 'baby-lovable-streaming',
    title: 'Baby Lovable · Resumable Streaming',
    titleZh: 'Baby Lovable · 可恢复流式',
    description:
      'Multi-user coding agent on serverless: reconnect after a drop and keep receiving the stream — no restart from scratch.',
    descriptionZh: 'Serverless 多用户 Coding Agent：断线重连后继续接收流式输出，不必从头再来。',
    video: '/video/Cursor-2-resumable-streaming.mp4',
    repo: 'https://github.com/1nFrastr/baby-lovable',
    tags: ['Baby Lovable', 'Streaming'],
    tagsZh: ['Baby Lovable', 'Streaming'],
  },
  {
    id: 'baby-lovable-autotest',
    title: 'Baby Lovable · Autotest',
    titleZh: 'Baby Lovable · Autotest',
    description:
      'Multi-user coding agent on serverless: agent-driven automated testing — from intent to executed test cases in one loop.',
    descriptionZh: 'Serverless 多用户 Coding Agent：用 Agent 驱动自动化测试，从意图到用例执行闭环。',
    video: '/video/Cursor-3-autotest-1.mp4',
    repo: 'https://github.com/1nFrastr/baby-lovable',
    tags: ['Baby Lovable', 'Testing'],
    tagsZh: ['Baby Lovable', '测试'],
  },
]
