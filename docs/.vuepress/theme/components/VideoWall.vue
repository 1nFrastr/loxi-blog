<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAppLocale, useLocalePath } from '../../client/i18n'
import { projectVideos, type ProjectVideo } from '../../client/projects'

const props = withDefaults(defineProps<{
  /** 列数：侧栏默认 1，关于页可用 2 */
  columns?: number
}>(), {
  columns: 1,
})

const locale = useAppLocale()
const localePath = useLocalePath()
const projects = projectVideos
const hoveredId = ref<string | null>(null)
const activeId = ref<string | null>(null)
const tileRefs = ref<Record<string, HTMLVideoElement | null>>({})
const cinemaVideo = ref<HTMLVideoElement | null>(null)
const columnCount = computed(() => Math.max(1, Number(props.columns) || 1))

const ui = computed(() => locale.value === 'zh'
  ? {
      wallLabel: '项目演示',
      close: '关闭',
      prev: '上一个',
      next: '下一个',
      readArticle: '阅读文章',
    }
  : {
      wallLabel: 'Project demos',
      close: 'Close',
      prev: 'Previous',
      next: 'Next',
      readArticle: 'Read article',
    })

function localizedProject(project: ProjectVideo) {
  const isZh = locale.value === 'zh'
  return {
    ...project,
    title: isZh && project.titleZh ? project.titleZh : project.title,
    description: isZh && project.descriptionZh ? project.descriptionZh : project.description,
    tags: isZh && project.tagsZh ? project.tagsZh : project.tags,
    article: project.article ? localePath.value(project.article) : undefined,
  }
}

const activeIndex = computed(() =>
  activeId.value ? projects.findIndex(p => p.id === activeId.value) : -1,
)
const activeProject = computed(() => {
  if (activeIndex.value < 0) return null
  return localizedProject(projects[activeIndex.value])
})

function displayTitle(project: ProjectVideo) {
  return localizedProject(project).title
}

function setTileRef(id: string, el: unknown) {
  tileRefs.value[id] = (el as HTMLVideoElement | null) ?? null
}

function isDimmed(id: string) {
  return hoveredId.value !== null && hoveredId.value !== id && activeId.value === null
}

function isFocused(id: string) {
  return hoveredId.value === id && activeId.value === null
}

async function playTile(id: string) {
  const el = tileRefs.value[id]
  if (!el) return
  try {
    el.muted = true
    await el.play()
  }
  catch {
    // ignore
  }
}

function pauseTile(id: string) {
  tileRefs.value[id]?.pause()
}

function pauseAll() {
  for (const p of projects) pauseTile(p.id)
}

function playVisible() {
  for (const p of projects) void playTile(p.id)
}

function onEnter(id: string) {
  hoveredId.value = id
}

function onLeave(id: string) {
  if (hoveredId.value === id) hoveredId.value = null
}

function openCinema(project: ProjectVideo) {
  activeId.value = project.id
  hoveredId.value = null
  pauseAll()
  document.documentElement.style.overflow = 'hidden'
  nextTick(() => {
    const el = cinemaVideo.value
    if (!el) return
    el.currentTime = 0
    void el.play().catch(() => {})
  })
}

function closeCinema() {
  cinemaVideo.value?.pause()
  activeId.value = null
  document.documentElement.style.overflow = ''
  playVisible()
}

function goCinema(delta: number) {
  if (activeIndex.value < 0 || !projects.length) return
  const next = (activeIndex.value + delta + projects.length) % projects.length
  activeId.value = projects[next].id
  nextTick(() => {
    const el = cinemaVideo.value
    if (!el) return
    el.currentTime = 0
    void el.play().catch(() => {})
  })
}

function onKeydown(e: KeyboardEvent) {
  if (!activeId.value) return
  if (e.key === 'Escape') closeCinema()
  else if (e.key === 'ArrowLeft') goCinema(-1)
  else if (e.key === 'ArrowRight') goCinema(1)
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  nextTick(playVisible)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.documentElement.style.overflow = ''
})

watch(activeId, (id) => {
  if (id) pauseAll()
})
</script>

