<script setup lang="ts">
// TagChip component — displays a tag with category-based color coding.
// Requirements: 6.3, 6.4, 14.3, 14.4, 14.5

import type { Tag } from '@/types'
import { useThemeStore } from '@/stores/theme'

const props = withDefaults(
  defineProps<{
    tag: Tag
    clickable?: boolean
    size?: 'sm' | 'md'
  }>(),
  { clickable: false, size: 'md' },
)

const emit = defineEmits<{ click: [tag: Tag] }>()
const themeStore = useThemeStore()

// Accent colors per category index (cycles through palette)
const darkColors = [
  'border-[rgba(94,106,210,0.30)] bg-[rgba(94,106,210,0.10)] text-[#8A9AE8]',
  'border-[rgba(120,80,200,0.30)] bg-[rgba(120,80,200,0.10)] text-[#B09AE8]',
  'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  'border-amber-500/30 bg-amber-500/10 text-amber-400',
  'border-pink-500/30 bg-pink-500/10 text-pink-400',
  'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
]

const lightColors = [
  'border-[rgba(94,106,210,0.25)] bg-[rgba(94,106,210,0.08)] text-[#5E6AD2]',
  'border-[rgba(120,80,200,0.25)] bg-[rgba(120,80,200,0.08)] text-[#7B5EA7]',
  'border-emerald-500/25 bg-emerald-50 text-emerald-600',
  'border-amber-500/25 bg-amber-50 text-amber-600',
  'border-pink-500/25 bg-pink-50 text-pink-600',
  'border-cyan-500/25 bg-cyan-50 text-cyan-600',
]

function colorClass(categoryId: string): string {
  // Deterministic index from categoryId string
  const idx = categoryId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % darkColors.length
  return themeStore.isDark ? darkColors[idx] : lightColors[idx]
}

function handleClick() {
  if (props.clickable) emit('click', props.tag)
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center rounded-full border font-medium transition-all duration-150',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      colorClass(tag.categoryId),
      clickable ? 'cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-1' : '',
    ]"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable ? 0 : undefined"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    {{ tag.name }}
  </span>
</template>
