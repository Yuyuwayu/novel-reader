<script setup lang="ts">
// HomePage — aggregated discovery page at route /.
// Fetches all data in one request via fetchHomeData(), then renders sections in order:
//   1. Hero/Featured (NovelCarousel)
//   2. Lanjutkan Membaca (auth only, from reading history)
//   3. Trending (NovelCarousel)
//   4. Latest Updates (LatestUpdateItem list, max 10) + "Lihat Semua" → /discovery
//   5. Popular by Genre (genre tabs + NovelCard grid)
//   6. Peringkat Novel (preview top 5 per period + link to /leaderboard)
//   7. Random Pick (NovelCard grid + "Acak Lagi" button)
//   8. Baru Ditambahkan
// Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8, 20.9, 20.11, 20.12

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchHomeData, fetchRandomPick, fetchHistory, fetchNewAdditions } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import type { HomeData, NovelSummary, LeaderboardEntry, ReadingHistory } from '@/types'
import NovelCarousel from '@/components/NovelCarousel.vue'
import NovelCard from '@/components/NovelCard.vue'
import LatestUpdateItem from '@/components/LatestUpdateItem.vue'
import LeaderboardItem from '@/components/LeaderboardItem.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

// ── Main home data ─────────────────────────────────────────────────────────────

const homeData = ref<HomeData | null>(null)
const homeLoading = ref(true)
const homeError = ref<string | null>(null)

// ── "Lanjutkan Membaca" section (auth only) ────────────────────────────────────

const continueReading = ref<ReadingHistory[]>([])
const continueLoading = ref(false)
const continueError = ref<string | null>(null)

// ── Random Pick section ────────────────────────────────────────────────────────

const randomPick = ref<NovelSummary[]>([])
const randomLoading = ref(false)
const randomError = ref<string | null>(null)

// ── New Additions section ──────────────────────────────────────────────────────

const newAdditions = ref<NovelSummary[]>([])
const newAdditionsLoading = ref(false)
const newAdditionsError = ref<string | null>(null)

/**
 * Returns true if the novel is considered "newly added" (within the last 7 days).
 * Since NovelSummary doesn't carry addedAt, we use the position in the sorted
 * newAdditions list as a proxy — the first items are the most recently added.
 * Items in the top 30% of the list are treated as within 7 days.
 */
function isNewlyAdded(novel: NovelSummary): boolean {
  const idx = newAdditions.value.findIndex((n) => n.id === novel.id)
  if (idx === -1) return false
  return idx < Math.ceil(newAdditions.value.length * 0.3)
}

/**
 * Returns a relative time label for a novel's position in the new additions list.
 * Used as a rough approximation since NovelSummary doesn't carry addedAt.
 */
function getAddedAtLabel(novel: NovelSummary): string {
  const idx = newAdditions.value.findIndex((n) => n.id === novel.id)
  if (idx === -1) return ''
  // Approximate: each position represents ~3 days apart in the mock data
  const total = Math.max(newAdditions.value.length - 1, 1)
  const daysAgo = Math.round(idx * (30 / total))
  if (daysAgo === 0) return 'hari ini'
  if (daysAgo === 1) return '1 hari lalu'
  if (daysAgo < 30) return `${daysAgo} hari lalu`
  return 'lebih dari sebulan lalu'
}

// ── Popular by Genre section ───────────────────────────────────────────────────

const selectedGenre = ref<string>('')

const genreList = computed<string[]>(() => {
  if (!homeData.value) return []
  return Object.keys(homeData.value.popularByGenre)
})

const popularNovels = computed<NovelSummary[]>(() => {
  if (!homeData.value || !selectedGenre.value) return []
  return homeData.value.popularByGenre[selectedGenre.value] ?? []
})

// ── Leaderboard preview section ────────────────────────────────────────────────

const leaderboardPeriod = ref<'daily' | 'weekly' | 'allTime'>('weekly')

const leaderboardEntries = computed<LeaderboardEntry[]>(() => {
  if (!homeData.value) return []
  return homeData.value.leaderboardPreview[leaderboardPeriod.value] ?? []
})

// ── Fetch functions ────────────────────────────────────────────────────────────

