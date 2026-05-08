<script setup lang="ts">
// NotificationItem — displays a single chapter update notification row.
// Requirements: 22.3, 22.5

import type { Notification } from '@/types'
import { formatRelativeTime } from '@/utils/formatRelativeTime'
import { useThemeStore } from '@/stores/theme'

defineProps<{
  notification: Notification
}>()

const emit = defineEmits<{
  click: [notification: Notification]
}>()

const themeStore = useThemeStore()
</script>

<template>
  <div
    class="flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/40"
    :class="!notification.isRead
      ? themeStore.isDark
        ? 'border-[rgba(94,106,210,0.25)] bg-[rgba(94,106,210,0.08)] hover:border-[rgba(94,106,210,0.40)] hover:bg-[rgba(94,106,210,0.12)]'
        : 'border-[rgba(94,106,210,0.20)] bg-[rgba(94,106,210,0.06)] hover:border-[rgba(94,106,210,0.30)] hover:bg-[rgba(94,106,210,0.10)]'
      : themeStore.isDark
        ? 'border-[rgba(255,255,255,0.05)] bg-white/[0.03] hover:border-[rgba(255,255,255,0.08)] hover:bg-white/[0.06]'
        : 'border-[rgba(0,0,0,0.06)] bg-white hover:border-[rgba(0,0,0,0.10)] hover:bg-black/[0.02]'"
    role="button"
    :tabindex="0"
    @click="emit('click', notification)"
    @keydown.enter="emit('click', notification)"
  >
    <!-- Unread indicator dot -->
    <div class="mt-1.5 shrink-0">
      <span
        v-if="!notification.isRead"
        class="block h-2 w-2 rounded-full bg-[#5E6AD2]"
        aria-label="Belum dibaca"
      />
      <span v-else class="block h-2 w-2 rounded-full bg-transparent" aria-hidden="true" />
    </div>

    <!-- Content -->
    <div class="min-w-0 flex-1">
      <p
        class="truncate text-sm font-semibold"
        :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'"
      >{{ notification.novelTitle }}</p>
      <p
        class="truncate text-xs mt-0.5"
        :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'"
      >
        Chapter {{ notification.chapterNumber }}
        <span v-if="notification.chapterTitle"> — {{ notification.chapterTitle }}</span>
      </p>
    </div>

    <!-- Relative time -->
    <span
      class="shrink-0 font-mono text-xs"
      :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'"
    >
      {{ formatRelativeTime(notification.createdAt) }}
    </span>
  </div>
</template>
