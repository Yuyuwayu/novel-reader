<script setup lang="ts">
// Confirmation modal dialog for destructive actions.
// Requirements: 10.6, 11.6, 13.3

import { useThemeStore } from '@/stores/theme'

withDefaults(
  defineProps<{
    open: boolean
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
  }>(),
  { confirmLabel: 'Konfirmasi', cancelLabel: 'Batal' },
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()
const themeStore = useThemeStore()
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 backdrop-blur-sm"
          :class="themeStore.isDark ? 'bg-black/60' : 'bg-black/30'"
          aria-hidden="true"
          @click="emit('cancel')"
        />

        <!-- Dialog panel -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 scale-[0.97]"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-[0.97]"
        >
          <div
            v-if="open"
            class="relative z-10 w-full max-w-md rounded-2xl border shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
            :class="themeStore.isDark
              ? 'border-[rgba(255,255,255,0.06)] bg-[#0a0a0c]'
              : 'border-[rgba(0,0,0,0.07)] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.12)]'"
          >
            <!-- Header -->
            <div class="px-6 pt-6 pb-4">
              <h2
                id="confirm-dialog-title"
                class="text-lg font-semibold tracking-tight"
                :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'"
              >{{ title }}</h2>
            </div>

            <!-- Body -->
            <div class="px-6 pb-6">
              <p
                id="confirm-dialog-message"
                class="text-sm leading-relaxed"
                :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'"
              >{{ message }}</p>
            </div>

            <!-- Footer -->
            <div
              class="flex justify-end gap-3 border-t px-6 py-4"
              :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)]' : 'border-[rgba(0,0,0,0.06)]'"
            >
              <button
                type="button"
                class="rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
                :class="themeStore.isDark
                  ? 'border-[rgba(255,255,255,0.08)] bg-white/[0.04] text-[#EDEDEF] hover:bg-white/[0.07] focus:ring-offset-[#0a0a0c]'
                  : 'border-[rgba(0,0,0,0.08)] bg-black/[0.03] text-[#111118] hover:bg-black/[0.06] focus:ring-offset-white'"
                @click="emit('cancel')"
              >{{ cancelLabel }}</button>
              <button
                type="button"
                class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-red-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2"
                :class="themeStore.isDark ? 'focus:ring-offset-[#0a0a0c]' : 'focus:ring-offset-white'"
                @click="emit('confirm')"
              >{{ confirmLabel }}</button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
