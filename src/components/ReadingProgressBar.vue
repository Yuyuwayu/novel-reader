<script setup lang="ts">
// Reading progress bar: fixed bar at the top of the page showing scroll progress.
// Requirements: 25.5

defineProps<{
  /** Scroll progress percentage (0–100) */
  progress: number
}>()
</script>

<template>
  <!-- Fixed progress bar at the very top of the viewport, above the navbar -->
  <div
    class="fixed left-0 top-0 z-50 h-1 bg-blue-600 transition-[width] duration-100 ease-linear dark:bg-blue-400"
    role="progressbar"
    :aria-valuenow="Math.round(progress)"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-label="`Reading progress: ${Math.round(progress)}%`"
    :style="{ width: `${Math.min(100, Math.max(0, progress))}%` }"
  ></div>
</template>
