<script setup lang="ts">
// Chapter navigation component with prev/next buttons.
// Requirements: 4.2, 4.3, 4.4

import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'

const props = defineProps<{
  novelId: string
  currentChapter: number
  totalChapters: number
}>()

const router = useRouter()
const themeStore = useThemeStore()

const isFirst = computed(() => props.currentChapter <= 1)
const isLast = computed(() => props.currentChapter >= props.totalChapters)

function goToPrev(): void {
  if (!isFirst.value) router.push(`/novel/${props.novelId}/chapter/${props.currentChapter - 1}`)
}

function goToNext(): void {
  if (!isLast.value) router.push(`/novel/${props.novelId}/chapter/${props.currentChapter + 1}`)
}
</script>

<template>
  <nav class="flex items-center justify-between gap-2 sm:gap-4" aria-label="Navigasi chapter">
    <button
      type="button"
      :disabled="isFirst"
      class="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
      :class="themeStore.isDark
        ? 'border-[rgba(255,255,255,0.08)] bg-white/[0.04] text-[#8A8F98] hover:bg-white/[0.07] hover:text-[#EDEDEF] focus:ring-offset-[#050506]'
        : 'border-[rgba(0,0,0,0.08)] bg-white text-[#6B7080] hover:bg-black/[0.04] hover:text-[#111118] focus:ring-offset-[#F8F8FC]'"
      aria-label="Chapter Sebelumnya"
      @click="goToPrev"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      <span class="hidden sm:inline">Chapter Sebelumnya</span>
    </button>

    <span class="flex-shrink-0 font-mono text-xs" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'">
      {{ currentChapter }} / {{ totalChapters }}
    </span>

    <button
      type="button"
      :disabled="isLast"
      class="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
      :class="themeStore.isDark
        ? 'border-[rgba(255,255,255,0.08)] bg-white/[0.04] text-[#8A8F98] hover:bg-white/[0.07] hover:text-[#EDEDEF] focus:ring-offset-[#050506]'
        : 'border-[rgba(0,0,0,0.08)] bg-white text-[#6B7080] hover:bg-black/[0.04] hover:text-[#111118] focus:ring-offset-[#F8F8FC]'"
      aria-label="Chapter Berikutnya"
      @click="goToNext"
    >
      <span class="hidden sm:inline">Chapter Berikutnya</span>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </nav>
</template>
