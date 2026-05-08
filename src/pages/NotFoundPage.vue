<script setup lang="ts">
// 404 Not Found page with a link back to the catalog.
// Requirements: 8.4, 15.5

import { RouterLink } from 'vue-router'
import { useSeoMeta } from '@/composables/useSeoMeta'

useSeoMeta('Halaman Tidak Ditemukan — Novel Reader')
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <div class="text-center">
      <!-- 404 illustration -->
      <div class="mb-6 flex justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-24 w-24 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <!-- 404 heading -->
      <h1 class="mb-2 text-6xl font-bold text-gray-900">404</h1>
      <p class="mb-6 text-lg text-gray-600">Halaman tidak ditemukan</p>

      <!-- Back to catalog link -->
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Kembali ke Katalog
      </RouterLink>
    </div>
  </div>
</template>
