<script setup lang="ts">
// Catalog page: displays a grid of novels with search and infinite scroll.
// Uses useInfiniteScroll composable (IntersectionObserver) to automatically
// load the next page when the sentinel element enters the viewport.
// Reads `genres` and `tags` query params from the URL on mount to initialize
// pre-filtered views (e.g. when navigating from a genre/tag chip click).
// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.3, 2.4, 2.5, 10.2, 10.3,
//               14.2, 14.4, 15.2, 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7

import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSeoMeta } from '@/composables/useSeoMeta'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { fetchCatalog, fetchFilteredCatalog } from '@/api'
import type { NovelSummary } from '@/types'
import { DEFAULT_FILTER_STATE } from '@/types'
import { ApiError } from '@/api'
import { useThemeStore } from '@/stores/theme'
import NovelCard from '@/components/NovelCard.vue'
import SearchBar from '@/components/SearchBar.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'

// ── SEO ───────────────────────────────────────────────────────────────────────

useSeoMeta(
  'Novel Reader — Baca Novel Online',
  'Baca novel online gratis. Temukan ribuan novel dari berbagai genre.',
)

// ── Route ─────────────────────────────────────────────────────────────────────

const route = useRoute()
const themeStore = useThemeStore()

// ── State ────────────────────────────────────────────────────────────────────

const novels = ref<NovelSummary[]>([])
const searchQuery = ref('')
const currentPage = ref(1)
const totalNovels = ref(0)
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const hasMore = ref(false)
const allLoaded = ref(false)

// Active genre/tag filters from URL query params (set on mount)
const activeGenres = ref<string[]>([])
const activeTags = ref<string[]>([])

// ── Sentinel + useInfiniteScroll ──────────────────────────────────────────────

const sentinel = ref<HTMLDivElement | null>(null)

const { start: startObserver, stop: stopObserver } = useInfiniteScroll(
  sentinel,
  () => {
    if (!isLoading.value && hasMore.value) {
      loadNextPage()
    }
  },
  { rootMargin: '200px' },
)

// ── Data fetching ─────────────────────────────────────────────────────────────

/**
 * Fetches a catalog page. Uses fetchFilteredCatalog when genres or tags are
 * active (from URL query params), otherwise falls back to the simpler
 * fetchCatalog with optional text search.
 */
async function fetchPage(page: number): Promise<{ novels: NovelSummary[]; total: number; currentPage: number; perPage: number }> {
  const hasFilter = activeGenres.value.length > 0 || activeTags.value.length > 0

  if (hasFilter) {
    const filter = {
      ...DEFAULT_FILTER_STATE,
      genres: activeGenres.value,
      tags: activeTags.value,
    }
    const response = await fetchFilteredCatalog(filter, page)
    return response
  }

  const response = await fetchCatalog(page, searchQuery.value || undefined)
  return response
}

async function loadNextPage(): Promise<void> {
  if (isLoading.value || !hasMore.value) return

  isLoading.value = true
  errorMessage.value = null

  const nextPage = currentPage.value + 1

  try {
    const response = await fetchPage(nextPage)
    // Append — do not replace existing novels (Req 16.2)
    novels.value = [...novels.value, ...response.novels]
    currentPage.value = response.page
    totalNovels.value = response.total
    const totalPages = Math.ceil(response.total / response.perPage)
    hasMore.value = currentPage.value < totalPages

    // All pages loaded — stop observer and show end message (Req 16.4)
    if (!hasMore.value) {
      stopObserver()
      allLoaded.value = true
    }
  } catch (err) {
    // Show retry button without removing existing content (Req 16.6)
    if (err instanceof ApiError) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = 'Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.'
    }
  } finally {
    isLoading.value = false
  }
}

async function loadInitial(query: string): Promise<void> {
  isLoading.value = true
  errorMessage.value = null
  allLoaded.value = false

  try {
    const response = await fetchPage(1)
    novels.value = response.novels
    currentPage.value = response.page
    totalNovels.value = response.total
    const totalPages = Math.ceil(response.total / response.perPage)
    hasMore.value = currentPage.value < totalPages

    if (!hasMore.value) {
      allLoaded.value = true
    }
  } catch (err) {
    if (err instanceof ApiError) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = 'Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.'
    }
  } finally {
    isLoading.value = false
  }
}

function retry(): void {
  if (novels.value.length === 0) {
    // Initial load failed — retry from scratch
    loadInitial(searchQuery.value)
  } else {
    // Load-more failed — retry next page
    hasMore.value = true
    loadNextPage()
  }
}

// ── Search handler ────────────────────────────────────────────────────────────

function onSearch(query: string): void {
  searchQuery.value = query
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  // Read genres and tags query params from URL and initialize filters (Req 14.2, 14.4)
  const genresParam = route.query.genres
  const tagsParam = route.query.tags

  if (typeof genresParam === 'string' && genresParam.length > 0) {
    activeGenres.value = genresParam.split(',').filter(Boolean)
  } else if (Array.isArray(genresParam)) {
    activeGenres.value = genresParam.filter((g): g is string => typeof g === 'string' && g.length > 0)
  }

  if (typeof tagsParam === 'string' && tagsParam.length > 0) {
    activeTags.value = tagsParam.split(',').filter(Boolean)
  } else if (Array.isArray(tagsParam)) {
    activeTags.value = tagsParam.filter((t): t is string => typeof t === 'string' && t.length > 0)
  }

  await loadInitial(searchQuery.value)
  startObserver()
})

