<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'

export interface XPostMedia {
  type: string
  url: string
  width?: number
  height?: number
  poster?: string
  video_url?: string
}

export interface XPost {
  id: string
  url: string
  created_at: string
  text: string
  urls?: string[]
  media?: XPostMedia[]
  thread_count?: number
}

/** 默认正文最大高度（约 10 行） */
const BODY_MAX_HEIGHT = 260

const props = defineProps<{
  post: XPost
  /** 独立详情页：不截断正文 */
  full?: boolean
}>()

const bodyEl = ref<HTMLElement | null>(null)
const expanded = ref(!!props.full)
const needsClamp = ref(false)
/** 图片/视频加载失败的格子索引（国内访问外网 CDN 时常现） */
const failedMedia = ref<Record<number, true>>({})

function onMediaError(i: number) {
  if (failedMedia.value[i]) return
  failedMedia.value = { ...failedMedia.value, [i]: true }
}

const dateLabel = computed(() => {
  const d = new Date(props.post.created_at)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
})

const mediaList = computed(() => props.post.media || [])
const hasMedia = computed(() => mediaList.value.length > 0)
const mediaCount = computed(() => Math.min(mediaList.value.length, 4))

/** 把 URL 变成可点链接，其余按段落保留 */
const textHtml = computed(() => {
  const escaped = (props.post.text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  const linked = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="x-post-link">$1</a>',
  )
  return linked.replace(/\n/g, '<br>')
})

function mediaStyle(m: XPostMedia) {
  if (m.width && m.height) {
    return { aspectRatio: `${m.width} / ${m.height}` }
  }
  return { aspectRatio: '16 / 10' }
}

function measureClamp() {
  if (props.full) {
    needsClamp.value = false
    return
  }
  const el = bodyEl.value
  if (!el) return
  // overflow:hidden + max-height 时 scrollHeight 仍是全文高度，无需临时撑开
  needsClamp.value = el.scrollHeight > BODY_MAX_HEIGHT + 8
}

function toggleExpand() {
  expanded.value = !expanded.value
}

onMounted(async () => {
  await nextTick()
  measureClamp()
})

watch(
  () => props.post.text,
  async () => {
    expanded.value = false
    await nextTick()
    measureClamp()
  },
)
</script>

<template>
  <article class="x-post-card">
    <div v-if="hasMedia" class="x-post-media" :data-count="mediaCount">
      <template v-for="(m, i) in mediaList.slice(0, 4)" :key="`${post.id}-${i}`">
        <div class="x-post-media-cell" :style="mediaStyle(m)">
          <div
            v-if="failedMedia[i]"
            class="x-post-media-fallback"
            role="img"
            aria-label="国内网络无法访问，请检查代理"
          >
            <span class="x-post-media-fallback-text">
              国内网络无法访问<br>请检查代理
            </span>
          </div>
          <!-- 有可播放地址：页内 video；纯图：交给主题 PhotoSwipe（勿包在 a 里） -->
          <video
            v-else-if="m.video_url"
            class="x-post-video"
            :src="m.video_url"
            :poster="m.poster || m.url"
            controls
            playsinline
            preload="metadata"
            referrerpolicy="no-referrer"
            @error="onMediaError(i)"
          />
          <template v-else>
            <img
              class="x-post-photo"
              :src="m.url"
              alt="想法配图"
              loading="lazy"
              decoding="async"
              referrerpolicy="no-referrer"
              @error="onMediaError(i)"
            >
            <span v-if="m.type === 'video'" class="x-post-play" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </template>
        </div>
      </template>
      <span v-if="mediaList.length > 4" class="x-post-more-media">+{{ mediaList.length - 4 }}</span>
    </div>

    <header class="x-post-meta">
      <time class="x-post-date" :datetime="post.created_at">{{ dateLabel }}</time>
      <span v-if="(post.thread_count || 1) > 1" class="x-post-thread">
        Thread · {{ post.thread_count }}
      </span>
      <a
        class="x-post-origin vp-external-link-icon"
        :href="post.url"
        target="_blank"
        rel="noopener noreferrer"
      >
        查看原帖
      </a>
    </header>

    <div
      ref="bodyEl"
      class="x-post-body"
      :class="{ 'is-clamped': needsClamp && !expanded }"
      :style="needsClamp && !expanded ? { maxHeight: `${BODY_MAX_HEIGHT}px` } : undefined"
      v-html="textHtml"
    />

    <button
      v-if="needsClamp"
      type="button"
      class="x-post-expand"
      @click="toggleExpand"
    >
      {{ expanded ? '收起' : '展开全文' }}
    </button>
  </article>
</template>

