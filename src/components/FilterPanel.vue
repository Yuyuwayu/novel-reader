<script setup lang="ts">
// FilterPanel — advanced filter controls for the novel finder.
// Requirements: 7.1, 7.3, 8.1, 8.2, 8.5, 9.1, 9.3, 9.4, 9.5, 9.6, 10.1, 10.3, 10.4, 10.5

import { computed } from 'vue'
import type { FilterState, Genre, Tag, TagCategory } from '@/types'

const props = withDefaults(
  defineProps<{
    modelValue: FilterState
    genres: Genre[]
    tags: Tag[]
    tagCategories: TagCategory[]
    validationErrors?: Record<string, string>
    loading?: boolean
  }>(),
  {
    validationErrors: () => ({}),
    loading: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: FilterState]
  reset: []
}>()

/** Emit a partial update merged with current state */
function update(partial: Partial<FilterState>) {
  emit('update:modelValue', { ...props.modelValue, ...partial })
}

/** Tags grouped by category */
const tagsByCategory = computed(() => {
  const map = new Map<string, { category: TagCategory; tags: Tag[] }>()
  for (const cat of props.tagCategories) {
    map.set(cat.id, { category: cat, tags: [] })
  }
  for (const tag of props.tags) {
    const entry = map.get(tag.categoryId)
    if (entry) {
      entry.tags.push(tag)
    } else {
      // Tag with unknown category — create a group on the fly
      map.set(tag.categoryId, {
        category: { id: tag.categoryId, name: tag.categoryName },
        tags: [tag],
      })
    }
  }
  return [...map.values()].filter((g) => g.tags.length > 0)
})

// ── Genre helpers ─────────────────────────────────────────────────────────────

function toggleGenre(id: string) {
  const current = props.modelValue.genres
  update({
    genres: current.includes(id) ? current.filter((g) => g !== id) : [...current, id],
  })
}

function toggleExcludeGenre(id: string) {
  const current = props.modelValue.excludeGenres
  update({
    excludeGenres: current.includes(id) ? current.filter((g) => g !== id) : [...current, id],
  })
}

// ── Tag helpers ───────────────────────────────────────────────────────────────

function toggleTag(id: string) {
  const current = props.modelValue.tags
  update({
    tags: current.includes(id) ? current.filter((t) => t !== id) : [...current, id],
  })
}

function toggleExcludeTag(id: string) {
  const current = props.modelValue.excludeTags
  update({
    excludeTags: current.includes(id) ? current.filter((t) => t !== id) : [...current, id],
  })
}

const sortOptions = [
  { value: 'updatedAt', label: 'Terbaru Diperbarui' },
  { value: 'rating', label: 'Rating Tertinggi' },
  { value: 'readers', label: 'Pembaca Terbanyak' },
  { value: 'chapters', label: 'Chapter Terbanyak' },
  { value: 'addedAt', label: 'Terbaru Ditambahkan' },
] as const
</script>