// Reset when search query changes (Req 16.5)
watch(searchQuery, async (newQuery) => {
  stopObserver()
  novels.value = []
  currentPage.value = 1
  allLoaded.value = false
  hasMore.value = false
  // Clear genre/tag filters when user performs a text search
  activeGenres.value = []
  activeTags.value = []
  await loadInitial(newQuery)
  startObserver()
})
</script>

<template>
  <div
    class="relative min-h-screen transition-colors duration-300"
    :class="themeStore.isDark ? 'bg-[#050506] text-[#EDEDEF]' : 'bg-[#F8F8FC] text-[#111118]'"
  >
    <!-- Ambient background -->
    <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div class="absolute inset-0" :class="themeStore.isDark ? 'bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)]' : 'bg-[radial-gradient(ellipse_at_top,#eeeef8_0%,#F8F8FC_50%,#ebebf2_100%)]'" />
      <div class="absolute -top-[100px] left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full blur-[120px] animate-[blob-float_10s_ease-in-out_infinite]" :class="themeStore.isDark ? 'bg-[rgba(94,106,210,0.15)]' : 'bg-[rgba(94,106,210,0.07)]'" />
    </div>

    <!-- Page header with search bar -->
    <div
      class="relative z-10 border-b backdrop-blur-xl"
      :class="themeStore.isDark
        ? 'border-[rgba(255,255,255,0.06)] bg-[rgba(5,5,6,0.80)]'
        : 'border-[rgba(0,0,0,0.07)] bg-[rgba(248,248,252,0.80)]'"
    >
      <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              class="text-lg font-semibold tracking-tight"
              :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'"
            >Katalog Novel</h1>
            <!-- Active filter chips -->
            <div v-if="activeGenres.length > 0 || activeTags.length > 0" class="mt-1.5 flex flex-wrap gap-1.5">
              <span
                v-for="genre in activeGenres"
                :key="`genre-${genre}`"
                class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-xs"
                :class="themeStore.isDark
                  ? 'border-[rgba(94,106,210,0.30)] bg-[rgba(94,106,210,0.10)] text-[#8A9AE8]'
                  : 'border-[rgba(94,106,210,0.25)] bg-[rgba(94,106,210,0.08)] text-[#5E6AD2]'"
              >
                Genre: {{ genre }}
              </span>
              <span
                v-for="tag in activeTags"
                :key="`tag-${tag}`"
                class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-xs"
                :class="themeStore.isDark
                  ? 'border-[rgba(120,80,200,0.30)] bg-[rgba(120,80,200,0.10)] text-[#B09AE8]'
                  : 'border-[rgba(120,80,200,0.25)] bg-[rgba(120,80,200,0.08)] text-[#7B5EA7]'"
              >
                Tag: {{ tag }}
              </span>
            </div>
          </div>
          <div class="w-full sm:max-w-sm">
            <SearchBar v-model="searchQuery" @search="onSearch" />
          </div>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <main class="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

      <!-- Loading state (initial) -->
      <SkeletonLoader v-if="isLoading && novels.length === 0" />

      <!-- Error state (initial) -->
      <ErrorMessage
        v-else-if="errorMessage && novels.length === 0"
        :message="errorMessage"
        :retryable="true"
        @retry="retry"
      />

      <!-- Empty results -->
      <div
        v-else-if="!isLoading && novels.length === 0"
        class="flex flex-col items-center gap-4 py-20 text-center"
      >
        <div
          class="flex h-16 w-16 items-center justify-center rounded-2xl border"
          :class="themeStore.isDark
            ? 'border-[rgba(255,255,255,0.06)] bg-white/[0.04]'
            : 'border-[rgba(0,0,0,0.07)] bg-black/[0.03]'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </div>
        <div>
          <p class="font-medium" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">
            Tidak ada novel ditemukan
          </p>
          <p class="mt-1 text-sm" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">
            Coba kata kunci yang berbeda
          </p>
        </div>
        <button
          type="button"
          class="rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50"
          :class="themeStore.isDark
            ? 'border-[rgba(255,255,255,0.08)] bg-white/[0.04] text-[#EDEDEF] hover:bg-white/[0.07]'
            : 'border-[rgba(0,0,0,0.08)] bg-black/[0.03] text-[#111118] hover:bg-black/[0.06]'"
          @click="searchQuery = ''; onSearch('')"
        >
          Tampilkan semua novel
        </button>
      </div>

      <!-- Novel grid -->
      <template v-else>
        <!-- Result count -->
        <p
          v-if="searchQuery.length >= 2"
          class="mb-5 font-mono text-xs"
          :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'"
        >
          {{ novels.length }} dari {{ totalNovels }} novel
        </p>

        <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <NovelCard v-for="novel in novels" :key="novel.id" :novel="novel" />
        </div>

        <!-- Skeleton for next page -->
        <div v-if="isLoading && novels.length > 0" class="mt-6">
          <SkeletonLoader :count="4" />
        </div>

        <!-- Inline error for load-more -->
        <ErrorMessage
          v-if="errorMessage && novels.length > 0"
          :message="errorMessage"
          :retryable="true"
          class="mt-6"
          @retry="retry"
        />

        <!-- End of list -->
        <p
          v-if="allLoaded && !isLoading"
          class="mt-10 text-center font-mono text-xs"
          :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'"
        >
          — Semua novel sudah ditampilkan —
        </p>
      </template>

      <!-- Sentinel for IntersectionObserver -->
      <div ref="sentinel" class="h-1" aria-hidden="true" />
    </main>
  </div>
</template>
