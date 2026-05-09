<script setup lang="ts">
// Reading settings panel: theme toggle, font size, font family, line spacing, content width.
// Accesses useThemeStore for theme; usePreferencesStore for all reading preferences.
// Requirements: 5.7, 5.8, 6.1, 6.2, 6.3, 6.4, 6.5, 25.1, 25.2, 25.3, 25.8, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8

import { ref, computed, onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { usePreferencesStore } from '@/stores/preferences'
import type { FontFamily, LineSpacing } from '@/types'
import { cacheManager } from '@/utils/cacheManager'
import { getOfflineAnalytics, resetOfflineAnalytics } from '@/utils/offlineAnalytics'
import { formatRelativeTime } from '@/utils/formatRelativeTime'

const themeStore = useThemeStore()
const prefsStore = usePreferencesStore()
const isOpen = ref(false)

// Offline reading cache state
const cacheStats = ref({ count: 0, totalSize: 0 })
const showClearConfirm = ref(false)
const isClearing = ref(false)

// Storage quota state
const storageQuota = ref({ usage: 0, quota: 0, percentage: 0 })

// Offline analytics state
const offlineAnalytics = ref({
  offlineReadsCount: 0,
  onlineReadsCount: 0,
  lastOfflineReadAt: null as string | null,
  offlineNovelIds: [] as string[]
})

// Service Worker support detection
const isServiceWorkerSupported = ref('serviceWorker' in navigator)

const isDark = computed(() => themeStore.isDark)
const fontSize = computed(() => prefsStore.preferences.fontSizePx)
const fontFamily = computed(() => prefsStore.preferences.fontFamily)
const lineSpacing = computed(() => prefsStore.preferences.lineSpacing)
const contentWidth = computed(() => prefsStore.preferences.contentWidth)
const autoScrollSpeed = computed(() => prefsStore.preferences.autoScrollSpeed)

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

function onAutoScrollSpeedChange(event: Event): void {
  const value = parseInt((event.target as HTMLInputElement).value, 10)
  prefsStore.setAutoScrollSpeed(value)
}

const lineSpacingOptions: { value: LineSpacing; label: string }[] = [
  { value: 'leading-snug', label: 'Rapat' },
  { value: 'leading-relaxed', label: 'Normal' },
  { value: 'leading-loose', label: 'Longgar' },
]

// Format bytes to MB
function formatBytes(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(2)
}

// Check storage quota
async function checkStorageQuota(): Promise<void> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate()
      const usage = estimate.usage || 0
      const quota = estimate.quota || 0
      const percentage = quota > 0 ? (usage / quota) * 100 : 0
      
      storageQuota.value = { usage, quota, percentage }
    } catch (error) {
      console.error('Failed to check storage quota:', error)
      storageQuota.value = { usage: 0, quota: 0, percentage: 0 }
    }
  }
}

// Load cache stats on mount
onMounted(async () => {
  await cacheManager.init()
  await refreshCacheStats()
  await checkStorageQuota()
  loadOfflineAnalytics()
})

// Refresh cache statistics
async function refreshCacheStats(): Promise<void> {
  cacheStats.value = await cacheManager.getCacheStats()
  await checkStorageQuota()
}

// Load offline analytics from localStorage
function loadOfflineAnalytics(): void {
  offlineAnalytics.value = getOfflineAnalytics()
}

// Show clear cache confirmation dialog
function showClearCacheDialog(): void {
  showClearConfirm.value = true
}

// Clear all cached chapters
async function clearCache(): Promise<void> {
  isClearing.value = true
  try {
    await cacheManager.clearCache()
    resetOfflineAnalytics() // Reset offline analytics when cache is cleared
    await refreshCacheStats()
    loadOfflineAnalytics() // Reload analytics after reset
    showClearConfirm.value = false
    // Show success toast (simple implementation)
    alert('Cache berhasil dihapus')
  } catch (error) {
    console.error('Failed to clear cache:', error)
    alert('Gagal menghapus cache')
  } finally {
    isClearing.value = false
  }
}

