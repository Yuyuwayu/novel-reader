<script setup lang="ts">
// Register page — username, email, password, confirmPassword form with client-side validation.
// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const router = useRouter()
const auth = useAuthStore()
const themeStore = useThemeStore()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMessage = ref('')

function validate(): string | null {
  if (!username.value.trim()) return 'Username wajib diisi.'
  if (!email.value.trim()) return 'Email wajib diisi.'
  if (!password.value) return 'Password wajib diisi.'
  if (password.value.length < 8) return 'Password minimal 8 karakter.'
  if (password.value !== confirmPassword.value) return 'Password dan konfirmasi password tidak cocok.'
  return null
}

async function handleSubmit() {
  errorMessage.value = ''

  const validationError = validate()
  if (validationError) {
    errorMessage.value = validationError
    return
  }

  loading.value = true
  try {
    await auth.register(username.value.trim(), email.value.trim(), password.value)
    await router.push('/login')
  } catch (err: unknown) {
    if (err instanceof Error) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = 'Registrasi gagal. Silakan coba lagi.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div
    class="relative flex min-h-screen items-center justify-center px-4 transition-colors duration-300"
    :class="themeStore.isDark ? 'bg-[#050506]' : 'bg-[#F8F8FC]'"
  >
    <!-- Ambient background -->
    <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div class="absolute inset-0" :class="themeStore.isDark ? 'bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)]' : 'bg-[radial-gradient(ellipse_at_top,#eeeef8_0%,#F8F8FC_50%,#ebebf2_100%)]'" />
      <div class="absolute -top-[100px] left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full blur-[130px] animate-[blob-float_10s_ease-in-out_infinite]" :class="themeStore.isDark ? 'bg-[rgba(94,106,210,0.20)]' : 'bg-[rgba(94,106,210,0.09)]'" />
    </div>

    <div class="relative z-10 w-full max-w-md py-12">
      <!-- Logo mark -->
      <div class="mb-8 flex flex-col items-center gap-3">
        <div
          class="flex h-12 w-12 items-center justify-center rounded-2xl border"
          :class="themeStore.isDark ? 'border-[rgba(94,106,210,0.30)] bg-[rgba(94,106,210,0.12)]' : 'border-[rgba(94,106,210,0.25)] bg-[rgba(94,106,210,0.08)]'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#5E6AD2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <span class="font-mono text-xs tracking-widest uppercase" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'">Novel Reader</span>
      </div>

      <!-- Card -->
      <div
        class="rounded-2xl border px-8 py-10"
        :class="themeStore.isDark
          ? 'border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-white/[0.07] to-white/[0.02] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_8px_40px_rgba(0,0,0,0.3)]'
          : 'border-[rgba(0,0,0,0.07)] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_8px_40px_rgba(0,0,0,0.08)]'"
      >
        <h1 class="mb-1.5 text-center text-2xl font-semibold tracking-tight" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">Buat Akun</h1>
        <p class="mb-8 text-center text-sm" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">
          Sudah punya akun?
          <RouterLink to="/login" class="font-medium text-[#5E6AD2] transition-colors hover:text-[#6872D9] focus:outline-none focus:underline">Masuk</RouterLink>
        </p>

        <!-- Error -->
        <div
          v-if="errorMessage"
          role="alert"
          class="mb-6 rounded-xl border px-4 py-3 text-sm"
          :class="themeStore.isDark ? 'border-red-500/20 bg-red-500/10 text-red-400' : 'border-red-200 bg-red-50 text-red-600'"
        >
          {{ errorMessage }}
        </div>

        <!-- Form -->
        <form class="space-y-5" novalidate @submit.prevent="handleSubmit">
          <div v-for="field in [
            { id: 'username', label: 'Username', model: 'username', type: 'text', autocomplete: 'username', placeholder: 'username_kamu' },
            { id: 'email', label: 'Email', model: 'email', type: 'email', autocomplete: 'email', placeholder: 'nama@email.com' },
            { id: 'password', label: 'Password', model: 'password', type: 'password', autocomplete: 'new-password', placeholder: 'Minimal 8 karakter' },
            { id: 'confirmPassword', label: 'Konfirmasi Password', model: 'confirmPassword', type: 'password', autocomplete: 'new-password', placeholder: 'Ulangi password' },
          ]" :key="field.id">
            <label :for="field.id" class="mb-1.5 block text-sm font-medium" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">{{ field.label }}</label>
            <input
              :id="field.id"
              v-model="field.id === 'username' ? username : field.id === 'email' ? email : field.id === 'password' ? password : confirmPassword"
              :type="field.type"
              :autocomplete="field.autocomplete"
              required
              :disabled="loading"
              :placeholder="field.placeholder"
              class="w-full rounded-lg border px-3.5 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
              :class="themeStore.isDark
                ? 'border-[rgba(255,255,255,0.08)] bg-[#0F0F12] text-[#EDEDEF] placeholder-[#8A8F98] focus:border-[#5E6AD2] focus:ring-[#5E6AD2]/20'
                : 'border-[rgba(0,0,0,0.10)] bg-white text-[#111118] placeholder-[#9CA3AF] focus:border-[#5E6AD2] focus:ring-[#5E6AD2]/15'"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
            :class="themeStore.isDark
              ? 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-[#6872D9] focus:ring-offset-[#050506]'
              : 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.4),0_4px_12px_rgba(94,106,210,0.2)] hover:bg-[#6872D9] focus:ring-offset-[#F8F8FC]'"
          >
            <svg v-if="loading" class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ loading ? 'Memproses...' : 'Daftar' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
