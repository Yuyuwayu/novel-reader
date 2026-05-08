<script setup lang="ts">
// Notes page: displays all highlights and notes grouped by novel.
// Fetches highlights for each novel the user has reading progress for.
// Requirements: 26.5

import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useSeoMeta } from '@/composables/useSeoMeta'
import { fetchHighlights, deleteHighlight } from '@/api'
import { ApiError } from '@/api'
import type { Highlight } from '@/types'
import { isStorageAvailable } from '@/utils/storage'
import { formatRelativeTime } from '@/utils/formatRelativeTime'
import LoadingIndicator from '@/components/LoadingIndicator.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

useSeoMeta('Catatan & Highlight — Novel Reader', 'Semua highlight dan catatan yang kamu buat saat membaca novel.')

// ── State ─────────────────────────────────────────────────────────────────────

/** Highlights grouped by novelId */
interface NovelHighlightGroup {
  novelId: string
  novelTitle: string
  highlights: Highlight[]
}

const groups = ref<NovelHighlightGroup[]>([])
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

/** Highlight pending deletion */
const pendingDelete = ref<Highlight | null>(null)
const showConfirmDialog = ref(false)

// ── Color display helpers ─────────────────────────────────────────────────────

const COLOR_BG_MAP: Record<Highlight['color'], string> = {
  yellow: 'bg-yellow-200 dark:bg-yellow-900/40',
  green: 'bg-green-200 dark:bg-green-900/40',
  blue: 'bg-blue-200 dark:bg-blue-900/40',
  pink: 'bg-pink-200 dark:bg-pink-900/40',
}

const COLOR_BORDER_MAP: Record<Highlight['color'], string> = {
  yellow: 'border-yellow-400',
  green: 'border-green-400',
  blue: 'border-blue-400',
  pink: 'border-pink-400',
}

const COLOR_LABEL_MAP: Record<Highlight['color'], string> = {
  yellow: 'Kuning',
  green: 'Hijau',
  blue: 'Biru',
  pink: 'Merah Muda',
}

// ── Data loading ──────────────────────────────────────────────────────────────

/**
 * Reads all novel IDs from localStorage reading progress keys.
 * Returns an array of { novelId, novelTitle } objects.
 */
function getReadingProgressNovels(): Array<{ novelId: string; novelTitle: string }> {
  if (!isStorageAvailable()) return []

  const results: Array<{ novelId: string; novelTitle: string }> = []
  const prefix = 'novel_reader:progress:'

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        const novelId = key.slice(prefix.length)
        results.push({ novelId, novelTitle: novelId })
      }
    }
  } catch {
    // Fail silently
  }

  return results
}

async function loadNotes(): Promise<void> {
  isLoading.value = true
  errorMessage.value = null
  groups.value = []

  try {
    const novels = getReadingProgressNovels()

    if (novels.length === 0) {
      isLoading.value = false
      return
    }

    // Fetch all highlights for each novel in parallel (no chapterNumber = all chapters)
    const results = await Promise.allSettled(
      novels.map(async ({ novelId }) => {
        const highlights = await fetchHighlights(novelId)
        return { novelId, highlights }
      })
    )

    const newGroups: NovelHighlightGroup[] = []
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.highlights.length > 0) {
        newGroups.push({
          novelId: result.value.novelId,
          novelTitle: result.value.novelId,
          highlights: result.value.highlights,
        })
      }
    }

    // Sort groups by novelId for consistent ordering
    newGroups.sort((a, b) => a.novelId.localeCompare(b.novelId))
    groups.value = newGroups
  } catch (err) {
    if (err instanceof ApiError) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = 'Gagal memuat catatan. Silakan coba lagi.'
    }
  } finally {
    isLoading.value = false
  }
}

// ── Delete highlight ──────────────────────────────────────────────────────────

function confirmDelete(highlight: Highlight): void {
  pendingDelete.value = highlight
  showConfirmDialog.value = true
}

async function onConfirmDelete(): Promise<void> {
  if (!pendingDelete.value) return

  const toDelete = pendingDelete.value
  showConfirmDialog.value = false
  pendingDelete.value = null

  try {
    await deleteHighlight(toDelete.id)

    // Remove from local state
    for (const group of groups.value) {
      const idx = group.highlights.findIndex((h) => h.id === toDelete.id)
      if (idx !== -1) {
        group.highlights.splice(idx, 1)
        break
      }
    }

    // Remove empty groups
    groups.value = groups.value.filter((g) => g.highlights.length > 0)
  } catch {
    // Non-critical — fail silently
  }
}

