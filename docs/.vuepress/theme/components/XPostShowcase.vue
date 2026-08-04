<script setup lang="ts">
import XPostCard, { type XPost } from './XPostCard.vue'

withDefaults(
  defineProps<{
    post: XPost
    /** 独立详情页：不截断正文 */
    full?: boolean
    /** 抽卡扇形中的序号，影响浮动相位 */
    index?: number
  }>(),
  { index: 0 },
)
</script>

<template>
  <div class="x-post-showcase" :style="{ '--i': index }">
    <div class="x-post-showcase-boost">
      <div class="x-post-showcase-motion">
        <div class="x-post-showcase-card">
          <XPostCard :post="post" :full="full" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* hover 抬升/放大：停掉浮动，落到固定姿态 */
.x-post-showcase-boost {
  transform-origin: 50% 60%;
  transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.x-post-showcase:hover .x-post-showcase-boost {
  transform: translateY(-8px) scale(1.05);
}

/* 持续轻柔浮动 */
.x-post-showcase-motion {
  --float-y: -8px;
  --float-r: 0.7deg;
  transform-origin: 50% 60%;
  animation: x-showcase-float 3.4s ease-in-out infinite;
  animation-delay: calc(var(--i, 0) * -0.7s);
}

.x-post-showcase:hover .x-post-showcase-motion {
  animation-play-state: paused;
}

.x-post-showcase-card {
  transition: filter 0.3s ease;
  filter: drop-shadow(0 14px 22px color-mix(in srgb, var(--vp-c-text-1) 14%, transparent));
}

.x-post-showcase:hover .x-post-showcase-card {
  filter: drop-shadow(0 24px 36px color-mix(in srgb, var(--vp-c-brand-1) 24%, transparent));
}

.x-post-showcase :deep(.x-post-card) {
  transition:
    border-color 0.22s ease,
    box-shadow 0.22s ease;
}

.x-post-showcase :deep(.x-post-card:hover) {
  transform: none;
}

.x-post-showcase:hover :deep(.x-post-card) {
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 45%, var(--vp-c-divider));
}

@keyframes x-showcase-float {
  0%,
  100% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }

  50% {
    transform: translate3d(0, var(--float-y, -8px), 0) rotate(var(--float-r, 0.7deg));
  }
}

@media (prefers-reduced-motion: reduce) {
  .x-post-showcase-motion {
    animation: none !important;
  }

  .x-post-showcase-boost,
  .x-post-showcase-card {
    transition: none !important;
  }
}
</style>