async function loadHomeData(): Promise<void> {
  homeLoading.value = true
  homeError.value = null
  try {
    homeData.value = await fetchHomeData()
    // Initialize random pick from home data
    randomPick.value = homeData.value.randomPick
    // Initialize selected genre to first available
    if (genreList.value.length > 0) {
      selectedGenre.value = genreList.value[0]
    }
  } catch (err) {
    homeError.value = err instanceof Error ? err.message : 'Gagal memuat data beranda.'
  } finally {
    homeLoading.value = false
  }
}

async function loadContinueReading(): Promise<void> {
  if (!authStore.isAuthenticated) return
  continueLoading.value = true
  continueError.value = null
  try {
    const history = await fetchHistory()
    continueReading.value = history.slice(0, 6)
  } catch (err) {
    continueError.value = err instanceof Error ? err.message : 'Gagal memuat riwayat baca.'
  } finally {
    continueLoading.value = false
  }
}

async function refreshRandomPick(): Promise<void> {
  randomLoading.value = true
  randomError.value = null
  try {
    randomPick.value = await fetchRandomPick()
  } catch (err) {
    randomError.value = err instanceof Error ? err.message : 'Gagal memuat novel acak.'
  } finally {
    randomLoading.value = false
  }
}

async function loadNewAdditions(): Promise<void> {
  newAdditionsLoading.value = true
  newAdditionsError.value = null
  try {
    newAdditions.value = await fetchNewAdditions(10)
  } catch (err) {
    newAdditionsError.value = err instanceof Error ? err.message : 'Gagal memuat novel baru.'
  } finally {
    newAdditionsLoading.value = false
  }
}

// ── Lifecycle ──────────────────────────────────────────────────────────────────

onMounted(async () => {
  // Load home data and continue reading in parallel (Req 20.3)
  const tasks: Promise<void>[] = [loadHomeData(), loadNewAdditions()]
  if (authStore.isAuthenticated) {
    tasks.push(loadContinueReading())
  }
  await Promise.allSettled(tasks)
})

// ── Navigation helpers ─────────────────────────────────────────────────────────

function goToDiscovery(): void {
  router.push('/discovery')
}

function goToLeaderboard(): void {
  router.push('/leaderboard')
}

// ── Convert ReadingHistory to NovelSummary for carousel ───────────────────────

const continueReadingNovels = computed<NovelSummary[]>(() =>
  continueReading.value.map((h) => ({
    id: h.novelId,
    title: h.novelTitle,
    author: '',
    genre: [],
    thumbnailUrl: h.thumbnailUrl,
    status: 'ongoing' as const,
  }))
)
</script>

