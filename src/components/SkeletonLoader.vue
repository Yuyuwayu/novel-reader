<script setup lang="ts">
// Skeleton placeholder for content loading state.
// Requirements: 9.2

import { useThemeStore } from '@/stores/theme'

withDefaults(
  defineProps<{
    count?: number
  }>(),
  { count: 6 },
)

const themeStore = useThemeStore()
</script>

<template>
  <div
    class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
    aria-busy="true"
    aria-label="Memuat konten..."
  >
    <div
      v-for="n in count"
      :key="n"
      class="animate-pulse overflow-hidden rounded-2xl border"
      :class="themeStore.isDark
        ? 'border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-white/[0.07] to-white/[0.02]'
        : 'border-[rgba(0,0,0,0.07)] bg-white'"
    >
      <!-- Thumbnail placeholder -->
      <div
        class="aspect-[2/3] w-full"
        :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'"
      />
      <!-- Metadata placeholder -->
      <div class="p-3 space-y-2">
        <div class="h-4 w-3/4 rounded" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
        <div class="h-3 w-1/2 rounded" :class="themeStore.isDark ? 'bg-white/[0.06]' : 'bg-black/[0.05]'" />
        <div class="h-3 w-1/3 rounded" :class="themeStore.isDark ? 'bg-white/[0.05]' : 'bg-black/[0.04]'" />
      </div>
    </div>
  </div>
</template>
