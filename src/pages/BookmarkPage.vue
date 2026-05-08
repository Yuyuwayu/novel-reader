<script setup lang="ts">
// Bookmark page: lists server-side novel-level bookmarks.
// Requirements: 7.4, 7.5

import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchNovelBookmarks } from '@/api'
import { ApiError } from '@/api'
import type { NovelBookmark } from '@/types'
import { useThemeStore } from '@/stores/theme'

const bookmarks = ref<NovelBookmark[]>([])
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const themeStore = useThemeStore()

async function loadBookmarks(): Promise<void> {
  isLoading.value = true
  errorMessage.value = null
  try {
    bookmarks.value = await fetchNovelBookmarks()
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

onMounted(() => { loadBookmarks() })
</script>

<template>
  <div class="relative min-h-screen transition-colors duration-300" :class="themeStore.isDark ? 'bg-[#050506]' : 'bg-[#F8F8FC]'">
    <!-- Ambient background -->
    <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div class="absolute inset-0" :class="themeStore.isDark ? 'bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)]' : 'bg-[radial-gradient(ellipse_at_top,#eeeef8_0%,#F8F8FC_50%,#ebebf2_100%)]'" />
      <div class="absolute -top-[80px] left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full blur-[120px] animate-[blob-float_10s_ease-in-out_infinite]" :class="themeStore.isDark ? 'bg-[rgba(94,106,210,0.15)]' : 'bg-[rgba(94,106,210,0.07)]'" />
    </div>

    <!-- Page header -->
    <header class="sticky top-0 z-20 border-b backdrop-blur-xl" :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)] bg-[rgba(5,5,6,0.80)]' : 'border-[rgba(0,0,0,0.07)] bg-[rgba(248,248,252,0.80)]'">
      <div class="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <span class="rounded-full border px-3 py-0.5 font-mono text-xs tracking-widest uppercase" :class="themeStore.isDark ? 'border-[rgba(94,106,210,0.30)] text-[#5E6AD2]' : 'border-[rgba(94,106,210,0.25)] text-[#5E6AD2]'">Library</span>
        <h1 class="text-lg font-semibold tracking-tight" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">Bookmark Saya</h1>
      </div>
    </header>

    <main class="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">

      <!-- Loading skeleton -->
      <div v-if="isLoading" aria-busy="true" aria-label="Memuat bookmark..." class="space-y-1.5">
        <div v-for="n in 4" :key="n" class="flex items-center gap-4 rounded-xl border p-4" :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-white/[0.07] to-white/[0.02]' : 'border-[rgba(0,0,0,0.07)] bg-white'">
          <div class="h-16 w-12 flex-shrink-0 animate-pulse rounded-lg" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
          <div class="flex-1 space-y-2">
            <div class="h-4 w-3/4 animate-pulse rounded" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
            <div class="h-3 w-1/2 animate-pulse rounded" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
          </div>
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="errorMessage" class="flex flex-col items-center gap-4 py-20 text-center">
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl border" :class="themeStore.isDark ? 'border-red-500/20 bg-red-500/10' : 'border-red-200 bg-red-50'">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p class="text-sm" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">{{ errorMessage }}</p>
        <button type="button" class="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#6872D9] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50" :class="themeStore.isDark ? 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3)]' : 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.4),0_4px_12px_rgba(94,106,210,0.2)]'" @click="loadBookmarks">Coba Lagi</button>
      </div>

      <!-- Empty state -->
      <div v-else-if="bookmarks.length === 0" class="flex flex-col items-center gap-4 py-20 text-center">
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl border" :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-white/[0.07] to-white/[0.02]' : 'border-[rgba(0,0,0,0.07)] bg-white'">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
        <p class="text-sm" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">Belum ada bookmark.</p>
        <RouterLink to="/" class="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#6872D9] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50" :class="themeStore.isDark ? 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3)]' : 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.4),0_4px_12px_rgba(94,106,210,0.2)]'">Jelajahi Katalog</RouterLink>
      </div>

      <!-- Bookmark list -->
      <ul v-else class="space-y-1.5" aria-label="Daftar bookmark novel">
        <li v-for="bookmark in bookmarks" :key="bookmark.novelId">
          <RouterLink
            :to="`/novel/${bookmark.novelId}`"
            class="group flex items-center gap-4 rounded-xl border px-4 py-3.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/40"
            :class="themeStore.isDark
              ? 'border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-white/[0.07] to-white/[0.02] hover:border-[rgba(94,106,210,0.30)] hover:shadow-[0_0_0_1px_rgba(94,106,210,0.15),0_4px_16px_rgba(94,106,210,0.10)]'
              : 'border-[rgba(0,0,0,0.07)] bg-white hover:border-[rgba(94,106,210,0.25)] hover:shadow-[0_0_0_1px_rgba(94,106,210,0.10),0_4px_16px_rgba(94,106,210,0.06)]'"
          >
            <img :src="bookmark.thumbnailUrl" :alt="bookmark.novelTitle" loading="lazy" class="h-16 w-12 flex-shrink-0 rounded-lg object-cover" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">{{ bookmark.novelTitle }}</p>
              <p class="mt-0.5 truncate text-xs" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">{{ bookmark.author }}</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </RouterLink>
        </li>
      </ul>

      <p v-if="bookmarks.length > 0" class="mt-6 text-center font-mono text-xs" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">
        {{ bookmarks.length }} novel tersimpan
      </p>
    </main>
  </div>
</template>
