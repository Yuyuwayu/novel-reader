<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { fetchCatalog } from '@/api'
import type { NovelSummary } from '@/types'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'search', query: string): void
  (e: 'select', novel: NovelSummary): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const suggestions = ref<NovelSummary[]>([])
const showDropdown = ref(false)
const isLoading = ref(false)
const activeIndex = ref(-1)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  emit('update:modelValue', value)
  activeIndex.value = -1

  if (debounceTimer) clearTimeout(debounceTimer)

  if (value.trim().length < 2) {
    suggestions.value = []
    showDropdown.value = false
    return
  }

  debounceTimer = setTimeout(async () => {
    isLoading.value = true
    try {
      const result = await fetchCatalog(1, value.trim())
      suggestions.value = result.novels.slice(0, 5)
      showDropdown.value = suggestions.value.length > 0
    } catch {
      suggestions.value = []
      showDropdown.value = false
    } finally {
      isLoading.value = false
    }
  }, 300)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    if (activeIndex.value >= 0 && suggestions.value[activeIndex.value]) {
      selectSuggestion(suggestions.value[activeIndex.value])
    } else {
      emit('search', props.modelValue)
      showDropdown.value = false
    }
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, suggestions.value.length - 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, -1)
  } else if (event.key === 'Escape') {
    showDropdown.value = false
    activeIndex.value = -1
  }
}

function selectSuggestion(novel: NovelSummary) {
  emit('update:modelValue', novel.title)
  emit('select', novel)
  showDropdown.value = false
  suggestions.value = []
}

function onSearchClick() {
  emit('search', props.modelValue)
  showDropdown.value = false
}

function handleDocumentClick(event: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    showDropdown.value = false
    activeIndex.value = -1
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
  <div ref="containerRef" class="relative w-full">
    <!-- Input wrapper -->
    <div class="relative flex items-center">
      <!-- Search icon (left) -->
      <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400 dark:text-gray-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
      </span>

      <input
        type="search"
        :value="modelValue"
        :placeholder="placeholder ?? 'Cari judul atau penulis...'"
        class="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
        aria-label="Cari novel"
        :aria-expanded="showDropdown"
        aria-autocomplete="list"
        role="combobox"
        @input="onInput"
        @keydown="onKeydown"
      />

      <!-- Loading spinner or clickable search button (right) -->
      <span class="absolute inset-y-0 right-3 flex items-center">
        <svg
          v-if="isLoading"
          class="h-4 w-4 animate-spin text-gray-400 dark:text-gray-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <button
          v-else
          type="button"
          class="text-gray-400 transition-colors hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400"
          aria-label="Cari"
          @click="onSearchClick"
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
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </button>
      </span>
    </div>

    <!-- Suggestions dropdown -->
    <ul
      v-if="showDropdown && suggestions.length > 0"
      role="listbox"
      class="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
    >
      <li
        v-for="(novel, index) in suggestions"
        :key="novel.id"
        role="option"
        :aria-selected="index === activeIndex"
        class="flex cursor-pointer items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
        :class="{
          'bg-blue-50 dark:bg-blue-900/30': index === activeIndex,
        }"
        @click="selectSuggestion(novel)"
        @mouseenter="activeIndex = index"
      >
        <!-- Thumbnail -->
        <img
          :src="novel.thumbnailUrl"
          :alt="novel.title"
          class="h-10 w-7 flex-shrink-0 rounded object-cover"
        />

        <!-- Title + author -->
        <div class="min-w-0 flex-1">
          <p class="truncate font-medium text-gray-900 dark:text-gray-100">{{ novel.title }}</p>
          <p class="truncate text-xs text-gray-500 dark:text-gray-400">{{ novel.author }}</p>
        </div>

        <!-- Genre badge (first genre only) -->
        <span
          v-if="novel.genre.length > 0"
          class="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300"
        >
          {{ novel.genre[0] }}
        </span>
      </li>
    </ul>
  </div>
</template>
