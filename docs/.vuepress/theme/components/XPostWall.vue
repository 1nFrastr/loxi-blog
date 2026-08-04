<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vuepress/client'
import data from '../../client/x-posts.json'
import XPostCard, { type XPost } from './XPostCard.vue'
import XPostShowcase from './XPostShowcase.vue'

const LUCKY_FLAG = 'x-post-open-lucky'

const props = defineProps<{
  /** 搜索详情：在抽卡舞台展示单卡，并点亮「详情」页签 */
  focusId?: string
}>()

const GAP = 20
const RANDOM_COUNT = 3
const posts = (data.posts || []) as XPost[]
const router = useRouter()

type Mode = 'all' | 'lucky' | 'focus'
const mode = ref<Mode>(props.focusId ? 'focus' : 'all')
const luckyPosts = ref<XPost[]>([])
const luckyRound = ref(0)

const focusPost = computed(() =>
  props.focusId ? posts.find(p => p.id === props.focusId) : undefined,
)

const isMd = useMediaQuery('(min-width: 640px)')
const isLg = useMediaQuery('(min-width: 960px)')
const colCount = computed(() => {
  if (isLg.value) return 3
  if (isMd.value) return 2
  return 1
})

function goThoughts(next?: 'lucky') {
  if (next === 'lucky') {
    try {
      sessionStorage.setItem(LUCKY_FLAG, '1')
    }
    catch { /* ignore */ }
  }
  if (props.focusId) {
    void router.push('/thoughts/')
    return
  }
  if (next === 'lucky') rollLucky()
  else mode.value = 'all'
}

function showAll() {
  goThoughts()
}

function showLucky() {
  if (props.focusId) {
    goThoughts('lucky')
    return
  }
  if (mode.value !== 'lucky' || !luckyPosts.value.length) {
    rollLucky()
    return
  }
  mode.value = 'lucky'
}

function rollLucky() {
  const pool = posts.slice()
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = pool[i]
    pool[i] = pool[j]
    pool[j] = tmp
  }
  luckyPosts.value = pool.slice(0, Math.min(RANDOM_COUNT, pool.length))
  luckyRound.value += 1
  mode.value = 'lucky'
}

const filtered = computed(() => {
  if (mode.value === 'lucky') return luckyPosts.value
  if (mode.value === 'focus') return focusPost.value ? [focusPost.value] : []
  return posts
})

/**
 * 按源顺序依次放入当前最短列：
 * 第 1、2、3 条先占满第一行，再往下排 —— 而不是先填满整列。
 */
const columns = ref<XPost[][]>([[]])
const masonryEl = ref<HTMLElement | null>(null)

function estimateHeight(post: XPost) {
  const textLines = Math.ceil((post.text || '').length / 26)
  let h = 92 + textLines * 24
  if ((post.text || '').length > 320) h += 28
  const media = post.media || []
  if (media.length === 1) {
    const m = media[0]
    const ratio = m.width && m.height ? m.height / m.width : 0.62
    h += Math.min(360, Math.max(140, 360 * ratio))
  }
  else if (media.length > 1) {
    h += 200
  }
  return h
}

function pack(list: XPost[], n: number, heightOf: (p: XPost) => number) {
  const cols: XPost[][] = Array.from({ length: n }, () => [])
  const heights = Array.from({ length: n }, () => 0)
  for (const post of list) {
    const i = heights.indexOf(Math.min(...heights))
    cols[i].push(post)
    heights[i] += heightOf(post) + GAP
  }
  return cols
}

function readMeasuredHeights() {
  const map = new Map<string, number>()
  const root = masonryEl.value
  if (!root) return map
  for (const el of root.querySelectorAll<HTMLElement>('[data-post-id]')) {
    map.set(el.dataset.postId!, el.offsetHeight)
  }
  return map
}

function layout(precise = false) {
  if (mode.value !== 'all') return
  const list = filtered.value
  const n = colCount.value
  if (!list.length) {
    columns.value = Array.from({ length: n }, () => [])
    return
  }

  if (!precise) {
    columns.value = pack(list, n, estimateHeight)
    return
  }

  const measured = readMeasuredHeights()
  columns.value = pack(
    list,
    n,
    (p) => measured.get(p.id) || estimateHeight(p),
  )
}

