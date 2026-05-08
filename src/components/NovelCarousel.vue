<script setup lang="ts">
// NovelCarousel — horizontal scroll carousel of NovelCard items.
// Requirements: 20.2, 20.12

import type { NovelSummary } from '@/types'
import { useThemeStore } from '@/stores/theme'
import NovelCard from '@/components/NovelCard.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'

withDefaults(
  defineProps<{
    novels: NovelSummary[]
    title?: string
    loading?: boolean
  }>(),
  { title: undefined, loading: false },
)

const themeStore = useThemeStore()
</script>

<template>
  <section>
    <h2
      v-if="title"
      class="mb-3 text-lg font-semibold tracking-tight"
      :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'"
    >
      {{ title }}
    </h2>

    <div v-if="loading" class="overflow-hidden">
      <SkeletonLoader :count="4" />
    </div>

    <div
      v-else
      class="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
      style="-webkit-overflow-scrolling: touch;"
    >
      <div
        v-for="novel in novels"
        :key="novel.id"
        class="w-36 shrink-0 snap-start sm:w-44"
      >
        <NovelCard :novel="novel" />
      </div>

      <p
        v-if="!novels.length"
        class="py-8 font-mono text-xs"
        :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'"
      >
        Tidak ada novel untuk ditampilkan.
      </p>
    </div>
  </section>
</template>
