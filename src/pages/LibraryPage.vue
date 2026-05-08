<script setup lang="ts">
// Library page: manage personal reading lists.
// Requirements: 24.4, 24.5

import { ref, onMounted } from 'vue'
import { useSeoMeta } from '@/composables/useSeoMeta'
import {
  fetchReadingLists,
  createReadingList,
  updateReadingList,
  deleteReadingList,
} from '@/api'
import { ApiError } from '@/api'
import type { ReadingList } from '@/types'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

useSeoMeta('Library — Novel Reader', 'Kelola koleksi novel pribadi Anda.')

// ── State ─────────────────────────────────────────────────────────────────────

const lists = ref<ReadingList[]>([])
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

// ── Create new list ───────────────────────────────────────────────────────────

const showCreateInput = ref(false)
const newListName = ref('')
const createError = ref<string | null>(null)
const isCreating = ref(false)

function openCreateInput(): void {
  showCreateInput.value = true
  newListName.value = ''
  createError.value = null
}

function cancelCreate(): void {
  showCreateInput.value = false
  newListName.value = ''
  createError.value = null
}

async function submitCreate(): Promise<void> {
  const name = newListName.value.trim()
  if (!name) {
    createError.value = 'Nama list tidak boleh kosong.'
    return
  }

  isCreating.value = true
  createError.value = null

  try {
    const created = await createReadingList(name)
    lists.value.push(created)
    showCreateInput.value = false
    newListName.value = ''
  } catch (err) {
    createError.value = err instanceof ApiError ? err.message : 'Gagal membuat list. Silakan coba lagi.'
  } finally {
    isCreating.value = false
  }
}

// ── Rename list ───────────────────────────────────────────────────────────────

const renamingId = ref<string | null>(null)
const renameValue = ref('')
const renameError = ref<string | null>(null)
const isRenaming = ref(false)

function startRename(list: ReadingList): void {
  renamingId.value = list.id
  renameValue.value = list.name
  renameError.value = null
}

function cancelRename(): void {
  renamingId.value = null
  renameValue.value = ''
  renameError.value = null
}

async function submitRename(listId: string): Promise<void> {
  const name = renameValue.value.trim()
  if (!name) {
    renameError.value = 'Nama list tidak boleh kosong.'
    return
  }

  isRenaming.value = true
  renameError.value = null

  try {
    const updated = await updateReadingList(listId, name)
    const idx = lists.value.findIndex((l) => l.id === listId)
    if (idx !== -1) {
      lists.value[idx] = updated
    }
    renamingId.value = null
  } catch (err) {
    renameError.value = err instanceof ApiError ? err.message : 'Gagal mengubah nama list. Silakan coba lagi.'
  } finally {
    isRenaming.value = false
  }
}

// ── Delete list ───────────────────────────────────────────────────────────────

const confirmDeleteList = ref<ReadingList | null>(null)
const isDeleting = ref(false)

function requestDelete(list: ReadingList): void {
  confirmDeleteList.value = list
}

