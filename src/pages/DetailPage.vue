<script setup lang="ts">
// Detail page: tabbed layout with About, Table of Contents, Reviews, Recommendations.
// Requirements: 6.3, 6.4, 12.1-12.8, 13.1-13.6, 14.1-14.5, 17.1-17.10, 18.1-18.5, 19.1-19.8

import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useSeoMeta } from '@/composables/useSeoMeta'
import {
  fetchNovelDetail,
  fetchNovelStats,
  fetchNovelRankings,
  fetchNovelPatrons,
  fetchNovelRecommendations,
  fetchAuthorNovels,
  isNovelBookmarked,
  addNovelBookmark,
  removeNovelBookmark,
  fetchNovelRating,
  submitRating,
  fetchReadingLists,
  addNovelToList,
} from '@/api'
import { ApiError } from '@/api'
import type { NovelDetail, NovelStats, NovelRankings, Patron, NovelSummary, RatingInfo, NovelTag, ReadingList } from '@/types'
import { useProgressStore } from '@/stores/progress'
import { useAuthStore } from '@/stores/auth'
import { useFollowsStore } from '@/stores/follows'
import { useThemeStore } from '@/stores/theme'
import LoadingIndicator from '@/components/LoadingIndicator.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'
import BookmarkButton from '@/components/BookmarkButton.vue'
import FollowButton from '@/components/FollowButton.vue'
import StarRating from '@/components/StarRating.vue'
import NovelStatsBar from '@/components/NovelStatsBar.vue'
import DetailTabNav from '@/components/DetailTabNav.vue'
import SynopsisCollapsible from '@/components/SynopsisCollapsible.vue'
import TagChip from '@/components/TagChip.vue'
import CommentSection from '@/components/CommentSection.vue'
import NovelCard from '@/components/NovelCard.vue'
import NovelCarousel from '@/components/NovelCarousel.vue'

// ── Route & stores ────────────────────────────────────────────────────────────

const route = useRoute()
const router = useRouter()
const progressStore = useProgressStore()
const themeStore = useThemeStore()
const authStore = useAuthStore()
const followsStore = useFollowsStore()

const novelId = computed(() => route.params.novelId as string)

// ── Tab state ─────────────────────────────────────────────────────────────────

const tabs = [
  { id: 'tentang', label: 'Tentang' },
  { id: 'daftar-isi', label: 'Daftar Isi' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'recommendations', label: 'Recommendations' },
]

const activeTab = ref('tentang')
const tabContentRef = ref<HTMLElement | null>(null)

