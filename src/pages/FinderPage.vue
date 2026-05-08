<script setup lang="ts">
// Advanced Novel Finder page — multi-criteria filter with URL sync, search, and infinite scroll.
// Requirements: 3.1, 3.2, 3.4, 3.6, 3.7, 3.8, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6,
//               8.1, 8.2, 8.3, 8.4, 8.5, 8.6,
//               9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7

import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSeoMeta } from '@/composables/useSeoMeta'
import { useFilterState } from '@/composables/useFilterState'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { fetchFilteredCatalog, fetchTags, fetchTagCategories, fetchGenres } from '@/api'
import { ApiError } from '@/api'
import type { NovelSummary, Genre, Tag, TagCategory } from '@/types'
import FilterPanel from '@/components/FilterPanel.vue'
import NovelCard from '@/components/NovelCard.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'
import SearchBar from '@/components/SearchBar.vue'

// ── SEO ───────────────────────────────────────────────────────────────────────

useSeoMeta(
  'Cari & Temukan Novel — Novel Reader',
  'Cari novel berdasarkan judul atau penulis, lalu saring dengan filter canggih: genre, tag, status, rating, jumlah chapter, dan rentang tanggal update.',
)

// ── Router ────────────────────────────────────────────────────────────────────

const route = useRoute()
const router = useRouter()

// ── Search query state (synced to URL param `q`) ──────────────────────────────

const searchQuery = ref<string>('')

// ── Filter state (synced to URL query params) ─────────────────────────────────

const { filterState, resetFilter, isFilterActive, validationErrors } = useFilterState()

// ── Filter data (genres, tags, tag categories) ────────────────────────────────

const genres = ref<Genre[]>([])
const tags = ref<Tag[]>([])
const tagCategories = ref<TagCategory[]>([])
const filterDataLoading = ref(false)
const filterDataError = ref<string | null>(null)

async function loadFilterData(): Promise<void> {
  filterDataLoading.value = true
  filterDataError.value = null
  try {
    const [genreList, tagList, tagCategoryList] = await Promise.all([
      fetchGenres(),
      fetchTags(),
      fetchTagCategories(),
    ])
    genres.value = genreList
    tags.value = tagList
    tagCategories.value = tagCategoryList
  } catch (err) {
    if (err instanceof ApiError) {
      filterDataError.value = err.message
    } else {
      filterDataError.value = 'Gagal memuat data filter. Silakan coba lagi.'
    }
  } finally {
    filterDataLoading.value = false
  }
}

// ── Results state ─────────────────────────────────────────────────────────────

const novels = ref<NovelSummary[]>([])
const currentPage = ref(1)
const totalNovels = ref(0)
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const hasMore = ref(false)
const allLoaded = ref(false)

// ── Sentinel for infinite scroll ──────────────────────────────────────────────

const sentinel = ref<HTMLDivElement | null>(null)

const { stop: stopScroll, start: startScroll } = useInfiniteScroll(
  sentinel,
  () => {
    if (!isLoading.value && hasMore.value) {
      loadNextPage()
    }
  },
  { rootMargin: '200px' },
)

// ── Data fetching ─────────────────────────────────────────────────────────────

async function loadInitial(): Promise<void> {
  stopScroll()
  isLoading.value = true
  errorMessage.value = null
  allLoaded.value = false
  novels.value = []
  currentPage.value = 1

  try {
    const response = await fetchFilteredCatalog(filterState.value, 1, searchQuery.value || undefined)
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
    startScroll()
  }
}

