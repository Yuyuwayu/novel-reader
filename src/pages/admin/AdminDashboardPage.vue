<script setup lang="ts">
// Admin dashboard — navigation hub for admin panel.
// Requirements: 9.3, 9.5

import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const authStore = useAuthStore()
const themeStore = useThemeStore()
</script>

<template>
  <div class="relative min-h-screen transition-colors duration-300" :class="themeStore.isDark ? 'bg-[#050506]' : 'bg-[#F8F8FC]'">
    <!-- Ambient background -->
    <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div class="absolute inset-0" :class="themeStore.isDark ? 'bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)]' : 'bg-[radial-gradient(ellipse_at_top,#eeeef8_0%,#F8F8FC_50%,#ebebf2_100%)]'" />
      <div class="absolute -top-[80px] left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full blur-[120px] animate-[blob-float_10s_ease-in-out_infinite]" :class="themeStore.isDark ? 'bg-[rgba(94,106,210,0.15)]' : 'bg-[rgba(94,106,210,0.07)]'" />
    </div>

    <!-- Page header -->
    <header class="sticky top-0 z-20 border-b backdrop-blur-xl" :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)] bg-[rgba(5,5,6,0.80)]' : 'border-[rgba(0,0,0,0.07)] bg-[rgba(248,248,252,0.80)]'">
      <div class="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
        <div class="flex items-center gap-4">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl border"
            :class="themeStore.isDark ? 'border-[rgba(94,106,210,0.30)] bg-[rgba(94,106,210,0.12)]' : 'border-[rgba(94,106,210,0.25)] bg-[rgba(94,106,210,0.08)]'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#5E6AD2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 class="text-xl font-semibold tracking-tight" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">Admin Panel</h1>
            <p class="text-sm" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">
              Selamat datang,
              <span class="font-medium" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">{{ authStore.user?.username ?? 'Admin' }}</span>
            </p>
          </div>
        </div>
      </div>
    </header>

    <!-- Navigation menu -->
    <main class="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <p class="mb-6 text-sm" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">Pilih area yang ingin dikelola:</p>

      <nav aria-label="Menu admin" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <RouterLink
          v-for="item in [
            { to: '/admin/novels', label: 'Manajemen Novel', desc: 'Tambah, edit, dan hapus novel di katalog', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
            { to: '/admin/genres', label: 'Manajemen Genre', desc: 'Kelola daftar genre yang tersedia di platform', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
            { to: '/admin/tags', label: 'Manajemen Tag', desc: 'Kelola tag tematik dan kategorinya', icon: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z' },
            { to: '/admin/reports', label: 'Laporan Chapter', desc: 'Tinjau laporan masalah dari pengguna', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
          ]"
          :key="item.to"
          :to="item.to"
          class="group flex items-start gap-4 rounded-2xl border p-6 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
          :class="themeStore.isDark
            ? 'border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-white/[0.07] to-white/[0.02] hover:border-[rgba(94,106,210,0.30)] hover:shadow-[0_0_0_1px_rgba(94,106,210,0.15),0_4px_20px_rgba(94,106,210,0.10)] focus:ring-offset-[#050506]'
            : 'border-[rgba(0,0,0,0.07)] bg-white hover:border-[rgba(94,106,210,0.25)] hover:shadow-[0_0_0_1px_rgba(94,106,210,0.10),0_4px_20px_rgba(94,106,210,0.06)] focus:ring-offset-[#F8F8FC]'"
        >
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-200"
            :class="themeStore.isDark
              ? 'border-[rgba(94,106,210,0.20)] bg-[rgba(94,106,210,0.08)] group-hover:border-[rgba(94,106,210,0.40)] group-hover:bg-[rgba(94,106,210,0.15)]'
              : 'border-[rgba(94,106,210,0.15)] bg-[rgba(94,106,210,0.06)] group-hover:border-[rgba(94,106,210,0.30)] group-hover:bg-[rgba(94,106,210,0.12)]'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#5E6AD2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
            </svg>
          </div>
          <div>
            <p
              class="font-semibold tracking-tight transition-colors duration-200"
              :class="themeStore.isDark ? 'text-[#EDEDEF] group-hover:text-white' : 'text-[#111118] group-hover:text-[#5E6AD2]'"
            >{{ item.label }}</p>
            <p class="mt-1 text-sm" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">{{ item.desc }}</p>
          </div>
        </RouterLink>
      </nav>
    </main>
  </div>
</template>
    <!-- Page header -->
    <div class="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div class="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 text-white"
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
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">Admin Panel</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Selamat datang,
              <span class="font-medium text-gray-700 dark:text-gray-300">{{ authStore.user?.username ?? 'Admin' }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation menu -->
    <main class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <p class="mb-6 text-sm text-gray-600 dark:text-gray-400">Pilih area yang ingin dikelola:</p>

      <nav aria-label="Menu admin" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <!-- Manajemen Novel -->
        <RouterLink
          to="/admin/novels"
          class="group flex items-start gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm transition hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 transition group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <div>
            <p class="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400">Manajemen Novel</p>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Tambah, edit, dan hapus novel di katalog</p>
          </div>
        </RouterLink>

        <!-- Manajemen Genre -->
        <RouterLink
          to="/admin/genres"
          class="group flex items-start gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm transition hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 transition group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
          </div>
          <div>
            <p class="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-purple-700 dark:group-hover:text-purple-400">Manajemen Genre</p>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Kelola daftar genre yang tersedia di platform</p>
          </div>
        </RouterLink>
      </nav>
    </main>
  </div>
</template>