onMounted(() => {
  if (!props.focusId) {
    try {
      if (sessionStorage.getItem(LUCKY_FLAG) === '1') {
        sessionStorage.removeItem(LUCKY_FLAG)
        rollLucky()
      }
    }
    catch { /* ignore */ }
  }

  layout(false)
  void nextTick(() => {
    layout(true)
  })

  watch([filtered, colCount, mode], async () => {
    if (mode.value !== 'all') return
    layout(false)
    await nextTick()
    layout(true)
  })
})
</script>

<template>
  <div class="x-post-wall" :class="{ 'is-focus': mode === 'focus' }">
    <header class="x-post-wall-head">
      <p class="x-post-wall-kicker">From X · @{{ data.username }}</p>
      <div class="x-post-wall-title-row">
        <h1 class="x-post-wall-title">小想法</h1>
        <div class="x-post-filters" role="tablist" aria-label="浏览方式">
          <button
            type="button"
            class="x-post-filter"
            role="tab"
            :aria-selected="mode === 'all'"
            :class="{ active: mode === 'all' }"
            @click="showAll"
          >
            <span>全部</span>
            <span class="x-post-filter-count">{{ posts.length }}</span>
          </button>
          <div class="x-post-draw-wrap">
            <span
              v-show="mode === 'all'"
              class="x-post-draw-guide"
              aria-hidden="true"
            >
              <span class="x-post-pup-mover">
                <svg
                  class="x-post-pup"
                  viewBox="0 0 72 56"
                  width="44"
                  height="34"
                >
                  <g class="x-post-pup-tail">
                    <path
                      d="M14 30c-6 2-10-2-11-7 4 1 8 2 11 5z"
                      fill="currentColor"
                      opacity="0.85"
                    />
                  </g>
                  <g class="x-post-pup-body">
                    <ellipse cx="34" cy="34" rx="16" ry="11" fill="currentColor" />
                    <circle cx="48" cy="24" r="11" fill="currentColor" />
                    <path
                      class="x-post-pup-ear"
                      d="M40 16c-2-7 2-11 6-10 1 4-1 8-3 10z"
                      fill="currentColor"
                    />
                    <path
                      class="x-post-pup-ear x-post-pup-ear-r"
                      d="M52 15c2-7 7-9 10-6-2 4-5 7-8 8z"
                      fill="currentColor"
                      opacity="0.9"
                    />
                    <circle cx="45.5" cy="23" r="1.3" fill="var(--vp-c-bg)" />
                    <circle cx="52.5" cy="23" r="1.3" fill="var(--vp-c-bg)" />
                    <ellipse cx="49" cy="26.5" rx="2.2" ry="1.4" fill="var(--vp-c-bg)" opacity="0.55" />
                    <g class="x-post-pup-legs">
                      <rect x="24" y="40" width="4" height="8" rx="2" fill="currentColor" />
                      <rect x="31" y="40" width="4" height="8" rx="2" fill="currentColor" />
                      <rect x="38" y="40" width="4" height="8" rx="2" fill="currentColor" />
                      <rect x="45" y="40" width="4" height="8" rx="2" fill="currentColor" />
                    </g>
                  </g>
                </svg>
                <span class="x-post-pup-bubble">mew～</span>
              </span>
            </span>
            <button
              type="button"
              class="x-post-draw"
              role="tab"
              :aria-selected="mode === 'lucky'"
              :class="{ active: mode === 'lucky' }"
              @click="showLucky"
            >
              随机抽卡
            </button>
          </div>
          <button
            v-if="focusId"
            type="button"
            class="x-post-draw"
            role="tab"
            :aria-selected="mode === 'focus'"
            :class="{ active: mode === 'focus' }"
            @click="mode = 'focus'"
          >
            详情
          </button>
        </div>
      </div>
    </header>

    <div
      v-if="mode === 'all'"
      ref="masonryEl"
      class="x-post-masonry"
      :style="{ '--cols': colCount, '--gap': `${GAP}px` }"
    >
      <div
        v-for="(col, i) in columns"
        :key="`all-${colCount}-c${i}`"
        class="x-post-masonry-col"
      >
        <div
          v-for="post in col"
          :key="post.id"
          class="x-post-masonry-item"
          :data-post-id="post.id"
        >
          <XPostCard :post="post" />
        </div>
      </div>
    </div>

    <section
      v-else-if="mode === 'lucky'"
      class="x-post-lucky"
      aria-label="随机抽卡"
    >
      <div class="x-post-lucky-bg" aria-hidden="true" />
      <div class="x-post-lucky-actions">
        <button type="button" class="x-post-lucky-reroll" @click="rollLucky">
          再来一次
        </button>
      </div>

      <div
        :key="luckyRound"
        class="x-post-lucky-stage"
      >
        <article
          v-for="(post, i) in luckyPosts"
          :key="post.id"
          class="x-post-lucky-slot"
          :style="{ '--i': i }"
        >
          <XPostShowcase :post="post" :index="i" />
        </article>
      </div>
    </section>

    <section
      v-else-if="focusPost"
      class="x-post-lucky x-post-focus"
      aria-label="想法详情"
    >
      <div class="x-post-lucky-bg" aria-hidden="true" />
      <div class="x-post-lucky-stage x-post-focus-stage">
        <article class="x-post-lucky-slot x-post-focus-slot" style="--i: 0">
          <XPostShowcase :post="focusPost" full />
        </article>
      </div>
    </section>

    <p v-else class="x-post-empty">
      {{ mode === 'focus' ? '未找到这条想法' : '暂无内容' }}
    </p>
  </div>
