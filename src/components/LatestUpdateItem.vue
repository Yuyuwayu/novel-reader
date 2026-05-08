<script setup lang="ts">
// LatestUpdateItem — Linear/Modern design system.
// Glass row with hover glow and smooth transition.
// Requirements: 4.2, 4.4

import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import type { LatestUpdateEntry } from '@/types'
import { formatRelativeTime } from '@/utils/formatRelativeTime'

const props = defineProps<{
  entry: LatestUpdateEntry
}>()

const router = useRouter()
const themeStore = useThemeStore()

function navigate() {
  router.push(`/novel/${props.entry.novelId}/chapter/${props.entry.chapterNumber}`)
}
</script>

<template>
  <div
    class="group flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
    :class="themeStore.isDark
      ? 'border-[rgba(255,255,255,0.05)] bg-white/[0.03] hover:border-[rgba(255,255,255,0.08)] hover:bg-white/[0.06] focus:ring-offset-[#050506]'
      : 'border-[rgba(0,0,0,0.06)] bg-white hover:border-[rgba(94,106,210,0.15)] hover:bg-[rgba(94,106,210,0.03)] focus:ring-offset-[#F8F8FC]'"
    role="link"
    :tabindex="0"
    @click="navigate"
    @keydown.enter="navigate"
  >
    <!-- Novel thumbnail -->
    <img
      :src="entry.thumbnailUrl"
      :alt="entry.novelTitle"
      loading="lazy"
      class="h-12 w-9 shrink-0 rounded-lg object-cover transition-transform duration-300 group-hover:scale-[1.03]"
    />

    <!-- Text content -->
    <div class="min-w-0 flex-1">
      <p
        class="truncate text-sm font-semibold leading-snug transition-colors duration-200"
        :class="themeStore.isDark
          ? 'text-[#EDEDEF] group-hover:text-white'
          : 'text-[#111118] group-hover:text-[#5E6AD2]'"
      >
        {{ entry.novelTitle }}
      </p>
      <p
        class="truncate text-xs"
        :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'"
      >
        Chapter {{ entry.chapterNumber }}
        <span v-if="entry.chapterTitle"> — {{ entry.chapterTitle }}</span>
      </p>
    </div>

    <!-- Relative time -->
    <span
      class="shrink-0 font-mono text-xs"
      :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'"
    >
      {{ formatRelativeTime(entry.releasedAt) }}
    </span>

    <!-- Arrow indicator -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-3.5 w-3.5 shrink-0 transition-all duration-200 group-hover:translate-x-0.5"
      :class="themeStore.isDark ? 'text-[#8A8F98] group-hover:text-[#EDEDEF]' : 'text-[#9CA3AF] group-hover:text-[#5E6AD2]'"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2.5"
      aria-hidden="true"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  </div>
</template>
