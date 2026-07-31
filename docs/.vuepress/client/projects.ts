/**
 * 首页视频展厅数据。
 * 把预览片放到 docs/.vuepress/public/video/，在此登记即可出现在墙上。
 */
export interface ProjectVideo {
  id: string
  title: string
  description: string
  /** public 下的路径，如 /video/xxx.mp4 */
  video: string
  poster?: string
  repo?: string
  article?: string
  /** 占两列，适合代表作 */
  featured?: boolean
  tags?: string[]
}

export const projectVideos: ProjectVideo[] = [
  {
    id: 'roadmate',
    title: 'RoadMate 路友',
    description: '陌生人轻社交概念产品：三阶段流水线从社媒帖子提取可开口的兴趣标签。',
    video: '/video/roadmate-show2_compressed.mp4',
    repo: 'https://github.com/1nFrastr/roadmate',
    article: '/article/8710aee9/',
    featured: true,
    tags: ['产品设计', 'AI'],
  },
  {
    id: 'claude-code-desktop',
    title: 'Claude Code Desktop',
    description: 'Claude Code CLI 的桌面 GUI 封装，把终端工作流变成可视化交互。',
    video: '/video/cc-desktop-show.mp4',
    repo: 'https://github.com/1nFrastr/claude-code-desktop',
    tags: ['Desktop', 'Claude'],
  },
  {
    id: 'baby-lovable-workflow',
    title: 'Baby Lovable · Durable Workflow',
    description: 'Serverless 上的持久 Agent Workflow：任务可观测、可恢复、可重试，刷新不断。',
    video: '/video/baby-lovable-durable-workflow-show.mp4',
    repo: 'https://github.com/1nFrastr/baby-lovable',
    tags: ['Baby Lovable', 'Workflow'],
  },
  {
    id: 'super-words',
    title: 'Super Words · AI 超级单词表',
    description: '沉浸式英语单词打字练习：本地词库 + AI 场景生成，把背单词做成闯关游戏。',
    video: '/video/super-words-show.mp4',
    repo: 'https://github.com/1nFrastr/super-words',
    tags: ['Next.js', 'AI'],
  },
  {
    id: 'baby-lovable-streaming',
    title: 'Baby Lovable · 可恢复流式',
    description: 'Serverless 多用户 Coding Agent：断线重连后继续接收流式输出，不必从头再来。',
    video: '/video/Cursor-2-resumable-streaming.mp4',
    repo: 'https://github.com/1nFrastr/baby-lovable',
    tags: ['Baby Lovable', 'Streaming'],
  },
  {
    id: 'baby-lovable-autotest',
    title: 'Baby Lovable · Autotest',
    description: 'Serverless 多用户 Coding Agent：用 Agent 驱动自动化测试，从意图到用例执行闭环。',
    video: '/video/Cursor-3-autotest-1.mp4',
    repo: 'https://github.com/1nFrastr/baby-lovable',
    tags: ['Baby Lovable', '测试'],
  },
]
