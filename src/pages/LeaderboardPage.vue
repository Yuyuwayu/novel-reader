<script setup lang="ts">
// LeaderboardPage — full leaderboard with daily/weekly/all-time period tabs.
// Fetches up to 50 entries per period via fetchLeaderboard().
// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9

import { ref, onMounted, watch } from 'vue'
import { fetchLeaderboard } from '@/api'
import { useSeoMeta } from '@/composables/useSeoMeta'
import { useThemeStore } from '@/stores/theme'
import type { LeaderboardEntry } from '@/types'
import LeaderboardItem from '@/components/LeaderboardItem.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'

// ── SEO ───────────────────────────────────────────────────────────────────────

useSeoMeta(
  'Peringkat Novel | Novel Reader',
  'Lihat daftar novel terpopuler berdasarkan periode harian, mingguan, dan sepanjang masa.',
)

const themeStore = useThemeStore()

// ── State ─────────────────────────────────────────────────────────────────────

type Period = 'daily' | 'weekly' | 'all_time'

const period = ref<Period>('weekly')
const entries = ref<LeaderboardEntry[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const tabs: { id: Period; label: string }[] = [
  { id: 'daily', label: 'Harian' },
  { id: 'weekly', label: 'Mingguan' },
  { id: 'all_time', label: 'Sepanjang Masa' },
]

// ── Data fetching ─────────────────────────────────────────────────────────────

async function loadLeaderboard(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const data = await fetchLeaderboard(period.value)
    entries.value = data.slice(0, 50)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat data peringkat.'
  } finally {
    loading.value = false
  }
}

// ── Lifecycle & watchers ──────────────────────────────────────────────────────

onMounted(loadLeaderboard)

watch(period, loadLeaderboard)
</script>

<template>
  <div
    class="relative min-h-screen transition-colors duration-300"
    :class="themeStore.isDark ? 'bg-[#050506] text-[#EDEDEF]' : 'bg-[#F8F8FC] text-[#111118]'"
  >
    <!-- Ambient background -->
    <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div class="absolute inset-0" :class="themeStore.isDark ? 'bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)]' : 'bg-[radial-gradient(ellipse_at_top,#eeeef8_0%,#F8F8FC_50%,#ebebf2_100%)]'" />
      <div class="absolute -top-[100px] left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full blur-[120px] animate-[blob-float_10s_ease-in-out_infinite]" :class="themeStore.isDark ? 'bg-[rgba(94,106,210,0.15)]' : 'bg-[rgba(94,106,210,0.07)]'" />
    </div>

    <main class="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">

      <!-- Page heading -->
      <div class="mb-8">
        <div class="mb-2 flex items-center gap-3">
          <span
            class="inline-block rounded-full border px-3 py-0.5 font-mono text-xs tracking-widest uppercase"
            :class="themeStore.isDark ? 'border-[rgba(94,106,210,0.30)] text-[#5E6AD2]' : 'border-[rgba(94,106,210,0.25)] text-[#5E6AD2]'"
          >Ranking</span>
        </div>
        <h1
          class="text-2xl font-semibold tracking-tight"
          :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'"
        >Peringkat Novel</h1>
        <p class="mt-1 text-sm" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">
          Novel terpopuler berdasarkan jumlah pembaca unik dalam periode yang dipilih.
        </p>
      </div>

      <!-- Period tabs -->
      <div class="mb-6 flex gap-2" role="tablist" aria-label="Pilih periode peringkat">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          role="tab"
          :aria-selected="period === tab.id"
          :aria-controls="`panel-${tab.id}`"
          class="rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
          :class="period === tab.id
            ? themeStore.isDark
              ? 'border-[rgba(94,106,210,0.50)] bg-[rgba(94,106,210,0.15)] text-[#EDEDEF] shadow-[0_0_12px_rgba(94,106,210,0.2)] focus:ring-offset-[#050506]'
              : 'border-[rgba(94,106,210,0.40)] bg-[rgba(94,106,210,0.10)] text-[#5E6AD2] focus:ring-offset-[#F8F8FC]'
            : themeStore.isDark
              ? 'border-[rgba(255,255,255,0.06)] bg-white/[0.04] text-[#8A8F98] hover:border-[rgba(255,255,255,0.10)] hover:bg-white/[0.07] hover:text-[#EDEDEF] focus:ring-offset-[#050506]'
              : 'border-[rgba(0,0,0,0.08)] bg-black/[0.03] text-[#6B7080] hover:border-[rgba(0,0,0,0.12)] hover:bg-black/[0.06] hover:text-[#111118] focus:ring-offset-[#F8F8FC]'"
          @click="period = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Loading skeleton -->
      <div
        v-if="loading"
        :id="`panel-${period}`"
        role="tabpanel"
        class="space-y-2"
        aria-busy="true"
        aria-label="Memuat peringkat..."
      >
        <div
          v-for="n in 15"
          :key="n"
          class="flex animate-pulse items-center gap-4 rounded-xl p-3"
          :class="themeStore.isDark ? 'bg-white/[0.04]' : 'bg-black/[0.03]'"
        >
          <div class="h-8 w-8 shrink-0 rounded-full" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
          <div class="h-14 w-10 shrink-0 rounded-lg" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
          <div class="flex-1 space-y-2">
            <div class="h-4 w-3/4 rounded" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
            <div class="h-3 w-1/2 rounded" :class="themeStore.isDark ? 'bg-white/[0.05]' : 'bg-black/[0.05]'" />
          </div>
          <div class="flex shrink-0 flex-col items-end gap-1.5">
            <div class="h-5 w-20 rounded-full" :class="themeStore.isDark ? 'bg-white/[0.06]' : 'bg-black/[0.05]'" />
            <div class="h-4 w-12 rounded" :class="themeStore.isDark ? 'bg-white/[0.06]' : 'bg-black/[0.05]'" />
          </div>
        </div>
      </div>

      <!-- Error state -->
      <ErrorMessage v-else-if="error" :message="error" :retryable="true" @retry="loadLeaderboard" />

      <!-- Leaderboard list -->
      <div
        v-else
        :id="`panel-${period}`"
        role="tabpanel"
        class="space-y-1.5"
      >
        <p
          v-if="entries.length === 0"
          class="py-12 text-center text-sm"
          :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'"
        >
          Belum ada data peringkat untuk periode ini.
        </p>

        <LeaderboardItem
          v-for="entry in entries"
          :key="entry.novelId"
          :entry="entry"
          :rank="entry.rank"
        />
      </div>

    </main>
  </div>
</template>
