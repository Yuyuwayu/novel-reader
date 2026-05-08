<script setup lang="ts">
// Admin novel create/edit form page.
// Routes: /admin/novels/new (create) and /admin/novels/:novelId/edit (edit)
// Requirements: 10.2, 10.3, 10.4, 10.5, 10.8, 10.9, 12.1, 12.5, 13.4, 13.5, 6.9

import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  adminCreateNovel,
  adminUpdateNovel,
  adminFetchGenres,
  fetchNovelDetail,
  fetchTags,
  fetchTagCategories,
  adminFetchNovelTags,
  adminUpdateNovelTags,
} from '@/api'
import CoverUpload from '@/components/CoverUpload.vue'
import type { NovelFormData, NovelStatus, Genre, Tag, TagCategory } from '@/types'

const route = useRoute()
const router = useRouter()

// ── Mode detection ────────────────────────────────────────────────────────────

const novelId = computed(() => {
  const id = route.params.novelId
  return typeof id === 'string' && id.length > 0 ? id : null
})

const isEditMode = computed(() => novelId.value !== null)
const pageTitle = computed(() => (isEditMode.value ? 'Edit Novel' : 'Tambah Novel'))

// ── Form state ────────────────────────────────────────────────────────────────

const form = ref<NovelFormData>({
  title: '',
  author: '',
  synopsis: '',
  genres: [],
  status: 'ongoing',
  thumbnailUrl: '',
})

const genres = ref<Genre[]>([])
const availableTags = ref<Tag[]>([])
const tagCategories = ref<TagCategory[]>([])
const selectedTagIds = ref<Set<string>>(new Set())
const isLoadingData = ref(false)
const isSubmitting = ref(false)
const loadError = ref<string | null>(null)
const submitError = ref<string | null>(null)

// ── Validation ────────────────────────────────────────────────────────────────

const titleError = ref<string | null>(null)
const authorError = ref<string | null>(null)

function validateForm(): boolean {
  titleError.value = null
  authorError.value = null

  let valid = true

  if (form.value.title.trim().length === 0) {
    titleError.value = 'Judul wajib diisi.'
    valid = false
  }

  if (form.value.author.trim().length === 0) {
    authorError.value = 'Penulis wajib diisi.'
    valid = false
  }

  return valid
}

// ── Genre multi-select helpers ────────────────────────────────────────────────

function isGenreSelected(genreId: string): boolean {
  return form.value.genres.includes(genreId)
}

function toggleGenre(genreId: string): void {
  const idx = form.value.genres.indexOf(genreId)
  if (idx === -1) {
    form.value.genres.push(genreId)
  } else {
    form.value.genres.splice(idx, 1)
  }
}

// ── Tag multi-select helpers ──────────────────────────────────────────────────

function isTagSelected(tagId: string): boolean {
  return selectedTagIds.value.has(tagId)
}

function toggleTag(tagId: string): void {
  if (selectedTagIds.value.has(tagId)) {
    selectedTagIds.value.delete(tagId)
  } else {
    selectedTagIds.value.add(tagId)
  }
}

/** Returns tags belonging to a given category, sorted by name. */
function tagsForCategory(categoryId: string): Tag[] {
  return availableTags.value.filter((t) => t.categoryId === categoryId)
}

// ── Data loading ──────────────────────────────────────────────────────────────

async function loadData(): Promise<void> {
  isLoadingData.value = true
  loadError.value = null

  try {
    // Always fetch genres, tags, and tag categories for the multi-selects
    const [fetchedGenres, fetchedTags, fetchedCategories] = await Promise.all([
      adminFetchGenres(),
      fetchTags(),
      fetchTagCategories(),
      // In edit mode, also fetch the novel detail to pre-fill the form
      isEditMode.value && novelId.value
        ? fetchNovelDetail(novelId.value).then((detail) => {
            form.value.title = detail.title
            form.value.author = detail.author
            form.value.synopsis = detail.synopsis ?? ''
            form.value.genres = detail.genre ?? []
            form.value.status = detail.status
            form.value.thumbnailUrl = detail.thumbnailUrl ?? ''
          })
        : Promise.resolve(),
      // In edit mode, also fetch existing novel tags to pre-populate selectedTagIds
      isEditMode.value && novelId.value
        ? adminFetchNovelTags(novelId.value).then((tags) => {
            selectedTagIds.value = new Set(tags.map((t) => t.id))
          })
        : Promise.resolve(),
    ])

    genres.value = fetchedGenres
    availableTags.value = fetchedTags
    tagCategories.value = fetchedCategories
  } catch (err) {
    loadError.value =
      err instanceof Error ? err.message : 'Gagal memuat data. Silakan coba lagi.'
  } finally {
    isLoadingData.value = false
  }
}