// Cancel clear cache
function cancelClearCache(): void {
  showClearConfirm.value = false
}
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
      <div class="mb-4">
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

      <!-- Auto-scroll speed slider -->
      <div class="mb-4">
        <div class="mb-2 flex items-center justify-between">
          <label for="auto-scroll-speed-slider" class="text-sm text-gray-700 dark:text-gray-300">
            Kecepatan Scroll Otomatis
          </label>
          <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ autoScrollSpeed }}x</span>
        </div>
        <input
          id="auto-scroll-speed-slider"
          type="range"
          min="1"
          max="10"
          step="1"
          :value="autoScrollSpeed"
          class="w-full accent-blue-600"
          aria-label="Kecepatan scroll otomatis"
          @input="onAutoScrollSpeedChange"
        />
        <div class="mt-1 flex justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>Lambat</span>
          <span>Cepat</span>
        </div>
      </div>

      <!-- Offline Reading section -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Offline Reading</h3>
        
        <!-- Service Worker not supported message -->
        <div
          v-if="!isServiceWorkerSupported"
          class="mb-3 rounded-md border border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-2"
          role="status"
        >
          <div class="flex items-start gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div class="flex-1">
              <p class="text-sm text-blue-800 dark:text-blue-300">
                Browser Anda tidak mendukung offline reading
              </p>
            </div>
          </div>
        </div>
        
        <!-- Storage quota warning -->
        <div
          v-if="storageQuota.percentage > 80"
          class="mb-3 rounded-md border border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-2"
          role="alert"
        >
          <div class="flex items-start gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div class="flex-1">
              <p class="text-sm font-medium text-amber-800 dark:text-amber-300">
                Storage hampir penuh
              </p>
              <p class="mt-1 text-xs text-amber-700 dark:text-amber-400">
                Penggunaan storage: {{ storageQuota.percentage.toFixed(0) }}% ({{ formatBytes(storageQuota.usage) }} MB dari {{ formatBytes(storageQuota.quota) }} MB)
              </p>
            </div>
          </div>
        </div>
        
        <!-- Cache stats -->
        <div class="mb-3 space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-700 dark:text-gray-300">Chapter di-cache</span>
            <span class="font-medium text-gray-900 dark:text-gray-100">{{ cacheStats.count }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-700 dark:text-gray-300">Total ukuran</span>
            <span class="font-medium text-gray-900 dark:text-gray-100">{{ formatBytes(cacheStats.totalSize) }} MB</span>
          </div>
          <div v-if="storageQuota.quota > 0" class="flex items-center justify-between text-sm">
            <span class="text-gray-700 dark:text-gray-300">Penggunaan storage</span>
            <span class="font-medium text-gray-900 dark:text-gray-100">{{ storageQuota.percentage.toFixed(1) }}%</span>
          </div>
        </div>

        <!-- Offline analytics stats -->
        <div v-if="offlineAnalytics.offlineReadsCount > 0" class="mb-3 space-y-2 border-t border-gray-200 dark:border-gray-700 pt-3">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-700 dark:text-gray-300">Total Bacaan Offline</span>
            <span class="font-medium text-gray-900 dark:text-gray-100">{{ offlineAnalytics.offlineReadsCount }} chapter</span>
          </div>
          <div v-if="offlineAnalytics.lastOfflineReadAt" class="flex items-center justify-between text-sm">
            <span class="text-gray-700 dark:text-gray-300">Terakhir Baca Offline</span>
            <span class="font-medium text-gray-900 dark:text-gray-100">{{ formatRelativeTime(offlineAnalytics.lastOfflineReadAt) }}</span>
          </div>
        </div>

        <!-- Clear cache button -->
        <button
          type="button"
          class="w-full rounded-md border border-red-300 dark:border-red-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="cacheStats.count === 0 || isClearing"
          @click="showClearCacheDialog"
        >
          {{ isClearing ? 'Menghapus...' : 'Hapus Semua Cache' }}
        </button>
      </div>
    </div>

    <!-- Clear cache confirmation dialog -->
    <div
      v-if="showClearConfirm"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clear-cache-title"
      @click.self="cancelClearCache"
    >
      <div class="w-full max-w-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-xl">
        <h3 id="clear-cache-title" class="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Hapus Semua Cache?
        </h3>
        <p class="mb-6 text-sm text-gray-600 dark:text-gray-400">
          Semua chapter yang di-cache akan dihapus. Anda perlu koneksi internet untuk membaca chapter tersebut lagi.
        </p>
        <div class="flex gap-3">
          <button
            type="button"
            class="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="cancelClearCache"
          >
            Batal
          </button>
          <button
            type="button"
            class="flex-1 rounded-md border border-red-600 bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isClearing"
            @click="clearCache"
          >
            {{ isClearing ? 'Menghapus...' : 'Hapus' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
