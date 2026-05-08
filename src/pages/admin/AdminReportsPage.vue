<script setup lang="ts">
// Admin reports management page.
// Displays chapter error reports submitted by users, with status filtering and status updates.
// Requirements: 29.4

import { ref, computed, onMounted } from 'vue'
import { adminFetchReports, adminUpdateReportStatus } from '@/api'
import { ApiError } from '@/api'
import type { Report } from '@/types'
import { useSeoMeta } from '@/composables/useSeoMeta'

useSeoMeta('Manajemen Laporan — Admin | Novel Reader')

// ── Types ─────────────────────────────────────────────────────────────────────

type StatusFilter = 'all' | Report['status']

// ── State ─────────────────────────────────────────────────────────────────────

const reports = ref<Report[]>([])
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const activeTab = ref<StatusFilter>('all')
const updatingReportId = ref<string | null>(null)

// Pagination (client-side, 20 per page)
const currentPage = ref(1)
const PER_PAGE = 20

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: 'new', label: 'Baru' },
  { value: 'reviewing', label: 'Sedang Ditinjau' },
  { value: 'resolved', label: 'Selesai' },
]

const REPORT_TYPE_LABELS: Record<Report['type'], string> = {
  wrong_translation: 'Terjemahan Salah',
  missing_content: 'Konten Hilang',
  duplicate: 'Chapter Duplikat',
  inappropriate: 'Konten Tidak Sesuai',
  other: 'Lainnya',
}

const STATUS_LABELS: Record<Report['status'], string> = {
  new: 'Baru',
  reviewing: 'Sedang Ditinjau',
  resolved: 'Selesai',
}