<style scoped>
.x-post-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--vp-c-bg-alt) 65%, transparent), var(--vp-c-bg)),
    var(--vp-c-bg);
  border: 1px solid color-mix(in srgb, var(--vp-c-divider) 85%, transparent);
  border-radius: 14px;
  box-shadow: 0 1px 0 color-mix(in srgb, var(--vp-c-text-1) 4%, transparent);
  transition:
    border-color 0.22s ease,
    box-shadow 0.22s ease,
    transform 0.22s ease;
}

.x-post-card:hover {
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 35%, var(--vp-c-divider));
  box-shadow:
    0 10px 28px -18px color-mix(in srgb, var(--vp-c-text-1) 35%, transparent),
    0 1px 0 color-mix(in srgb, var(--vp-c-text-1) 4%, transparent);
  transform: translateY(-2px);
}

.x-post-media {
  position: relative;
  display: grid;
  gap: 2px;
  background: color-mix(in srgb, var(--vp-c-bg-alt) 80%, #000 8%);
}

.x-post-media[data-count='1'] {
  grid-template-columns: 1fr;
}

.x-post-media[data-count='2'] {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.x-post-media[data-count='3'],
.x-post-media[data-count='4'] {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.x-post-media-cell {
  position: relative;
  min-height: 120px;
  max-height: 320px;
  overflow: hidden;
  background: color-mix(in srgb, var(--vp-c-bg-alt) 70%, #111 10%);
}

.x-post-media[data-count='1'] .x-post-media-cell {
  max-height: 360px;
}

.x-post-video,
.x-post-photo {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.x-post-photo {
  cursor: zoom-in;
}

.x-post-media-fallback {
  display: grid;
  place-content: start;
  justify-items: start;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-height: 120px;
  padding: 12px 14px;
  text-align: left;
  background:
    radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, var(--vp-c-brand-1) 8%, transparent), transparent 55%),
    linear-gradient(
      165deg,
      color-mix(in srgb, var(--vp-c-bg-alt) 88%, transparent),
      color-mix(in srgb, var(--vp-c-bg-alt) 55%, #888 12%)
    );
}

.x-post-media-fallback-text {
  font-size: 11px;
  font-weight: 400;
  line-height: 1.55;
  color: color-mix(in srgb, var(--vp-c-text-3) 55%, transparent);
}

.x-post-play {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #fff;
  pointer-events: none;
  background: radial-gradient(circle at center, rgb(0 0 0 / 35%), transparent 55%);
}

.x-post-play svg {
  padding: 10px 10px 10px 12px;
  background: rgb(0 0 0 / 45%);
  border-radius: 999px;
  backdrop-filter: blur(4px);
}

.x-post-more-media {
  position: absolute;
  right: 10px;
  bottom: 10px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: rgb(0 0 0 / 55%);
  border-radius: 999px;
}

.x-post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  padding: 14px 16px 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--vp-c-text-2);
}

.x-post-thread {
  padding: 2px 7px;
  font-size: 11px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  background: color-mix(in srgb, var(--vp-c-bg-alt) 90%, var(--vp-c-divider));
  border-radius: 999px;
}

.x-post-body {
  position: relative;
  padding: 10px 16px 14px;
  font-size: 14.5px;
  line-height: 1.7;
  color: var(--vp-c-text-1);
  word-break: break-word;
  overflow-wrap: anywhere;
}

.x-post-body.is-clamped {
  overflow: hidden;
  padding-bottom: 8px;
  mask-image: linear-gradient(180deg, #000 62%, transparent 100%);
}

.x-post-card:has(.x-post-expand) .x-post-body {
  padding-bottom: 4px;
}

.x-post-body :deep(.x-post-link) {
  color: var(--vp-c-brand-1);
  text-decoration: none;
  word-break: break-all;
}

.x-post-body :deep(.x-post-link:hover) {
  text-decoration: underline;
}

.x-post-expand {
  align-self: flex-start;
  margin: 0 16px 14px;
  padding: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  cursor: pointer;
  background: none;
  border: 0;
}

.x-post-expand:hover {
  text-decoration: underline;
}

.x-post-origin {
  display: inline-flex;
  align-items: center;
  margin-left: auto;
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-3);
  text-decoration: none;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition:
    color 0.18s ease,
    opacity 0.18s ease;
}

.x-post-card:hover .x-post-origin,
.x-post-card:focus-within .x-post-origin {
  opacity: 1;
  pointer-events: auto;
}

.x-post-origin:hover,
.x-post-origin:hover::after {
  color: var(--vp-c-brand-1);
}

@media (hover: none) {
  .x-post-origin {
    opacity: 1;
    pointer-events: auto;
  }
}
</style>
