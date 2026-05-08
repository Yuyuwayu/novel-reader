<script setup lang="ts">
// Reading settings panel: theme toggle, font size, font family, line spacing, content width.
// Accesses useThemeStore for theme; usePreferencesStore for all reading preferences.
// Requirements: 5.7, 5.8, 6.1, 6.2, 6.3, 6.4, 6.5, 25.1, 25.2, 25.3, 25.8

import { ref, computed } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { usePreferencesStore } from '@/stores/preferences'
import type { FontFamily, LineSpacing } from '@/types'

const themeStore = useThemeStore()
const prefsStore = usePreferencesStore()
const isOpen = ref(false)

const isDark = computed(() => themeStore.isDark)
const fontSize = computed(() => prefsStore.preferences.fontSizePx)
const fontFamily = computed(() => prefsStore.preferences.fontFamily)
const lineSpacing = computed(() => prefsStore.preferences.lineSpacing)
const contentWidth = computed(() => prefsStore.preferences.contentWidth)

function togglePanel(): void {
  isOpen.value = !isOpen.value
}

function toggleTheme(): void {
  themeStore.setTheme(isDark.value ? 'light' : 'dark')
}

function onFontSizeChange(event: Event): void {
  const value = parseInt((event.target as HTMLInputElement).value, 10)
  prefsStore.setFontSize(value)
}

function onFontFamilyChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value as FontFamily
  prefsStore.setFontFamily(value)
}

function onContentWidthChange(event: Event): void {
  const value = parseInt((event.target as HTMLInputElement).value, 10)
  prefsStore.setContentWidth(value)
}

const lineSpacingOptions: { value: LineSpacing; label: string }[] = [
  { value: 'leading-snug', label: 'Rapat' },
  { value: 'leading-relaxed', label: 'Normal' },
  { value: 'leading-loose', label: 'Longgar' },
]
</script>

<template>
  <div class="relative">
    <!-- Toggle button -->
    <button
      type="button"
      class="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      :aria-expanded="isOpen"
      aria-controls="settings-panel"
      aria-label="Pengaturan tampilan"
      @click="togglePanel"
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
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      Pengaturan
    </button>

    <!-- Settings panel -->
    <div
      v-show="isOpen"
      id="settings-panel"
      class="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-lg"
      role="region"
      aria-label="Panel pengaturan tampilan"
    >
      <h2 class="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Pengaturan Tampilan</h2>

      <!-- Theme toggle -->
      <div class="mb-4 flex items-center justify-between">
        <span class="text-sm text-gray-700 dark:text-gray-300">Mode Gelap</span>
        <button
          type="button"
          role="switch"
          :aria-checked="isDark"
          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          :class="isDark ? 'bg-blue-600' : 'bg-gray-200'"
          @click="toggleTheme"
        >
          <span
            class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
            :class="isDark ? 'translate-x-6' : 'translate-x-1'"
          ></span>
          <span class="sr-only">{{ isDark ? 'Nonaktifkan mode gelap' : 'Aktifkan mode gelap' }}</span>
        </button>
      </div>

      <!-- Font size slider -->
      <div class="mb-4">
        <div class="mb-2 flex items-center justify-between">
          <label for="font-size-slider" class="text-sm text-gray-700 dark:text-gray-300">Ukuran Font</label>
          <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ fontSize }}px</span>
        </div>
        <input
          id="font-size-slider"
          type="range"
          min="12"
          max="24"
          step="1"
          :value="fontSize"
          class="w-full accent-blue-600"
          aria-label="Ukuran font"
          @input="onFontSizeChange"
        />
        <div class="mt-1 flex justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>12px</span>
          <span>24px</span>
        </div>
      </div>

      <!-- Font family dropdown -->
      <div class="mb-4">
        <label for="font-family-select" class="mb-2 block text-sm text-gray-700 dark:text-gray-300">
          Jenis Font
        </label>
        <select
          id="font-family-select"
          :value="fontFamily"
          class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="onFontFamilyChange"
        >
          <option value="font-sans">Sans-serif</option>
          <option value="font-serif">Serif</option>
          <option value="font-mono">Monospace</option>
        </select>
      </div>

      <!-- Line spacing toggle -->
      <div class="mb-4">
        <span class="mb-2 block text-sm text-gray-700 dark:text-gray-300">Jarak Baris</span>
        <div class="flex gap-1" role="group" aria-label="Pilih jarak baris">
          <button
            v-for="opt in lineSpacingOptions"
            :key="opt.value"
            type="button"
            class="flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            :class="
              lineSpacing === opt.value
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
            "
            :aria-pressed="lineSpacing === opt.value"
            @click="prefsStore.setLineSpacing(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Content width slider -->
      <div>
        <div class="mb-2 flex items-center justify-between">
          <label for="content-width-slider" class="text-sm text-gray-700 dark:text-gray-300">
            Lebar Konten
          </label>
          <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ contentWidth }}px</span>
        </div>
        <input
          id="content-width-slider"
          type="range"
          min="600"
          max="900"
          step="50"
          :value="contentWidth"
          class="w-full accent-blue-600"
          aria-label="Lebar konten"
          @input="onContentWidthChange"
        />
        <div class="mt-1 flex justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>600px</span>
          <span>900px</span>
        </div>
      </div>
    </div>
  </div>
</template>
