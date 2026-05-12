<script setup lang="ts">
// Novel card component — Linear/Modern design system.
// Glass surface with multi-layer shadow, accent hover glow, smooth scale transition.
// Requirements: 1.2, 9.3

import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import type { NovelSummary } from '@/types'

defineProps<{
  novel: NovelSummary
}>()

const themeStore = useThemeStore()

// Mouse-tracking spotlight effect
const cardRef = ref<HTMLElement | null>(null)
const spotX = ref(0)
const spotY = ref(0)
const spotVisible = ref(false)

function onMouseMove(e: MouseEvent) {
  const el = cardRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  spotX.value = e.clientX - rect.left
  spotY.value = e.clientY - rect.top
}

const statusLabel: Record<string, string> = {
  ongoing: 'Berlangsung',
  completed: 'Selesai',
  hiatus: 'Hiatus',
}

const statusColor: Record<string, { dark: string; light: string }> = {
  ongoing:   { dark: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',   light: 'border-emerald-500/25 bg-emerald-50 text-emerald-600' },
  completed: { dark: 'border-[rgba(94,106,210,0.30)] bg-[rgba(94,106,210,0.10)] text-[#8A9AE8]', light: 'border-[rgba(94,106,210,0.25)] bg-[rgba(94,106,210,0.08)] text-[#5E6AD2]' },
  hiatus:    { dark: 'border-amber-500/30 bg-amber-500/10 text-amber-400',         light: 'border-amber-500/25 bg-amber-50 text-amber-600' },
}
</script>

<template>
  <RouterLink
    :to="'/novel/' + novel.id"
    class="group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
    :class="themeStore.isDark
      ? 'border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-white/[0.07] to-white/[0.02] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_2px_20px_rgba(0,0,0,0.4)] hover:border-[rgba(255,255,255,0.10)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_8px_40px_rgba(0,0,0,0.5),0_0_60px_rgba(94,106,210,0.08)] hover:-translate-y-1 focus:ring-offset-[#050506]'
      : 'border-[rgba(0,0,0,0.07)] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_2px_12px_rgba(0,0,0,0.06)] hover:border-[rgba(94,106,210,0.20)] hover:shadow-[0_0_0_1px_rgba(94,106,210,0.15),0_8px_32px_rgba(0,0,0,0.10),0_0_40px_rgba(94,106,210,0.06)] hover:-translate-y-1 focus:ring-offset-[#F8F8FC]'"
    ref="cardRef"
    @mouseenter="spotVisible = true"
    @mouseleave="spotVisible = false"
    @mousemove="onMouseMove"
  >
    <!-- Mouse-tracking spotlight (dark mode only for subtlety) -->
    <div
      v-if="themeStore.isDark"
      class="pointer-events-none absolute inset-0 z-10 rounded-2xl transition-opacity duration-300"
      :class="spotVisible ? 'opacity-100' : 'opacity-0'"
      :style="{
        background: `radial-gradient(300px circle at ${spotX}px ${spotY}px, rgba(94,106,210,0.10), transparent 70%)`,
      }"
      aria-hidden="true"
    />

    <!-- Thumbnail -->
    <div
      class="relative aspect-[2/3] overflow-hidden"
      :class="themeStore.isDark ? 'bg-white/[0.04]' : 'bg-[#F0F0F6]'"
    >
      <img
        :src="novel.thumbnailUrl"
        :alt="novel.title"
        loading="lazy"
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
      />

      <!-- Gradient overlay at bottom for text legibility -->
      <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" aria-hidden="true" />

      <!-- Status badge -->
      <span
        class="absolute right-2 top-2 z-20 rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide uppercase backdrop-blur-sm"
        :class="(statusColor[novel.status] ?? statusColor.ongoing)[themeStore.isDark ? 'dark' : 'light']"
      >
        {{ statusLabel[novel.status] ?? novel.status }}
      </span>
    </div>

    <!-- Metadata — flex layout agar tinggi menyesuaikan atau di-handle overflow -->
    <div class="flex h-[104px] flex-shrink-0 flex-col overflow-hidden p-3">
      <div class="min-h-0 flex-1">
        <!-- Title: max 2 baris -->
        <h3
          class="line-clamp-2 text-sm font-semibold leading-snug tracking-tight transition-colors duration-200"
          :class="themeStore.isDark
            ? 'text-[#EDEDEF] group-hover:text-white'
            : 'text-[#111118] group-hover:text-[#5E6AD2]'"
        >
          {{ novel.title }}
        </h3>
        <!-- Author: 1 baris -->
        <p
          class="mt-0.5 truncate text-xs"
          :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'"
        >
          {{ novel.author }}
        </p>
      </div>

      <!-- Genre chips -->
      <div
        v-if="novel.genre.length"
        class="mt-1.5 flex h-[22px] flex-wrap gap-1 overflow-hidden"
      >
        <span
          v-for="g in novel.genre.slice(0, 2)"
          :key="g"
          class="whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-medium"
          :class="themeStore.isDark
            ? 'border-[rgba(255,255,255,0.06)] bg-white/[0.04] text-[#8A8F98]'
            : 'border-[rgba(0,0,0,0.07)] bg-black/[0.03] text-[#6B7080]'"
        >
          {{ g }}
        </span>
      </div>
    </div>
  </RouterLink>
</template>