onMounted(loadData)

// ── Submit ────────────────────────────────────────────────────────────────────

async function handleSubmit(): Promise<void> {
  if (!validateForm()) return

  isSubmitting.value = true
  submitError.value = null

  try {
    const payload: NovelFormData = {
      title: form.value.title.trim(),
      author: form.value.author.trim(),
      synopsis: form.value.synopsis.trim(),
      genres: form.value.genres,
      status: form.value.status,
      thumbnailUrl: form.value.thumbnailUrl,
    }

    let savedNovelId: string

    if (isEditMode.value && novelId.value) {
      await adminUpdateNovel(novelId.value, payload)
      savedNovelId = novelId.value
    } else {
      const created = await adminCreateNovel(payload)
      savedNovelId = created.id
    }

    // Save tag changes after the novel is saved
    await adminUpdateNovelTags(savedNovelId, Array.from(selectedTagIds.value))

    await router.push('/admin/novels')
  } catch (err) {
    submitError.value =
      err instanceof Error ? err.message : 'Terjadi kesalahan. Silakan coba lagi.'
  } finally {
    isSubmitting.value = false
  }
}

const statusOptions: { value: NovelStatus; label: string }[] = [
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'hiatus', label: 'Hiatus' },
]
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div class="mx-auto max-w-3xl px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="rounded-md p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Kembali ke daftar novel"
            @click="router.push('/admin/novels')"
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
          <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ pageTitle }}</h1>
        </div>
      </div>
    </div>

    <main class="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <!-- Loading state -->
      <div v-if="isLoadingData" class="flex items-center justify-center py-16">
        <div
          class="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"
          role="status"
          aria-label="Memuat data..."
        ></div>
        <span class="ml-3 text-sm text-gray-500 dark:text-gray-400">Memuat data...</span>
      </div>

      <!-- Load error -->
      <div
        v-else-if="loadError"
        class="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4"
        role="alert"
      >
        <p class="text-sm text-red-700 dark:text-red-400">{{ loadError }}</p>
        <button
          type="button"
          class="mt-2 text-sm font-medium text-red-700 dark:text-red-400 underline hover:text-red-900 dark:hover:text-red-300"
          @click="loadData"
        >
          Coba lagi
        </button>
      </div>

      <!-- Form -->
      <form
        v-else
        class="space-y-6"
        novalidate
        @submit.prevent="handleSubmit"
      >
        <!-- Submit error -->
        <div
          v-if="submitError"
          class="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4"
          role="alert"
          aria-live="assertive"
        >
          <p class="text-sm text-red-700 dark:text-red-400">{{ submitError }}</p>
        </div>

        <!-- Judul -->
        <div>
          <label for="novel-title" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Judul <span class="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="novel-title"
            v-model="form.title"
            type="text"
            autocomplete="off"
            :disabled="isSubmitting"
            :aria-invalid="titleError !== null"
            :aria-describedby="titleError ? 'title-error' : undefined"
            class="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:opacity-60"
            :class="{ 'border-red-400 focus:border-red-500 focus:ring-red-500': titleError }"
            placeholder="Masukkan judul novel"
          />
          <p
            v-if="titleError"
            id="title-error"
            class="mt-1 text-xs text-red-600"
            role="alert"
          >
            {{ titleError }}
          </p>
        </div>

        <!-- Penulis -->
        <div>
          <label for="novel-author" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Penulis <span class="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="novel-author"
            v-model="form.author"
            type="text"
            autocomplete="off"
            :disabled="isSubmitting"
            :aria-invalid="authorError !== null"
            :aria-describedby="authorError ? 'author-error' : undefined"
            class="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:opacity-60"
            :class="{ 'border-red-400 focus:border-red-500 focus:ring-red-500': authorError }"
            placeholder="Masukkan nama penulis"
          />
          <p
            v-if="authorError"
            id="author-error"
            class="mt-1 text-xs text-red-600"
            role="alert"
          >
            {{ authorError }}
          </p>
        </div>

        <!-- Sinopsis -->
        <div>
          <label for="novel-synopsis" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Sinopsis
          </label>
          <textarea
            id="novel-synopsis"
            v-model="form.synopsis"
            rows="5"
            :disabled="isSubmitting"
            class="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:opacity-60"
            placeholder="Masukkan sinopsis novel"
          ></textarea>
        </div>

        <!-- Genre (multi-select via checkboxes) -->
        <div>
          <fieldset>
            <legend class="block text-sm font-medium text-gray-700 dark:text-gray-300">Genre</legend>
            <div
              v-if="genres.length === 0"
              class="mt-2 text-sm text-gray-400 dark:text-gray-500"
            >
              Tidak ada genre tersedia.
            </div>
            <div
              v-else
              class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3"
            >
              <label
                v-for="genre in genres"
                :key="genre.id"
                class="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-600"
                :class="{
                  'border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300': isGenreSelected(genre.id),
                  'cursor-not-allowed opacity-60': isSubmitting,
                }"
              >
                <input
                  type="checkbox"
                  :value="genre.id"
                  :checked="isGenreSelected(genre.id)"
                  :disabled="isSubmitting"
                  class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                  @change="toggleGenre(genre.id)"
                />
                <span>{{ genre.name }}</span>
              </label>
            </div>
          </fieldset>
        </div>

        <!-- Tags (multi-select via checkboxes, grouped by category) -->
        <div>
          <fieldset>
            <legend class="block text-sm font-medium text-gray-700 dark:text-gray-300">Tag</legend>
            <div
              v-if="tagCategories.length === 0"
              class="mt-2 text-sm text-gray-400 dark:text-gray-500"
            >
              Tidak ada tag tersedia.
            </div>
            <div v-else class="mt-2 space-y-4">
              <div
                v-for="category in tagCategories"
                :key="category.id"
              >
                <!-- Category header -->
                <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {{ category.name }}
                </p>
                <div
                  v-if="tagsForCategory(category.id).length === 0"
                  class="text-xs text-gray-400 dark:text-gray-500"
                >
                  Tidak ada tag dalam kategori ini.
                </div>
                <div
                  v-else
                  class="grid grid-cols-2 gap-2 sm:grid-cols-3"
                >
                  <label
                    v-for="tag in tagsForCategory(category.id)"
                    :key="tag.id"
                    class="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-600"
                    :class="{
                      'border-purple-400 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300': isTagSelected(tag.id),
                      'cursor-not-allowed opacity-60': isSubmitting,
                    }"
                  >
                    <input
                      type="checkbox"
                      :value="tag.id"
                      :checked="isTagSelected(tag.id)"
                      :disabled="isSubmitting"
                      class="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:cursor-not-allowed"
                      @change="toggleTag(tag.id)"
                    />
                    <span>{{ tag.name }}</span>
                  </label>
                </div>
              </div>
            </div>
          </fieldset>
        </div>

        <!-- Status -->
        <div>
          <label for="novel-status" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Status
          </label>
          <select
            id="novel-status"
            v-model="form.status"
            :disabled="isSubmitting"
            class="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:opacity-60"
          >
            <option
              v-for="opt in statusOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- Cover upload -->
        <div>
          <p class="block text-sm font-medium text-gray-700 dark:text-gray-300">Cover Novel</p>
          <div class="mt-2">
            <CoverUpload
              :model-value="form.thumbnailUrl || null"
              @update:model-value="form.thumbnailUrl = $event"
            />
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-700 pt-6">
          <button
            type="button"
            :disabled="isSubmitting"
            class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            @click="router.push('/admin/novels')"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span
              v-if="isSubmitting"
              class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
              aria-hidden="true"
            ></span>
            <span>{{ isSubmitting ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Tambah Novel') }}</span>
          </button>
        </div>
      </form>
    </main>
  </div>
</template>