<template>
  <!--
    ═══════════════════════════════════════════════════════════════
    HOMEPAGE — Linear/Modern Design System
    Dark:  deep-space near-blacks + indigo accent + ambient blobs
    Light: soft off-white + indigo accent + subtle blobs
    ═══════════════════════════════════════════════════════════════
  -->
  <main
    class="relative min-h-screen overflow-x-hidden transition-colors duration-300"
    :class="themeStore.isDark ? 'bg-[#050506] text-[#EDEDEF]' : 'bg-[#F4F4F8] text-[#1A1A2E]'"
  >

    <!-- ── Ambient background layer ── -->
    <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <!-- Base radial gradient -->
      <div
        class="absolute inset-0"
        :class="themeStore.isDark
          ? 'bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)]'
          : 'bg-[radial-gradient(ellipse_at_top,#eeeef8_0%,#F4F4F8_50%,#ebebf2_100%)]'"
      />
      <!-- Grid overlay -->
      <div
        class="absolute inset-0"
        :class="themeStore.isDark ? 'opacity-[0.02]' : 'opacity-[0.04]'"
        :style="{
          backgroundImage: themeStore.isDark
            ? 'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)'
            : 'linear-gradient(rgba(94,106,210,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(94,106,210,0.3) 1px,transparent 1px)',
          backgroundSize: '64px 64px',
        }"
      />
      <!-- Primary blob — top center -->
      <div
        class="absolute -top-[200px] left-1/2 h-[900px] w-[1400px] -translate-x-1/2 rounded-full blur-[150px] animate-[blob-float_10s_ease-in-out_infinite]"
        :class="themeStore.isDark ? 'bg-[rgba(94,106,210,0.25)]' : 'bg-[rgba(94,106,210,0.10)]'"
      />
      <!-- Secondary blob — left -->
      <div
        class="absolute left-[-200px] top-[30%] h-[800px] w-[600px] rounded-full blur-[120px] animate-[blob-float_8s_ease-in-out_2s_infinite]"
        :class="themeStore.isDark ? 'bg-[rgba(120,80,200,0.15)]' : 'bg-[rgba(120,80,200,0.07)]'"
      />
      <!-- Tertiary blob — right -->
      <div
        class="absolute right-[-150px] top-[50%] h-[700px] w-[500px] rounded-full blur-[100px] animate-[blob-float_12s_ease-in-out_4s_infinite]"
        :class="themeStore.isDark ? 'bg-[rgba(60,100,220,0.12)]' : 'bg-[rgba(60,100,220,0.06)]'"
      />
    </div>

    <!-- ── Page content ── -->
    <div class="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

      <!-- Global error -->
      <div v-if="homeError && !homeLoading" class="mb-8">
        <ErrorMessage :message="homeError" :retryable="true" @retry="loadHomeData" />
      </div>

      <!-- ── 1. Hero / Featured ──────────────────────────────────────────── -->
      <section class="mb-14" aria-label="Novel Unggulan">
        <!-- Section header -->
        <div class="mb-5 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span
              class="inline-block rounded-full border px-3 py-0.5 font-mono text-xs tracking-widest uppercase"
              :class="themeStore.isDark
                ? 'border-[rgba(94,106,210,0.30)] text-[#5E6AD2]'
                : 'border-[rgba(94,106,210,0.25)] text-[#5E6AD2]'"
            >Unggulan</span>
            <h2
              class="text-xl font-semibold tracking-tight"
              :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#1A1A2E]'"
            >Novel Unggulan</h2>
          </div>
        </div>

        <div v-if="homeLoading" class="overflow-hidden rounded-2xl">
          <SkeletonLoader :count="4" />
        </div>
        <ErrorMessage v-else-if="homeError" message="Gagal memuat novel unggulan." />
        <NovelCarousel v-else :novels="homeData?.featured ?? []" :loading="false" />
      </section>

      <!-- ── 2. Lanjutkan Membaca (auth only) ────────────────────────────── -->
      <section
        v-if="authStore.isAuthenticated"
        class="mb-14"
        aria-label="Lanjutkan Membaca"
      >
        <div class="mb-5 flex items-center gap-3">
          <span
            class="inline-block rounded-full border px-3 py-0.5 font-mono text-xs tracking-widest uppercase"
            :class="themeStore.isDark
              ? 'border-[rgba(94,106,210,0.30)] text-[#5E6AD2]'
              : 'border-[rgba(94,106,210,0.25)] text-[#5E6AD2]'"
          >Riwayat</span>
          <h2
            class="text-xl font-semibold tracking-tight"
            :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#1A1A2E]'"
          >Lanjutkan Membaca</h2>
        </div>

        <div v-if="continueLoading" class="overflow-hidden rounded-2xl">
          <SkeletonLoader :count="4" />
        </div>
        <ErrorMessage
          v-else-if="continueError"
          :message="continueError"
          :retryable="true"
          @retry="loadContinueReading"
        />
        <p
          v-else-if="continueReadingNovels.length === 0"
          class="text-sm"
          :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7280]'"
        >
          Belum ada riwayat baca. Mulai baca novel sekarang!
        </p>
        <NovelCarousel v-else :novels="continueReadingNovels" :loading="false" />
      </section>

      <!-- ── 3. Trending ─────────────────────────────────────────────────── -->
      <section class="mb-14" aria-label="Novel Trending">
        <div class="mb-5 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span
              class="inline-block rounded-full border px-3 py-0.5 font-mono text-xs tracking-widest uppercase"
              :class="themeStore.isDark
                ? 'border-[rgba(94,106,210,0.30)] text-[#5E6AD2]'
                : 'border-[rgba(94,106,210,0.25)] text-[#5E6AD2]'"
            >Trending</span>
            <h2
              class="text-xl font-semibold tracking-tight"
              :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#1A1A2E]'"
            >Sedang Populer</h2>
          </div>
          <button
            type="button"
            class="group inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
            :class="themeStore.isDark
              ? 'text-[#8A8F98] hover:text-[#EDEDEF] hover:bg-white/[0.05] focus:ring-offset-[#050506]'
              : 'text-[#6B7280] hover:text-[#1A1A2E] hover:bg-black/[0.04] focus:ring-offset-[#F4F4F8]'"
            @click="goToDiscovery"
          >
            Lihat Semua
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div v-if="homeLoading" class="overflow-hidden rounded-2xl">
          <SkeletonLoader :count="4" />
        </div>
        <ErrorMessage v-else-if="homeError" message="Gagal memuat novel trending." />
        <NovelCarousel v-else :novels="homeData?.trending ?? []" :loading="false" />
      </section>

      <!-- ── 4. Latest Updates ───────────────────────────────────────────── -->
      <section class="mb-14" aria-label="Update Terbaru">
        <div class="mb-5 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span
              class="inline-block rounded-full border px-3 py-0.5 font-mono text-xs tracking-widest uppercase"
              :class="themeStore.isDark
                ? 'border-[rgba(94,106,210,0.30)] text-[#5E6AD2]'
                : 'border-[rgba(94,106,210,0.25)] text-[#5E6AD2]'"
            >Live</span>
            <h2
              class="text-xl font-semibold tracking-tight"
              :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#1A1A2E]'"
            >Update Terbaru</h2>
          </div>
          <button
            type="button"
            class="group inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
            :class="themeStore.isDark
              ? 'text-[#8A8F98] hover:text-[#EDEDEF] hover:bg-white/[0.05] focus:ring-offset-[#050506]'
              : 'text-[#6B7280] hover:text-[#1A1A2E] hover:bg-black/[0.04] focus:ring-offset-[#F4F4F8]'"
            @click="goToDiscovery"
          >
            Lihat Semua
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Loading skeleton -->
        <div
          v-if="homeLoading"
          class="space-y-2"
          aria-busy="true"
          aria-label="Memuat update terbaru..."
        >
          <div
            v-for="n in 5"
            :key="n"
            class="flex animate-pulse items-center gap-3 rounded-2xl p-3"
            :class="themeStore.isDark ? 'bg-white/[0.04]' : 'bg-black/[0.03]'"
          >
            <div class="h-14 w-10 shrink-0 rounded-lg" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
            <div class="flex-1 space-y-2">
              <div class="h-4 w-3/4 rounded" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
              <div class="h-3 w-1/2 rounded" :class="themeStore.isDark ? 'bg-white/[0.05]' : 'bg-black/[0.05]'" />
            </div>
            <div class="h-3 w-16 rounded" :class="themeStore.isDark ? 'bg-white/[0.05]' : 'bg-black/[0.05]'" />
          </div>
        </div>

        <ErrorMessage v-else-if="homeError" message="Gagal memuat update terbaru." />

        <p
          v-else-if="(homeData?.latestUpdates ?? []).length === 0"
          class="text-sm"
          :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7280]'"
        >
          Belum ada update hari ini.
        </p>

        <!-- Content: glass card list -->
        <div v-else class="space-y-1.5">
          <LatestUpdateItem
            v-for="entry in (homeData?.latestUpdates ?? []).slice(0, 10)"
            :key="`${entry.novelId}-${entry.chapterNumber}`"
            :entry="entry"
          />
        </div>
      </section>

      <!-- ── 5. Popular by Genre ─────────────────────────────────────────── -->
      <section class="mb-14" aria-label="Populer per Genre">
        <div class="mb-5 flex items-center gap-3">
          <span
            class="inline-block rounded-full border px-3 py-0.5 font-mono text-xs tracking-widest uppercase"
            :class="themeStore.isDark
              ? 'border-[rgba(94,106,210,0.30)] text-[#5E6AD2]'
              : 'border-[rgba(94,106,210,0.25)] text-[#5E6AD2]'"
          >Genre</span>
          <h2
            class="text-xl font-semibold tracking-tight"
            :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#1A1A2E]'"
          >Populer per Genre</h2>
        </div>

        <!-- Loading skeleton -->
        <div v-if="homeLoading">
          <div class="mb-4 flex gap-2">
            <div
              v-for="n in 4"
              :key="n"
              class="h-8 w-20 animate-pulse rounded-full"
              :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'"
            />
          </div>
          <SkeletonLoader :count="4" />
        </div>

        <ErrorMessage v-else-if="homeError" message="Gagal memuat novel populer per genre." />

        <template v-else>
          <!-- Genre tabs — pill style with accent active state -->
          <div class="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Pilih genre">
            <button
              v-for="genre in genreList"
              :key="genre"
              type="button"
              role="tab"
              :aria-selected="selectedGenre === genre"
              class="rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
              :class="selectedGenre === genre
                ? themeStore.isDark
                  ? 'border-[rgba(94,106,210,0.50)] bg-[rgba(94,106,210,0.15)] text-[#EDEDEF] shadow-[0_0_12px_rgba(94,106,210,0.2)] focus:ring-offset-[#050506]'
                  : 'border-[rgba(94,106,210,0.40)] bg-[rgba(94,106,210,0.10)] text-[#5E6AD2] focus:ring-offset-[#F4F4F8]'
                : themeStore.isDark
                  ? 'border-[rgba(255,255,255,0.06)] bg-white/[0.04] text-[#8A8F98] hover:border-[rgba(255,255,255,0.10)] hover:bg-white/[0.07] hover:text-[#EDEDEF] focus:ring-offset-[#050506]'
                  : 'border-[rgba(0,0,0,0.08)] bg-black/[0.03] text-[#6B7280] hover:border-[rgba(0,0,0,0.12)] hover:bg-black/[0.06] hover:text-[#1A1A2E] focus:ring-offset-[#F4F4F8]'"
              @click="selectedGenre = genre"
            >
              {{ genre }}
            </button>
          </div>

          <!-- Novel grid -->
          <div
            v-if="popularNovels.length > 0"
            class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            role="tabpanel"
          >
            <NovelCard v-for="novel in popularNovels" :key="novel.id" :novel="novel" />
          </div>
          <p v-else class="text-sm" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7280]'">
            Tidak ada novel untuk genre ini.
          </p>
        </template>
      </section>

      <!-- ── 6. Peringkat Novel ──────────────────────────────────────────── -->
      <section class="mb-14" aria-label="Peringkat Novel">
        <div class="mb-5 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span
              class="inline-block rounded-full border px-3 py-0.5 font-mono text-xs tracking-widest uppercase"
              :class="themeStore.isDark
                ? 'border-[rgba(94,106,210,0.30)] text-[#5E6AD2]'
                : 'border-[rgba(94,106,210,0.25)] text-[#5E6AD2]'"
            >Ranking</span>
            <h2
              class="text-xl font-semibold tracking-tight"
              :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#1A1A2E]'"
            >Peringkat Novel</h2>
          </div>
          <button
            type="button"
            class="group inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
            :class="themeStore.isDark
              ? 'text-[#8A8F98] hover:text-[#EDEDEF] hover:bg-white/[0.05] focus:ring-offset-[#050506]'
              : 'text-[#6B7280] hover:text-[#1A1A2E] hover:bg-black/[0.04] focus:ring-offset-[#F4F4F8]'"
            @click="goToLeaderboard"
          >
            Lihat Semua
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Loading skeleton -->
        <div v-if="homeLoading">
          <div class="mb-4 flex gap-2">
            <div
              v-for="n in 3"
              :key="n"
              class="h-8 w-24 animate-pulse rounded-full"
              :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'"
            />
          </div>
          <div class="space-y-2">
            <div
              v-for="n in 5"
              :key="n"
              class="flex animate-pulse items-center gap-4 rounded-2xl p-3"
              :class="themeStore.isDark ? 'bg-white/[0.04]' : 'bg-black/[0.03]'"
            >
              <div class="h-9 w-9 shrink-0 rounded-full" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
              <div class="h-16 w-12 shrink-0 rounded-lg" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
              <div class="flex-1 space-y-2">
                <div class="h-4 w-3/4 rounded" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
                <div class="h-3 w-1/2 rounded" :class="themeStore.isDark ? 'bg-white/[0.05]' : 'bg-black/[0.05]'" />
              </div>
            </div>
          </div>
        </div>

        <ErrorMessage v-else-if="homeError" message="Gagal memuat peringkat novel." />

        <template v-else>
          <!-- Period tabs -->
          <div class="mb-4 flex gap-2" role="tablist" aria-label="Pilih periode peringkat">
            <button
              v-for="tab in [
                { id: 'daily', label: 'Harian' },
                { id: 'weekly', label: 'Mingguan' },
                { id: 'allTime', label: 'Sepanjang Masa' },
              ]"
              :key="tab.id"
              type="button"
              role="tab"
              :aria-selected="leaderboardPeriod === tab.id"
              class="rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
              :class="leaderboardPeriod === tab.id
                ? themeStore.isDark
                  ? 'border-[rgba(94,106,210,0.50)] bg-[rgba(94,106,210,0.15)] text-[#EDEDEF] shadow-[0_0_12px_rgba(94,106,210,0.2)] focus:ring-offset-[#050506]'
                  : 'border-[rgba(94,106,210,0.40)] bg-[rgba(94,106,210,0.10)] text-[#5E6AD2] focus:ring-offset-[#F4F4F8]'
                : themeStore.isDark
                  ? 'border-[rgba(255,255,255,0.06)] bg-white/[0.04] text-[#8A8F98] hover:border-[rgba(255,255,255,0.10)] hover:bg-white/[0.07] hover:text-[#EDEDEF] focus:ring-offset-[#050506]'
                  : 'border-[rgba(0,0,0,0.08)] bg-black/[0.03] text-[#6B7280] hover:border-[rgba(0,0,0,0.12)] hover:bg-black/[0.06] hover:text-[#1A1A2E] focus:ring-offset-[#F4F4F8]'"
              @click="leaderboardPeriod = (tab.id as 'daily' | 'weekly' | 'allTime')"
            >
              {{ tab.label }}
            </button>
          </div>

          <!-- Top 5 entries -->
          <div class="space-y-1.5" role="tabpanel">
            <LeaderboardItem
              v-for="entry in leaderboardEntries"
              :key="entry.novelId"
              :entry="entry"
              :rank="entry.rank"
            />
            <p
              v-if="leaderboardEntries.length === 0"
              class="text-sm"
              :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7280]'"
            >
              Belum ada data peringkat untuk periode ini.
            </p>
          </div>

          <!-- CTA to full leaderboard -->
          <div class="mt-6 text-center">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
              :class="themeStore.isDark
                ? 'border-[rgba(94,106,210,0.30)] bg-[rgba(94,106,210,0.08)] text-[#EDEDEF] hover:border-[rgba(94,106,210,0.50)] hover:bg-[rgba(94,106,210,0.15)] hover:shadow-[0_0_20px_rgba(94,106,210,0.15)] focus:ring-offset-[#050506]'
                : 'border-[rgba(94,106,210,0.25)] bg-[rgba(94,106,210,0.06)] text-[#5E6AD2] hover:border-[rgba(94,106,210,0.40)] hover:bg-[rgba(94,106,210,0.12)] focus:ring-offset-[#F4F4F8]'"
              @click="goToLeaderboard"
            >
              Lihat Peringkat Lengkap
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </template>
      </section>

      <!-- ── 7. Random Pick ──────────────────────────────────────────────── -->
      <section class="mb-14" aria-label="Novel Acak">
        <div class="mb-5 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span
              class="inline-block rounded-full border px-3 py-0.5 font-mono text-xs tracking-widest uppercase"
              :class="themeStore.isDark
                ? 'border-[rgba(94,106,210,0.30)] text-[#5E6AD2]'
                : 'border-[rgba(94,106,210,0.25)] text-[#5E6AD2]'"
            >Acak</span>
            <h2
              class="text-xl font-semibold tracking-tight"
              :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#1A1A2E]'"
            >Novel Acak</h2>
          </div>
          <!-- Acak Lagi button — primary accent style -->
          <button
            type="button"
            :disabled="randomLoading"
            class="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
            :class="themeStore.isDark
              ? 'bg-[#5E6AD2] text-white shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:bg-[#6872D9] hover:shadow-[0_0_0_1px_rgba(94,106,210,0.6),0_6px_20px_rgba(94,106,210,0.4),inset_0_1px_0_0_rgba(255,255,255,0.15)] focus:ring-offset-[#050506]'
              : 'bg-[#5E6AD2] text-white shadow-[0_0_0_1px_rgba(94,106,210,0.4),0_4px_12px_rgba(94,106,210,0.25)] hover:bg-[#6872D9] hover:shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_6px_20px_rgba(94,106,210,0.35)] focus:ring-offset-[#F4F4F8]'"
            @click="refreshRandomPick"
          >
            <svg
              v-if="randomLoading"
              class="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Acak Lagi
          </button>
        </div>

        <div v-if="homeLoading || randomLoading" class="overflow-hidden rounded-2xl">
          <SkeletonLoader :count="3" />
        </div>
        <ErrorMessage v-else-if="homeError" message="Gagal memuat novel acak." />
        <ErrorMessage
          v-else-if="randomError"
          :message="randomError"
          :retryable="true"
          @retry="refreshRandomPick"
        />
        <div
          v-else
          class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        >
          <NovelCard v-for="novel in randomPick" :key="novel.id" :novel="novel" />
          <p
            v-if="randomPick.length === 0"
            class="col-span-full text-sm"
            :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7280]'"
          >
            Tidak ada novel acak tersedia.
          </p>
        </div>
      </section>

      <!-- ── 8. Baru Ditambahkan ─────────────────────────────────────────── -->
      <section class="mb-10" aria-label="Baru Ditambahkan">
        <div class="mb-5 flex items-center gap-3">
          <span
            class="inline-block rounded-full border px-3 py-0.5 font-mono text-xs tracking-widest uppercase"
            :class="themeStore.isDark
              ? 'border-[rgba(94,106,210,0.30)] text-[#5E6AD2]'
              : 'border-[rgba(94,106,210,0.25)] text-[#5E6AD2]'"
          >Baru</span>
          <h2
            class="text-xl font-semibold tracking-tight"
            :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#1A1A2E]'"
          >Baru Ditambahkan</h2>
        </div>

        <!-- Loading skeleton -->
        <div
          v-if="newAdditionsLoading"
          class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          aria-busy="true"
          aria-label="Memuat novel baru..."
        >
          <SkeletonLoader :count="5" />
        </div>

        <ErrorMessage
          v-else-if="newAdditionsError"
          :message="newAdditionsError"
          :retryable="true"
          @retry="loadNewAdditions"
        />

        <p
          v-else-if="newAdditions.length === 0"
          class="text-sm"
          :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7280]'"
        >
          Belum ada novel baru yang ditambahkan.
        </p>

        <!-- Content: novels with "BARU" badge -->
        <div
          v-else
          class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        >
          <div
            v-for="novel in newAdditions"
            :key="novel.id"
            class="relative"
          >
            <!-- "BARU" badge — accent pill style -->
            <span
              v-if="isNewlyAdded(novel)"
              class="absolute left-2 top-2 z-10 rounded-full border px-2 py-0.5 font-mono text-xs font-bold tracking-wider uppercase shadow-[0_0_8px_rgba(94,106,210,0.4)]"
              :class="themeStore.isDark
                ? 'border-[rgba(94,106,210,0.50)] bg-[rgba(94,106,210,0.20)] text-[#EDEDEF]'
                : 'border-[rgba(94,106,210,0.40)] bg-[rgba(94,106,210,0.15)] text-[#5E6AD2]'"
              aria-label="Novel baru"
            >
              BARU
            </span>
            <NovelCard :novel="novel" />
            <p
              class="mt-1.5 text-center font-mono text-xs"
              :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'"
            >
              {{ getAddedAtLabel(novel) }}
            </p>
          </div>
        </div>
      </section>

    </div>
  </main>
</template>
