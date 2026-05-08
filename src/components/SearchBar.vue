<script setup lang="ts">
// Search bar with 300ms debounce.
// Requirements: 2.1, 2.5

import { onUnmounted } from 'vue'
import { useThemeStore } from '@/stores/theme'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: [query: string]
}>()

const themeStore = useThemeStore()

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function onInput(event: Event): void {
  const value = (event.target as HTMLInputElement).value
  emit('update:modelValue', value)
  if (debounceTimer !== null) clearTimeout(debounceTimer)
  if (value === '') {
    emit('search', '')
  } else {
    debounceTimer = setTimeout(() => {
      emit('search', value)
      debounceTimer = null
    }, 300)
  }
}

onUnmounted(() => {
  if (debounceTimer !== null) clearTimeout(debounceTimer)
})
</script>

<template>
  <div class="relative w-full">
    <span
      class="pointer-events-none absolute inset-y-0 left-3 flex items-center"
      :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
      </svg>
    </span>
    <input
      type="search"
      :value="modelValue"
      placeholder="Cari judul atau penulis..."
      class="w-full rounded-lg border py-2 pl-9 pr-4 text-sm transition-all duration-200 focus:outline-none focus:ring-2"
      :class="themeStore.isDark
        ? 'border-[rgba(255,255,255,0.08)] bg-[#0F0F12] text-[#EDEDEF] placeholder-[#8A8F98] focus:border-[#5E6AD2] focus:ring-[#5E6AD2]/20'
        : 'border-[rgba(0,0,0,0.10)] bg-white text-[#111118] placeholder-[#9CA3AF] focus:border-[#5E6AD2] focus:ring-[#5E6AD2]/15'"
      aria-label="Cari novel"
      @input="onInput"
    />
  </div>
</template>