const STATUS_BADGE_CLASSES: Record<Report['status'], string> = {
  new: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  reviewing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

// ── Computed ──────────────────────────────────────────────────────────────────

/** Reports filtered by the active tab */
const filteredReports = computed(() => {
  if (activeTab.value === 'all') return reports.value
  return reports.value.filter((r) => r.status === activeTab.value)
})

/** Total pages for current filter */
const totalPages = computed(() => Math.max(1, Math.ceil(filteredReports.value.length / PER_PAGE)))

/** Reports for the current page */
const pagedReports = computed(() => {
  const start = (currentPage.value - 1) * PER_PAGE
  return filteredReports.value.slice(start, start + PER_PAGE)
})

/** Count per status for tab badges */
const countByStatus = computed(() => {
  const counts: Record<StatusFilter, number> = { all: reports.value.length, new: 0, reviewing: 0, resolved: 0 }
  for (const r of reports.value) {
    counts[r.status]++
  }
  return counts
})

// ── Data fetching ─────────────────────────────────────────────────────────────

async function loadReports(): Promise<void> {
  isLoading.value = true
  errorMessage.value = null

  try {
    reports.value = await adminFetchReports()
  } catch (err) {
    if (err instanceof ApiError) {
      errorMessage.value = `Gagal memuat laporan: ${err.message}`
    } else {
      errorMessage.value = 'Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.'
    }
  } finally {
    isLoading.value = false
  }
}

// ── Tab switching ─────────────────────────────────────────────────────────────

function switchTab(tab: StatusFilter): void {
  activeTab.value = tab
  currentPage.value = 1
}

// ── Status update ─────────────────────────────────────────────────────────────

async function updateStatus(report: Report, newStatus: Report['status']): Promise<void> {
  updatingReportId.value = report.id

  try {
    const updated = await adminUpdateReportStatus(report.id, newStatus)
    const idx = reports.value.findIndex((r) => r.id === report.id)
    if (idx !== -1) {
      reports.value[idx] = updated
    }
  } catch (err) {
    if (err instanceof ApiError) {
      alert(`Gagal memperbarui status: ${err.message}`)
    } else {
      alert('Terjadi kesalahan. Silakan coba lagi.')
    }
  } finally {
    updatingReportId.value = null
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function truncate(text: string, maxLength = 80): string {
  if (!text) return '—'
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(() => {
  loadReports()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

      <!-- Page header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Manajemen Laporan Chapter
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Tinjau dan kelola laporan masalah yang dikirimkan oleh pengguna.
        </p>
      </div>

      <!-- Error state -->
      <div
        v-if="errorMessage"
        class="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-sm text-red-700 dark:text-red-400">{{ errorMessage }}</p>
        <button
          type="button"
          class="ml-auto text-sm font-medium text-red-600 underline hover:no-underline dark:text-red-400"
          @click="loadReports"
        >
          Coba lagi
        </button>
      </div>

      <!-- Tab filter -->
      <div class="mb-4 border-b border-gray-200 dark:border-gray-700">
        <nav class="-mb-px flex gap-1" aria-label="Filter status laporan">
          <button
            v-for="tab in TABS"
            :key="tab.value"
            type="button"
            class="inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            :class="
              activeTab === tab.value
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            "
            :aria-current="activeTab === tab.value ? 'page' : undefined"
            @click="switchTab(tab.value)"
          >
            {{ tab.label }}
            <span
              class="rounded-full px-1.5 py-0.5 text-xs font-semibold"
              :class="
                activeTab === tab.value
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              "
            >
              {{ countByStatus[tab.value] }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Loading skeleton -->
      <div v-if="isLoading" class="space-y-3" aria-busy="true" aria-label="Memuat laporan...">
        <div
          v-for="n in 5"
          :key="n"
          class="h-16 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
        />
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!errorMessage && filteredReports.length === 0"
        class="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 dark:border-gray-600"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="mb-3 h-10 w-10 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
          Tidak ada laporan
          <template v-if="activeTab !== 'all'">dengan status "{{ STATUS_LABELS[activeTab as Report['status']] }}"</template>
        </p>
      </div>

      <!-- Reports table -->
      <div v-else-if="!isLoading && !errorMessage" class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Novel / Chapter
                </th>
                <th scope="col" class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Jenis
                </th>
                <th scope="col" class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Deskripsi
                </th>
                <th scope="col" class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th scope="col" class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Tanggal
                </th>
                <th scope="col" class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
              <tr
                v-for="report in pagedReports"
                :key="report.id"
                class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <!-- Novel / Chapter -->
                <td class="whitespace-nowrap px-4 py-3">
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{ report.novelId }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Chapter {{ report.chapterNumber }}
                  </p>
                </td>

                <!-- Type -->
                <td class="whitespace-nowrap px-4 py-3">
                  <span class="text-sm text-gray-700 dark:text-gray-300">
                    {{ REPORT_TYPE_LABELS[report.type] }}
                  </span>
                </td>

                <!-- Description (truncated) -->
                <td class="px-4 py-3">
                  <p
                    class="max-w-xs text-sm text-gray-600 dark:text-gray-400"
                    :title="report.description || undefined"
                  >
                    {{ truncate(report.description) }}
                  </p>
                </td>

                <!-- Status badge -->
                <td class="whitespace-nowrap px-4 py-3">
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                    :class="STATUS_BADGE_CLASSES[report.status]"
                  >
                    {{ STATUS_LABELS[report.status] }}
                  </span>
                </td>

                <!-- Date -->
                <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDate(report.createdAt) }}
                </td>

                <!-- Actions -->
                <td class="whitespace-nowrap px-4 py-3 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <!-- new → reviewing -->
                    <button
                      v-if="report.status === 'new'"
                      type="button"
                      class="inline-flex items-center gap-1 rounded-lg border border-yellow-300 bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700 transition-colors hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/40"
                      :disabled="updatingReportId === report.id"
                      @click="updateStatus(report, 'reviewing')"
                    >
                      <svg
                        v-if="updatingReportId === report.id"
                        class="h-3 w-3 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Tandai Sedang Ditinjau
                    </button>

                    <!-- reviewing → resolved -->
                    <button
                      v-if="report.status === 'reviewing'"
                      type="button"
                      class="inline-flex items-center gap-1 rounded-lg border border-green-300 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40"
                      :disabled="updatingReportId === report.id"
                      @click="updateStatus(report, 'resolved')"
                    >
                      <svg
                        v-if="updatingReportId === report.id"
                        class="h-3 w-3 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Tandai Selesai
                    </button>

                    <!-- resolved — no further action -->
                    <span
                      v-if="report.status === 'resolved'"
                      class="text-xs text-gray-400 dark:text-gray-500"
                    >
                      Selesai
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          v-if="totalPages > 1"
          class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900"
        >
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Halaman {{ currentPage }} dari {{ totalPages }}
            ({{ filteredReports.length }} laporan)
          </p>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              :class="
                currentPage === 1
                  ? 'border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-600'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
              "
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              class="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              :class="
                currentPage === totalPages
                  ? 'border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-600'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
              "
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
