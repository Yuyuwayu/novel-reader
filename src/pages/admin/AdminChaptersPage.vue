<script setup lang="ts">
// Admin chapters list page — CRUD for chapters of a novel.
// Requirements: 11.1, 11.6, 11.7, 14.5

import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { adminFetchChapters, adminDeleteChapter, ApiError } from '@/api'
import type { AdminChapterSummary } from '@/types'
import { useThemeStore } from '@/stores/theme'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()

const novelId = route.params.novelId as string

// ── State ─────────────────────────────────────────────────────────────────────

const chapters = ref<AdminChapterSummary[]>([])
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

// Confirm dialog state
const confirmOpen = ref(false)
const pendingDeleteNumber = ref<number | null>(null)
const pendingDeleteTitle = ref('')
const isDeleting = ref(false)

// ── Data fetching ─────────────────────────────────────────────────────────────

async function loadChapters(): Promise<void> {
  isLoading.value = true
  errorMessage.value = null

  try {
    chapters.value = await adminFetchChapters(novelId)
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

function goBack(): void {
  router.push('/admin/novels')
}

function goToCreate(): void {
  router.push(`/admin/novels/${novelId}/chapters/new`)
}

function goToEdit(chapterNumber: number): void {
  router.push(`/admin/novels/${novelId}/chapters/${chapterNumber}/edit`)
}

// ── Delete flow ───────────────────────────────────────────────────────────────

function requestDelete(chapter: AdminChapterSummary): void {
  pendingDeleteNumber.value = chapter.number
  pendingDeleteTitle.value = chapter.title
  confirmOpen.value = true
}

function cancelDelete(): void {
  confirmOpen.value = false
  pendingDeleteNumber.value = null
  pendingDeleteTitle.value = ''
}

async function confirmDelete(): Promise<void> {
  if (pendingDeleteNumber.value === null) return

  isDeleting.value = true
  const numberToDelete = pendingDeleteNumber.value

  try {
    await adminDeleteChapter(novelId, numberToDelete)
    chapters.value = chapters.value.filter((c) => c.number !== numberToDelete)
    confirmOpen.value = false
    pendingDeleteNumber.value = null
    pendingDeleteTitle.value = ''
  } catch (err) {
    confirmOpen.value = false
    if (err instanceof ApiError) {
      errorMessage.value = `Gagal menghapus chapter: ${err.message}`
    } else {
      errorMessage.value = 'Gagal menghapus chapter. Silakan coba lagi.'
    }
  } finally {
    isDeleting.value = false
  }
}

// ── Release status helpers ────────────────────────────────────────────────────

function releaseStatusLabel(status: AdminChapterSummary['releaseStatus']): string {
  const map: Record<AdminChapterSummary['releaseStatus'], string> = {
    published: 'Terbit',
    scheduled: 'Terjadwal',
    draft: 'Draf',
  }
  return map[status]
}

function releaseStatusClass(status: AdminChapterSummary['releaseStatus']): string {
  const dark: Record<AdminChapterSummary['releaseStatus'], string> = {
    published: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    scheduled: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    draft: 'border-[rgba(255,255,255,0.08)] bg-white/[0.04] text-[#8A8F98]',
  }
  const light: Record<AdminChapterSummary['releaseStatus'], string> = {
    published: 'border-emerald-500/25 bg-emerald-50 text-emerald-600',
    scheduled: 'border-amber-500/25 bg-amber-50 text-amber-600',
    draft: 'border-[rgba(0,0,0,0.08)] bg-black/[0.03] text-[#6B7080]',
  }
  return themeStore.isDark ? dark[status] : light[status]
}

function formatScheduledAt(scheduledAt: string | null): string {
  if (!scheduledAt) return '—'
  const date = new Date(scheduledAt)
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(() => {
  loadChapters()
})
</script>

<template>
  <div class="relative min-h-screen transition-colors duration-300" :class="themeStore.isDark ? 'bg-[#050506]' : 'bg-[#F8F8FC]'">
    <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div class="absolute inset-0" :class="themeStore.isDark ? 'bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)]' : 'bg-[radial-gradient(ellipse_at_top,#eeeef8_0%,#F8F8FC_50%,#ebebf2_100%)]'" />
      <div class="absolute -top-[80px] left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full blur-[120px] animate-[blob-float_10s_ease-in-out_infinite]" :class="themeStore.isDark ? 'bg-[rgba(94,106,210,0.15)]' : 'bg-[rgba(94,106,210,0.07)]'" />
    </div>

    <header class="sticky top-0 z-20 border-b backdrop-blur-xl" :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)] bg-[rgba(5,5,6,0.80)]' : 'border-[rgba(0,0,0,0.07)] bg-[rgba(248,248,252,0.80)]'">
      <div class="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-3">
          <button type="button" class="rounded-lg p-1.5 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50" :class="themeStore.isDark ? 'text-[#8A8F98] hover:bg-white/[0.06] hover:text-[#EDEDEF]' : 'text-[#6B7080] hover:bg-black/[0.05] hover:text-[#111118]'" aria-label="Kembali ke daftar novel" @click="goBack">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span class="rounded-full border px-3 py-0.5 font-mono text-xs tracking-widest uppercase" :class="themeStore.isDark ? 'border-[rgba(94,106,210,0.30)] text-[#5E6AD2]' : 'border-[rgba(94,106,210,0.25)] text-[#5E6AD2]'">Admin</span>
          <h1 class="text-lg font-semibold tracking-tight" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">Manajemen Chapter</h1>
        </div>
      </div>
    </header>

    <main class="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="mb-6 flex items-center justify-between">
        <p class="font-mono text-xs" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'">
          <template v-if="!isLoading && !errorMessage">{{ chapters.length }} chapter</template>
        </p>
        <button type="button" class="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2" :class="themeStore.isDark ? 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3)] hover:bg-[#6872D9] focus:ring-offset-[#050506]' : 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.4),0_4px_12px_rgba(94,106,210,0.2)] hover:bg-[#6872D9] focus:ring-offset-[#F8F8FC]'" @click="goToCreate">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
          Tambah Chapter
        </button>
      </div>

      <div v-if="isLoading" aria-busy="true" class="overflow-hidden rounded-2xl border" :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-white/[0.07] to-white/[0.02]' : 'border-[rgba(0,0,0,0.07)] bg-white'">
        <div class="divide-y" :class="themeStore.isDark ? 'divide-[rgba(255,255,255,0.06)]' : 'divide-[rgba(0,0,0,0.06)]'">
          <div v-for="n in 5" :key="n" class="flex items-center gap-4 px-4 py-3.5">
            <div class="h-4 w-8 animate-pulse rounded" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
            <div class="h-4 w-48 animate-pulse rounded" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
            <div class="ml-auto h-5 w-20 animate-pulse rounded-full" :class="themeStore.isDark ? 'bg-white/[0.06]' : 'bg-black/[0.05]'" />
          </div>
        </div>
      </div>

      <div v-else-if="errorMessage" class="flex flex-col items-center gap-4 py-16 text-center">
        <p class="text-sm" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">{{ errorMessage }}</p>
        <button type="button" class="rounded-lg px-5 py-2 text-sm font-semibold text-white bg-[#5E6AD2] hover:bg-[#6872D9] focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50" @click="loadChapters">Coba Lagi</button>
      </div>

      <div v-else-if="chapters.length === 0" class="flex flex-col items-center gap-4 py-16 text-center">
        <p class="text-sm" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">Belum ada chapter. Tambahkan chapter pertama.</p>
        <button type="button" class="rounded-lg px-5 py-2 text-sm font-semibold text-white bg-[#5E6AD2] hover:bg-[#6872D9] focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50" @click="goToCreate">Tambah Chapter</button>
      </div>

      <div v-else class="overflow-hidden rounded-2xl border" :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-white/[0.07] to-white/[0.02]' : 'border-[rgba(0,0,0,0.07)] bg-white'">
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead>
              <tr :class="themeStore.isDark ? 'border-b border-[rgba(255,255,255,0.06)]' : 'border-b border-[rgba(0,0,0,0.06)]'">
                <th v-for="col in ['No.', 'Judul', 'Status Rilis', 'Tanggal Rilis', 'Aksi']" :key="col" scope="col" class="px-4 py-3 text-left font-mono text-xs uppercase tracking-widest" :class="[col === 'Aksi' ? 'text-right' : '', themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]']">{{ col }}</th>
              </tr>
            </thead>
            <tbody class="divide-y" :class="themeStore.isDark ? 'divide-[rgba(255,255,255,0.04)]' : 'divide-[rgba(0,0,0,0.04)]'">
              <tr v-for="chapter in chapters" :key="chapter.number" class="transition-colors duration-150" :class="themeStore.isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-black/[0.02]'">
                <td class="px-4 py-3.5">
                  <span class="font-mono text-sm" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'">{{ chapter.number }}</span>
                </td>
                <td class="px-4 py-3.5">
                  <p class="max-w-xs truncate text-sm font-medium" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">{{ chapter.title }}</p>
                </td>
                <td class="px-4 py-3.5">
                  <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-xs font-medium uppercase tracking-wide" :class="releaseStatusClass(chapter.releaseStatus)">{{ releaseStatusLabel(chapter.releaseStatus) }}</span>
                </td>
                <td class="px-4 py-3.5">
                  <p class="text-sm" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">{{ chapter.releaseStatus === 'scheduled' ? formatScheduledAt(chapter.scheduledAt) : '—' }}</p>
                </td>
                <td class="px-4 py-3.5 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button type="button" :aria-label="`Edit chapter ${chapter.number}`" class="rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/40" :class="themeStore.isDark ? 'text-[#5E6AD2] hover:bg-[rgba(94,106,210,0.10)]' : 'text-[#5E6AD2] hover:bg-[rgba(94,106,210,0.08)]'" @click="goToEdit(chapter.number)">Edit</button>
                    <button type="button" :aria-label="`Hapus chapter ${chapter.number}`" class="rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-500/40" :class="themeStore.isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'" @click="requestDelete(chapter)">Hapus</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <ConfirmDialog :open="confirmOpen" title="Hapus Chapter" :message="`Apakah Anda yakin ingin menghapus chapter &quot;${pendingDeleteTitle}&quot;? Tindakan ini tidak dapat dibatalkan.`" confirm-label="Hapus" cancel-label="Batal" @confirm="confirmDelete" @cancel="cancelDelete" />
  </div>
</template>
      <div class="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="rounded p-1 text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
            aria-label="Kembali ke daftar novel"
            @click="goBack"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Manajemen Chapter</h1>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <main class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

      <!-- Toolbar -->
      <div class="mb-6 flex items-center justify-between">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          <template v-if="!isLoading && !errorMessage">
            {{ chapters.length }} chapter
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
          Tambah Chapter
        </button>
      </div>

      <!-- Loading skeleton -->
      <div
        v-if="isLoading"
        aria-busy="true"
        aria-label="Memuat daftar chapter..."
        class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm"
      >
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">No.</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Judul</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Status Rilis</th>
              <th class="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:table-cell">Tanggal Rilis</th>
              <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
            <tr v-for="n in 5" :key="n">
              <td class="px-4 py-3">
                <div class="h-4 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              </td>
              <td class="px-4 py-3">
                <div class="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              </td>
              <td class="px-4 py-3">
                <div class="h-5 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
              </td>
              <td class="hidden px-4 py-3 sm:table-cell">
                <div class="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
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
          @click="loadChapters"
        >
          Coba Lagi
        </button>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="chapters.length === 0"
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
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-gray-500 dark:text-gray-400">Belum ada chapter. Tambahkan chapter pertama.</p>
        <button
          type="button"
          class="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          @click="goToCreate"
        >
          Tambah Chapter
        </button>
      </div>

      <!-- Chapters table -->
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
                No.
              </th>
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
                Status Rilis
              </th>
              <th
                scope="col"
                class="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:table-cell"
              >
                Tanggal Rilis
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
              v-for="chapter in chapters"
              :key="chapter.number"
              class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <!-- Chapter number -->
              <td class="px-4 py-3">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ chapter.number }}</span>
              </td>

              <!-- Title -->
              <td class="px-4 py-3">
                <p class="max-w-xs truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                  {{ chapter.title }}
                </p>
              </td>

              <!-- Release status badge -->
              <td class="px-4 py-3">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    releaseStatusClass(chapter.releaseStatus),
                  ]"
                >
                  {{ releaseStatusLabel(chapter.releaseStatus) }}
                </span>
              </td>

              <!-- Scheduled date (hidden on mobile) -->
              <td class="hidden px-4 py-3 sm:table-cell">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ chapter.releaseStatus === 'scheduled' ? formatScheduledAt(chapter.scheduledAt) : '—' }}
                </p>
              </td>

              <!-- Actions -->
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    :aria-label="`Edit chapter ${chapter.number}`"
                    class="rounded px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    @click="goToEdit(chapter.number)"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    :aria-label="`Hapus chapter ${chapter.number}`"
                    class="rounded px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                    @click="requestDelete(chapter)"
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
      title="Hapus Chapter"
      :message="`Apakah Anda yakin ingin menghapus chapter &quot;${pendingDeleteTitle}&quot;? Tindakan ini tidak dapat dibatalkan.`"
      confirm-label="Hapus"
      cancel-label="Batal"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>
