<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const authStore = useAuthStore()
const themeStore = useThemeStore()
const router = useRouter()

function close() {
  emit('close')
}

async function handleLogout() {
  await authStore.logout()
  close()
  router.push('/login')
}

const navLinks = [
  { to: '/', label: 'Beranda', exact: true, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/finder', label: 'Katalog', exact: false, icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
  { to: '/leaderboard', label: 'Leaderboard', exact: false, icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
]

const authLinks = [
  { to: '/notifications', label: 'Notifikasi', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
  { to: '/library', label: 'Library', icon: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z' },
  { to: '/history', label: 'Riwayat', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
]
</script>

<template>
  <!-- Backdrop -->
  <Transition
    enter-active-class="transition-opacity duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="props.open"
      class="fixed inset-0 z-40 backdrop-blur-sm"
      :class="themeStore.isDark ? 'bg-black/60' : 'bg-black/30'"
      aria-hidden="true"
      @click="close"
    />
  </Transition>

  <!-- Slide-in drawer -->
  <Transition
    enter-active-class="transition-transform duration-250 ease-out"
    enter-from-class="-translate-x-full"
    enter-to-class="translate-x-0"
    leave-active-class="transition-transform duration-200 ease-in"
    leave-from-class="translate-x-0"
    leave-to-class="-translate-x-full"
  >
    <aside
      v-if="props.open"
      class="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r"
      :class="themeStore.isDark
        ? 'border-[rgba(255,255,255,0.06)] bg-[#050506]/95 backdrop-blur-xl'
        : 'border-[rgba(0,0,0,0.07)] bg-[#F8F8FC]/95 backdrop-blur-xl'"
      role="dialog"
      aria-modal="true"
      aria-label="Menu navigasi"
    >
      <!-- Header -->
      <div
        class="flex h-14 items-center justify-between border-b px-4"
        :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)]' : 'border-[rgba(0,0,0,0.07)]'"
      >
        <RouterLink
          to="/"
          class="flex items-center gap-2 text-sm font-semibold tracking-tight transition-colors duration-200 focus:outline-none"
          :class="themeStore.isDark ? 'text-[#EDEDEF] hover:text-white' : 'text-[#111118] hover:text-[#5E6AD2]'"
          @click="close"
        >
          <div
            class="flex h-6 w-6 items-center justify-center rounded-lg border"
            :class="themeStore.isDark
              ? 'border-[rgba(94,106,210,0.30)] bg-[rgba(94,106,210,0.12)]'
              : 'border-[rgba(94,106,210,0.25)] bg-[rgba(94,106,210,0.08)]'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-[#5E6AD2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          Novel Reader
        </RouterLink>

        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50"
          :class="themeStore.isDark
            ? 'border-[rgba(255,255,255,0.06)] bg-white/[0.04] text-[#8A8F98] hover:bg-white/[0.08] hover:text-[#EDEDEF]'
            : 'border-[rgba(0,0,0,0.07)] bg-black/[0.03] text-[#6B7080] hover:bg-black/[0.06] hover:text-[#111118]'"
          aria-label="Tutup menu"
          @click="close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Nav links -->
      <nav class="flex-1 overflow-y-auto px-3 py-4">
        <div class="space-y-0.5">
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50"
            :class="themeStore.isDark
              ? 'text-[#8A8F98] hover:bg-white/[0.05] hover:text-[#EDEDEF]'
              : 'text-[#6B7080] hover:bg-black/[0.04] hover:text-[#111118]'"
            :active-class="themeStore.isDark
              ? 'bg-white/[0.06] text-[#EDEDEF]'
              : 'bg-[rgba(94,106,210,0.08)] text-[#5E6AD2]'"
            :exact-active-class="link.exact
              ? (themeStore.isDark ? 'bg-white/[0.06] text-[#EDEDEF]' : 'bg-[rgba(94,106,210,0.08)] text-[#5E6AD2]')
              : ''"
            @click="close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" :d="link.icon" />
            </svg>
            {{ link.label }}
          </RouterLink>
        </div>

        <!-- Auth-only links -->
        <template v-if="authStore.isAuthenticated">
          <div
            class="my-3 border-t"
            :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)]' : 'border-[rgba(0,0,0,0.06)]'"
          />
          <div class="space-y-0.5">
            <RouterLink
              v-for="link in authLinks"
              :key="link.to"
              :to="link.to"
              class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50"
              :class="themeStore.isDark
                ? 'text-[#8A8F98] hover:bg-white/[0.05] hover:text-[#EDEDEF]'
                : 'text-[#6B7080] hover:bg-black/[0.04] hover:text-[#111118]'"
              active-class="bg-[rgba(94,106,210,0.08)] text-[#5E6AD2]"
              @click="close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" :d="link.icon" />
              </svg>
              {{ link.label }}
            </RouterLink>
          </div>
        </template>

        <!-- Divider -->
        <div
          class="my-3 border-t"
          :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)]' : 'border-[rgba(0,0,0,0.06)]'"
        />

        <!-- Theme toggle -->
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50"
          :class="themeStore.isDark
            ? 'text-[#8A8F98] hover:bg-white/[0.05] hover:text-[#EDEDEF]'
            : 'text-[#6B7080] hover:bg-black/[0.04] hover:text-[#111118]'"
          @click="themeStore.toggleTheme()"
        >
          <svg v-if="themeStore.isDark" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          {{ themeStore.isDark ? 'Mode Terang' : 'Mode Gelap' }}
        </button>
      </nav>

      <!-- Auth area at bottom -->
      <div
        class="border-t px-3 py-4"
        :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)]' : 'border-[rgba(0,0,0,0.07)]'"
      >
        <!-- Guest -->
        <template v-if="!authStore.isAuthenticated">
          <RouterLink
            to="/login"
            class="flex w-full items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50"
            :class="themeStore.isDark
              ? 'border-[rgba(255,255,255,0.08)] bg-white/[0.04] text-[#EDEDEF] hover:bg-white/[0.07]'
              : 'border-[rgba(0,0,0,0.08)] bg-black/[0.03] text-[#111118] hover:bg-black/[0.06]'"
            @click="close"
          >
            Masuk
          </RouterLink>
          <RouterLink
            to="/register"
            class="mt-2 flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50"
            :class="themeStore.isDark
              ? 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_2px_8px_rgba(94,106,210,0.3)] hover:bg-[#6872D9]'
              : 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.4),0_2px_8px_rgba(94,106,210,0.2)] hover:bg-[#6872D9]'"
            @click="close"
          >
            Daftar
          </RouterLink>
        </template>

        <!-- Authenticated -->
        <template v-else>
          <div class="mb-3 flex items-center gap-3 px-1">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
              :class="'bg-[#5E6AD2]'"
            >
              {{ authStore.user?.username?.charAt(0).toUpperCase() }}
            </div>
            <div class="min-w-0">
              <p
                class="truncate text-sm font-medium"
                :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'"
              >
                {{ authStore.user?.username }}
              </p>
              <p
                class="font-mono text-xs capitalize"
                :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'"
              >
                {{ authStore.user?.role }}
              </p>
            </div>
          </div>

          <RouterLink
            to="/profile"
            class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 focus:outline-none"
            :class="themeStore.isDark
              ? 'text-[#8A8F98] hover:bg-white/[0.05] hover:text-[#EDEDEF]'
              : 'text-[#6B7080] hover:bg-black/[0.04] hover:text-[#111118]'"
            @click="close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profil Saya
          </RouterLink>

          <button
            type="button"
            class="mt-0.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 focus:outline-none"
            :class="themeStore.isDark
              ? 'text-red-400 hover:bg-red-500/[0.08] hover:text-red-300'
              : 'text-red-500 hover:bg-red-50 hover:text-red-600'"
            @click="handleLogout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Keluar
          </button>
        </template>
      </div>
    </aside>
  </Transition>
</template>
