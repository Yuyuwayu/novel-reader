<script setup lang="ts">
// Admin genres management page.
// Requirements: 13.1, 13.2, 13.3, 13.6

import { ref, onMounted } from 'vue'
import { adminFetchGenres, adminCreateGenre, adminDeleteGenre } from '@/api'
import { ApiError } from '@/api'
import type { Genre } from '@/types'
import { useThemeStore } from '@/stores/theme'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const themeStore = useThemeStore()

// ── State ─────────────────────────────────────────────────────────────────────

const genres = ref<Genre[]>([])
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

// Add genre form state
const newGenreName = ref('')
const isSubmitting = ref(false)
const formError = ref<string | null>(null)

// Confirm dialog state
const confirmOpen = ref(false)
const pendingDeleteGenre = ref<Genre | null>(null)
const isDeleting = ref(false)

// ── Data fetching ─────────────────────────────────────────────────────────────

async function loadGenres(): Promise<void> {
  isLoading.value = true
  errorMessage.value = null

  try {
    genres.value = await adminFetchGenres()
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

// ── Add genre ─────────────────────────────────────────────────────────────────

async function submitAddGenre(): Promise<void> {
  const name = newGenreName.value.trim()

  if (!name) {
    formError.value = 'Nama genre tidak boleh kosong.'
    return
  }

  formError.value = null
  isSubmitting.value = true

  try {
    const created = await adminCreateGenre(name)
    genres.value.push(created)
    newGenreName.value = ''
  } catch (err) {
    if (err instanceof ApiError) {
      formError.value = err.message
    } else {
      formError.value = 'Gagal menambahkan genre. Silakan coba lagi.'
    }
  } finally {
    isSubmitting.value = false
  }
}

// ── Delete flow ───────────────────────────────────────────────────────────────

function requestDelete(genre: Genre): void {
  pendingDeleteGenre.value = genre
  confirmOpen.value = true
}

function cancelDelete(): void {
  confirmOpen.value = false
  pendingDeleteGenre.value = null
}

async function confirmDelete(): Promise<void> {
  if (!pendingDeleteGenre.value) return

  isDeleting.value = true
  const genre = pendingDeleteGenre.value

  try {
    await adminDeleteGenre(genre.id)
    genres.value = genres.value.filter((g) => g.id !== genre.id)
    confirmOpen.value = false
    pendingDeleteGenre.value = null
  } catch (err) {
    confirmOpen.value = false
    if (err instanceof ApiError) {
      errorMessage.value = `Gagal menghapus genre: ${err.message}`
    } else {
      errorMessage.value = 'Gagal menghapus genre. Silakan coba lagi.'
    }
  } finally {
    isDeleting.value = false
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(() => {
  loadGenres()
})
</script>

<template>
  <div class="relative min-h-screen transition-colors duration-300" :class="themeStore.isDark ? 'bg-[#050506]' : 'bg-[#F8F8FC]'">
    <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div class="absolute inset-0" :class="themeStore.isDark ? 'bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)]' : 'bg-[radial-gradient(ellipse_at_top,#eeeef8_0%,#F8F8FC_50%,#ebebf2_100%)]'" />
      <div class="absolute -top-[80px] left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full blur-[120px] animate-[blob-float_10s_ease-in-out_infinite]" :class="themeStore.isDark ? 'bg-[rgba(94,106,210,0.15)]' : 'bg-[rgba(94,106,210,0.07)]'" />
    </div>

    <header class="sticky top-0 z-20 border-b backdrop-blur-xl" :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)] bg-[rgba(5,5,6,0.80)]' : 'border-[rgba(0,0,0,0.07)] bg-[rgba(248,248,252,0.80)]'">
      <div class="mx-auto max-w-3xl px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-3">
          <span class="rounded-full border px-3 py-0.5 font-mono text-xs tracking-widest uppercase" :class="themeStore.isDark ? 'border-[rgba(94,106,210,0.30)] text-[#5E6AD2]' : 'border-[rgba(94,106,210,0.25)] text-[#5E6AD2]'">Admin</span>
          <h1 class="text-lg font-semibold tracking-tight" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">Manajemen Genre</h1>
        </div>
      </div>
    </header>

    <main class="relative z-10 mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">

      <!-- Add genre form -->
      <section class="rounded-2xl border p-6" :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-white/[0.07] to-white/[0.02]' : 'border-[rgba(0,0,0,0.07)] bg-white'">
        <h2 class="mb-4 text-sm font-semibold" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">Tambah Genre Baru</h2>
        <form class="flex flex-col gap-3 sm:flex-row sm:items-start" @submit.prevent="submitAddGenre">
          <div class="flex-1">
            <label for="new-genre-name" class="sr-only">Nama genre</label>
            <input
              id="new-genre-name"
              v-model="newGenreName"
              type="text"
              placeholder="Nama genre (harus unik)"
              :disabled="isSubmitting"
              class="w-full rounded-lg border px-3.5 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
              :class="[
                formError
                  ? 'border-red-500/40 focus:border-red-500 focus:ring-red-500/20'
                  : themeStore.isDark
                    ? 'border-[rgba(255,255,255,0.08)] bg-[#0F0F12] text-[#EDEDEF] placeholder-[#8A8F98] focus:border-[#5E6AD2] focus:ring-[#5E6AD2]/20'
                    : 'border-[rgba(0,0,0,0.10)] bg-white text-[#111118] placeholder-[#9CA3AF] focus:border-[#5E6AD2] focus:ring-[#5E6AD2]/15',
              ]"
            />
            <p v-if="formError" class="mt-1.5 text-xs text-red-400" role="alert">{{ formError }}</p>
          </div>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50"
            :class="themeStore.isDark ? 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3)] hover:bg-[#6872D9]' : 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.4),0_4px_12px_rgba(94,106,210,0.2)] hover:bg-[#6872D9]'"
          >
            <svg v-if="isSubmitting" class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
            {{ isSubmitting ? 'Menyimpan...' : 'Tambah' }}
          </button>
        </form>
      </section>

      <!-- Loading skeleton -->
      <div v-if="isLoading" aria-busy="true" class="overflow-hidden rounded-2xl border" :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-white/[0.07] to-white/[0.02]' : 'border-[rgba(0,0,0,0.07)] bg-white'">
        <div class="divide-y" :class="themeStore.isDark ? 'divide-[rgba(255,255,255,0.06)]' : 'divide-[rgba(0,0,0,0.06)]'">
          <div v-for="n in 5" :key="n" class="flex items-center justify-between px-5 py-4">
            <div class="flex items-center gap-3">
              <div class="h-4 w-32 animate-pulse rounded" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
              <div class="h-4 w-16 animate-pulse rounded-full" :class="themeStore.isDark ? 'bg-white/[0.06]' : 'bg-black/[0.05]'" />
            </div>
            <div class="h-7 w-16 animate-pulse rounded-lg" :class="themeStore.isDark ? 'bg-white/[0.06]' : 'bg-black/[0.05]'" />
          </div>
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="errorMessage" class="flex flex-col items-center gap-4 py-16 text-center">
        <p class="text-sm" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">{{ errorMessage }}</p>
        <button type="button" class="rounded-lg px-5 py-2 text-sm font-semibold text-white bg-[#5E6AD2] hover:bg-[#6872D9] focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50" @click="loadGenres">Coba Lagi</button>
      </div>

      <!-- Empty state -->
      <div v-else-if="genres.length === 0" class="flex flex-col items-center gap-4 py-16 text-center">
        <p class="text-sm" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">Belum ada genre. Tambahkan genre pertama di atas.</p>
      </div>

      <!-- Genre list -->
      <div v-else class="overflow-hidden rounded-2xl border" :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-white/[0.07] to-white/[0.02]' : 'border-[rgba(0,0,0,0.07)] bg-white'">
        <ul class="divide-y" :class="themeStore.isDark ? 'divide-[rgba(255,255,255,0.04)]' : 'divide-[rgba(0,0,0,0.04)]'" role="list" aria-label="Daftar genre">
          <li
            v-for="genre in genres"
            :key="genre.id"
            class="flex items-center justify-between px-5 py-4 transition-colors duration-150"
            :class="themeStore.isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-black/[0.02]'"
          >
            <div class="flex min-w-0 items-center gap-3">
              <span class="truncate text-sm font-medium" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">{{ genre.name }}</span>
              <span class="shrink-0 rounded-full border px-2.5 py-0.5 font-mono text-xs" :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)] bg-white/[0.04] text-[#8A8F98]' : 'border-[rgba(0,0,0,0.07)] bg-black/[0.03] text-[#6B7080]'">{{ genre.novelCount }} novel</span>
            </div>
            <button
              type="button"
              :aria-label="`Hapus genre ${genre.name}`"
              class="ml-4 shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-500/40"
              :class="themeStore.isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'"
              @click="requestDelete(genre)"
            >Hapus</button>
          </li>
        </ul>
      </div>

    </main>

    <ConfirmDialog :open="confirmOpen" title="Hapus Genre" :message="pendingDeleteGenre ? `Genre ini digunakan oleh ${pendingDeleteGenre.novelCount} novel. Menghapus genre ini akan menghapusnya dari semua novel tersebut.` : ''" confirm-label="Hapus" cancel-label="Batal" @confirm="confirmDelete" @cancel="cancelDelete" />
  </div>
</template>
      <div class="mx-auto max-w-3xl px-4 py-4 sm:px-6 lg:px-8">
        <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Manajemen Genre</h1>
      </div>
    </div>

    <!-- Main content -->
    <main class="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">

      <!-- Add genre form -->
      <section class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <h2 class="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Tambah Genre Baru</h2>
        <form class="flex flex-col gap-3 sm:flex-row sm:items-start" @submit.prevent="submitAddGenre">
          <div class="flex-1">
            <label for="new-genre-name" class="sr-only">Nama genre</label>
            <input
              id="new-genre-name"
              v-model="newGenreName"
              type="text"
              placeholder="Nama genre (harus unik)"
              :disabled="isSubmitting"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
              :class="{ 'border-red-400 focus:border-red-500 focus:ring-red-500': formError }"
            />
            <p v-if="formError" class="mt-1.5 text-xs text-red-600" role="alert">
              {{ formError }}
            </p>
          </div>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              v-if="isSubmitting"
              class="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
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
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {{ isSubmitting ? 'Menyimpan...' : 'Tambah' }}
          </button>
        </form>
      </section>

      <!-- Loading skeleton -->
      <div
        v-if="isLoading"
        aria-busy="true"
        aria-label="Memuat daftar genre..."
        class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm"
      >
        <ul class="divide-y divide-gray-100 dark:divide-gray-700">
          <li v-for="n in 5" :key="n" class="flex items-center justify-between px-5 py-4">
            <div class="flex items-center gap-3">
              <div class="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              <div class="h-4 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div class="h-7 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
          </li>
        </ul>
      </div>

      <!-- Error state -->
      <div
        v-else-if="errorMessage"
        class="flex flex-col items-center gap-4 py-16 text-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-12 w-12 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p class="text-gray-700 dark:text-gray-300">{{ errorMessage }}</p>
        <button
          type="button"
          class="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          @click="loadGenres"
        >
          Coba Lagi
        </button>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="genres.length === 0"
        class="flex flex-col items-center gap-4 py-16 text-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-14 w-14 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <p class="text-gray-500 dark:text-gray-400">Belum ada genre. Tambahkan genre pertama di atas.</p>
      </div>

      <!-- Genre list -->
      <div
        v-else
        class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm"
      >
        <ul class="divide-y divide-gray-100 dark:divide-gray-700" role="list" aria-label="Daftar genre">
          <li
            v-for="genre in genres"
            :key="genre.id"
            class="flex items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <!-- Genre info -->
            <div class="flex items-center gap-3 min-w-0">
              <span class="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{{ genre.name }}</span>
              <span class="shrink-0 inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                {{ genre.novelCount }} novel
              </span>
            </div>

            <!-- Delete button -->
            <button
              type="button"
              :aria-label="`Hapus genre ${genre.name}`"
              class="ml-4 shrink-0 rounded px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
              @click="requestDelete(genre)"
            >
              Hapus
            </button>
          </li>
        </ul>
      </div>

    </main>

    <!-- Confirm delete dialog -->
    <ConfirmDialog
      :open="confirmOpen"
      title="Hapus Genre"
      :message="pendingDeleteGenre
        ? `Genre ini digunakan oleh ${pendingDeleteGenre.novelCount} novel. Menghapus genre ini akan menghapusnya dari semua novel tersebut.`
        : ''"
      confirm-label="Hapus"
      cancel-label="Batal"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>