<template>
  <aside class="rounded-lg bg-white dark:bg-gray-800 p-4 shadow space-y-6">
    <!-- Sort by -->
    <div>
      <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Urutkan
      </label>
      <div class="relative">
        <select
          :value="modelValue.sortBy"
          class="w-full appearance-none rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 pr-10 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:light] dark:[color-scheme:dark]"
          @change="update({ sortBy: ($event.target as HTMLSelectElement).value as FilterState['sortBy'] })"
        >
          <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
          <svg class="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
      </div>
    </div>

    <!-- Status -->
    <div>
      <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Status
      </label>
      <div class="relative">
        <select
          :value="modelValue.status"
          class="w-full appearance-none rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 pr-10 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:light] dark:[color-scheme:dark]"
          @change="update({ status: ($event.target as HTMLSelectElement).value as FilterState['status'] })"
        >
          <option value="">Semua Status</option>
          <option value="ongoing">Berlangsung</option>
          <option value="completed">Selesai</option>
          <option value="hiatus">Hiatus</option>
        </select>
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
          <svg class="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
      </div>
    </div>

    <!-- Min rating -->
    <div>
      <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Rating Minimum: <span class="text-blue-600 dark:text-blue-400 font-bold">{{ modelValue.minRating > 0 ? modelValue.minRating.toFixed(1) : 'Semua' }}</span>
      </label>
      <input
        type="range"
        min="0"
        max="5"
        step="0.5"
        :value="modelValue.minRating"
        class="w-full appearance-none bg-transparent focus:outline-none [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-gray-200 dark:[&::-webkit-slider-runnable-track]:bg-gray-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:mt-[-4px] [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-gray-200 dark:[&::-moz-range-track]:bg-gray-700 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-600 cursor-pointer"
        @input="update({ minRating: parseFloat(($event.target as HTMLInputElement).value) })"
      />
      <div class="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
        <span>0</span><span>5</span>
      </div>
    </div>

    <!-- Chapter range -->
    <div>
      <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Jumlah Chapter
      </label>
      <div class="flex items-center gap-2">
        <input
          type="number"
          min="0"
          placeholder="Min"
          :value="modelValue.minChapters || ''"
          class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:light] dark:[color-scheme:dark]"
          @input="update({ minChapters: parseInt(($event.target as HTMLInputElement).value) || 0 })"
        />
        <span class="text-gray-400">–</span>
        <input
          type="number"
          min="0"
          placeholder="Maks"
          :value="modelValue.maxChapters || ''"
          class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:light] dark:[color-scheme:dark]"
          @input="update({ maxChapters: parseInt(($event.target as HTMLInputElement).value) || 0 })"
        />
      </div>
      <p v-if="validationErrors.chapters" class="mt-1 text-xs text-red-500">
        {{ validationErrors.chapters }}
      </p>
    </div>

    <!-- Date range -->
    <div>
      <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Diperbarui Antara
      </label>
      <div class="flex flex-col gap-2">
        <input
          type="date"
          :value="modelValue.updatedAfter"
          class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:light] dark:[color-scheme:dark]"
          @input="update({ updatedAfter: ($event.target as HTMLInputElement).value })"
        />
        <input
          type="date"
          :value="modelValue.updatedBefore"
          class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:light] dark:[color-scheme:dark]"
          @input="update({ updatedBefore: ($event.target as HTMLInputElement).value })"
        />
      </div>
      <p v-if="validationErrors.dateRange" class="mt-1 text-xs text-red-500">
        {{ validationErrors.dateRange }}
      </p>
    </div>

    <!-- Genre include -->
    <div>
      <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Genre (Sertakan)
      </label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="genre in genres"
          :key="genre.id"
          type="button"
          class="rounded-full px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          :class="
            modelValue.genres.includes(genre.id)
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          "
          @click="toggleGenre(genre.id)"
        >
          {{ genre.name }}
        </button>
      </div>
      <p v-if="validationErrors.genres" class="mt-1 text-xs text-red-500">
        {{ validationErrors.genres }}
      </p>
    </div>

    <!-- Genre blacklist -->
    <div>
      <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Genre (Kecualikan)
      </label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="genre in genres"
          :key="genre.id"
          type="button"
          class="rounded-full px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          :class="
            modelValue.excludeGenres.includes(genre.id)
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          "
          @click="toggleExcludeGenre(genre.id)"
        >
          {{ genre.name }}
        </button>
      </div>
      <p v-if="validationErrors.excludeGenres" class="mt-1 text-xs text-red-500">
        {{ validationErrors.excludeGenres }}
      </p>
    </div>

    <!-- Tags include (grouped by category) -->
    <div>
      <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Tag (Sertakan)
      </label>
      <div v-if="loading" class="text-xs text-gray-400 dark:text-gray-500">Memuat tag...</div>
      <div v-else class="space-y-3">
        <div v-for="group in tagsByCategory" :key="group.category.id">
          <p class="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            {{ group.category.name }}
          </p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="tag in group.tags"
              :key="tag.id"
              type="button"
              class="rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="
                modelValue.tags.includes(tag.id)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              "
              @click="toggleTag(tag.id)"
            >
              {{ tag.name }}
            </button>
          </div>
        </div>
      </div>
      <p v-if="validationErrors.tags" class="mt-1 text-xs text-red-500">
        {{ validationErrors.tags }}
      </p>
    </div>

    <!-- Tags blacklist (grouped by category) -->
    <div>
      <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Tag (Kecualikan)
      </label>
      <div v-if="loading" class="text-xs text-gray-400 dark:text-gray-500">Memuat tag...</div>
      <div v-else class="space-y-3">
        <div v-for="group in tagsByCategory" :key="group.category.id">
          <p class="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            {{ group.category.name }}
          </p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="tag in group.tags"
              :key="tag.id"
              type="button"
              class="rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              :class="
                modelValue.excludeTags.includes(tag.id)
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              "
              @click="toggleExcludeTag(tag.id)"
            >
              {{ tag.name }}
            </button>
          </div>
        </div>
      </div>
      <p v-if="validationErrors.excludeTags" class="mt-1 text-xs text-red-500">
        {{ validationErrors.excludeTags }}
      </p>
    </div>

    <!-- Reset button -->
    <button
      type="button"
      class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      @click="emit('reset')"
    >
      Reset Filter
    </button>
  </aside>
</template>
