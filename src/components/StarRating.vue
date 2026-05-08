<script setup lang="ts">
// StarRating: interactive or readonly star rating component (1–5 stars).

import { ref, computed } from 'vue'
import { useThemeStore } from '@/stores/theme'

interface Props {
  modelValue: number | null
  readonly?: boolean
  averageRating?: number
  totalRatings?: number
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  averageRating: 0,
  totalRatings: 0,
})

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()
const themeStore = useThemeStore()

const hoverValue = ref<number | null>(null)

const displayValue = computed<number>(() => {
  if (props.readonly) return props.averageRating ?? 0
  return hoverValue.value ?? props.modelValue ?? 0
})

function starFill(position: number): 'full' | 'half' | 'empty' {
  const val = displayValue.value
  if (val >= position) return 'full'
  if (val >= position - 0.5) return 'half'
  return 'empty'
}

function handleClick(value: number): void {
  if (!props.readonly) emit('update:modelValue', value)
}

function handleMouseEnter(value: number): void {
  if (!props.readonly) hoverValue.value = value
}

function handleMouseLeave(): void {
  if (!props.readonly) hoverValue.value = null
}
</script>

<template>
  <div class="flex flex-col gap-1">
    <div
      class="flex items-center gap-0.5"
      :class="readonly ? '' : 'cursor-pointer'"
      role="group"
      :aria-label="readonly ? `Rating rata-rata: ${averageRating?.toFixed(1)} dari 5` : 'Pilih rating'"
      @mouseleave="handleMouseLeave"
    >
      <button
        v-for="star in 5"
        :key="star"
        type="button"
        :disabled="readonly"
        :aria-label="`${star} bintang`"
        class="rounded focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-1 disabled:cursor-default"
        :class="readonly ? 'cursor-default' : 'hover:scale-110 transition-transform duration-150'"
        @click="handleClick(star)"
        @mouseenter="handleMouseEnter(star)"
      >
        <svg v-if="starFill(star) === 'full'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        <svg v-else-if="starFill(star) === 'half'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-400" viewBox="0 0 24 24" aria-hidden="true">
          <defs>
            <linearGradient :id="`half-${star}`" x1="0" x2="1" y1="0" y2="0">
              <stop offset="50%" stop-color="currentColor" />
              <stop offset="50%" stop-color="transparent" />
            </linearGradient>
          </defs>
          <path :fill="`url(#half-${star})`" stroke="currentColor" stroke-width="1" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" :class="themeStore.isDark ? 'text-white/[0.15]' : 'text-black/[0.12]'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </button>
    </div>

    <div v-if="readonly && totalRatings !== undefined && totalRatings > 0" class="flex items-center gap-1 font-mono text-xs" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'">
      <span class="font-medium" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">{{ averageRating?.toFixed(1) }}</span>
      <span>({{ totalRatings }} ulasan)</span>
    </div>
    <div v-else-if="readonly && (totalRatings === 0 || totalRatings === undefined)" class="font-mono text-xs" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'">
      Belum ada ulasan
    </div>
    <div v-if="!readonly" class="font-mono text-xs" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'">
      <span v-if="modelValue !== null">Rating kamu: {{ modelValue }}/5</span>
      <span v-else>Klik bintang untuk memberi rating</span>
    </div>
  </div>
</template>
