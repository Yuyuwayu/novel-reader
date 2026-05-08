<script setup lang="ts">
// Generic loading spinner.
// Requirements: 1.5, 3.5, 4.6, 9.2

import { useThemeStore } from '@/stores/theme'
const themeStore = useThemeStore()
</script>

<template>
  <div class="flex items-center justify-center p-8" role="status" aria-label="Memuat...">
    <div
      class="h-10 w-10 animate-spin rounded-full border-4 border-t-[#5E6AD2]"
      :class="themeStore.isDark ? 'border-white/[0.08]' : 'border-black/[0.07]'"
    />
    <span class="sr-only">Memuat...</span>
  </div>
</template>