function onCancelDelete(): void {
  showConfirmDialog.value = false
  pendingDelete.value = null
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(() => {
  loadNotes()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">

      <!-- Page header -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Catatan &amp; Highlight
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Semua highlight yang kamu buat saat membaca, dikelompokkan per novel.
        </p>
      </div>

      <!-- Loading state -->
      <div v-if="isLoading" class="flex justify-center py-16">
        <LoadingIndicator />
      </div>

      <!-- Error state -->
      <ErrorMessage
        v-else-if="errorMessage"
        :message="errorMessage"
        :retryable="true"
        @retry="loadNotes"
      />

      <!-- Empty state -->
      <div
        v-else-if="groups.length === 0"
        class="rounded-xl border border-dashed py-16 text-center"
        :class="'border-gray-300 dark:border-gray-700'"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p class="text-base font-medium text-gray-500 dark:text-gray-400">
          Belum ada highlight
        </p>
        <p class="mt-1 text-sm text-gray-400 dark:text-gray-500">
          Pilih teks saat membaca novel untuk membuat highlight.
        </p>
        <RouterLink
          to="/finder"
          class="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Mulai Membaca
        </RouterLink>
      </div>

      <!-- Highlights grouped by novel -->
      <div v-else class="space-y-8">
        <section
          v-for="group in groups"
          :key="group.novelId"
          class="rounded-xl border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <!-- Novel header -->
          <div class="flex items-center justify-between border-b px-5 py-4 dark:border-gray-700">
            <RouterLink
              :to="`/novel/${group.novelId}`"
              class="text-base font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              {{ group.novelId }}
            </RouterLink>
            <span class="text-xs text-gray-400 dark:text-gray-500">
              {{ group.highlights.length }} highlight
            </span>
          </div>

          <!-- Highlight list -->
          <ul class="divide-y divide-gray-100 dark:divide-gray-700">
            <li
              v-for="highlight in group.highlights"
              :key="highlight.id"
              class="flex items-start gap-4 px-5 py-4"
            >
              <!-- Color indicator -->
              <span
                class="mt-0.5 h-4 w-1 flex-shrink-0 rounded-full border-l-4"
                :class="COLOR_BORDER_MAP[highlight.color]"
                :aria-label="`Warna ${COLOR_LABEL_MAP[highlight.color]}`"
              />

              <!-- Highlight content -->
              <div class="min-w-0 flex-1">
                <!-- Chapter link -->
                <RouterLink
                  :to="`/novel/${group.novelId}/chapter/${highlight.chapterNumber}`"
                  class="mb-1 inline-flex items-center gap-1 text-xs font-medium text-gray-500 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Chapter {{ highlight.chapterNumber }}
                </RouterLink>

                <!-- Highlight text placeholder (offsets only, no original text stored) -->
                <div
                  class="mb-2 rounded px-2 py-1 text-sm"
                  :class="COLOR_BG_MAP[highlight.color]"
                >
                  <span class="text-gray-700 dark:text-gray-300">
                    Offset {{ highlight.startOffset }}–{{ highlight.endOffset }}
                  </span>
                </div>

                <!-- Note (if any) -->
                <p
                  v-if="highlight.note"
                  class="text-sm text-gray-600 dark:text-gray-300"
                >
                  {{ highlight.note }}
                </p>
                <p
                  v-else
                  class="text-xs italic text-gray-400 dark:text-gray-500"
                >
                  Tidak ada catatan
                </p>

                <!-- Timestamp -->
                <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  {{ formatRelativeTime(highlight.createdAt) }}
                </p>
              </div>

              <!-- Delete button -->
              <button
                type="button"
                :aria-label="`Hapus highlight di chapter ${highlight.chapterNumber}`"
                class="flex-shrink-0 rounded p-1 text-gray-400 transition-colors hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-gray-500 dark:hover:text-red-400"
                @click="confirmDelete(highlight)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </li>
          </ul>
        </section>
      </div>
    </div>

    <!-- Confirm delete dialog -->
    <ConfirmDialog
      :open="showConfirmDialog"
      title="Hapus Highlight"
      :message="`Apakah kamu yakin ingin menghapus highlight ini${pendingDelete?.note ? ` beserta catatannya` : ''}? Tindakan ini tidak dapat dibatalkan.`"
      confirm-label="Hapus"
      cancel-label="Batal"
      @confirm="onConfirmDelete"
      @cancel="onCancelDelete"
    />
  </div>
</template>
