<script setup lang="ts">
// DiscoveryPage — pusat rekomendasi novel di route /discovery.
// Memuat tiga section secara paralel via Promise.allSettled:
//   1. Popular by Genre — tab genre + grid NovelCard + "Lihat Semua" → /catalog?genres=<genreId>
//   2. Random Pick — 3 novel acak + tombol "Acak Lagi"
//   3. Latest Updates — daftar LatestUpdateItem; kosong → "Belum ada update hari ini"
// Setiap section memiliki loading skeleton dan error state independen.
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5,
//               4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 15.1, 15.2, 15.3, 15.4, 15.5

import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchPopularByGenre, fetchRandomPick, fetchLatestUpdates } from '@/api'
import { useSeoMeta } from '@/composables/useSeoMeta'
import { useThemeStore } from '@/stores/theme'
import type { NovelSummary, LatestUpdateEntry } from '@/types'
import NovelCard from '@/components/NovelCard.vue'
import LatestUpdateItem from '@/components/LatestUpdateItem.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'

useSeoMeta(
  'Discovery — Novel Reader',
  'Temukan novel baru: populer per genre, pilihan acak, dan update chapter terbaru.',
)

const router = useRouter()
const themeStore = useThemeStore()

// ── Genre list (hardcoded dari mock data) ──────────────────────────────────────

interface GenreTab {
  id: string
  label: string
}

const GENRE_TABS: GenreTab[] = [
  { id: 'Action', label: 'Action' },
  { id: 'Fantasy', label: 'Fantasy' },
  { id: 'Romance', label: 'Romance' },
  { id: 'Mystery', label: 'Mystery' },
  { id: 'Sci-Fi', label: 'Sci-Fi' },
  { id: 'Horror', label: 'Horror' },
  { id: 'Adventure', label: 'Adventure' },
  { id: 'Isekai', label: 'Isekai' },
]

// ── Section 1: Popular by Genre ────────────────────────────────────────────────

const selectedGenre = ref<string>(GENRE_TABS[0].id)
const popularNovels = ref<NovelSummary[]>([])
const popularLoading = ref(true)
const popularError = ref<string | null>(null)

async function loadPopularByGenre(genre: string): Promise<void> {
  popularLoading.value = true
  popularError.value = null
  try {
    popularNovels.value = await fetchPopularByGenre(genre)
  } catch (err) {
    popularError.value = err instanceof Error ? err.message : 'Gagal memuat novel populer per genre.'
  } finally {
    popularLoading.value = false
  }
}

async function selectGenre(genre: string): Promise<void> {
  selectedGenre.value = genre
  await loadPopularByGenre(genre)
}

function goToCatalogByGenre(genreId: string): void {
  router.push({ path: '/catalog', query: { genres: genreId } })
}

// ── Section 2: Random Pick ─────────────────────────────────────────────────────

const randomNovels = ref<NovelSummary[]>([])
const randomLoading = ref(true)
const randomError = ref<string | null>(null)

async function loadRandomPick(): Promise<void> {
  randomLoading.value = true
  randomError.value = null
  try {
    randomNovels.value = await fetchRandomPick()
  } catch (err) {
    randomError.value = err instanceof Error ? err.message : 'Gagal memuat novel acak.'
  } finally {
    randomLoading.value = false
  }
}

async function refreshRandomPick(): Promise<void> {
  await loadRandomPick()
}

// ── Section 3: Latest Updates ──────────────────────────────────────────────────

const latestUpdates = ref<LatestUpdateEntry[]>([])
const latestLoading = ref(true)
const latestError = ref<string | null>(null)

async function loadLatestUpdates(): Promise<void> {
  latestLoading.value = true
  latestError.value = null
  try {
    latestUpdates.value = await fetchLatestUpdates()
  } catch (err) {
    latestError.value = err instanceof Error ? err.message : 'Gagal memuat update terbaru.'
  } finally {
    latestLoading.value = false
  }
}

// ── Lifecycle — muat semua section secara paralel (Req 15.3) ──────────────────

onMounted(async () => {
  await Promise.allSettled([
    loadPopularByGenre(selectedGenre.value),
    loadRandomPick(),
    loadLatestUpdates(),
  ])
})

// ── Navigation ─────────────────────────────────────────────────────────────────

function goToLeaderboard(): void {
  router.push('/leaderboard')
}
</script>

