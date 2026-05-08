<script setup lang="ts">
// Admin tags management page.
// Requirements: 6.5, 6.6, 6.7, 6.8, 6.10, 6.11

import { ref, computed, onMounted } from 'vue'
import { fetchTags, fetchTagCategories, adminCreateTag, adminDeleteTag } from '@/api'
import { ApiError } from '@/api'
import type { Tag, TagCategory } from '@/types'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

// ── State ─────────────────────────────────────────────────────────────────────

const tags = ref<Tag[]>([])
const tagCategories = ref<TagCategory[]>([])
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

// Add tag form state
const newTagName = ref('')
const selectedCategoryId = ref('')
const newCategoryName = ref('')
const useNewCategory = ref(false)
const isSubmitting = ref(false)
const formError = ref<string | null>(null)

// Confirm dialog state
const confirmOpen = ref(false)
const pendingDeleteTag = ref<Tag | null>(null)
const isDeleting = ref(false)

// ── Computed ──────────────────────────────────────────────────────────────────

/** Tags sorted by category name then tag name */
const sortedTags = computed(() =>
  [...tags.value].sort((a, b) => {
    const catCmp = a.categoryName.localeCompare(b.categoryName)
    return catCmp !== 0 ? catCmp : a.name.localeCompare(b.name)
  })
)

// ── Data fetching ─────────────────────────────────────────────────────────────

async function loadData(): Promise<void> {
  isLoading.value = true
  errorMessage.value = null

  try {
    const [tagsResult, categoriesResult] = await Promise.allSettled([
      fetchTags(),
      fetchTagCategories(),
    ])

    if (tagsResult.status === 'fulfilled') {
      tags.value = tagsResult.value
    } else {
      throw tagsResult.reason
    }

    if (categoriesResult.status === 'fulfilled') {
      tagCategories.value = categoriesResult.value
    } else {
      throw categoriesResult.reason
    }
  } catch (err) {
    if (err instanceof ApiError) {
      errorMessage.value = `Gagal memuat data: ${err.message}`
    } else {
      errorMessage.value = 'Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.'
    }
  } finally {
    isLoading.value = false
  }
}

// ── Add tag ───────────────────────────────────────────────────────────────────

async function submitAddTag(): Promise<void> {
  const name = newTagName.value.trim()
  const categoryName = useNewCategory.value ? newCategoryName.value.trim() : ''
  const categoryId = useNewCategory.value ? '' : selectedCategoryId.value

  // Basic validation
  if (!name) {
    formError.value = 'Nama tag tidak boleh kosong.'
    return
  }

  if (useNewCategory.value) {
    if (!categoryName) {
      formError.value = 'Nama kategori baru tidak boleh kosong.'
      return
    }
  } else {
    if (!categoryId) {
      formError.value = 'Pilih kategori untuk tag ini.'
      return
    }
  }

  // Client-side duplicate check: same name in same category
  if (!useNewCategory.value) {
    const duplicate = tags.value.some(
      (t) =>
        t.categoryId === categoryId &&
        t.name.toLowerCase() === name.toLowerCase()
    )
    if (duplicate) {
      formError.value = 'Tag dengan nama ini sudah ada dalam kategori tersebut.'
      return
    }
  }

  formError.value = null
  isSubmitting.value = true

  try {
    // Determine the categoryId to send: for new category, the server will create it
    // and return the tag with the new categoryId populated.
    const payload = useNewCategory.value
      ? { name, categoryId: categoryName } // server interprets new category name
      : { name, categoryId }

    const created = await adminCreateTag(payload)
    tags.value.push(created)

    // If a new category was created, add it to the local list if not already present
    if (useNewCategory.value) {
      const exists = tagCategories.value.some((c) => c.id === created.categoryId)
      if (!exists) {
        tagCategories.value.push({ id: created.categoryId, name: created.categoryName })
      }
    }

    // Reset form
    newTagName.value = ''
    selectedCategoryId.value = ''
    newCategoryName.value = ''
    useNewCategory.value = false
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 409) {
        formError.value = 'Tag dengan nama ini sudah ada dalam kategori tersebut.'
      } else {
        formError.value = `Gagal menambahkan tag: ${err.message}`
      }
    } else {
      formError.value = 'Gagal menambahkan tag. Silakan coba lagi.'
    }
  } finally {
    isSubmitting.value = false
  }
}

// ── Delete flow ───────────────────────────────────────────────────────────────

function requestDelete(tag: Tag): void {
  pendingDeleteTag.value = tag
  confirmOpen.value = true
}

function cancelDelete(): void {
  confirmOpen.value = false
  pendingDeleteTag.value = null
}

