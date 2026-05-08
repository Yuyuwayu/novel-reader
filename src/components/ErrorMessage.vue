<script setup lang="ts">
// Error message component with optional retry button.
// Requirements: 1.4, 2.4, 3.4, 4.5

import { useThemeStore } from '@/stores/theme'

defineProps<{
  message: string
  retryable?: boolean
}>()

const emit = defineEmits<{
  retry: []
}>()

const themeStore = useThemeStore()
</script>

<template>
  <div
    class="flex flex-col items-center gap-4 rounded-2xl border p-6 text-center"
    :class="themeStore.isDark
      ? 'border-red-500/20 bg-red-500/10'
      : 'border-red-200 bg-red-50'"
    role="alert"
  >
    <div
      class="flex h-12 w-12 items-center justify-center rounded-2xl border"
      :class="themeStore.isDark ? 'border-red-500/20 bg-red-500/10' : 'border-red-200 bg-red-50'"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    </div>

    <p class="text-sm" :class="themeStore.isDark ? 'text-red-400' : 'text-red-600'">{{ message }}</p>

    <button
      v-if="retryable"
      type="button"
      class="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-red-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 bg-red-600"
      @click="emit('retry')"
    >
      Coba Lagi
    </button>
  </div>
</template>
