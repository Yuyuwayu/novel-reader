<script setup lang="ts">
// Reading history page — lists server-side reading history.
// Requirements: 8.1, 8.3, 8.4, 8.5, 8.6, 8.7

import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchHistory, deleteHistory } from '@/api'
import { ApiError } from '@/api'
import type { ReadingHistory } from '@/types'
import { formatRelativeTime } from '@/utils/formatRelativeTime'
import { useThemeStore } from '@/stores/theme'

const historyList = ref<ReadingHistory[]>([])
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const themeStore = useThemeStore()

async function loadHistory(): Promise<void> {
  isLoading.value = true
  errorMessage.value = null
  try {
    historyList.value = await fetchHistory()
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

async function handleDelete(novelId: string): Promise<void> {
  try {
    await deleteHistory(novelId)
    historyList.value = historyList.value.filter((h) => h.novelId !== novelId)
  } catch {
    // Silently ignore delete errors
  }
}

onMounted(() => { loadHistory() })
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
        <span class="rounded-full border px-3 py-0.5 font-mono text-xs tracking-widest uppercase" :class="themeStore.isDark ? 'border-[rgba(94,106,210,0.30)] text-[#5E6AD2]' : 'border-[rgba(94,106,210,0.25)] text-[#5E6AD2]'">Riwayat</span>
        <h1 class="text-lg font-semibold tracking-tight" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">Riwayat Baca</h1>
      </div>
    </header>

    <main class="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">

      <!-- Loading skeleton -->
      <div v-if="isLoading" aria-busy="true" aria-label="Memuat riwayat..." class="space-y-1.5">
        <div v-for="n in 4" :key="n" class="flex items-center gap-4 rounded-xl border p-4" :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-white/[0.07] to-white/[0.02]' : 'border-[rgba(0,0,0,0.07)] bg-white'">
          <div class="h-16 w-12 flex-shrink-0 animate-pulse rounded-lg" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
          <div class="flex-1 space-y-2">
            <div class="h-4 w-3/4 animate-pulse rounded" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
            <div class="h-3 w-1/2 animate-pulse rounded" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
            <div class="h-3 w-1/3 animate-pulse rounded" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
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
        <button type="button" class="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#6872D9] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50" :class="themeStore.isDark ? 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3)]' : 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.4),0_4px_12px_rgba(94,106,210,0.2)]'" @click="loadHistory">Coba Lagi</button>
      </div>

      <!-- Empty state -->
      <div v-else-if="historyList.length === 0" class="flex flex-col items-center gap-4 py-20 text-center">
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl border" :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-white/[0.07] to-white/[0.02]' : 'border-[rgba(0,0,0,0.07)] bg-white'">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-sm" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">Belum ada riwayat baca.</p>
        <RouterLink to="/" class="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#6872D9] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50" :class="themeStore.isDark ? 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3)]' : 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.4),0_4px_12px_rgba(94,106,210,0.2)]'">Jelajahi Katalog</RouterLink>
      </div>

      <!-- History list -->
      <ul v-else class="space-y-1.5" aria-label="Daftar riwayat baca">
        <li
          v-for="entry in historyList"
          :key="entry.novelId"
          class="group flex items-center gap-4 rounded-xl border px-4 py-3.5 transition-all duration-200"
          :class="themeStore.isDark
            ? 'border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-white/[0.07] to-white/[0.02] hover:border-[rgba(94,106,210,0.30)] hover:shadow-[0_0_0_1px_rgba(94,106,210,0.15),0_4px_16px_rgba(94,106,210,0.10)]'
            : 'border-[rgba(0,0,0,0.07)] bg-white hover:border-[rgba(94,106,210,0.25)] hover:shadow-[0_0_0_1px_rgba(94,106,210,0.10),0_4px_16px_rgba(94,106,210,0.06)]'"
        >
          <RouterLink :to="`/novel/${entry.novelId}/chapter/${entry.lastChapter}`" class="flex min-w-0 flex-1 items-center gap-4 focus:outline-none">
            <img :src="entry.thumbnailUrl" :alt="entry.novelTitle" loading="lazy" class="h-16 w-12 flex-shrink-0 rounded-lg object-cover" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">{{ entry.novelTitle }}</p>
              <p class="mt-0.5 text-xs" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">Chapter {{ entry.lastChapter }}</p>
              <p class="mt-0.5 font-mono text-xs" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">{{ formatRelativeTime(entry.lastReadAt) }}</p>
            </div>
          </RouterLink>
          <button
            type="button"
            :aria-label="`Hapus riwayat ${entry.novelTitle}`"
            class="flex-shrink-0 rounded-lg p-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/40"
            :class="themeStore.isDark ? 'text-[#8A8F98] hover:bg-red-500/10 hover:text-red-400' : 'text-[#6B7080] hover:bg-red-50 hover:text-red-500'"
            @click="handleDelete(entry.novelId)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </li>
      </ul>
    </main>
  </div>
</template>
