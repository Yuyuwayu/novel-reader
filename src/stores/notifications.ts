import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Notification } from '@/types'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])

  const unreadCount = computed(() =>
    notifications.value.filter((n) => !n.isRead).length
  )

  async function loadNotifications(): Promise<void> {
    try {
      const { fetchNotifications } = await import('@/api')
      notifications.value = await fetchNotifications()
    } catch {
      // silently fail — UI handles error state
    }
  }

  async function markAllRead(): Promise<void> {
    try {
      const { markAllNotificationsRead } = await import('@/api')
      await markAllNotificationsRead()
      notifications.value = notifications.value.map((n) => ({ ...n, isRead: true }))
    } catch {
      // silently fail
    }
  }

  return { notifications, unreadCount, loadNotifications, markAllRead }
})
