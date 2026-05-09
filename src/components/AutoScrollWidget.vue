<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { usePreferencesStore } from '@/stores/preferences'
import { useThemeStore } from '@/stores/theme'

const prefsStore = usePreferencesStore()
const themeStore = useThemeStore()

const isPlaying = ref(false)
let animationFrameId: number | null = null
let lastTime = 0

function startScroll() {
  if (isPlaying.value) return
  isPlaying.value = true
  lastTime = performance.now()
  animationFrameId = requestAnimationFrame(scrollStep)
}

function stopScroll() {
  if (!isPlaying.value) return
  isPlaying.value = false
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

function toggleScroll() {
  if (isPlaying.value) {
    stopScroll()
  } else {
    startScroll()
  }
}

function scrollStep(currentTime: number) {
  if (!isPlaying.value) return

  const deltaTime = currentTime - lastTime
  lastTime = currentTime

  // speed from 1 to 10
  // speed 1: ~15px per second
  // speed 10: ~150px per second
  const speedPref = prefsStore.preferences.autoScrollSpeed
  const pixelsPerSecond = speedPref * 15
  
  // Calculate how many pixels to scroll based on time elapsed since last frame
  const scrollAmount = (pixelsPerSecond * deltaTime) / 1000

  window.scrollBy({ top: scrollAmount, left: 0, behavior: 'auto' })

  // Check if reached bottom
  const scrollHeight = document.documentElement.scrollHeight
  const clientHeight = document.documentElement.clientHeight
  const scrollY = window.scrollY || window.pageYOffset

  // Allow a 2px margin for rounding errors
  if (Math.ceil(scrollY + clientHeight) >= scrollHeight - 2) {
    stopScroll()
    return
  }

  animationFrameId = requestAnimationFrame(scrollStep)
}

// Stop scrolling when user interacts (scrolls manually, touches screen)
function onUserInteraction(e: Event) {
  // If it's a wheel event, only stop if scrolling up, or just stop on any wheel event for simplicity
  if (isPlaying.value) {
    // Only stop if user actively scrolls (wheel) or touches the screen
    stopScroll()
  }
}

onMounted(() => {
  window.addEventListener('wheel', onUserInteraction, { passive: true })
  window.addEventListener('touchstart', onUserInteraction, { passive: true })
  window.addEventListener('mousedown', onUserInteraction, { passive: true })
})

onUnmounted(() => {
  stopScroll()
  window.removeEventListener('wheel', onUserInteraction)
  window.removeEventListener('touchstart', onUserInteraction)
  window.removeEventListener('mousedown', onUserInteraction)
})

// Stop scroll when leaving component
watch(() => isPlaying.value, (newVal) => {
  if (!newVal && animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
})
</script>

<template>
  <div class="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-2">
    <!-- Optional: show speed when playing -->
    <div
      v-if="isPlaying"
      class="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider text-white shadow-md backdrop-blur-md transition-all duration-300"
      :class="themeStore.isDark ? 'bg-black/50' : 'bg-gray-800/50'"
    >
      {{ prefsStore.preferences.autoScrollSpeed }}x
    </div>
    
    <button
      type="button"
      class="flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
      :class="[
        isPlaying
          ? 'bg-[#5E6AD2] text-white hover:bg-[#6872D9]'
          : themeStore.isDark
            ? 'bg-white/[0.08] text-[#EDEDEF] backdrop-blur-lg hover:bg-white/[0.12]'
            : 'bg-white text-[#111118] hover:bg-gray-50 border border-gray-200'
      ]"
      :aria-label="isPlaying ? 'Hentikan Auto-scroll' : 'Mulai Auto-scroll'"
      @click="toggleScroll"
    >
      <!-- Pause Icon -->
      <svg
        v-if="isPlaying"
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <!-- Play Icon -->
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6 ml-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
  </div>
</template>
