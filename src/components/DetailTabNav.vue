<script setup lang="ts">
// DetailTabNav — tab navigation bar for the novel detail page.
// Requirements: 17.1, 17.7

import { useThemeStore } from '@/stores/theme'

defineProps<{
  tabs: Array<{ id: string; label: string }>
  modelValue: string
}>()

const emit = defineEmits<{ 'update:modelValue': [id: string] }>()
const themeStore = useThemeStore()
</script>

<template>
  <nav
    class="flex gap-1 overflow-x-auto border-b"
    :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)]' : 'border-[rgba(0,0,0,0.07)]'"
    role="tablist"
    aria-label="Tab navigasi"
  >
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      role="tab"
      :aria-selected="modelValue === tab.id"
      :tabindex="modelValue === tab.id ? 0 : -1"
      class="shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-inset"
      :class="modelValue === tab.id
        ? 'border-[#5E6AD2] text-[#5E6AD2]'
        : themeStore.isDark
          ? 'border-transparent text-[#8A8F98] hover:text-[#EDEDEF]'
          : 'border-transparent text-[#6B7080] hover:text-[#111118]'"
      @click="emit('update:modelValue', tab.id)"
    >
      {{ tab.label }}
    </button>
  </nav>
</template>
