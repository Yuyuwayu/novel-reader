<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useNotificationsStore } from '@/stores/notifications'
import MobileSidebarDrawer from './MobileSidebarDrawer.vue'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const notificationsStore = useNotificationsStore()
const router = useRouter()

const showUserDropdown = ref(false)
const showMobileDrawer = ref(false)

async function handleLogout() {
  await authStore.logout()
  showUserDropdown.value = false
  router.push('/login')
}
</script>

<template>
  <!--
    AppNavbar — Linear/Modern design system
    Dark:  frosted glass over deep-space background, indigo accent
    Light: frosted glass over soft lavender background, indigo accent
  -->
  <nav
    class="sticky top-0 z-30 border-b backdrop-blur-xl transition-colors duration-300"
    :class="themeStore.isDark
      ? 'border-[rgba(255,255,255,0.06)] bg-[rgba(5,5,6,0.85)]'
      : 'border-[rgba(0,0,0,0.07)] bg-[rgba(248,248,252,0.85)]'"
    aria-label="Navigasi utama"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-14 items-center justify-between">

        <!-- Logo -->
        <RouterLink
          to="/"
          class="group flex items-center gap-2 rounded-lg px-1 py-1 text-base font-semibold tracking-tight transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
          :class="themeStore.isDark
            ? 'text-[#EDEDEF] hover:text-white focus:ring-offset-[#050506]'
            : 'text-[#111118] hover:text-[#5E6AD2] focus:ring-offset-[#F8F8FC]'"
        >
          <div
            class="flex h-7 w-7 items-center justify-center rounded-lg border transition-all duration-200"
            :class="themeStore.isDark
              ? 'border-[rgba(94,106,210,0.30)] bg-[rgba(94,106,210,0.12)] group-hover:border-[rgba(94,106,210,0.50)] group-hover:bg-[rgba(94,106,210,0.20)]'
              : 'border-[rgba(94,106,210,0.25)] bg-[rgba(94,106,210,0.08)] group-hover:border-[rgba(94,106,210,0.40)] group-hover:bg-[rgba(94,106,210,0.15)]'"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 text-[#5E6AD2]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          Novel Reader
        </RouterLink>

        <!-- Desktop nav links -->
        <div class="hidden items-center gap-1 md:flex">
          <RouterLink
            v-for="link in [
              { to: '/', label: 'Beranda', exact: true },
              { to: '/finder', label: 'Katalog', exact: false },
              { to: '/leaderboard', label: 'Leaderboard', exact: false },
            ]"
            :key="link.to"
            :to="link.to"
            class="rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
            :class="themeStore.isDark
              ? 'text-[#8A8F98] hover:bg-white/[0.06] hover:text-[#EDEDEF] focus:ring-offset-[#050506]'
              : 'text-[#6B7080] hover:bg-black/[0.05] hover:text-[#111118] focus:ring-offset-[#F8F8FC]'"
            :active-class="themeStore.isDark
              ? 'bg-white/[0.06] text-[#EDEDEF]'
              : 'bg-[rgba(94,106,210,0.08)] text-[#5E6AD2]'"
            :exact-active-class="link.exact
              ? (themeStore.isDark ? 'bg-white/[0.06] text-[#EDEDEF]' : 'bg-[rgba(94,106,210,0.08)] text-[#5E6AD2]')
              : ''"
          >
            {{ link.label }}
          </RouterLink>
        </div>

        <!-- Right side: theme toggle + auth -->
        <div class="hidden items-center gap-2 md:flex">

          <!-- Theme toggle -->
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
            :class="themeStore.isDark
              ? 'border-[rgba(255,255,255,0.06)] bg-white/[0.04] text-[#8A8F98] hover:border-[rgba(255,255,255,0.10)] hover:bg-white/[0.08] hover:text-[#EDEDEF] focus:ring-offset-[#050506]'
              : 'border-[rgba(0,0,0,0.07)] bg-black/[0.03] text-[#6B7080] hover:border-[rgba(0,0,0,0.12)] hover:bg-black/[0.06] hover:text-[#111118] focus:ring-offset-[#F8F8FC]'"
            :aria-label="themeStore.isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'"
            @click="themeStore.toggleTheme()"
          >
            <!-- Sun icon (dark mode → switch to light) -->
            <svg v-if="themeStore.isDark" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
            <!-- Moon icon (light mode → switch to dark) -->
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>

          <!-- Guest: Masuk + Daftar -->
          <template v-if="!authStore.isAuthenticated">
            <RouterLink
              to="/login"
              class="rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
              :class="themeStore.isDark
                ? 'text-[#8A8F98] hover:bg-white/[0.06] hover:text-[#EDEDEF] focus:ring-offset-[#050506]'
                : 'text-[#6B7080] hover:bg-black/[0.05] hover:text-[#111118] focus:ring-offset-[#F8F8FC]'"
            >
              Masuk
            </RouterLink>
            <RouterLink
              to="/register"
              class="rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
              :class="themeStore.isDark
                ? 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_2px_8px_rgba(94,106,210,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-[#6872D9] focus:ring-offset-[#050506]'
                : 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.4),0_2px_8px_rgba(94,106,210,0.2)] hover:bg-[#6872D9] focus:ring-offset-[#F8F8FC]'"
            >
              Daftar
            </RouterLink>
          </template>

          <!-- Authenticated: user dropdown -->
          <div v-else class="relative">
            <button
              type="button"
              class="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
              :class="themeStore.isDark
                ? 'border-[rgba(255,255,255,0.06)] bg-white/[0.04] text-[#EDEDEF] hover:border-[rgba(255,255,255,0.10)] hover:bg-white/[0.07] focus:ring-offset-[#050506]'
                : 'border-[rgba(0,0,0,0.07)] bg-black/[0.03] text-[#111118] hover:border-[rgba(0,0,0,0.12)] hover:bg-black/[0.06] focus:ring-offset-[#F8F8FC]'"
              :aria-expanded="showUserDropdown"
              aria-haspopup="true"
              @click="showUserDropdown = !showUserDropdown"
            >
              <!-- Avatar circle -->
              <span
                class="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
                :class="themeStore.isDark ? 'bg-[#5E6AD2]' : 'bg-[#5E6AD2]'"
                aria-hidden="true"
              >
                {{ authStore.user?.username?.charAt(0).toUpperCase() }}
              </span>
              <span>{{ authStore.user?.username }}</span>
              <!-- Notification badge -->
              <span
                v-if="notificationsStore.unreadCount > 0"
                class="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
              >
                {{ notificationsStore.unreadCount > 9 ? '9+' : notificationsStore.unreadCount }}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3.5 w-3.5 transition-transform duration-200"
                :class="[showUserDropdown ? 'rotate-180' : '', themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]']"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2.5"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Dropdown menu -->
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 translate-y-1 scale-[0.98]"
              enter-to-class="opacity-100 translate-y-0 scale-100"
              leave-active-class="transition-all duration-150 ease-in"
              leave-from-class="opacity-100 translate-y-0 scale-100"
              leave-to-class="opacity-0 translate-y-1 scale-[0.98]"
            >
              <div
                v-show="showUserDropdown"
                class="absolute right-0 mt-2 w-52 rounded-xl border py-1 shadow-[0_8px_40px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.06)]"
                :class="themeStore.isDark
                  ? 'border-[rgba(255,255,255,0.06)] bg-[#0a0a0c]'
                  : 'border-[rgba(0,0,0,0.07)] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.06)]'"
                role="menu"
              >
                <!-- Notifications -->
                <RouterLink
                  to="/notifications"
                  class="flex items-center gap-2.5 px-3 py-2 text-sm transition-colors duration-150 focus:outline-none"
                  :class="themeStore.isDark
                    ? 'text-[#8A8F98] hover:bg-white/[0.05] hover:text-[#EDEDEF]'
                    : 'text-[#6B7080] hover:bg-black/[0.04] hover:text-[#111118]'"
                  role="menuitem"
                  @click="showUserDropdown = false"
                >
                  <span class="relative flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span
                      v-if="notificationsStore.unreadCount > 0"
                      class="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white"
                    >
                      {{ notificationsStore.unreadCount > 9 ? '9+' : notificationsStore.unreadCount }}
                    </span>
                  </span>
                  Notifikasi
                </RouterLink>

                <!-- Library -->
                <RouterLink
                  to="/library"
                  class="flex items-center gap-2.5 px-3 py-2 text-sm transition-colors duration-150 focus:outline-none"
                  :class="themeStore.isDark
                    ? 'text-[#8A8F98] hover:bg-white/[0.05] hover:text-[#EDEDEF]'
                    : 'text-[#6B7080] hover:bg-black/[0.04] hover:text-[#111118]'"
                  role="menuitem"
                  @click="showUserDropdown = false"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                  Library
                </RouterLink>

                <!-- History -->
                <RouterLink
                  to="/history"
                  class="flex items-center gap-2.5 px-3 py-2 text-sm transition-colors duration-150 focus:outline-none"
                  :class="themeStore.isDark
                    ? 'text-[#8A8F98] hover:bg-white/[0.05] hover:text-[#EDEDEF]'
                    : 'text-[#6B7080] hover:bg-black/[0.04] hover:text-[#111118]'"
                  role="menuitem"
                  @click="showUserDropdown = false"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Riwayat
                </RouterLink>

                <!-- Profile -->
                <RouterLink
                  to="/profile"
                  class="flex items-center gap-2.5 px-3 py-2 text-sm transition-colors duration-150 focus:outline-none"
                  :class="themeStore.isDark
                    ? 'text-[#8A8F98] hover:bg-white/[0.05] hover:text-[#EDEDEF]'
                    : 'text-[#6B7080] hover:bg-black/[0.04] hover:text-[#111118]'"
                  role="menuitem"
                  @click="showUserDropdown = false"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profil
                </RouterLink>

                <div
                  class="my-1 border-t"
                  :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)]' : 'border-[rgba(0,0,0,0.06)]'"
                />

                <!-- Logout -->
                <button
                  type="button"
                  class="flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors duration-150 focus:outline-none"
                  :class="themeStore.isDark
                    ? 'text-red-400 hover:bg-red-500/[0.08] hover:text-red-300'
                    : 'text-red-500 hover:bg-red-50 hover:text-red-600'"
                  role="menuitem"
                  @click="handleLogout"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Keluar
                </button>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Mobile: hamburger -->
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2 md:hidden"
          :class="themeStore.isDark
            ? 'border-[rgba(255,255,255,0.06)] bg-white/[0.04] text-[#8A8F98] hover:border-[rgba(255,255,255,0.10)] hover:bg-white/[0.08] hover:text-[#EDEDEF] focus:ring-offset-[#050506]'
            : 'border-[rgba(0,0,0,0.07)] bg-black/[0.03] text-[#6B7080] hover:border-[rgba(0,0,0,0.12)] hover:bg-black/[0.06] hover:text-[#111118] focus:ring-offset-[#F8F8FC]'"
          :aria-expanded="showMobileDrawer"
          aria-label="Buka menu navigasi"
          @click="showMobileDrawer = true"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

      </div>
    </div>
  </nav>

  <!-- Mobile sidebar drawer -->
  <MobileSidebarDrawer :open="showMobileDrawer" @close="showMobileDrawer = false" />

  <!-- Backdrop to close dropdown -->
  <div
    v-if="showUserDropdown"
    class="fixed inset-0 z-20"
    aria-hidden="true"
    @click="showUserDropdown = false"
  />
</template>
