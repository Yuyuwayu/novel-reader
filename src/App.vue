<script setup lang="ts">
// Root component: renders AppNavbar once at the top and MobileBottomNav at the bottom.
// Requirements: 5.5, 11.1, 11.2, 21.1

import { onBeforeMount } from 'vue'
import { RouterView } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import AppNavbar from '@/components/AppNavbar.vue'
import MobileBottomNav from '@/components/MobileBottomNav.vue'
import PWAInstallPrompt from '@/components/PWAInstallPrompt.vue'

const themeStore = useThemeStore()

// Initialize theme before first render to prevent flash of unstyled content
onBeforeMount(() => {
  themeStore.initTheme()
})
</script>

<template>
  <!--
    Root wrapper — applies base background color globally.
    Individual pages layer their own ambient blobs on top of this.
  -->
  <div
    class="min-h-screen transition-colors duration-300"
    :class="themeStore.isDark ? 'bg-[#050506]' : 'bg-[#F8F8FC]'"
  >
    <AppNavbar />

    <!-- PWA Install Prompt -->
    <PWAInstallPrompt />

    <!-- Page content — pb-16 accounts for mobile bottom nav height -->
    <div class="pb-16 md:pb-0">
      <RouterView />
    </div>

    <MobileBottomNav />
  </div>
</template>