</template>

<style scoped>
.x-post-wall {
  box-sizing: border-box;
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  padding: 8px 0 48px;
  overflow-x: clip;
}

.x-post-wall-head {
  margin: 8px 0 28px;
}

.x-post-wall-kicker {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-3);
  letter-spacing: 0.04em;
}

.x-post-wall-title-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
}

.x-post-wall-title {
  margin: 0;
  font-size: clamp(1.75rem, 2.4vw, 2.25rem);
  font-weight: 700;
  line-height: 1.2;
  color: var(--vp-c-text-1);
  letter-spacing: -0.02em;
}

.x-post-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin: 0;
  overflow: visible;
}

.x-post-filter {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  cursor: pointer;
  background: color-mix(in srgb, var(--vp-c-bg-alt) 88%, transparent);
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  transition:
    color 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease;
}

.x-post-filter:hover {
  color: var(--vp-c-text-1);
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 30%, var(--vp-c-divider));
}

.x-post-filter.active {
  color: var(--vp-c-bg);
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.x-post-filter-count {
  min-width: 1.25em;
  font-variant-numeric: tabular-nums;
  opacity: 0.75;
}

.x-post-filter.active .x-post-filter-count {
  opacity: 0.9;
}

.x-post-draw-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-left: 2px;
}

.x-post-draw {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  cursor: pointer;
  background: color-mix(in srgb, var(--vp-c-bg-alt) 88%, transparent);
  border: 1px dashed color-mix(in srgb, var(--vp-c-text-2) 35%, var(--vp-c-divider));
  border-radius: 999px;
  transition:
    color 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease,
    border-style 0.18s ease;
}

.x-post-draw:hover {
  color: var(--vp-c-text-1);
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 40%, var(--vp-c-divider));
  border-style: solid;
}

.x-post-draw.active {
  color: var(--vp-c-brand-1);
  background: color-mix(in srgb, var(--vp-c-brand-1) 10%, var(--vp-c-bg));
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 45%, var(--vp-c-divider));
  border-style: solid;
}

