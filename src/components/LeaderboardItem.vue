<script setup lang="ts">
// LeaderboardItem — Linear/Modern design system.
// Glass row with rank badge, hover glow, and accent score.
// Requirements: 1.2, 1.5, 1.6

import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import type { LeaderboardEntry } from '@/types'

const props = defineProps<{
  entry: LeaderboardEntry
  rank: number
}>()

const router = useRouter()
const themeStore = useThemeStore()

const statusLabel: Record<string, string> = {
  ongoing: 'Berlangsung',
  completed: 'Selesai',
  hiatus: 'Hiatus',
}

/** Rank badge: gold/silver/bronze for top 3, plain glass otherwise */
function rankBadgeClass(rank: number): string {
  if (rank === 1) return 'bg-amber-400/20 border-amber-400/40 text-amber-300'
  if (rank === 2) return 'bg-slate-400/20 border-slate-400/40 text-slate-300'
  if (rank === 3) return 'bg-orange-600/20 border-orange-500/40 text-orange-400'
  return themeStore.isDark
    ? 'bg-white/[0.04] border-[rgba(255,255,255,0.08)] text-[#8A8F98]'
    : 'bg-black/[0.04] border-[rgba(0,0,0,0.08)] text-[#6B7080]'
}

function rankBadgeClassLight(rank: number): string {
  if (rank === 1) return 'bg-amber-50 border-amber-300/60 text-amber-600'
  if (rank === 2) return 'bg-slate-50 border-slate-300/60 text-slate-500'
  if (rank === 3) return 'bg-orange-50 border-orange-300/60 text-orange-600'
  return 'bg-black/[0.04] border-[rgba(0,0,0,0.08)] text-[#6B7080]'
}

function navigate() {
  router.push(`/novel/${props.entry.novelId}`)
}
</script>

<template>
  <div
    class="group flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
    :class="themeStore.isDark
      ? 'border-[rgba(255,255,255,0.05)] bg-white/[0.03] hover:border-[rgba(255,255,255,0.08)] hover:bg-white/[0.06] focus:ring-offset-[#050506]'
      : 'border-[rgba(0,0,0,0.06)] bg-white hover:border-[rgba(94,106,210,0.15)] hover:bg-[rgba(94,106,210,0.03)] focus:ring-offset-[#F8F8FC]'"
    role="link"
    :tabindex="0"
    @click="navigate"
    @keydown.enter="navigate"
  >
    <!-- Rank badge -->
    <div
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-bold"
      :class="themeStore.isDark ? rankBadgeClass(rank) : rankBadgeClassLight(rank)"
    >
      {{ rank }}
    </div>

    <!-- Thumbnail -->
    <img
      :src="entry.thumbnailUrl"
      :alt="entry.title"
      loading="lazy"
      class="h-14 w-10 shrink-0 rounded-lg object-cover transition-transform duration-300 group-hover:scale-[1.03]"
    />

    <!-- Metadata -->
    <div class="min-w-0 flex-1">
      <h3
        class="truncate text-sm font-semibold leading-snug transition-colors duration-200"
        :class="themeStore.isDark
          ? 'text-[#EDEDEF] group-hover:text-white'
          : 'text-[#111118] group-hover:text-[#5E6AD2]'"
      >
        {{ entry.title }}
      </h3>
      <p
        class="truncate text-xs"
        :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'"
      >
        {{ entry.author }}
      </p>

      <!-- Genre chips -->
      <div v-if="entry.genre.length" class="mt-1 flex flex-wrap gap-1">
        <span
          v-for="g in entry.genre.slice(0, 2)"
          :key="g"
          class="rounded-full border px-2 py-0.5 text-[10px] font-medium"
          :class="themeStore.isDark
            ? 'border-[rgba(255,255,255,0.06)] bg-white/[0.04] text-[#8A8F98]'
            : 'border-[rgba(0,0,0,0.07)] bg-black/[0.03] text-[#6B7080]'"
        >
          {{ g }}
        </span>
      </div>
    </div>

    <!-- Right: status + score -->
    <div class="flex shrink-0 flex-col items-end gap-1.5">
      <span
        class="rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide"
        :class="themeStore.isDark
          ? 'border-[rgba(255,255,255,0.06)] bg-white/[0.04] text-[#8A8F98]'
          : 'border-[rgba(0,0,0,0.07)] bg-black/[0.03] text-[#6B7080]'"
      >
        {{ statusLabel[entry.status] ?? entry.status }}
      </span>
      <span
        class="font-mono text-xs font-semibold"
        :class="themeStore.isDark ? 'text-[#5E6AD2]' : 'text-[#5E6AD2]'"
      >
        {{ entry.popularityScore.toLocaleString() }}
      </span>
    </div>
  </div>
</template>
