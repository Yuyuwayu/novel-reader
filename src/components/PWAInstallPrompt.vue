<script setup lang="ts">
// PWA Install Prompt — displays install banner after 2 visits.
// Captures beforeinstallprompt event and provides Install/Dismiss buttons.
// Stores dismissal state in localStorage with 7-day cooldown.
// Hides permanently after successful installation.
// Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8

import { ref, onMounted, onUnmounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { isStorageAvailable } from '@/utils/storage'

const themeStore = useThemeStore()

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
const showBanner = ref(false)

/**
 * Handles the beforeinstallprompt event.
 * Stores the event for later use and shows the banner.
 */
function handleBeforeInstallPrompt(e: Event): void {
  // Prevent the default browser install prompt
  e.preventDefault()
  
  // Store the event for later use
  deferredPrompt.value = e as BeforeInstallPromptEvent
  showBanner.value = true
}

/**
 * Triggers the browser install prompt when user clicks "Install".
 * Saves pwa_installed flag to localStorage on successful installation.
 */
async function install(): Promise<void> {
  if (!deferredPrompt.value) return

  try {
    // Show the browser install prompt
    await deferredPrompt.value.prompt()

    // Wait for the user's response
    const { outcome } = await deferredPrompt.value.userChoice

    if (outcome === 'accepted') {
      // Save installation flag to localStorage
      if (isStorageAvailable()) {
        localStorage.setItem('pwa_installed', 'true')
      }
    }

    // Hide the banner regardless of outcome
    showBanner.value = false
    deferredPrompt.value = null
  } catch (error) {
    console.error('Failed to show install prompt:', error)
    showBanner.value = false
  }
}

/**
 * Dismisses the install banner and saves dismissal timestamp.
 * Banner won't show again for 7 days.
 */
function dismiss(): void {
  if (isStorageAvailable()) {
    localStorage.setItem('pwa_dismissed_at', String(Date.now()))
  }
  showBanner.value = false
  deferredPrompt.value = null
}

onMounted(() => {
  if (!isStorageAvailable()) return

  // Increment visit counter
  const visits = parseInt(localStorage.getItem('pwa_visits') || '0', 10)
  localStorage.setItem('pwa_visits', String(visits + 1))

  // Check if already installed
  const installed = localStorage.getItem('pwa_installed') === 'true'
  if (installed) return

  // Check if dismissed recently (within 7 days)
  const dismissedAt = localStorage.getItem('pwa_dismissed_at')
  if (dismissedAt) {
    const daysSinceDismissal = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24)
    if (daysSinceDismissal < 7) return
  }

  // Only show banner if visits >= 2
  if (visits + 1 >= 2) {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
})
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-4"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-300 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-4"
  >
    <div
      v-if="showBanner"
      class="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md md:bottom-6 md:left-6 md:right-auto"
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-description"
    >
      <div
        class="overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-sm transition-all duration-200"
        :class="themeStore.isDark
          ? 'border-[rgba(255,255,255,0.10)] bg-[#0A0A0C]/95 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_8px_40px_rgba(0,0,0,0.6)]'
          : 'border-[rgba(0,0,0,0.08)] bg-white/95 shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_8px_32px_rgba(0,0,0,0.12)]'"
      >
        <div class="p-4">
          <!-- Icon and Title -->
          <div class="mb-3 flex items-start gap-3">
            <!-- App Icon -->
            <div
              class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
              :class="themeStore.isDark ? 'bg-[#5E6AD2]/20' : 'bg-[#5E6AD2]/10'"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                :class="themeStore.isDark ? 'text-[#8A9AE8]' : 'text-[#5E6AD2]'"
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

            <div class="flex-1">
              <h3
                id="pwa-install-title"
                class="text-base font-semibold leading-snug tracking-tight"
                :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'"
              >
                Install Novel Reader
              </h3>
              <p
                id="pwa-install-description"
                class="mt-1 text-sm leading-relaxed"
                :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'"
              >
                Install Novel Reader untuk pengalaman lebih baik
              </p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2">
            <button
              type="button"
              class="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
              :class="themeStore.isDark
                ? 'bg-[#5E6AD2] text-white hover:bg-[#6872D9] focus:ring-offset-[#0A0A0C]'
                : 'bg-[#5E6AD2] text-white hover:bg-[#4E5AC2] focus:ring-offset-white'"
              @click="install"
            >
              Install
            </button>
            <button
              type="button"
              class="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
              :class="themeStore.isDark
                ? 'bg-white/[0.06] text-[#EDEDEF] hover:bg-white/[0.10] focus:ring-white/20 focus:ring-offset-[#0A0A0C]'
                : 'bg-black/[0.04] text-[#111118] hover:bg-black/[0.08] focus:ring-black/20 focus:ring-offset-white'"
              @click="dismiss"
            >
              Nanti
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