<template>
  <div
    class="relative min-h-screen transition-colors duration-300"
    :class="themeStore.isDark ? 'bg-[#050506] text-[#EDEDEF]' : 'bg-[#F8F8FC] text-[#111118]'"
  >
    <!-- Ambient background -->
    <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div class="absolute inset-0" :class="themeStore.isDark ? 'bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)]' : 'bg-[radial-gradient(ellipse_at_top,#eeeef8_0%,#F8F8FC_50%,#ebebf2_100%)]'" />
      <div class="absolute -top-[150px] left-1/2 h-[700px] w-[1100px] -translate-x-1/2 rounded-full blur-[130px] animate-[blob-float_10s_ease-in-out_infinite]" :class="themeStore.isDark ? 'bg-[rgba(94,106,210,0.18)]' : 'bg-[rgba(94,106,210,0.08)]'" />
      <div class="absolute left-[-100px] top-[40%] h-[500px] w-[400px] rounded-full blur-[100px] animate-[blob-float_8s_ease-in-out_3s_infinite]" :class="themeStore.isDark ? 'bg-[rgba(120,80,200,0.12)]' : 'bg-[rgba(120,80,200,0.05)]'" />
    </div>

    <main class="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

      <!-- Page header -->
      <div class="mb-10">
        <div class="mb-2 flex items-center gap-3">
          <span
            class="inline-block rounded-full border px-3 py-0.5 font-mono text-xs tracking-widest uppercase"
            :class="themeStore.isDark ? 'border-[rgba(94,106,210,0.30)] text-[#5E6AD2]' : 'border-[rgba(94,106,210,0.25)] text-[#5E6AD2]'"
          >Explore</span>
        </div>
        <h1
          class="text-2xl font-semibold tracking-tight"
          :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'"
        >Discovery</h1>
        <p class="mt-1 text-sm" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">
          Temukan novel baru yang menarik untukmu.
        </p>
      </div>

      <!-- ── 1. Popular by Genre ──────────────────────────────────────────── -->
      <section class="mb-14" aria-label="Populer per Genre">
        <div class="mb-5 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="inline-block rounded-full border px-3 py-0.5 font-mono text-xs tracking-widest uppercase" :class="themeStore.isDark ? 'border-[rgba(94,106,210,0.30)] text-[#5E6AD2]' : 'border-[rgba(94,106,210,0.25)] text-[#5E6AD2]'">Genre</span>
            <h2 class="text-xl font-semibold tracking-tight" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">Populer per Genre</h2>
          </div>
          <button
            type="button"
            class="group inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
            :class="themeStore.isDark ? 'text-[#8A8F98] hover:bg-white/[0.05] hover:text-[#EDEDEF] focus:ring-offset-[#050506]' : 'text-[#6B7080] hover:bg-black/[0.04] hover:text-[#111118] focus:ring-offset-[#F8F8FC]'"
            @click="goToCatalogByGenre(selectedGenre)"
          >
            Lihat Semua
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Loading skeleton -->
        <div v-if="popularLoading">
          <div class="mb-4 flex flex-wrap gap-2">
            <div v-for="n in 5" :key="n" class="h-8 w-20 animate-pulse rounded-full" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
          </div>
          <SkeletonLoader :count="6" />
        </div>

        <ErrorMessage v-else-if="popularError" :message="popularError" :retryable="true" @retry="loadPopularByGenre(selectedGenre)" />

        <template v-else>
          <!-- Genre tabs -->
          <div class="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Pilih genre">
            <button
              v-for="tab in GENRE_TABS"
              :key="tab.id"
              type="button"
              role="tab"
              :aria-selected="selectedGenre === tab.id"
              class="rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
              :class="selectedGenre === tab.id
                ? themeStore.isDark
                  ? 'border-[rgba(94,106,210,0.50)] bg-[rgba(94,106,210,0.15)] text-[#EDEDEF] shadow-[0_0_12px_rgba(94,106,210,0.2)] focus:ring-offset-[#050506]'
                  : 'border-[rgba(94,106,210,0.40)] bg-[rgba(94,106,210,0.10)] text-[#5E6AD2] focus:ring-offset-[#F8F8FC]'
                : themeStore.isDark
                  ? 'border-[rgba(255,255,255,0.06)] bg-white/[0.04] text-[#8A8F98] hover:border-[rgba(255,255,255,0.10)] hover:bg-white/[0.07] hover:text-[#EDEDEF] focus:ring-offset-[#050506]'
                  : 'border-[rgba(0,0,0,0.08)] bg-black/[0.03] text-[#6B7080] hover:border-[rgba(0,0,0,0.12)] hover:bg-black/[0.06] hover:text-[#111118] focus:ring-offset-[#F8F8FC]'"
              @click="selectGenre(tab.id)"
            >
              {{ tab.label }}
            </button>
          </div>

          <div v-if="popularNovels.length > 0" class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" role="tabpanel" :aria-label="`Novel populer genre ${selectedGenre}`">
            <NovelCard v-for="novel in popularNovels" :key="novel.id" :novel="novel" />
          </div>
          <p v-else class="text-sm" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">
            Tidak ada novel untuk genre ini.
          </p>
        </template>
      </section>

      <!-- ── 2. Random Pick ──────────────────────────────────────────────── -->
      <section class="mb-14" aria-label="Novel Acak">
        <div class="mb-5 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="inline-block rounded-full border px-3 py-0.5 font-mono text-xs tracking-widest uppercase" :class="themeStore.isDark ? 'border-[rgba(94,106,210,0.30)] text-[#5E6AD2]' : 'border-[rgba(94,106,210,0.25)] text-[#5E6AD2]'">Acak</span>
            <h2 class="text-xl font-semibold tracking-tight" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">Random Pick</h2>
          </div>
          <button
            type="button"
            :disabled="randomLoading"
            class="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
            :class="themeStore.isDark
              ? 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:bg-[#6872D9] focus:ring-offset-[#050506]'
              : 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.4),0_4px_12px_rgba(94,106,210,0.25)] hover:bg-[#6872D9] focus:ring-offset-[#F8F8FC]'"
            @click="refreshRandomPick"
          >
            <svg v-if="randomLoading" class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Acak Lagi
          </button>
        </div>

        <div v-if="randomLoading"><SkeletonLoader :count="3" /></div>
        <ErrorMessage v-else-if="randomError" :message="randomError" :retryable="true" @retry="refreshRandomPick" />
        <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          <NovelCard v-for="novel in randomNovels" :key="novel.id" :novel="novel" />
          <p v-if="randomNovels.length === 0" class="col-span-full text-sm" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">
            Tidak ada novel acak tersedia.
          </p>
        </div>
      </section>

      <!-- ── 3. Latest Updates ───────────────────────────────────────────── -->
      <section class="mb-14" aria-label="Update Terbaru">
        <div class="mb-5 flex items-center gap-3">
          <span class="inline-block rounded-full border px-3 py-0.5 font-mono text-xs tracking-widest uppercase" :class="themeStore.isDark ? 'border-[rgba(94,106,210,0.30)] text-[#5E6AD2]' : 'border-[rgba(94,106,210,0.25)] text-[#5E6AD2]'">Live</span>
          <h2 class="text-xl font-semibold tracking-tight" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">Update Terbaru</h2>
        </div>

        <!-- Loading skeleton -->
        <div v-if="latestLoading" class="space-y-2" aria-busy="true" aria-label="Memuat update terbaru...">
          <div v-for="n in 5" :key="n" class="flex animate-pulse items-center gap-3 rounded-xl p-3" :class="themeStore.isDark ? 'bg-white/[0.04]' : 'bg-black/[0.03]'">
            <div class="h-12 w-9 shrink-0 rounded-lg" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
            <div class="flex-1 space-y-2">
              <div class="h-4 w-3/4 rounded" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
              <div class="h-3 w-1/2 rounded" :class="themeStore.isDark ? 'bg-white/[0.05]' : 'bg-black/[0.05]'" />
            </div>
            <div class="h-3 w-16 rounded" :class="themeStore.isDark ? 'bg-white/[0.05]' : 'bg-black/[0.05]'" />
          </div>
        </div>

        <ErrorMessage v-else-if="latestError" :message="latestError" :retryable="true" @retry="loadLatestUpdates" />
        <p v-else-if="latestUpdates.length === 0" class="text-sm" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">
          Belum ada update hari ini.
        </p>
        <div v-else class="space-y-1.5">
          <LatestUpdateItem
            v-for="entry in latestUpdates.slice(0, 20)"
            :key="`${entry.novelId}-${entry.chapterNumber}`"
            :entry="entry"
          />
        </div>
      </section>

      <!-- Leaderboard CTA -->
      <div class="flex justify-center">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
          :class="themeStore.isDark
            ? 'border-[rgba(94,106,210,0.30)] bg-[rgba(94,106,210,0.08)] text-[#EDEDEF] hover:border-[rgba(94,106,210,0.50)] hover:bg-[rgba(94,106,210,0.15)] hover:shadow-[0_0_20px_rgba(94,106,210,0.15)] focus:ring-offset-[#050506]'
            : 'border-[rgba(94,106,210,0.25)] bg-[rgba(94,106,210,0.06)] text-[#5E6AD2] hover:border-[rgba(94,106,210,0.40)] hover:bg-[rgba(94,106,210,0.12)] focus:ring-offset-[#F8F8FC]'"
          @click="goToLeaderboard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Lihat Peringkat Novel
        </button>
      </div>

    </main>
  </div>
</template>