async function confirmDelete(): Promise<void> {
  if (!confirmDeleteList.value) return

  const listId = confirmDeleteList.value.id
  isDeleting.value = true

  try {
    await deleteReadingList(listId)
    lists.value = lists.value.filter((l) => l.id !== listId)
    confirmDeleteList.value = null
  } catch (err) {
    errorMessage.value = err instanceof ApiError ? err.message : 'Gagal menghapus list. Silakan coba lagi.'
    confirmDeleteList.value = null
  } finally {
    isDeleting.value = false
  }
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function loadLists(): Promise<void> {
  isLoading.value = true
  errorMessage.value = null

  try {
    lists.value = await fetchReadingLists()
  } catch (err) {
    errorMessage.value = err instanceof ApiError ? err.message : 'Gagal memuat library. Silakan coba lagi.'
  } finally {
    isLoading.value = false
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(loadLists)
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <main class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">

      <!-- Page header -->
      <div class="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Library</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Kelola koleksi novel pribadi Anda.</p>
        </div>

        <button
          v-if="!showCreateInput"
          type="button"
          class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          @click="openCreateInput"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Buat List Baru
        </button>
      </div>

      <!-- Create new list inline form -->
      <div
        v-if="showCreateInput"
        class="mb-6 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4"
      >
        <p class="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">Buat List Baru</p>
        <div class="flex items-start gap-3">
          <div class="flex-1">
            <input
              v-model="newListName"
              type="text"
              placeholder="Nama list..."
              maxlength="100"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              :class="{ 'border-red-400 dark:border-red-500': createError }"
              @keydown.enter="submitCreate"
              @keydown.escape="cancelCreate"
            />
            <p v-if="createError" class="mt-1 text-xs text-red-600 dark:text-red-400">{{ createError }}</p>
          </div>
          <button
            type="button"
            :disabled="isCreating"
            class="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="submitCreate"
          >
            <svg v-if="isCreating" class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Simpan
          </button>
          <button
            type="button"
            class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
            @click="cancelCreate"
          >
            Batal
          </button>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="isLoading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonLoader v-for="i in 3" :key="i" class="h-36 rounded-lg" />
      </div>

      <!-- Error state -->
      <ErrorMessage
        v-else-if="errorMessage"
        :message="errorMessage"
        :retryable="true"
        @retry="loadLists"
      />

      <!-- Empty state -->
      <div
        v-else-if="lists.length === 0"
        class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 py-16 text-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p class="text-base font-medium text-gray-900 dark:text-gray-100">Belum ada list</p>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Buat list pertama Anda untuk mulai mengorganisir novel.</p>
        <button
          type="button"
          class="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="openCreateInput"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Buat List Baru
        </button>
      </div>

      <!-- Lists grid -->
      <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="list in lists"
          :key="list.id"
          class="group relative flex flex-col rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <!-- Rename inline form -->
          <template v-if="renamingId === list.id">
            <div class="flex flex-col gap-2">
              <input
                v-model="renameValue"
                type="text"
                maxlength="100"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                :class="{ 'border-red-400 dark:border-red-500': renameError }"
                @keydown.enter="submitRename(list.id)"
                @keydown.escape="cancelRename"
              />
              <p v-if="renameError" class="text-xs text-red-600 dark:text-red-400">{{ renameError }}</p>
              <div class="flex gap-2">
                <button
                  type="button"
                  :disabled="isRenaming"
                  class="flex-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @click="submitRename(list.id)"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  class="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  @click="cancelRename"
                >
                  Batal
                </button>
              </div>
            </div>
          </template>

          <!-- Normal card view -->
          <template v-else>
            <!-- Card icon + name -->
            <div class="mb-3 flex items-start gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div class="min-w-0 flex-1">
                <h2 class="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
                  {{ list.name }}
                </h2>
                <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  {{ list.novelCount }} novel
                </p>
              </div>
            </div>

            <!-- Date -->
            <p class="mt-auto text-xs text-gray-400 dark:text-gray-500">
              Dibuat {{ formatDate(list.createdAt) }}
            </p>

            <!-- Action buttons (visible on hover) -->
            <div class="mt-4 flex gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
              <button
                type="button"
                class="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                @click="startRename(list)"
              >
                Ubah Nama
              </button>
              <button
                type="button"
                class="flex-1 rounded-md border border-red-200 dark:border-red-800 bg-white dark:bg-gray-700 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500"
                @click="requestDelete(list)"
              >
                Hapus
              </button>
            </div>
          </template>
        </div>
      </div>

    </main>

    <!-- Delete confirmation dialog -->
    <ConfirmDialog
      :open="confirmDeleteList !== null"
      :title="confirmDeleteList ? `Hapus list &quot;${confirmDeleteList.name}&quot;?` : ''"
      :message="confirmDeleteList ? `List ini berisi ${confirmDeleteList.novelCount} novel. Semua novel dalam list ini akan dihapus. Tindakan ini tidak dapat dibatalkan.` : ''"
      confirm-label="Hapus"
      @confirm="confirmDelete"
      @cancel="confirmDeleteList = null"
    />
  </div>
</template>
