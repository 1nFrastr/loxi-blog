<script setup lang="ts">
import { computed } from 'vue'
import { usePageFrontmatter } from 'vuepress/client'
import XPostWall from './XPostWall.vue'

const fm = usePageFrontmatter<{ xPostId?: string }>()
const focusId = computed(() => fm.value.xPostId)
</script>

<template>
  <XPostWall :focus-id="focusId" />
</template>
