<script setup lang="ts">
// Notifications page — lists chapter update notifications for followed novels.
// Requirements: 22.3, 22.5, 22.6

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationsStore } from '@/stores/notifications'
import NotificationItem from '@/components/NotificationItem.vue'
import { useSeoMeta } from '@/composables/useSeoMeta'
import { useThemeStore } from '@/stores/theme'
import type { Notification } from '@/types'

useSeoMeta('Notifikasi — Novel Reader', 'Daftar notifikasi update chapter dari novel yang kamu ikuti.')

const notificationsStore = useNotificationsStore()
const router = useRouter()
const themeStore = useThemeStore()

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const isMarkingAllRead = ref(false)

const sortedNotifications = computed<Notification[]>(() =>
  [...notificationsStore.notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  ),
)

async function loadNotifications(): Promise<void> {
  isLoading.value = true
  errorMessage.value = null
  try {
    await notificationsStore.loadNotifications()
  } catch {
    errorMessage.value = 'Gagal memuat notifikasi. Silakan coba lagi.'
  } finally {
    isLoading.value = false
  }
}

async function handleMarkAllRead(): Promise<void> {
  isMarkingAllRead.value = true
  try {
    await notificationsStore.markAllRead()
  } finally {
    isMarkingAllRead.value = false
  }
}

function handleNotificationClick(notification: Notification): void {
  router.push(`/novel/${notification.novelId}/chapter/${notification.chapterNumber}`)
}

onMounted(() => { loadNotifications() })
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
      <div class="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <h1 class="text-lg font-semibold tracking-tight" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">Notifikasi</h1>
        <button
          v-if="sortedNotifications.length > 0 && notificationsStore.unreadCount > 0"
          type="button"
          :disabled="isMarkingAllRead"
          class="rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/40 disabled:cursor-not-allowed disabled:opacity-50"
          :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.08)] bg-white/[0.04] text-[#EDEDEF] hover:bg-white/[0.08]' : 'border-[rgba(0,0,0,0.08)] bg-black/[0.03] text-[#111118] hover:bg-black/[0.06]'"
          @click="handleMarkAllRead"
        >
          <span v-if="isMarkingAllRead">Memproses…</span>
          <span v-else>Tandai Semua Dibaca</span>
        </button>
      </div>
    </header>

    <main class="relative z-10 mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">

      <!-- Loading skeleton -->
      <div v-if="isLoading" aria-busy="true" aria-label="Memuat notifikasi..." class="space-y-1.5">
        <div v-for="n in 5" :key="n" class="flex items-start gap-3 rounded-xl border p-4" :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-white/[0.07] to-white/[0.02]' : 'border-[rgba(0,0,0,0.07)] bg-white'">
          <div class="mt-1.5 h-2 w-2 shrink-0 animate-pulse rounded-full" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
          <div class="flex-1 space-y-2">
            <div class="h-4 w-3/4 animate-pulse rounded" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
            <div class="h-3 w-1/2 animate-pulse rounded" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
          </div>
          <div class="h-3 w-16 animate-pulse rounded" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="errorMessage" class="flex flex-col items-center gap-4 py-20 text-center">
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl border" :class="themeStore.isDark ? 'border-red-500/20 bg-red-500/10' : 'border-red-200 bg-red-50'">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p class="text-sm" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">{{ errorMessage }}</p>
        <button type="button" class="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#6872D9] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50" :class="themeStore.isDark ? 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3)]' : 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.4),0_4px_12px_rgba(94,106,210,0.2)]'" @click="loadNotifications">Coba Lagi</button>
      </div>

      <!-- Empty state -->
      <div v-else-if="sortedNotifications.length === 0" class="flex flex-col items-center gap-4 py-20 text-center">
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl border" :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-white/[0.07] to-white/[0.02]' : 'border-[rgba(0,0,0,0.07)] bg-white'">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <p class="text-sm" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">Belum ada notifikasi.</p>
      </div>

      <!-- Notification list -->
      <ul v-else class="space-y-1" aria-label="Daftar notifikasi">
        <li v-for="notification in sortedNotifications" :key="notification.id">
          <NotificationItem :notification="notification" @click="handleNotificationClick" />
        </li>
      </ul>

      <p v-if="sortedNotifications.length > 0" class="mt-6 text-center font-mono text-xs" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">
        {{ notificationsStore.unreadCount > 0 ? `${notificationsStore.unreadCount} belum dibaca` : 'Semua notifikasi sudah dibaca' }}
      </p>
    </main>
  </div>
</template>