.x-post-draw-guide {
  position: absolute;
  top: -36px;
  left: -8px;
  z-index: 2;
  width: 120px;
  height: 46px;
  pointer-events: none;
  color: color-mix(in srgb, var(--vp-c-text-1) 42%, #b08968);
}

.x-post-pup-mover {
  position: absolute;
  bottom: 2px;
  left: 0;
  animation: x-pup-visit 9s linear infinite;
}

.x-post-pup {
  display: block;
  overflow: visible;
  transform-origin: 50% 100%;
}

.x-post-pup-body {
  transform-origin: 34px 40px;
  animation: x-pup-bob 9s linear infinite;
}

.x-post-pup-tail {
  transform-origin: 14px 30px;
  animation: x-pup-wag 0.28s ease-in-out infinite;
}

.x-post-pup-ear {
  transform-origin: 42px 18px;
  animation: x-pup-ear 1.6s ease-in-out infinite;
}

.x-post-pup-ear-r {
  transform-origin: 54px 18px;
  animation-delay: 0.12s;
}

.x-post-pup-legs {
  animation: x-pup-legs-sit 9s linear infinite;
}

.x-post-pup-legs rect:nth-child(odd) {
  transform-origin: center top;
  animation: x-pup-step 0.42s ease-in-out infinite;
}

.x-post-pup-legs rect:nth-child(even) {
  transform-origin: center top;
  animation: x-pup-step 0.42s ease-in-out infinite reverse;
}

.x-post-pup-bubble {
  position: absolute;
  top: -16px;
  left: 34px;
  padding: 2px 7px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  box-shadow: 0 2px 6px color-mix(in srgb, var(--vp-c-text-1) 8%, transparent);
  opacity: 0;
  transform: translateY(4px) scale(0.9);
  animation: x-pup-bubble 9s linear infinite;
}

@keyframes x-pup-visit {
  0%,
  4% {
    translate: -28px 3px;
    opacity: 0;
  }

  10% {
    opacity: 1;
    translate: -8px 2px;
  }

  22%,
  58% {
    translate: 22px -2px;
    opacity: 1;
  }

  72% {
    opacity: 1;
    translate: 58px 2px;
  }

  86%,
  100% {
    translate: 96px 5px;
    opacity: 0;
  }
}

@keyframes x-pup-bob {
  0%,
  18%,
  66%,
  100% {
    transform: translateY(0) scaleY(1);
  }

  24%,
  56% {
    transform: translateY(2px) scaleY(0.92);
  }
}

@keyframes x-pup-legs-sit {
  0%,
  20%,
  62%,
  100% {
    opacity: 1;
  }

  24%,
  56% {
    opacity: 0.15;
  }
}

@keyframes x-pup-wag {
  0%,
  100% {
    transform: rotate(-18deg);
  }

  50% {
    transform: rotate(22deg);
  }
}

@keyframes x-pup-ear {
  0%,
  100% {
    transform: rotate(0deg);
  }

  50% {
    transform: rotate(-8deg);
  }
}

@keyframes x-pup-step {
  0%,
  100% {
    transform: rotate(-12deg);
  }

  50% {
    transform: rotate(12deg);
  }
}

@keyframes x-pup-bubble {
  0%,
  24%,
  54%,
  100% {
    opacity: 0;
    transform: translateY(4px) scale(0.9);
  }

  30%,
  48% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .x-post-draw-guide {
    display: none;
  }
}

.x-post-masonry {
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  gap: var(--gap);
  align-items: start;
}

.x-post-masonry-col {
  display: flex;
  flex-direction: column;
  gap: var(--gap);
  min-width: 0;
}

.x-post-masonry-item {
  width: 100%;
}

.x-post-lucky {
  position: relative;
  isolation: isolate;
  padding: 28px 16px 36px;
  margin-top: 4px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--vp-c-divider) 80%, transparent);
  border-radius: 22px;
  background: var(--vp-c-bg);
}

.x-post-lucky-bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(ellipse 70% 55% at 50% 18%, color-mix(in srgb, var(--vp-c-brand-1) 14%, transparent), transparent 68%),
    radial-gradient(circle at 12% 88%, color-mix(in srgb, var(--vp-c-text-1) 5%, transparent), transparent 42%),
    radial-gradient(circle at 88% 82%, color-mix(in srgb, var(--vp-c-brand-1) 8%, transparent), transparent 40%),
    repeating-linear-gradient(
      -18deg,
      transparent 0,
      transparent 11px,
      color-mix(in srgb, var(--vp-c-text-1) 3.5%, transparent) 11px,
      color-mix(in srgb, var(--vp-c-text-1) 3.5%, transparent) 12px
    );
}

.x-post-lucky-stage {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  align-items: flex-start;
  justify-content: center;
  min-height: 380px;
  padding: 20px 0 12px;
}

/* 外层：扇形摆姿 + 入场淡入；hover 不改这里的 transform */
.x-post-lucky-slot {
  position: relative;
  z-index: 1;
  width: min(300px, 86vw);
  margin: 0 -10px;
  padding: 16px;
  transform-origin: 50% 80%;
  animation: x-lucky-fade 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--i) * 80ms);
}

.x-post-lucky-slot:nth-child(1) {
  z-index: 1;
  transform: rotate(-8deg) translateY(30px);
}

.x-post-lucky-slot:nth-child(2) {
  z-index: 3;
  transform: rotate(0deg) translateY(0);
}

