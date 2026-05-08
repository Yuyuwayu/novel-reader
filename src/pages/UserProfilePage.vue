<script setup lang="ts">
// UserProfilePage — public user profile at /user/:username.
// Fetches and displays user stats, avatar, and currently reading list.
// Requirements: 23.1, 23.2, 23.3, 23.5, 23.6

import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { fetchUserProfile } from '@/api'
import { ApiError } from '@/api'
import type { UserProfile } from '@/types'
import { useSeoMeta } from '@/composables/useSeoMeta'
import NovelCard from '@/components/NovelCard.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'

const route = useRoute()

// ── State ─────────────────────────────────────────────────────────────────────

const profile = ref<UserProfile | null>(null)
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

// ── SEO ───────────────────────────────────────────────────────────────────────

const pageTitle = computed(() =>
  profile.value
    ? `Profil ${profile.value.username} — Novel Reader`
    : 'Profil Pengguna — Novel Reader'
)

const pageDescription = computed(() =>
  profile.value
    ? `Profil publik ${profile.value.username}: ${profile.value.novelsRead} novel dibaca, ${profile.value.commentsCount} komentar.`
    : 'Profil publik pengguna Novel Reader.'
)

useSeoMeta(pageTitle.value, pageDescription.value)

// ── Avatar color ──────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-green-500',
  'bg-teal-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-purple-500',
  'bg-pink-500',
]

const avatarColor = computed(() => {
  if (!profile.value) return 'bg-gray-400'
  const code = profile.value.username.charCodeAt(0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
})

const avatarLetter = computed(() =>
  profile.value ? profile.value.username.charAt(0).toUpperCase() : '?'
)

// ── Date formatting ───────────────────────────────────────────────────────────

const joinedAtFormatted = computed(() => {
  if (!profile.value) return ''
  return new Date(profile.value.joinedAt).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

// ── Data fetching ─────────────────────────────────────────────────────────────

async function loadProfile(): Promise<void> {
  const username = route.params.username as string
  isLoading.value = true
  errorMessage.value = null

  try {
    profile.value = await fetchUserProfile(username)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      errorMessage.value = `Pengguna "${username}" tidak ditemukan.`
    } else if (err instanceof ApiError) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = 'Gagal memuat profil pengguna. Silakan coba lagi.'
    }
  } finally {
    isLoading.value = false
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(() => {
  loadProfile()
})
</script>

<template>
  <main class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">

      <!-- ── Loading skeleton ──────────────────────────────────────────────── -->
      <div v-if="isLoading" aria-busy="true" aria-label="Memuat profil...">
        <!-- Avatar + name skeleton -->
        <div class="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div class="h-20 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700 shrink-0"></div>
          <div class="flex-1 space-y-3 text-center sm:text-left">
            <div class="mx-auto h-6 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700 sm:mx-0"></div>
            <div class="mx-auto h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700 sm:mx-0"></div>
          </div>
        </div>

        <!-- Stats skeleton -->
        <div class="mb-8 grid grid-cols-3 gap-4">
          <div
            v-for="n in 3"
            :key="n"
            class="animate-pulse rounded-lg bg-white dark:bg-gray-800 p-4 shadow-sm"
          >
            <div class="mx-auto mb-2 h-7 w-12 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div class="mx-auto h-3 w-20 rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
        </div>

        <!-- Currently reading skeleton -->
        <div class="mb-4 h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div
            v-for="n in 3"
            :key="n"
            class="animate-pulse rounded-lg bg-white dark:bg-gray-800 p-4 shadow-sm"
          >
            <div class="mb-3 h-40 rounded-md bg-gray-200 dark:bg-gray-700"></div>
            <div class="mb-2 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div class="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
        </div>
      </div>

      <!-- ── Error state ────────────────────────────────────────────────────── -->
      <ErrorMessage
        v-else-if="errorMessage"
        :message="errorMessage"
        :retryable="true"
        @retry="loadProfile"
      />

      <!-- ── Profile content ────────────────────────────────────────────────── -->
      <template v-else-if="profile">

        <!-- Avatar + username + joined date -->
        <div class="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <!-- Avatar: colored circle with first letter -->
          <div
            class="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-3xl font-bold text-white shadow"
            :class="avatarColor"
            aria-hidden="true"
          >
            {{ avatarLetter }}
          </div>

          <div class="text-center sm:text-left">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {{ profile.username }}
            </h1>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Bergabung sejak {{ joinedAtFormatted }}
            </p>
          </div>
        </div>

        <!-- Public statistics -->
        <section class="mb-8" aria-label="Statistik pengguna">
          <div class="grid grid-cols-3 gap-4">
            <!-- Novels read -->
            <div class="rounded-lg bg-white dark:bg-gray-800 p-4 text-center shadow-sm">
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {{ profile.novelsRead.toLocaleString('id-ID') }}
              </p>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Novel Dibaca</p>
            </div>

            <!-- Comments count -->
            <div class="rounded-lg bg-white dark:bg-gray-800 p-4 text-center shadow-sm">
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {{ profile.commentsCount.toLocaleString('id-ID') }}
              </p>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Komentar</p>
            </div>

            <!-- Follows count -->
            <div class="rounded-lg bg-white dark:bg-gray-800 p-4 text-center shadow-sm">
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {{ profile.followsCount.toLocaleString('id-ID') }}
              </p>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Novel Diikuti</p>
            </div>
          </div>
        </section>

        <!-- Currently reading section (optional) -->
        <section
          v-if="profile.currentlyReading && profile.currentlyReading.length > 0"
          aria-label="Sedang dibaca"
        >
          <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Sedang Dibaca
          </h2>
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <NovelCard
              v-for="novel in profile.currentlyReading"
              :key="novel.id"
              :novel="novel"
            />
          </div>
        </section>

      </template>

    </div>
  </main>
</template>
