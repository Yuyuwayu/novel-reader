<script setup lang="ts">
// Admin novels list page — CRUD for novels.
// Requirements: 10.1, 10.6, 10.7, 10.8

import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { adminFetchNovels, adminDeleteNovel } from '@/api'
import { ApiError } from '@/api'
import type { NovelSummary } from '@/types'
import { useThemeStore } from '@/stores/theme'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const router = useRouter()
const themeStore = useThemeStore()

// ── State ─────────────────────────────────────────────────────────────────────

const novels = ref<NovelSummary[]>([])
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

// Confirm dialog state
const confirmOpen = ref(false)
const pendingDeleteId = ref<string | null>(null)
const pendingDeleteTitle = ref('')
const isDeleting = ref(false)

// ── Data fetching ─────────────────────────────────────────────────────────────

async function loadNovels(): Promise<void> {
  isLoading.value = true
  errorMessage.value = null

  try {
    novels.value = await adminFetchNovels()
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

// ── Navigation ────────────────────────────────────────────────────────────────

function goToCreate(): void {
  router.push('/admin/novels/new')
}

function goToEdit(novelId: string): void {
  router.push(`/admin/novels/${novelId}/edit`)
}

// ── Delete flow ───────────────────────────────────────────────────────────────

function requestDelete(novel: NovelSummary): void {
  pendingDeleteId.value = novel.id
  pendingDeleteTitle.value = novel.title
  confirmOpen.value = true
}

function cancelDelete(): void {
  confirmOpen.value = false
  pendingDeleteId.value = null
  pendingDeleteTitle.value = ''
}

async function confirmDelete(): Promise<void> {
  if (!pendingDeleteId.value) return

  isDeleting.value = true
  const idToDelete = pendingDeleteId.value

  try {
    await adminDeleteNovel(idToDelete)
    novels.value = novels.value.filter((n) => n.id !== idToDelete)
    confirmOpen.value = false
    pendingDeleteId.value = null
    pendingDeleteTitle.value = ''
  } catch (err) {
    // Close dialog and show inline error
    confirmOpen.value = false
    if (err instanceof ApiError) {
      errorMessage.value = `Gagal menghapus novel: ${err.message}`
    } else {
      errorMessage.value = 'Gagal menghapus novel. Silakan coba lagi.'
    }
  } finally {
    isDeleting.value = false
  }
}

// ── Status badge helper ───────────────────────────────────────────────────────

function statusLabel(status: NovelSummary['status']): string {
  const map: Record<NovelSummary['status'], string> = {
    ongoing: 'Berlangsung',
    completed: 'Selesai',
    hiatus: 'Hiatus',
  }
  return map[status]
}

function statusClass(status: NovelSummary['status']): string {
  const dark: Record<NovelSummary['status'], string> = {
    ongoing: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    completed: 'border-[rgba(94,106,210,0.30)] bg-[rgba(94,106,210,0.10)] text-[#8A9AE8]',
    hiatus: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  }
  const light: Record<NovelSummary['status'], string> = {
    ongoing: 'border-emerald-500/25 bg-emerald-50 text-emerald-600',
    completed: 'border-[rgba(94,106,210,0.25)] bg-[rgba(94,106,210,0.08)] text-[#5E6AD2]',
    hiatus: 'border-amber-500/25 bg-amber-50 text-amber-600',
  }
  return themeStore.isDark ? dark[status] : light[status]
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(() => {
  loadNovels()
})
</script>

<template>
  <div class="relative min-h-screen transition-colors duration-300" :class="themeStore.isDark ? 'bg-[#050506]' : 'bg-[#F8F8FC]'">
    <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div class="absolute inset-0" :class="themeStore.isDark ? 'bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)]' : 'bg-[radial-gradient(ellipse_at_top,#eeeef8_0%,#F8F8FC_50%,#ebebf2_100%)]'" />
      <div class="absolute -top-[80px] left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full blur-[120px] animate-[blob-float_10s_ease-in-out_infinite]" :class="themeStore.isDark ? 'bg-[rgba(94,106,210,0.15)]' : 'bg-[rgba(94,106,210,0.07)]'" />
    </div>

    <header class="sticky top-0 z-20 border-b backdrop-blur-xl" :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)] bg-[rgba(5,5,6,0.80)]' : 'border-[rgba(0,0,0,0.07)] bg-[rgba(248,248,252,0.80)]'">
      <div class="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-3">
          <span class="rounded-full border px-3 py-0.5 font-mono text-xs tracking-widest uppercase" :class="themeStore.isDark ? 'border-[rgba(94,106,210,0.30)] text-[#5E6AD2]' : 'border-[rgba(94,106,210,0.25)] text-[#5E6AD2]'">Admin</span>
          <h1 class="text-lg font-semibold tracking-tight" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">Manajemen Novel</h1>
        </div>
      </div>
    </header>

    <main class="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <!-- Toolbar -->
      <div class="mb-6 flex items-center justify-between">
        <p class="font-mono text-xs" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'">
          <template v-if="!isLoading && !errorMessage">{{ novels.length }} novel</template>
        </p>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
          :class="themeStore.isDark ? 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3)] hover:bg-[#6872D9] focus:ring-offset-[#050506]' : 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.4),0_4px_12px_rgba(94,106,210,0.2)] hover:bg-[#6872D9] focus:ring-offset-[#F8F8FC]'"
          @click="goToCreate"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
          Tambah Novel
        </button>
      </div>

      <!-- Loading skeleton -->
      <div v-if="isLoading" aria-busy="true" class="overflow-hidden rounded-2xl border" :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-white/[0.07] to-white/[0.02]' : 'border-[rgba(0,0,0,0.07)] bg-white'">
        <div class="divide-y" :class="themeStore.isDark ? 'divide-[rgba(255,255,255,0.06)]' : 'divide-[rgba(0,0,0,0.06)]'">
          <div v-for="n in 5" :key="n" class="flex items-center gap-4 px-4 py-3.5">
            <div class="h-4 w-40 animate-pulse rounded" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
            <div class="h-4 w-28 animate-pulse rounded" :class="themeStore.isDark ? 'bg-white/[0.06]' : 'bg-black/[0.05]'" />
            <div class="ml-auto h-5 w-20 animate-pulse rounded-full" :class="themeStore.isDark ? 'bg-white/[0.06]' : 'bg-black/[0.05]'" />
          </div>
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="errorMessage" class="flex flex-col items-center gap-4 py-16 text-center">
        <p class="text-sm" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">{{ errorMessage }}</p>
        <button type="button" class="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#6872D9] focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50" :class="themeStore.isDark ? 'bg-[#5E6AD2]' : 'bg-[#5E6AD2]'" @click="loadNovels">Coba Lagi</button>
      </div>

      <!-- Empty state -->
      <div v-else-if="novels.length === 0" class="flex flex-col items-center gap-4 py-16 text-center">
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl border" :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-white/[0.07] to-white/[0.02]' : 'border-[rgba(0,0,0,0.07)] bg-white'">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
        </div>
        <p class="text-sm" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">Belum ada novel. Tambahkan novel pertama.</p>
        <button type="button" class="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#6872D9] focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50" :class="themeStore.isDark ? 'bg-[#5E6AD2]' : 'bg-[#5E6AD2]'" @click="goToCreate">Tambah Novel</button>
      </div>

      <!-- Novels table -->
      <div v-else class="overflow-hidden rounded-2xl border" :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-white/[0.07] to-white/[0.02]' : 'border-[rgba(0,0,0,0.07)] bg-white'">
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead>
              <tr :class="themeStore.isDark ? 'border-b border-[rgba(255,255,255,0.06)]' : 'border-b border-[rgba(0,0,0,0.06)]'">
                <th v-for="col in ['Judul', 'Penulis', 'Genre', 'Status', 'Aksi']" :key="col" scope="col" class="px-4 py-3 text-left font-mono text-xs uppercase tracking-widest" :class="[col === 'Aksi' ? 'text-right' : '', themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]']">{{ col }}</th>
              </tr>
            </thead>
            <tbody class="divide-y" :class="themeStore.isDark ? 'divide-[rgba(255,255,255,0.04)]' : 'divide-[rgba(0,0,0,0.04)]'">
              <tr v-for="novel in novels" :key="novel.id" class="transition-colors duration-150" :class="themeStore.isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-black/[0.02]'">
                <td class="px-4 py-3.5">
                  <p class="max-w-xs truncate text-sm font-medium" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">{{ novel.title }}</p>
                </td>
                <td class="px-4 py-3.5">
                  <p class="max-w-[10rem] truncate text-sm" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">{{ novel.author }}</p>
                </td>
                <td class="px-4 py-3.5">
                  <p class="max-w-[12rem] truncate text-sm" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">{{ novel.genre.join(', ') || '—' }}</p>
                </td>
                <td class="px-4 py-3.5">
                  <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-xs font-medium uppercase tracking-wide" :class="statusClass(novel.status)">{{ statusLabel(novel.status) }}</span>
                </td>
                <td class="px-4 py-3.5 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button type="button" :aria-label="`Edit novel ${novel.title}`" class="rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/40" :class="themeStore.isDark ? 'text-[#5E6AD2] hover:bg-[rgba(94,106,210,0.10)]' : 'text-[#5E6AD2] hover:bg-[rgba(94,106,210,0.08)]'" @click="goToEdit(novel.id)">Edit</button>
                    <button type="button" :aria-label="`Hapus novel ${novel.title}`" class="rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-500/40" :class="themeStore.isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'" @click="requestDelete(novel)">Hapus</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <ConfirmDialog :open="confirmOpen" title="Hapus Novel" :message="`Apakah Anda yakin ingin menghapus novel &quot;${pendingDeleteTitle}&quot;? Tindakan ini tidak dapat dibatalkan.`" confirm-label="Hapus" cancel-label="Batal" @confirm="confirmDelete" @cancel="cancelDelete" />
  </div>
</template>
      <div class="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Manajemen Novel</h1>
      </div>
    </div>

    <!-- Main content -->
    <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

      <!-- Toolbar -->
      <div class="mb-6 flex items-center justify-between">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          <template v-if="!isLoading && !errorMessage">
            {{ novels.length }} novel
          </template>
        </p>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          @click="goToCreate"
        >
          <svg
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
          Tambah Novel
        </button>
      </div>

      <!-- Loading skeleton -->
      <div v-if="isLoading" aria-busy="true" aria-label="Memuat daftar novel..." class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Judul</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Penulis</th>
              <th class="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:table-cell">Genre</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
              <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
            <tr v-for="n in 5" :key="n">
              <td class="px-4 py-3">
                <div class="h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              </td>
              <td class="px-4 py-3">
                <div class="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              </td>
              <td class="hidden px-4 py-3 sm:table-cell">
                <div class="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              </td>
              <td class="px-4 py-3">
                <div class="h-5 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="ml-auto h-7 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              </td>
            </tr>
          </tbody>
        </table>
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
          @click="loadNovels"
        >
          Coba Lagi
        </button>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="novels.length === 0"
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
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <p class="text-gray-500 dark:text-gray-400">Belum ada novel. Tambahkan novel pertama.</p>
        <button
          type="button"
          class="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          @click="goToCreate"
        >
          Tambah Novel
        </button>
      </div>

      <!-- Novels table -->
      <div
        v-else
        class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm"
      >
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                scope="col"
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Judul
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Penulis
              </th>
              <th
                scope="col"
                class="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:table-cell"
              >
                Genre
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Status
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
            <tr
              v-for="novel in novels"
              :key="novel.id"
              class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <!-- Title -->
              <td class="px-4 py-3">
                <p class="max-w-xs truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                  {{ novel.title }}
                </p>
              </td>

              <!-- Author -->
              <td class="px-4 py-3">
                <p class="max-w-[10rem] truncate text-sm text-gray-600 dark:text-gray-400">
                  {{ novel.author }}
                </p>
              </td>

              <!-- Genre (hidden on mobile) -->
              <td class="hidden px-4 py-3 sm:table-cell">
                <p class="max-w-[12rem] truncate text-sm text-gray-500 dark:text-gray-400">
                  {{ novel.genre.join(', ') || '—' }}
                </p>
              </td>

              <!-- Status badge -->
              <td class="px-4 py-3">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    statusClass(novel.status),
                  ]"
                >
                  {{ statusLabel(novel.status) }}
                </span>
              </td>

              <!-- Actions -->
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    :aria-label="`Edit novel ${novel.title}`"
                    class="rounded px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    @click="goToEdit(novel.id)"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    :aria-label="`Hapus novel ${novel.title}`"
                    class="rounded px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                    @click="requestDelete(novel)"
                  >
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <!-- Confirm delete dialog -->
    <ConfirmDialog
      :open="confirmOpen"
      title="Hapus Novel"
      :message="`Apakah Anda yakin ingin menghapus novel &quot;${pendingDeleteTitle}&quot;? Tindakan ini tidak dapat dibatalkan.`"
      confirm-label="Hapus"
      cancel-label="Batal"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>
