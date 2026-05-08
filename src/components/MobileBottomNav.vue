<script setup lang="ts">
// MobileBottomNav — Linear/Modern design system.
// Frosted glass bottom bar with accent active state.

import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const route = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const tabs = [
  { to: '/', label: 'Beranda', exact: true, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/catalog', label: 'Katalog', exact: false, icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
  { to: '/leaderboard', label: 'Ranking', exact: false, icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
]
</script>

<template>
  <!-- Bottom navigation — mobile only (< 768px) -->
  <nav
    class="fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl transition-colors duration-300 md:hidden"
    :class="themeStore.isDark
      ? 'border-[rgba(255,255,255,0.06)] bg-[rgba(5,5,6,0.90)]'
      : 'border-[rgba(0,0,0,0.07)] bg-[rgba(248,248,252,0.90)]'"
    aria-label="Navigasi bawah"
  >
    <div class="flex h-16 items-stretch">
      <!-- Main tabs -->
      <RouterLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-all duration-200 focus:outline-none"
        :class="isActive(tab.to)
          ? 'text-[#5E6AD2]'
          : themeStore.isDark
            ? 'text-[#8A8F98] hover:text-[#EDEDEF]'
            : 'text-[#6B7080] hover:text-[#111118]'"
        :aria-label="tab.label"
        :aria-current="isActive(tab.to) ? 'page' : undefined"
      >
        <!-- Active indicator dot -->
        <span
          class="mb-0.5 h-0.5 w-4 rounded-full transition-all duration-200"
          :class="isActive(tab.to)
            ? 'bg-[#5E6AD2] opacity-100'
            : 'opacity-0'"
          aria-hidden="true"
        />
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" :d="tab.icon" />
        </svg>
        <span>{{ tab.label }}</span>
      </RouterLink>

      <!-- Profile / Login tab -->
      <RouterLink
        :to="authStore.isAuthenticated ? '/profile' : '/login'"
        class="flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-all duration-200 focus:outline-none"
        :class="isActive('/profile') || isActive('/login')
          ? 'text-[#5E6AD2]'
          : themeStore.isDark
            ? 'text-[#8A8F98] hover:text-[#EDEDEF]'
            : 'text-[#6B7080] hover:text-[#111118]'"
        :aria-label="authStore.isAuthenticated ? 'Profil' : 'Masuk'"
        :aria-current="isActive('/profile') || isActive('/login') ? 'page' : undefined"
      >
        <span
          class="mb-0.5 h-0.5 w-4 rounded-full transition-all duration-200"
          :class="isActive('/profile') || isActive('/login')
            ? 'bg-[#5E6AD2] opacity-100'
            : 'opacity-0'"
          aria-hidden="true"
        />
        <!-- Avatar if authenticated, person icon if not -->
        <div
          v-if="authStore.isAuthenticated"
          class="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
          :class="isActive('/profile') ? 'bg-[#5E6AD2]' : themeStore.isDark ? 'bg-white/20' : 'bg-black/15'"
          aria-hidden="true"
        >
          {{ authStore.user?.username?.charAt(0).toUpperCase() }}
        </div>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span>{{ authStore.isAuthenticated ? 'Profil' : 'Masuk' }}</span>
      </RouterLink>
    </div>
  </nav>
</template>