.x-post-lucky-slot:nth-child(3) {
  z-index: 2;
  transform: rotate(8deg) translateY(30px);
}

.x-post-lucky-slot:hover {
  z-index: 6;
}

.x-post-lucky-slot:nth-child(1) :deep(.x-post-showcase-motion) {
  --float-y: -7px;
  --float-r: -1.1deg;
  animation-duration: 3.2s;
}

.x-post-lucky-slot:nth-child(2) :deep(.x-post-showcase-motion) {
  --float-y: -11px;
  --float-r: 0.9deg;
  animation-duration: 3.9s;
}

.x-post-lucky-slot:nth-child(3) :deep(.x-post-showcase-motion) {
  --float-y: -6px;
  --float-r: 1.2deg;
  animation-duration: 3s;
}

/* 搜索详情：同一舞台只放一张卡，居中略放大 */
.x-post-focus-stage {
  min-height: 420px;
  align-items: center;
  padding: 28px 0 24px;
}

.x-post-focus-slot {
  z-index: 3;
  width: min(360px, 86vw);
  margin: 0;
  transform: rotate(-1.5deg) translateY(0);
}

.x-post-focus-slot :deep(.x-post-showcase-motion) {
  --float-y: -10px;
  --float-r: 0.8deg;
  animation-duration: 3.6s;
}

.x-post-lucky-actions {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.x-post-lucky-reroll {
  padding: 10px 22px;
  font-size: 14px;
  font-weight: 700;
  color: var(--vp-c-bg);
  cursor: pointer;
  background: var(--vp-c-text-1);
  border: 0;
  border-radius: 999px;
  box-shadow: 0 10px 24px -14px color-mix(in srgb, var(--vp-c-text-1) 55%, transparent);
  transition:
    transform 0.18s ease,
    opacity 0.18s ease;
}

.x-post-lucky-reroll:hover {
  transform: translateY(-1px) scale(1.02);
}

.x-post-lucky-reroll:active {
  transform: translateY(1px) scale(0.99);
}

@keyframes x-lucky-fade {
  from {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .x-post-lucky-slot {
    animation: none !important;
  }

  .x-post-lucky-reroll {
    transition: none !important;
  }
}

.x-post-empty {
  margin: 48px 0;
  font-size: 14px;
  color: var(--vp-c-text-3);
  text-align: center;
}

@media (max-width: 639px) {
  .x-post-wall-head {
    margin-bottom: 20px;
  }

  .x-post-wall-title-row {
    align-items: flex-start;
  }

  .x-post-filters {
    flex-wrap: nowrap;
  }

  .x-post-filter {
    flex: 0 0 auto;
  }

  /* 小狗走动动画会 translate 出右缘，移动端直接隐藏避免整页横向滑动 */
  .x-post-draw-guide {
    display: none;
  }

  .x-post-lucky {
    padding: 22px 12px 28px;
  }

  .x-post-lucky-stage {
    flex-direction: column;
    gap: 18px;
    align-items: center;
    min-height: 0;
    padding: 4px 0;
  }

  .x-post-lucky-slot {
    width: min(360px, 100%);
    margin: 0;
  }

  .x-post-lucky-slot:nth-child(1) {
    transform: rotate(-2deg);
  }

  .x-post-lucky-slot:nth-child(2) {
    transform: rotate(1.5deg);
  }

  .x-post-lucky-slot:nth-child(3) {
    transform: rotate(-1deg);
  }

  .x-post-focus-slot {
    width: min(360px, 100%);
    transform: none;
  }
}
</style>

<style>
.vp-page:has(.x-post-wall) .vp-doc.plume-content,
.vp-doc.plume-content:has(.x-post-wall) {
  box-sizing: border-box;
  width: 100%;
  max-width: 1180px !important;
  margin-inline: auto;
  padding-inline: 20px;
  overflow-x: clip;
}

/* 搜索详情页：隐藏主题默认标题与供索引用的 h2 */
.vp-page:has(.x-post-wall.is-focus) .page-title,
.vp-page:has(.x-post-wall.is-focus) .vp-page-title,
.vp-page:has(.x-post-wall.is-focus) .vp-doc > h2:first-of-type,
.vp-doc.plume-content:has(.x-post-wall.is-focus) > h2:first-of-type {
  display: none;
}
</style>