function handleTabChange(id: string) {
  activeTab.value = id
  nextTick(() => {
    tabContentRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

// ── Main data state ───────────────────────────────────────────────────────────

const novel = ref<NovelDetail | null>(null)
const novelStats = ref<NovelStats | null>(null)
const novelRankings = ref<NovelRankings | null>(null)
const novelPatrons = ref<Patron[]>([])
const recommendations = ref<NovelSummary[]>([])
const authorNovels = ref<NovelSummary[]>([])

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

// ── SEO ───────────────────────────────────────────────────────────────────────

watch(novel, (n) => {
  if (n) {
    useSeoMeta(`${n.title} — Novel Reader`, n.synopsis ?? '')
  } else {
    useSeoMeta('Novel Reader')
  }
})

// ── Bookmark state ────────────────────────────────────────────────────────────

const bookmarked = ref(false)
const bookmarkLoading = ref(false)
const showLoginPrompt = ref(false)

// ── Rating state ──────────────────────────────────────────────────────────────

const ratingInfo = ref<RatingInfo | null>(null)
const userRating = ref<number | null>(null)

// ── Reading progress ──────────────────────────────────────────────────────────

const readingProgress = computed(() => progressStore.get(novelId.value))

// ── Chapter list state ────────────────────────────────────────────────────────

const showAllChapters = ref(false)
const CHAPTERS_DEFAULT_LIMIT = 20

const visibleChapters = computed(() => {
  if (!novel.value) return []
  const chapters = novel.value.chapters
  if (showAllChapters.value) return chapters

  const lastChapter = readingProgress.value?.lastChapter
  const first20 = chapters.slice(0, CHAPTERS_DEFAULT_LIMIT)

  // Always include last-read chapter even if outside first 20
  if (lastChapter !== undefined) {
    const alreadyIncluded = first20.some((c) => c.number === lastChapter)
    if (!alreadyIncluded) {
      const lastReadChapter = chapters.find((c) => c.number === lastChapter)
      if (lastReadChapter) {
        return [...first20, lastReadChapter]
      }
    }
  }

  return first20
})

// ── Status labels ─────────────────────────────────────────────────────────────

const statusLabel: Record<string, string> = {
  ongoing: 'Berlangsung',
  completed: 'Selesai',
  hiatus: 'Hiatus',
}

const statusColor: Record<string, string> = {
  ongoing: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  hiatus: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
}

// ── Tags grouped by category ──────────────────────────────────────────────────

const tagsByCategory = computed(() => {
  if (!novel.value?.tags) return []
  const map = new Map<string, { categoryId: string; categoryName: string; tags: NovelTag[] }>()
  for (const tag of novel.value.tags) {
    if (!map.has(tag.categoryId)) {
      map.set(tag.categoryId, { categoryId: tag.categoryId, categoryName: tag.categoryName, tags: [] })
    }
    map.get(tag.categoryId)!.tags.push(tag)
  }
  return Array.from(map.values())
})

// ── Sorted patrons ────────────────────────────────────────────────────────────

const sortedPatrons = computed(() =>
  [...novelPatrons.value].sort((a, b) => b.amount - a.amount)
)

// ── Bookmark toggle ───────────────────────────────────────────────────────────

async function toggleBookmark(): Promise<void> {
  if (!authStore.isAuthenticated) {
    showLoginPrompt.value = true
    return
  }

  const previous = bookmarked.value
  bookmarked.value = !previous
  bookmarkLoading.value = true

  try {
    if (previous) {
      await removeNovelBookmark(novelId.value)
    } else {
      await addNovelBookmark(novelId.value)
    }
  } catch {
    bookmarked.value = previous
  } finally {
    bookmarkLoading.value = false
  }
}

// ── Follow toggle ─────────────────────────────────────────────────────────────

const followLoading = ref(false)

async function toggleFollow(): Promise<void> {
  if (!authStore.isAuthenticated) {
    showLoginPrompt.value = true
    return
  }

  followLoading.value = true
  try {
    if (followsStore.isFollowing(novelId.value)) {
      await followsStore.unfollow(novelId.value)
    } else {
      await followsStore.follow(novelId.value)
    }
  } catch {
    // Silently ignore follow errors
  } finally {
    followLoading.value = false
  }
}

// ── Share ─────────────────────────────────────────────────────────────────────

const showShareMenu = ref(false)
const shareCopied = ref(false)

function getShareUrl(): string {
  return window.location.href
}

async function handleShare(): Promise<void> {
  const url = getShareUrl()
  const title = novel.value?.title ?? 'Novel Reader'

  if (navigator.share) {
    try {
      await navigator.share({ title, url })
    } catch {
      // User cancelled or share failed — silently ignore
    }
  } else {
    showShareMenu.value = true
  }
}

async function copyShareLink(): Promise<void> {
  try {
    await navigator.clipboard.writeText(getShareUrl())
    shareCopied.value = true
    setTimeout(() => {
      shareCopied.value = false
      showShareMenu.value = false
    }, 2000)
  } catch {
    // Clipboard API not available — silently ignore
  }
}

function shareToTwitter(): void {
  const url = encodeURIComponent(getShareUrl())
  const text = encodeURIComponent(`Baca "${novel.value?.title ?? ''}" di Novel Reader`)
  window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'noopener,noreferrer')
  showShareMenu.value = false
}

function shareToWhatsApp(): void {
  const text = encodeURIComponent(`Baca "${novel.value?.title ?? ''}" di Novel Reader: ${getShareUrl()}`)
  window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
  showShareMenu.value = false
}

function shareToTelegram(): void {
  const url = encodeURIComponent(getShareUrl())
  const text = encodeURIComponent(`Baca "${novel.value?.title ?? ''}" di Novel Reader`)
  window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank', 'noopener,noreferrer')
  showShareMenu.value = false
}

// ── Add to List ───────────────────────────────────────────────────────────────

const showListDropdown = ref(false)
const readingLists = ref<ReadingList[]>([])
const listsLoading = ref(false)
const addToListSuccess = ref<string | null>(null)
const addToListError = ref<string | null>(null)

async function openListDropdown(): Promise<void> {
  if (!authStore.isAuthenticated) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }

  showListDropdown.value = true
  addToListSuccess.value = null
  addToListError.value = null

  if (readingLists.value.length === 0) {
    listsLoading.value = true
    try {
      readingLists.value = await fetchReadingLists()
    } catch {
      addToListError.value = 'Gagal memuat daftar list.'
    } finally {
      listsLoading.value = false
    }
  }
}

async function selectList(list: ReadingList): Promise<void> {
  addToListError.value = null
  try {
    await addNovelToList(list.id, novelId.value)
    addToListSuccess.value = `Ditambahkan ke "${list.name}"`
    setTimeout(() => {
      showListDropdown.value = false
      addToListSuccess.value = null
    }, 1500)
  } catch (err) {
    addToListError.value = err instanceof ApiError ? err.message : 'Gagal menambahkan ke list.'
  }
}

// ── Rating submit ─────────────────────────────────────────────────────────────
async function submitUserRating(value: number): Promise<void> {
  if (!authStore.isAuthenticated) {
    showLoginPrompt.value = true
    return
  }

  try {
    await submitRating(novelId.value, value)
    userRating.value = value
    ratingInfo.value = await fetchNovelRating(novelId.value)
  } catch {
    // Silently ignore rating errors
  }
}

// ── Genre chip click ──────────────────────────────────────────────────────────

function navigateToGenre(genre: string): void {
  router.push({ path: '/catalog', query: { genres: genre } })
}

// ── Tag chip click ────────────────────────────────────────────────────────────

function navigateToTag(tagId: string): void {
  router.push({ path: '/catalog', query: { tags: tagId } })
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function loadAll(): Promise<void> {
  isLoading.value = true
  errorMessage.value = null
  novel.value = null
  novelStats.value = null
  novelRankings.value = null
  novelPatrons.value = []
  recommendations.value = []
  authorNovels.value = []

  const id = novelId.value

  // Fetch novel detail first (required for author name)
  try {
    novel.value = await fetchNovelDetail(id)
  } catch (err) {
    if (err instanceof ApiError) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = 'Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.'
    }
    isLoading.value = false
    return
  }

  const authorName = novel.value.author

  // Load remaining data in parallel
  const [statsResult, rankingsResult, patronsResult, recsResult, authorNovelsResult] =
    await Promise.allSettled([
      fetchNovelStats(id),
      fetchNovelRankings(id),
      fetchNovelPatrons(id),
      fetchNovelRecommendations(id),
      fetchAuthorNovels(authorName, id),
    ])

  if (statsResult.status === 'fulfilled') novelStats.value = statsResult.value
  if (rankingsResult.status === 'fulfilled') novelRankings.value = rankingsResult.value
  if (patronsResult.status === 'fulfilled') novelPatrons.value = patronsResult.value
  if (recsResult.status === 'fulfilled') recommendations.value = recsResult.value.slice(0, 10)
  if (authorNovelsResult.status === 'fulfilled') authorNovels.value = authorNovelsResult.value

  isLoading.value = false
}

async function loadBookmarkStatus(): Promise<void> {
  if (!authStore.isAuthenticated) return
  try {
    bookmarked.value = await isNovelBookmarked(novelId.value)
  } catch {
    // Silently ignore
  }
}

async function loadRatingInfo(): Promise<void> {
  try {
    const info = await fetchNovelRating(novelId.value)
    ratingInfo.value = info
    userRating.value = info.userRating
  } catch {
    // Silently ignore
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  await Promise.allSettled([
    loadAll(),
    loadBookmarkStatus(),
    loadRatingInfo(),
    followsStore.loadFollows(),
  ])
})
</script>

<template>
  <div
    class="relative min-h-screen transition-colors duration-300"
    :class="themeStore.isDark ? 'bg-[#050506] text-[#EDEDEF]' : 'bg-[#F8F8FC] text-[#111118]'"
  >
    <!-- Ambient background -->
    <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div
        class="absolute inset-0"
        :class="themeStore.isDark
          ? 'bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)]'
          : 'bg-[radial-gradient(ellipse_at_top,#eeeef8_0%,#F8F8FC_50%,#ebebf2_100%)]'"
      />
      <div
        class="absolute -top-[150px] left-1/2 h-[700px] w-[1100px] -translate-x-1/2 rounded-full blur-[130px] animate-[blob-float_10s_ease-in-out_infinite]"
        :class="themeStore.isDark ? 'bg-[rgba(94,106,210,0.18)]' : 'bg-[rgba(94,106,210,0.08)]'"
      />
      <div
        class="absolute right-[-100px] top-[40%] h-[500px] w-[400px] rounded-full blur-[100px] animate-[blob-float_8s_ease-in-out_3s_infinite]"
        :class="themeStore.isDark ? 'bg-[rgba(120,80,200,0.10)]' : 'bg-[rgba(120,80,200,0.05)]'"
      />
    </div>

    <main class="relative z-10 mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">

      <!-- Loading skeleton -->
      <div v-if="isLoading" aria-busy="true" aria-label="Memuat detail novel...">
        <div class="flex flex-col gap-6 sm:flex-row sm:gap-8">
          <div class="flex shrink-0 justify-center sm:block">
            <div
              class="h-64 w-44 animate-pulse rounded-2xl sm:h-72 sm:w-48"
              :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'"
            />
          </div>
          <div class="flex flex-1 flex-col gap-4">
            <div class="h-8 w-3/4 animate-pulse rounded-lg" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
            <div class="h-4 w-1/3 animate-pulse rounded" :class="themeStore.isDark ? 'bg-white/[0.06]' : 'bg-black/[0.05]'" />
            <div class="h-6 w-24 animate-pulse rounded-full" :class="themeStore.isDark ? 'bg-white/[0.06]' : 'bg-black/[0.05]'" />
            <div class="flex gap-2 pt-2">
              <div v-for="n in 4" :key="n" class="h-10 w-28 animate-pulse rounded-lg" :class="themeStore.isDark ? 'bg-white/[0.06]' : 'bg-black/[0.05]'" />
            </div>
          </div>
        </div>
      </div>

      <!-- Error state -->
      <ErrorMessage
        v-else-if="errorMessage"
        :message="errorMessage"
        :retryable="true"
        @retry="loadAll"
      />

      <!-- Novel detail -->
      <template v-else-if="novel">

        <!-- Login prompt banner -->
        <div
          v-if="showLoginPrompt"
          class="mb-6 flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm"
          :class="themeStore.isDark
            ? 'border-[rgba(94,106,210,0.30)] bg-[rgba(94,106,210,0.08)] text-[#EDEDEF]'
            : 'border-[rgba(94,106,210,0.25)] bg-[rgba(94,106,210,0.06)] text-[#111118]'"
        >
          <span>Silakan login untuk menggunakan fitur ini.</span>
          <div class="flex items-center gap-3">
            <RouterLink to="/login" class="font-medium text-[#5E6AD2] underline hover:no-underline">Login</RouterLink>
            <button
              type="button"
              class="transition-colors"
              :class="themeStore.isDark ? 'text-[#8A8F98] hover:text-[#EDEDEF]' : 'text-[#6B7080] hover:text-[#111118]'"
              aria-label="Tutup notifikasi"
              @click="showLoginPrompt = false"
            >✕</button>
          </div>
        </div>

        <!-- ── HEADER ─────────────────────────────────────────────────────── -->
        <div class="flex flex-col gap-6 sm:flex-row sm:gap-8">
          <!-- Thumbnail -->
          <div class="flex shrink-0 justify-center sm:block">
            <img
              :src="novel.thumbnailUrl"
              :alt="novel.title"
              loading="lazy"
              class="h-64 w-44 rounded-2xl object-cover sm:h-72 sm:w-48"
              :class="themeStore.isDark
                ? 'shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_8px_40px_rgba(0,0,0,0.5)]'
                : 'shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_8px_40px_rgba(0,0,0,0.12)]'"
            />
          </div>

          <!-- Metadata -->
          <div class="flex flex-1 flex-col gap-3">
            <div>
              <h1
                class="text-2xl font-semibold tracking-tight sm:text-3xl"
                :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'"
              >{{ novel.title }}</h1>
              <p class="mt-1 text-base" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">{{ novel.author }}</p>
            </div>

            <!-- Status badge -->
            <span
              class="inline-flex w-fit items-center rounded-full border px-3 py-1 font-mono text-xs font-medium uppercase tracking-wide"
              :class="{
                'border-emerald-500/30 bg-emerald-500/10 text-emerald-400': themeStore.isDark && novel.status === 'ongoing',
                'border-emerald-500/25 bg-emerald-50 text-emerald-600': !themeStore.isDark && novel.status === 'ongoing',
                'border-[rgba(94,106,210,0.30)] bg-[rgba(94,106,210,0.10)] text-[#8A9AE8]': themeStore.isDark && novel.status === 'completed',
                'border-[rgba(94,106,210,0.25)] bg-[rgba(94,106,210,0.08)] text-[#5E6AD2]': !themeStore.isDark && novel.status === 'completed',
                'border-amber-500/30 bg-amber-500/10 text-amber-400': themeStore.isDark && novel.status === 'hiatus',
                'border-amber-500/25 bg-amber-50 text-amber-600': !themeStore.isDark && novel.status === 'hiatus',
              }"
            >{{ statusLabel[novel.status] ?? novel.status }}</span>

            <NovelStatsBar v-if="novelStats" :stats="novelStats" />

            <StarRating
              :model-value="userRating"
              :readonly="!authStore.isAuthenticated"
              :average-rating="ratingInfo?.averageRating ?? 0"
              :total-ratings="ratingInfo?.totalRatings ?? 0"
              @update:model-value="submitUserRating"
            />

            <!-- Action buttons -->
            <div class="mt-2 flex flex-wrap gap-2">
              <!-- Continue Reading -->
              <RouterLink
                v-if="readingProgress"
                :to="`/novel/${novel.id}/chapter/${readingProgress.lastChapter}`"
                class="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
                :class="themeStore.isDark
                  ? 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-[#6872D9] focus:ring-offset-[#050506]'
                  : 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.4),0_4px_12px_rgba(94,106,210,0.2)] hover:bg-[#6872D9] focus:ring-offset-[#F8F8FC]'"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Lanjutkan (Ch. {{ readingProgress.lastChapter }})
              </RouterLink>

              <!-- Start Reading -->
              <RouterLink
                v-if="novel.chapters.length > 0"
                :to="`/novel/${novel.id}/chapter/${novel.chapters[0].number}`"
                class="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
                :class="themeStore.isDark
                  ? 'border-[rgba(255,255,255,0.08)] bg-white/[0.04] text-[#EDEDEF] hover:bg-white/[0.07] focus:ring-offset-[#050506]'
                  : 'border-[rgba(0,0,0,0.08)] bg-black/[0.03] text-[#111118] hover:bg-black/[0.06] focus:ring-offset-[#F8F8FC]'"
              >Mulai Membaca</RouterLink>

              <BookmarkButton :novel-id="novel.id" :is-bookmarked="bookmarked" :disabled="bookmarkLoading" @toggle="toggleBookmark" />
              <FollowButton :novel-id="novel.id" :is-following="followsStore.isFollowing(novel.id)" :disabled="followLoading" @toggle="toggleFollow" />

              <!-- Share -->
              <div class="relative">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
                  :class="themeStore.isDark
                    ? 'border-[rgba(255,255,255,0.08)] bg-white/[0.04] text-[#EDEDEF] hover:bg-white/[0.07] focus:ring-offset-[#050506]'
                    : 'border-[rgba(0,0,0,0.08)] bg-black/[0.03] text-[#111118] hover:bg-black/[0.06] focus:ring-offset-[#F8F8FC]'"
                  aria-label="Bagikan novel ini"
                  @click="handleShare"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Bagikan
                </button>
                <div
                  v-if="showShareMenu"
                  class="absolute left-0 top-full z-20 mt-2 w-52 rounded-xl border py-1"
                  :class="themeStore.isDark
                    ? 'border-[rgba(255,255,255,0.06)] bg-[#0a0a0c] shadow-[0_8px_40px_rgba(0,0,0,0.4)]'
                    : 'border-[rgba(0,0,0,0.07)] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.10)]'"
                >
                  <div class="border-b px-4 py-2" :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)]' : 'border-[rgba(0,0,0,0.06)]'">
                    <p class="font-mono text-xs tracking-widest uppercase" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'">Bagikan ke</p>
                  </div>
                  <ul class="py-1">
                    <li><button type="button" class="flex w-full px-4 py-2.5 text-left text-sm transition-colors duration-150 focus:outline-none" :class="themeStore.isDark ? 'text-[#8A8F98] hover:bg-white/[0.05] hover:text-[#EDEDEF]' : 'text-[#6B7080] hover:bg-black/[0.04] hover:text-[#111118]'" @click="copyShareLink">{{ shareCopied ? 'Tautan disalin! ✓' : 'Salin Tautan' }}</button></li>
                    <li><button type="button" class="flex w-full px-4 py-2.5 text-left text-sm transition-colors duration-150 focus:outline-none" :class="themeStore.isDark ? 'text-[#8A8F98] hover:bg-white/[0.05] hover:text-[#EDEDEF]' : 'text-[#6B7080] hover:bg-black/[0.04] hover:text-[#111118]'" @click="shareToTwitter">Twitter / X</button></li>
                    <li><button type="button" class="flex w-full px-4 py-2.5 text-left text-sm transition-colors duration-150 focus:outline-none" :class="themeStore.isDark ? 'text-[#8A8F98] hover:bg-white/[0.05] hover:text-[#EDEDEF]' : 'text-[#6B7080] hover:bg-black/[0.04] hover:text-[#111118]'" @click="shareToWhatsApp">WhatsApp</button></li>
                    <li><button type="button" class="flex w-full px-4 py-2.5 text-left text-sm transition-colors duration-150 focus:outline-none" :class="themeStore.isDark ? 'text-[#8A8F98] hover:bg-white/[0.05] hover:text-[#EDEDEF]' : 'text-[#6B7080] hover:bg-black/[0.04] hover:text-[#111118]'" @click="shareToTelegram">Telegram</button></li>
                  </ul>
                  <div class="border-t px-4 py-2" :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)]' : 'border-[rgba(0,0,0,0.06)]'">
                    <button type="button" class="w-full text-center font-mono text-xs transition-colors" :class="themeStore.isDark ? 'text-[#8A8F98] hover:text-[#EDEDEF]' : 'text-[#9CA3AF] hover:text-[#111118]'" @click="showShareMenu = false">Tutup</button>
                  </div>
                </div>
              </div>

              <!-- Add to List (auth) -->
              <div v-if="authStore.isAuthenticated" class="relative">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
                  :class="themeStore.isDark
                    ? 'border-[rgba(255,255,255,0.08)] bg-white/[0.04] text-[#EDEDEF] hover:bg-white/[0.07] focus:ring-offset-[#050506]'
                    : 'border-[rgba(0,0,0,0.08)] bg-black/[0.03] text-[#111118] hover:bg-black/[0.06] focus:ring-offset-[#F8F8FC]'"
                  @click="openListDropdown"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Tambah ke List
                </button>
                <div
                  v-if="showListDropdown"
                  class="absolute left-0 top-full z-20 mt-2 w-56 rounded-xl border py-1"
                  :class="themeStore.isDark
                    ? 'border-[rgba(255,255,255,0.06)] bg-[#0a0a0c] shadow-[0_8px_40px_rgba(0,0,0,0.4)]'
                    : 'border-[rgba(0,0,0,0.07)] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.10)]'"
                >
                  <div v-if="addToListSuccess" class="flex items-center gap-2 px-4 py-3 text-sm text-emerald-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                    {{ addToListSuccess }}
                  </div>
                  <div v-else-if="listsLoading" class="flex items-center justify-center px-4 py-4">
                    <svg class="h-5 w-5 animate-spin" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  </div>
                  <div v-else-if="addToListError" class="px-4 py-3 text-sm text-red-400">{{ addToListError }}</div>
                  <div v-else-if="readingLists.length === 0" class="px-4 py-3 text-sm" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">
                    Belum ada list. Buat di <RouterLink to="/library" class="font-medium text-[#5E6AD2] hover:underline">Library</RouterLink>.
                  </div>
                  <template v-else>
                    <div class="border-b px-4 py-2" :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)]' : 'border-[rgba(0,0,0,0.06)]'">
                      <p class="font-mono text-xs tracking-widest uppercase" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'">Pilih list</p>
                    </div>
                    <ul class="max-h-48 overflow-y-auto py-1">
                      <li v-for="list in readingLists" :key="list.id">
                        <button type="button" class="flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors duration-150 focus:outline-none" :class="themeStore.isDark ? 'text-[#8A8F98] hover:bg-white/[0.05] hover:text-[#EDEDEF]' : 'text-[#6B7080] hover:bg-black/[0.04] hover:text-[#111118]'" @click="selectList(list)">
                          <span class="truncate">{{ list.name }}</span>
                          <span class="ml-2 shrink-0 font-mono text-xs" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'">{{ list.novelCount }}</span>
                        </button>
                      </li>
                    </ul>
                  </template>
                  <div class="border-t px-4 py-2" :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)]' : 'border-[rgba(0,0,0,0.06)]'">
                    <button type="button" class="w-full text-center font-mono text-xs transition-colors" :class="themeStore.isDark ? 'text-[#8A8F98] hover:text-[#EDEDEF]' : 'text-[#9CA3AF] hover:text-[#111118]'" @click="showListDropdown = false">Tutup</button>
                  </div>
                </div>
              </div>

              <!-- Add to List (guest) -->
              <button
                v-else
                type="button"
                class="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
                :class="themeStore.isDark
                  ? 'border-[rgba(255,255,255,0.08)] bg-white/[0.04] text-[#EDEDEF] hover:bg-white/[0.07] focus:ring-offset-[#050506]'
                  : 'border-[rgba(0,0,0,0.08)] bg-black/[0.03] text-[#111118] hover:bg-black/[0.06] focus:ring-offset-[#F8F8FC]'"
                @click="router.push({ path: '/login', query: { redirect: route.fullPath } })"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Tambah ke List
              </button>
            </div>
          </div>
        </div>

        <!-- ── TAB NAVIGATION ─────────────────────────────────────────────── -->
        <div ref="tabContentRef" class="mt-8">
          <DetailTabNav :tabs="tabs" :model-value="activeTab" @update:model-value="handleTabChange" />

          <div class="mt-6">

            <!-- ── TAB: TENTANG ──────────────────────────────────────────── -->
            <div v-show="activeTab === 'tentang'" role="tabpanel" aria-labelledby="tab-tentang">

              <section class="mb-6">
                <h2 class="mb-3 font-mono text-xs uppercase tracking-widest" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'">Sinopsis</h2>
                <SynopsisCollapsible :text="novel.synopsis" :max-lines="3" />
              </section>

              <section v-if="novel.genre.length" class="mb-6">
                <h2 class="mb-2 font-mono text-xs uppercase tracking-widest" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'">Genre</h2>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="g in novel.genre"
                    :key="g"
                    type="button"
                    class="rounded-full border px-3 py-1 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50"
                    :class="themeStore.isDark
                      ? 'border-[rgba(94,106,210,0.20)] bg-[rgba(94,106,210,0.08)] text-[#8A9AE8] hover:border-[rgba(94,106,210,0.40)] hover:bg-[rgba(94,106,210,0.15)] hover:text-[#EDEDEF]'
                      : 'border-[rgba(94,106,210,0.20)] bg-[rgba(94,106,210,0.06)] text-[#5E6AD2] hover:border-[rgba(94,106,210,0.35)] hover:bg-[rgba(94,106,210,0.12)]'"
                    @click="navigateToGenre(g)"
                  >{{ g }}</button>
                </div>
              </section>

              <section v-if="tagsByCategory.length" class="mb-6">
                <h2 class="mb-3 font-mono text-xs uppercase tracking-widest" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'">Tag</h2>
                <div class="space-y-3">
                  <div v-for="group in tagsByCategory" :key="group.categoryId">
                    <p class="mb-1.5 font-mono text-xs uppercase tracking-widest" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'">{{ group.categoryName }}</p>
                    <div class="flex flex-wrap gap-2">
                      <TagChip
                        v-for="tag in group.tags"
                        :key="tag.tagId"
                        :tag="{ id: tag.tagId, name: tag.tagName, categoryId: tag.categoryId, categoryName: tag.categoryName, novelCount: 0 }"
                        :clickable="true"
                        size="sm"
                        @click="navigateToTag(tag.tagId)"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <!-- Detail metadata card -->
              <section
                class="mb-6 rounded-2xl border p-5"
                :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-white/[0.07] to-white/[0.02]' : 'border-[rgba(0,0,0,0.07)] bg-white'"
              >
                <div class="mb-4 flex items-center justify-between">
                  <h2 class="text-sm font-semibold" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">Detail</h2>
                  <div v-if="authStore.isAdmin" class="flex items-center gap-2">
                    <RouterLink
                      :to="`/admin/novels/${novel.id}/edit`"
                      class="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50"
                      :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.08)] bg-white/[0.04] text-[#8A8F98] hover:text-[#EDEDEF]' : 'border-[rgba(0,0,0,0.08)] bg-black/[0.03] text-[#6B7080] hover:text-[#111118]'"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      Edit
                    </RouterLink>
                    <RouterLink
                      :to="`/admin/novels/${novel.id}/chapters`"
                      class="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50"
                      :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.08)] bg-white/[0.04] text-[#8A8F98] hover:text-[#EDEDEF]' : 'border-[rgba(0,0,0,0.08)] bg-black/[0.03] text-[#6B7080] hover:text-[#111118]'"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      History
                    </RouterLink>
                  </div>
                </div>
                <dl class="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                  <div v-if="novel.originalTitle">
                    <dt class="font-mono text-xs uppercase tracking-widest" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'">Judul Asli</dt>
                    <dd class="mt-0.5 text-sm" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">{{ novel.originalTitle }}</dd>
                  </div>
                  <div>
                    <dt class="font-mono text-xs uppercase tracking-widest" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'">Status</dt>
                    <dd class="mt-0.5">
                      <span
                        class="inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-xs font-medium uppercase tracking-wide"
                        :class="{
                          'border-emerald-500/30 bg-emerald-500/10 text-emerald-400': themeStore.isDark && novel.status === 'ongoing',
                          'border-emerald-500/25 bg-emerald-50 text-emerald-600': !themeStore.isDark && novel.status === 'ongoing',
                          'border-[rgba(94,106,210,0.30)] bg-[rgba(94,106,210,0.10)] text-[#8A9AE8]': themeStore.isDark && novel.status === 'completed',
                          'border-[rgba(94,106,210,0.25)] bg-[rgba(94,106,210,0.08)] text-[#5E6AD2]': !themeStore.isDark && novel.status === 'completed',
                          'border-amber-500/30 bg-amber-500/10 text-amber-400': themeStore.isDark && novel.status === 'hiatus',
                          'border-amber-500/25 bg-amber-50 text-amber-600': !themeStore.isDark && novel.status === 'hiatus',
                        }"
                      >{{ statusLabel[novel.status] ?? novel.status }}</span>
                    </dd>
                  </div>
                  <div>
                    <dt class="font-mono text-xs uppercase tracking-widest" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'">Pengarang</dt>
                    <dd class="mt-0.5 text-sm" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">{{ novel.author }}</dd>
                  </div>
                  <div v-if="novel.sourceLanguage">
                    <dt class="font-mono text-xs uppercase tracking-widest" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'">Bahasa Sumber</dt>
                    <dd class="mt-0.5 text-sm" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">{{ novel.sourceLanguage }}</dd>
                  </div>
                  <div v-if="novel.translator">
                    <dt class="font-mono text-xs uppercase tracking-widest" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'">Penerjemah</dt>
                    <dd class="mt-0.5 text-sm" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">{{ novel.translator }}</dd>
                  </div>
                  <div v-if="novel.addedAt">
                    <dt class="font-mono text-xs uppercase tracking-widest" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'">Tanggal Ditambahkan</dt>
                    <dd class="mt-0.5 text-sm" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">{{ new Date(novel.addedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) }}</dd>
                  </div>
                </dl>
              </section>

              <!-- Rankings card -->
              <section
                v-if="novelRankings"
                class="mb-6 rounded-2xl border p-5"
                :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-white/[0.07] to-white/[0.02]' : 'border-[rgba(0,0,0,0.07)] bg-white'"
              >
                <h2 class="mb-4 text-sm font-semibold" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">Peringkat</h2>
                <div class="grid grid-cols-3 gap-4 text-center">
                  <div v-for="item in [{ label: 'Mingguan', value: novelRankings.weekly }, { label: 'Bulanan', value: novelRankings.monthly }, { label: 'Sepanjang Masa', value: novelRankings.allTime }]" :key="item.label">
                    <p class="font-mono text-xs uppercase tracking-widest" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'">{{ item.label }}</p>
                    <p class="mt-1 text-xl font-bold text-[#5E6AD2]">{{ item.value !== null ? `#${item.value}` : '—' }}</p>
                  </div>
                </div>
              </section>

              <!-- Patrons card -->
              <section
                v-if="sortedPatrons.length"
                class="mb-6 rounded-2xl border p-5"
                :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-white/[0.07] to-white/[0.02]' : 'border-[rgba(0,0,0,0.07)] bg-white'"
              >
                <h2 class="mb-3 text-sm font-semibold" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">Novel Patrons</h2>
                <ul class="space-y-2">
                  <li v-for="patron in sortedPatrons" :key="patron.userId" class="flex items-center justify-between text-sm">
                    <span class="font-medium" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">{{ patron.username }}</span>
                    <span class="font-mono text-xs" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">{{ patron.amount.toLocaleString('id-ID') }}</span>
                  </li>
                </ul>
              </section>
            </div>

            <!-- ── TAB: DAFTAR ISI ────────────────────────────────────────── -->
            <div v-show="activeTab === 'daftar-isi'" role="tabpanel" aria-labelledby="tab-daftar-isi">
              <div class="mb-4 flex items-center justify-between">
                <h2 class="text-sm font-semibold" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">
                  Daftar Chapter
                  <span class="ml-1 font-mono text-xs" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'">({{ novel.chapters.length }})</span>
                </h2>
              </div>

              <div v-if="novel.chapters.length === 0" class="py-8 text-center text-sm" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">
                Belum ada chapter tersedia.
              </div>

              <template v-else>
                <ul class="space-y-1">
                  <li v-for="chapter in visibleChapters" :key="chapter.number">
                    <RouterLink
                      :to="`/novel/${novel.id}/chapter/${chapter.number}`"
                      class="group flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/40"
                      :class="readingProgress?.lastChapter === chapter.number
                        ? themeStore.isDark
                          ? 'border-[rgba(94,106,210,0.40)] bg-[rgba(94,106,210,0.12)]'
                          : 'border-[rgba(94,106,210,0.30)] bg-[rgba(94,106,210,0.08)]'
                        : themeStore.isDark
                          ? 'border-[rgba(255,255,255,0.05)] bg-white/[0.03] hover:border-[rgba(255,255,255,0.08)] hover:bg-white/[0.06]'
                          : 'border-[rgba(0,0,0,0.06)] bg-white hover:border-[rgba(94,106,210,0.20)] hover:bg-[rgba(94,106,210,0.03)]'"
                    >
                      <span class="font-medium" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">
                        Chapter {{ chapter.number }}: {{ chapter.title }}
                      </span>
                      <span
                        v-if="readingProgress?.lastChapter === chapter.number"
                        class="ml-3 shrink-0 rounded-full border px-2 py-0.5 font-mono text-xs"
                        :class="themeStore.isDark
                          ? 'border-[rgba(94,106,210,0.40)] bg-[rgba(94,106,210,0.15)] text-[#8A9AE8]'
                          : 'border-[rgba(94,106,210,0.30)] bg-[rgba(94,106,210,0.10)] text-[#5E6AD2]'"
                      >Terakhir dibaca</span>
                      <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </RouterLink>
                  </li>
                </ul>

                <div class="mt-4 flex justify-center gap-3">
                  <button
                    v-if="!showAllChapters && novel.chapters.length > CHAPTERS_DEFAULT_LIMIT"
                    type="button"
                    class="rounded-lg border px-5 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50"
                    :class="themeStore.isDark
                      ? 'border-[rgba(255,255,255,0.08)] bg-white/[0.04] text-[#EDEDEF] hover:bg-white/[0.07]'
                      : 'border-[rgba(0,0,0,0.08)] bg-black/[0.03] text-[#111118] hover:bg-black/[0.06]'"
                    @click="showAllChapters = true"
                  >Lihat Semua Chapter</button>
                  <button
                    v-if="showAllChapters"
                    type="button"
                    class="rounded-lg border px-5 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50"
                    :class="themeStore.isDark
                      ? 'border-[rgba(255,255,255,0.08)] bg-white/[0.04] text-[#EDEDEF] hover:bg-white/[0.07]'
                      : 'border-[rgba(0,0,0,0.08)] bg-black/[0.03] text-[#111118] hover:bg-black/[0.06]'"
                    @click="showAllChapters = false"
                  >Sembunyikan</button>
                </div>
              </template>
            </div>

            <!-- ── TAB: REVIEWS ──────────────────────────────────────────── -->
            <div v-show="activeTab === 'reviews'" role="tabpanel" aria-labelledby="tab-reviews">
              <CommentSection :novel-id="novel.id" :chapter-number="0" />
            </div>

            <!-- ── TAB: RECOMMENDATIONS ──────────────────────────────────── -->
            <div v-show="activeTab === 'recommendations'" role="tabpanel" aria-labelledby="tab-recommendations">
              <h2 class="mb-4 text-sm font-semibold" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">Rekomendasi</h2>
              <p
                v-if="recommendations.length === 0"
                class="py-8 text-center text-sm"
                :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'"
              >Belum ada rekomendasi tersedia untuk novel ini.</p>
              <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                <NovelCard v-for="rec in recommendations" :key="rec.id" :novel="rec" />
              </div>
            </div>

          </div>
        </div>

        <!-- ── AUTHOR'S OTHER NOVELS ─────────────────────────────────────── -->
        <section v-if="authorNovels.length" class="mt-10">
          <NovelCarousel :novels="authorNovels" :title="`Novel Lain dari ${novel.author}`" />
        </section>

      </template>
    </main>
  </div>
</template>
