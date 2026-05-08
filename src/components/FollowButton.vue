<script setup lang="ts">
// FollowButton — follow/unfollow toggle for a novel.
// Requirements: 22.1, 22.2

import { useThemeStore } from '@/stores/theme'

defineProps<{
  novelId: string
  isFollowing: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{ toggle: [] }>()
const themeStore = useThemeStore()
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    class="group inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    :class="isFollowing
      ? themeStore.isDark
        ? 'border-[rgba(94,106,210,0.40)] bg-[rgba(94,106,210,0.12)] text-[#8A9AE8] hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 focus:ring-offset-[#050506]'
        : 'border-[rgba(94,106,210,0.30)] bg-[rgba(94,106,210,0.08)] text-[#5E6AD2] hover:border-red-400/30 hover:bg-red-50 hover:text-red-500 focus:ring-offset-[#F8F8FC]'
      : themeStore.isDark
        ? 'border-[rgba(255,255,255,0.08)] bg-white/[0.04] text-[#8A8F98] hover:border-[rgba(94,106,210,0.40)] hover:bg-[rgba(94,106,210,0.10)] hover:text-[#EDEDEF] focus:ring-offset-[#050506]'
        : 'border-[rgba(0,0,0,0.08)] bg-black/[0.03] text-[#6B7080] hover:border-[rgba(94,106,210,0.25)] hover:bg-[rgba(94,106,210,0.06)] hover:text-[#5E6AD2] focus:ring-offset-[#F8F8FC]'"
    :aria-label="isFollowing ? 'Berhenti mengikuti novel ini' : 'Ikuti novel ini'"
    @click="emit('toggle')"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
    <span v-if="isFollowing" class="group-hover:hidden">Mengikuti</span>
    <span v-if="isFollowing" class="hidden group-hover:inline">Berhenti Mengikuti</span>
    <span v-if="!isFollowing">Ikuti</span>
  </button>
</template>