async function loadNextPage(): Promise<void> {
  if (isLoading.value || !hasMore.value) return

  isLoading.value = true
  errorMessage.value = null

  const nextPage = currentPage.value + 1

  try {
    const response = await fetchFilteredCatalog(filterState.value, nextPage, searchQuery.value || undefined)
    novels.value = [...novels.value, ...response.novels]
    currentPage.value = response.page
    totalNovels.value = response.total
    const totalPages = Math.ceil(response.total / response.perPage)
    hasMore.value = currentPage.value < totalPages

    if (!hasMore.value) {
      stopScroll()
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
    loadInitial()
  } else {
    hasMore.value = true
    loadNextPage()
  }
}

// ── Watch filter changes — reset to page 1 and reload ────────────────────────

// Track whether we've mounted yet to avoid double-loading on mount
let mounted = false

watch(
  filterState,
  () => {
    if (!mounted) return
    loadInitial()
  },
  { deep: true },
)

// ── Watch searchQuery — sync to URL param `q` and reload ──────────────────────

watch(searchQuery, (newQuery) => {
  if (!mounted) return
  const currentQuery = { ...route.query }
  if (newQuery) {
    currentQuery.q = newQuery
  } else {
    delete currentQuery.q
  }
  router.replace({ query: currentQuery })
  loadInitial()
})

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  searchQuery.value = (route.query.q as string) || ''
  await loadFilterData()
  await loadInitial()
  mounted = true
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Page header -->
    <div class="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Cari &amp; Temukan Novel
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Cari berdasarkan judul atau penulis, lalu saring dengan filter canggih
            </p>
          </div>

          <!-- Search bar + result count badge + reset filter -->
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchBar v-model="searchQuery" placeholder="Cari judul atau penulis..." />

            <!-- Result count badge (real-time) -->
            <div
              v-if="!isLoading || novels.length > 0"
              class="flex items-center gap-2"
            >
              <span class="rounded-full bg-blue-100 dark:bg-blue-900/40 px-3 py-1 text-sm font-medium text-blue-700 dark:text-blue-300 whitespace-nowrap">
                {{ totalNovels }} novel ditemukan
              </span>
              <button
                v-if="isFilterActive"
                type="button"
                class="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap"
                @click="resetFilter"
              >
                Reset Filter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main content: sidebar + results -->
    <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-start">

        <!-- Filter panel sidebar -->
        <aside class="w-full lg:w-72 lg:flex-shrink-0">
          <!-- Filter data error -->
          <ErrorMessage
            v-if="filterDataError"
            :message="filterDataError"
            :retryable="true"
            class="mb-4"
            @retry="loadFilterData"
          />

          <FilterPanel
            v-model="filterState"
            :genres="genres"
            :tags="tags"
            :tag-categories="tagCategories"
            :validation-errors="validationErrors"
            :loading="filterDataLoading"
            @reset="resetFilter"
          />
        </aside>

        <!-- Results area -->
        <div class="flex-1 min-w-0">

          <!-- Initial loading skeleton -->
          <SkeletonLoader v-if="isLoading && novels.length === 0" :count="6" />

          <!-- Initial load error -->
          <ErrorMessage
            v-else-if="errorMessage && novels.length === 0"
            :message="errorMessage"
            :retryable="true"
            @retry="retry"
          />

          <!-- Empty results -->
          <div
            v-else-if="!isLoading && novels.length === 0"
            class="flex flex-col items-center gap-4 py-16 text-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-14 w-14 text-gray-300 dark:text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.5"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
            <p class="text-gray-500 dark:text-gray-400 font-medium">
              Tidak ada novel yang sesuai dengan filter yang dipilih.
            </p>
            <p class="text-sm text-gray-400 dark:text-gray-500">
              Coba ubah atau kurangi kriteria filter.
            </p>
            <button
              v-if="isFilterActive"
              type="button"
              class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              @click="resetFilter"
            >
              Reset Filter
            </button>
          </div>

          <!-- Novel grid -->
          <template v-else>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              <NovelCard
                v-for="novel in novels"
                :key="novel.id"
                :novel="novel"
              />
            </div>

            <!-- Skeleton for next page loading -->
            <div v-if="isLoading && novels.length > 0" class="mt-6">
              <SkeletonLoader :count="4" />
            </div>

            <!-- Inline error for load-more failures -->
            <ErrorMessage
              v-if="errorMessage && novels.length > 0"
              :message="errorMessage"
              :retryable="true"
              class="mt-6"
              @retry="retry"
            />

            <!-- End-of-list message -->
            <p
              v-if="allLoaded && !isLoading"
              class="mt-8 text-center text-sm text-gray-400 dark:text-gray-500"
            >
              Semua novel sudah ditampilkan
            </p>
          </template>

          <!-- Sentinel element for IntersectionObserver -->
          <div ref="sentinel" class="h-1" aria-hidden="true"></div>
        </div>
      </div>
    </main>
  </div>
</template>