<template>
  <section
    v-if="projects.length"
    class="video-wall"
    :class="`cols-${columnCount}`"
    aria-label="项目演示"
  >
    <button
      v-for="project in projects"
      :key="project.id"
      type="button"
      class="vw-row"
      :class="{
        focused: isFocused(project.id),
        dimmed: isDimmed(project.id),
      }"
      :aria-label="project.title"
      @mouseenter="onEnter(project.id)"
      @mouseleave="onLeave(project.id)"
      @focus="onEnter(project.id)"
      @blur="onLeave(project.id)"
      @click="openCinema(project)"
    >
      <span class="vw-media">
        <video
          :ref="(el) => setTileRef(project.id, el)"
          class="vw-video"
          :src="project.video"
          :poster="project.poster"
          muted
          loop
          playsinline
          preload="metadata"
        />
      </span>
      <span class="vw-title">{{ project.title }}</span>
    </button>

    <Teleport to="body">
      <div
        v-if="activeProject"
        class="vw-cinema"
        role="dialog"
        aria-modal="true"
        :aria-label="activeProject.title"
        @click.self="closeCinema"
      >
        <button type="button" class="vw-cinema-close" aria-label="关闭" @click="closeCinema">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <button
          v-if="projects.length > 1"
          type="button"
          class="vw-nav prev"
          aria-label="上一个"
          @click="goCinema(-1)"
        >
          ‹
        </button>
        <button
          v-if="projects.length > 1"
          type="button"
          class="vw-nav next"
          aria-label="下一个"
          @click="goCinema(1)"
        >
          ›
        </button>

        <div class="vw-cinema-stage">
          <video
            ref="cinemaVideo"
            class="vw-cinema-video"
            :src="activeProject.video"
            :poster="activeProject.poster"
            controls
            playsinline
            autoplay
          />
          <div class="vw-cinema-info">
            <h3>{{ activeProject.title }}</h3>
            <p>{{ activeProject.description }}</p>
            <div class="vw-cinema-links">
              <a
                v-if="activeProject.repo"
                :href="activeProject.repo"
                target="_blank"
                rel="noopener noreferrer"
              >GitHub</a>
              <a
                v-if="activeProject.article"
                :href="activeProject.article"
              >阅读文章</a>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.video-wall {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  margin: 0 0 16px;
  padding: 0;
  text-align: left;
}

.video-wall.cols-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin: 0 0 24px;
}

.video-wall.cols-2 .vw-title {
  padding: 10px 12px 12px;
  font-size: 13px;
}

.vw-row {
  display: block;
  width: 100%;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  border: none;
  border-radius: 8px;
  background: var(--vp-c-bg);
  box-shadow: var(--vp-shadow-1);
  color: inherit;
  text-align: left;
  transition:
    opacity 0.25s ease,
    box-shadow 0.25s ease,
    transform 0.25s ease;
}

.vw-row.focused {
  box-shadow: var(--vp-shadow-2);
  transform: translateY(-1px);
}

.vw-row.dimmed {
  opacity: 0.45;
}

.vw-media {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #0c0d10;
}

.vw-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vw-title {
  display: block;
  padding: 8px 10px 10px;
  font-size: 12px;
  font-weight: 550;
  line-height: 1.35;
  color: var(--vp-c-text-1);
}

.vw-cinema {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(4, 5, 8, 0.82);
  backdrop-filter: blur(18px);
  animation: vw-fade-in 0.22s ease;
}

.vw-cinema-stage {
  width: min(960px, 100%);
  animation: vw-rise 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}

.vw-cinema-video {
  display: block;
  width: 100%;
  max-height: min(68vh, 540px);
  aspect-ratio: 16 / 9;
  object-fit: contain;
  background: #000;
  border: none;
  border-radius: 8px;
  outline: none;
}

.vw-cinema-info {
  margin-top: 16px;
  color: #f4f4f5;
}

.vw-cinema-info h3 {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 560;
}

.vw-cinema-info p {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.62);
}

.vw-cinema-links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.vw-cinema-links a {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.78);
  text-decoration: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.22);
}

.vw-cinema-links a:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.55);
}

.vw-cinema-close {
  position: absolute;
  top: 18px;
  right: 18px;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  color: rgba(255, 255, 255, 0.75);
  cursor: pointer;
  background: transparent;
  border: none;
}

.vw-nav {
  position: absolute;
  top: 50%;
  z-index: 1;
  width: 48px;
  height: 48px;
  font-size: 34px;
  line-height: 1;
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  background: transparent;
  border: none;
  transform: translateY(-50%);
}

.vw-nav:hover {
  color: rgba(255, 255, 255, 0.95);
}

.vw-nav.prev { left: 12px; }
.vw-nav.next { right: 12px; }

@keyframes vw-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes vw-rise {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 768px) {
  .video-wall.cols-2 {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .vw-nav {
    display: none;
  }

  .vw-cinema {
    padding: 16px;
    align-items: end;
  }

  .vw-cinema-video {
    max-height: 48vh;
  }
}
</style>
