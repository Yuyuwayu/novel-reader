<script setup lang="ts">
// User profile page.
// Requirements: 9.2, 9.5

import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const auth = useAuthStore()
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
      <div class="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <span class="rounded-full border px-3 py-0.5 font-mono text-xs tracking-widest uppercase" :class="themeStore.isDark ? 'border-[rgba(94,106,210,0.30)] text-[#5E6AD2]' : 'border-[rgba(94,106,210,0.25)] text-[#5E6AD2]'">Akun</span>
        <h1 class="text-lg font-semibold tracking-tight" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">Profil</h1>
      </div>
    </header>

    <main class="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <!-- Profile card -->
      <div
        class="rounded-2xl border p-8"
        :class="themeStore.isDark
          ? 'border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-white/[0.07] to-white/[0.02] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_8px_40px_rgba(0,0,0,0.3)]'
          : 'border-[rgba(0,0,0,0.07)] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_8px_40px_rgba(0,0,0,0.08)]'"
      >
        <div class="flex flex-col items-center gap-5 text-center">
          <!-- Avatar -->
          <div
            class="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_16px_rgba(94,106,210,0.3)]"
            style="background: linear-gradient(135deg, #5E6AD2 0%, #6872D9 100%)"
            aria-hidden="true"
          >
            {{ auth.user?.username?.charAt(0).toUpperCase() ?? '?' }}
          </div>

          <div class="space-y-2">
            <p class="text-xl font-semibold tracking-tight" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">
              {{ auth.user?.username ?? '—' }}
            </p>
            <span
              class="inline-block rounded-full border px-3 py-1 font-mono text-xs tracking-widest uppercase"
              :class="themeStore.isDark
                ? 'border-[rgba(94,106,210,0.30)] bg-[rgba(94,106,210,0.10)] text-[#5E6AD2]'
                : 'border-[rgba(94,106,210,0.25)] bg-[rgba(94,106,210,0.07)] text-[#5E6AD2]'"
            >{{ auth.user?.role ?? 'user' }}</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
