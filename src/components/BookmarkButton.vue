<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'

interface Props {
  novelId: string
  isBookmarked: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), { disabled: false })
const emit = defineEmits<{ toggle: [] }>()
const themeStore = useThemeStore()

function handleClick(): void {
  if (!props.disabled) emit('toggle')
}
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    :aria-pressed="isBookmarked"
    :aria-label="isBookmarked ? 'Hapus bookmark novel' : 'Bookmark novel ini'"
    class="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    :class="isBookmarked
      ? 'border-amber-400/40 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 focus:ring-amber-400/50'
      : themeStore.isDark
        ? 'border-[rgba(255,255,255,0.08)] bg-white/[0.04] text-[#8A8F98] hover:bg-white/[0.07] hover:text-[#EDEDEF] focus:ring-[#5E6AD2]/50 focus:ring-offset-[#050506]'
        : 'border-[rgba(0,0,0,0.08)] bg-black/[0.03] text-[#6B7080] hover:bg-black/[0.06] hover:text-[#111118] focus:ring-[#5E6AD2]/50 focus:ring-offset-[#F8F8FC]'"
    @click="handleClick"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-4 w-4"
      :fill="isBookmarked ? 'currentColor' : 'none'"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
    {{ isBookmarked ? 'Tersimpan' : 'Bookmark' }}
  </button>
</template>
