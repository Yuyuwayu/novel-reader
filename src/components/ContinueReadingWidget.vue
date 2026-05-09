<script setup lang="ts">
// Continue Reading Widget — displays the last read novel and chapter from Progress Store.
// Shows novel thumbnail, title, progress indicator, and "Lanjutkan Membaca" button.
// Handles deleted novels by showing second-to-last entry.
// Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9

import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useProgressStore } from '@/stores/progress'
import { useThemeStore } from '@/stores/theme'
import { fetchNovelDetail } from '@/api'
import { isStorageAvailable } from '@/utils/storage'
import type { ReadingProgress } from '@/types'

const progressStore = useProgressStore()
const themeStore = useThemeStore()

interface LastReadData {
  novelId: string
  lastChapter: number
  totalChapters: number
  title: string
  thumbnailUrl: string
  updatedAt: string
}

const lastRead = ref<LastReadData | null>(null)
const loading = ref(true)

/**
 * Fetches all reading progress entries from localStorage, sorted by updatedAt DESC.
 * Returns the most recent entry, or second-to-last if the first novel is deleted.
 */
async function loadLastRead(): Promise<void> {
  loading.value = true

  if (!isStorageAvailable()) {
    loading.value = false
    return
  }

  try {
    // Collect all progress entries from localStorage
    const allProgress: ReadingProgress[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('novel_reader:progress:')) {
        const novelId = key.replace('novel_reader:progress:', '')
        const progress = progressStore.get(novelId)
        if (progress) {
          allProgress.push(progress)
        }
      }
    }

    // Sort by updatedAt DESC (most recent first)
    allProgress.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )

    // Try to fetch the most recent novel, fallback to second if deleted
    for (const progress of allProgress) {
      try {
        const novel = await fetchNovelDetail(progress.novelId)
        lastRead.value = {
          novelId: progress.novelId,
          lastChapter: progress.lastChapter,
          totalChapters: novel.chapters.length,
          title: novel.title,
          thumbnailUrl: novel.thumbnailUrl,
          updatedAt: progress.updatedAt,
        }
        break // Successfully loaded, exit loop
      } catch (error) {
        // Novel deleted or API error, try next entry
        console.warn(`Failed to load novel ${progress.novelId}, trying next entry`)
        continue
      }
    }
  } catch (error) {
    console.error('Failed to load continue reading data:', error)
  } finally {
    loading.value = false
  }
}

const progressPercentage = computed(() => {
  if (!lastRead.value) return 0
  return Math.round((lastRead.value.lastChapter / lastRead.value.totalChapters) * 100)
})

onMounted(() => {
  loadLastRead()
})
</script>

<template>
  <!-- Only render if we have data to show -->
  <section v-if="!loading && lastRead" class="continue-reading-widget">
    <div class="mb-4 flex items-center justify-between">
      <h2
        class="text-lg font-semibold tracking-tight"
        :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'"
      >
        Lanjutkan Membaca
      </h2>
    </div>

    <div
      class="group relative overflow-hidden rounded-2xl border transition-all duration-300"
      :class="themeStore.isDark
        ? 'border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-white/[0.07] to-white/[0.02] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_2px_20px_rgba(0,0,0,0.4)] hover:border-[rgba(255,255,255,0.10)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_8px_40px_rgba(0,0,0,0.5),0_0_60px_rgba(94,106,210,0.08)]'
        : 'border-[rgba(0,0,0,0.07)] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_2px_12px_rgba(0,0,0,0.06)] hover:border-[rgba(94,106,210,0.20)] hover:shadow-[0_0_0_1px_rgba(94,106,210,0.15),0_8px_32px_rgba(0,0,0,0.10),0_0_40px_rgba(94,106,210,0.06)]'"
    >
      <div class="flex gap-4 p-4">
        <!-- Thumbnail -->
        <RouterLink
          :to="`/novel/${lastRead.novelId}`"
          class="relative flex-shrink-0 overflow-hidden rounded-lg"
          :class="themeStore.isDark ? 'bg-white/[0.04]' : 'bg-[#F0F0F6]'"
        >
          <img
            :src="lastRead.thumbnailUrl"
            :alt="lastRead.title"
            class="h-32 w-24 object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </RouterLink>

        <!-- Info -->
        <div class="flex flex-1 flex-col justify-between">
          <div>
            <RouterLink
              :to="`/novel/${lastRead.novelId}`"
              class="block transition-colors duration-200"
            >
              <h3
                class="line-clamp-2 text-base font-semibold leading-snug tracking-tight"
                :class="themeStore.isDark
                  ? 'text-[#EDEDEF] hover:text-white'
                  : 'text-[#111118] hover:text-[#5E6AD2]'"
              >
                {{ lastRead.title }}
              </h3>
            </RouterLink>

            <p
              class="mt-1 text-sm"
              :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'"
            >
              Chapter {{ lastRead.lastChapter }} dari {{ lastRead.totalChapters }}
            </p>
          </div>

          <!-- Progress bar -->
          <div class="mt-3">
            <div
              class="h-1.5 w-full overflow-hidden rounded-full"
              :class="themeStore.isDark ? 'bg-white/[0.06]' : 'bg-black/[0.06]'"
            >
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="themeStore.isDark ? 'bg-[#8A9AE8]' : 'bg-[#5E6AD2]'"
                :style="{ width: `${progressPercentage}%` }"
              />
            </div>
            <p
              class="mt-1 text-xs"
              :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'"
            >
              {{ progressPercentage }}% selesai
            </p>
          </div>

          <!-- Continue reading button -->
          <RouterLink
            :to="`/novel/${lastRead.novelId}/chapter/${lastRead.lastChapter}`"
            class="mt-3 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
            :class="themeStore.isDark
              ? 'bg-[#5E6AD2] text-white hover:bg-[#6872D9] focus:ring-offset-[#050506]'
              : 'bg-[#5E6AD2] text-white hover:bg-[#4E5AC2] focus:ring-offset-white'"
          >
            Lanjutkan Membaca
          </RouterLink>
        </div>
      </div>
    </div>
  </section>

  <!-- Loading state -->
  <section v-else-if="loading" class="continue-reading-widget">
    <div class="mb-4">
      <div
        class="h-6 w-40 animate-pulse rounded"
        :class="themeStore.isDark ? 'bg-white/[0.06]' : 'bg-black/[0.06]'"
      />
    </div>
    <div
      class="h-40 animate-pulse rounded-2xl"
      :class="themeStore.isDark ? 'bg-white/[0.06]' : 'bg-black/[0.06]'"
    />
  </section>
</template>