async function confirmDelete(): Promise<void> {
  if (!pendingDeleteTag.value) return

  isDeleting.value = true
  const tag = pendingDeleteTag.value

  try {
    await adminDeleteTag(tag.id)
    tags.value = tags.value.filter((t) => t.id !== tag.id)
    confirmOpen.value = false
    pendingDeleteTag.value = null
  } catch (err) {
    confirmOpen.value = false
    if (err instanceof ApiError) {
      errorMessage.value = `Gagal menghapus tag: ${err.message}`
    } else {
      errorMessage.value = 'Gagal menghapus tag. Silakan coba lagi.'
    }
  } finally {
    isDeleting.value = false
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Page heading -->
    <div class="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div class="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
        <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Manajemen Tag</h1>
      </div>
    </div>

    <!-- Main content -->
    <main class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">

      <!-- Add tag form -->
      <section
        class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm"
      >
        <h2 class="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Tambah Tag Baru</h2>

        <form class="space-y-4" @submit.prevent="submitAddTag">
          <!-- Tag name + category row -->
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start">
            <!-- Tag name -->
            <div class="flex-1">
              <label for="new-tag-name" class="sr-only">Nama tag</label>
              <input
                id="new-tag-name"
                v-model="newTagName"
                type="text"
                placeholder="Nama tag"
                :disabled="isSubmitting"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
                :class="{ 'border-red-400 focus:border-red-500 focus:ring-red-500': formError }"
              />
            </div>

            <!-- Category selector -->
            <div class="flex-1">
              <div v-if="!useNewCategory">
                <label for="category-select" class="sr-only">Kategori</label>
                <select
                  id="category-select"
                  v-model="selectedCategoryId"
                  :disabled="isSubmitting"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  :class="{ 'border-red-400 focus:border-red-500 focus:ring-red-500': formError && !selectedCategoryId }"
                >
                  <option value="" disabled>Pilih kategori</option>
                  <option
                    v-for="cat in tagCategories"
                    :key="cat.id"
                    :value="cat.id"
                  >
                    {{ cat.name }}
                  </option>
                </select>
              </div>
              <div v-else>
                <label for="new-category-name" class="sr-only">Nama kategori baru</label>
                <input
                  id="new-category-name"
                  v-model="newCategoryName"
                  type="text"
                  placeholder="Nama kategori baru"
                  :disabled="isSubmitting"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  :class="{ 'border-red-400 focus:border-red-500 focus:ring-red-500': formError && !newCategoryName.trim() }"
                />
              </div>
            </div>

            <!-- Submit button -->
            <button
              type="submit"
              :disabled="isSubmitting"
              class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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
          </div>

          <!-- Toggle new category -->
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="text-xs text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
              @click="useNewCategory = !useNewCategory; selectedCategoryId = ''; newCategoryName = ''"
            >
              {{ useNewCategory ? '← Pilih kategori yang sudah ada' : '+ Buat kategori baru' }}
            </button>
          </div>

          <!-- Form error -->
          <p v-if="formError" class="text-xs text-red-600 dark:text-red-400" role="alert">
            {{ formError }}
          </p>
        </form>
      </section>

      <!-- Loading skeleton -->
      <div
        v-if="isLoading"
        aria-busy="true"
        aria-label="Memuat daftar tag..."
        class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm"
      >
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Nama Tag</th>
                <th class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Kategori</th>
                <th class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Jumlah Novel</th>
                <th class="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
              <tr v-for="n in 8" :key="n">
                <td class="px-5 py-4"><div class="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div></td>
                <td class="px-5 py-4"><div class="h-4 w-36 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div></td>
                <td class="px-5 py-4"><div class="h-4 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div></td>
                <td class="px-5 py-4 text-right"><div class="ml-auto h-7 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div></td>
              </tr>
            </tbody>
          </table>
        </div>
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
          @click="loadData"
        >
          Coba Lagi
        </button>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="tags.length === 0"
        class="flex flex-col items-center gap-4 py-16 text-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-14 w-14 text-gray-300 dark:text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <p class="text-gray-500 dark:text-gray-400">Belum ada tag. Tambahkan tag pertama di atas.</p>
      </div>

      <!-- Tag table -->
      <div
        v-else
        class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm"
      >
        <div class="overflow-x-auto">
          <table
            class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
            aria-label="Daftar tag"
          >
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  scope="col"
                  class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Nama Tag
                </th>
                <th
                  scope="col"
                  class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Kategori
                </th>
                <th
                  scope="col"
                  class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Jumlah Novel
                </th>
                <th
                  scope="col"
                  class="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
              <tr
                v-for="tag in sortedTags"
                :key="tag.id"
                class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <!-- Tag name -->
                <td class="px-5 py-4">
                  <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{ tag.name }}
                  </span>
                </td>

                <!-- Category -->
                <td class="px-5 py-4">
                  <span
                    class="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300"
                  >
                    {{ tag.categoryName }}
                  </span>
                </td>

                <!-- Novel count -->
                <td class="px-5 py-4">
                  <span class="text-sm text-gray-600 dark:text-gray-400">
                    {{ tag.novelCount }} novel
                  </span>
                </td>

                <!-- Actions -->
                <td class="px-5 py-4 text-right">
                  <button
                    type="button"
                    :aria-label="`Hapus tag ${tag.name}`"
                    class="rounded px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500"
                    @click="requestDelete(tag)"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Table footer: total count -->
        <div class="border-t border-gray-100 dark:border-gray-700 px-5 py-3">
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Total {{ tags.length }} tag dalam {{ tagCategories.length }} kategori
          </p>
        </div>
      </div>

    </main>

    <!-- Confirm delete dialog -->
    <ConfirmDialog
      :open="confirmOpen"
      title="Hapus Tag"
      :message="pendingDeleteTag
        ? `Tag &quot;${pendingDeleteTag.name}&quot; digunakan oleh ${pendingDeleteTag.novelCount} novel. Menghapus tag ini akan menghapusnya dari semua novel tersebut. Tindakan ini tidak dapat dibatalkan.`
        : ''"
      confirm-label="Hapus"
      cancel-label="Batal"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>
