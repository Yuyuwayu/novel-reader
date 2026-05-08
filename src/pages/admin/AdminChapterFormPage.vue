<script setup lang="ts">
// Admin chapter create/edit form page.
// Routes: /admin/novels/:novelId/chapters/new (create)
//         /admin/novels/:novelId/chapters/:chapterNumber/edit (edit)
// Requirements: 11.2, 11.3, 11.4, 11.5, 11.8, 11.9, 14.1, 14.2, 14.3, 14.4

import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { adminCreateChapter, adminUpdateChapter, fetchChapter } from '@/api'
import { useThemeStore } from '@/stores/theme'
import type { ChapterFormData } from '@/types'

const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()

// â”€â”€ Mode detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const novelId = computed(() => {
  const id = route.params.novelId
  return typeof id === 'string' && id.length > 0 ? id : ''
})

const chapterNumberParam = computed(() => {
  const num = route.params.chapterNumber
  if (typeof num === 'string' && num.length > 0) {
    const parsed = parseInt(num, 10)
    return isNaN(parsed) ? null : parsed
  }
  return null
})

const isEditMode = computed(() => chapterNumberParam.value !== null)
const pageTitle = computed(() => (isEditMode.value ? 'Edit Chapter' : 'Tambah Chapter'))

// â”€â”€ Form state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const form = ref<{ number: number | ''; title: string; content: string; scheduledAt: string }>({
  number: '',
  title: '',
  content: '',
  scheduledAt: '',
})

const isLoadingData = ref(false)
const isSubmitting = ref(false)
const loadError = ref<string | null>(null)
const submitError = ref<string | null>(null)

// â”€â”€ Validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const titleError = ref<string | null>(null)
const contentError = ref<string | null>(null)
const scheduledAtError = ref<string | null>(null)

function validateForm(): boolean {
  titleError.value = null
  contentError.value = null
  scheduledAtError.value = null

  let valid = true

  if (form.value.title.trim().length === 0) {
    titleError.value = 'Judul wajib diisi.'
    valid = false
  }

  if (form.value.content.trim().length === 0) {
    contentError.value = 'Konten wajib diisi.'
    valid = false
  }

  if (form.value.scheduledAt.trim().length > 0) {
    const scheduledDate = new Date(form.value.scheduledAt)
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      scheduledAtError.value = 'Tanggal rilis harus di masa depan.'
      valid = false
    }
  }

  return valid
}

// â”€â”€ Data loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function loadData(): Promise<void> {
  if (!isEditMode.value || chapterNumberParam.value === null) return

  isLoadingData.value = true
  loadError.value = null

  try {
    const chapter = await fetchChapter(novelId.value, chapterNumberParam.value)
    form.value.number = chapter.chapterNumber
    form.value.title = chapter.title
    form.value.content = chapter.content
    form.value.scheduledAt = ''
  } catch (err) {
    loadError.value =
      err instanceof Error ? err.message : 'Gagal memuat data chapter. Silakan coba lagi.'
  } finally {
    isLoadingData.value = false
  }
}

onMounted(loadData)

// â”€â”€ Submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function handleSubmit(): Promise<void> {
  if (!validateForm()) return

  isSubmitting.value = true
  submitError.value = null

  try {
    const scheduledAtValue = form.value.scheduledAt.trim().length > 0
      ? new Date(form.value.scheduledAt).toISOString()
      : null

    const payload: ChapterFormData = {
      number: typeof form.value.number === 'number' ? form.value.number : 0,
      title: form.value.title.trim(),
      content: form.value.content.trim(),
      scheduledAt: scheduledAtValue,
    }

    if (isEditMode.value && chapterNumberParam.value !== null) {
      await adminUpdateChapter(novelId.value, chapterNumberParam.value, payload)
    } else {
      await adminCreateChapter(novelId.value, payload)
    }

    await router.push(`/admin/novels/${novelId.value}/chapters`)
  } catch (err) {
    submitError.value =
      err instanceof Error ? err.message : 'Terjadi kesalahan. Silakan coba lagi.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="relative min-h-screen transition-colors duration-300" :class="themeStore.isDark ? 'bg-[#050506]' : 'bg-[#F8F8FC]'">
    <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div class="absolute inset-0" :class="themeStore.isDark ? 'bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)]' : 'bg-[radial-gradient(ellipse_at_top,#eeeef8_0%,#F8F8FC_50%,#ebebf2_100%)]'" />
      <div class="absolute -top-[80px] left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full blur-[120px] animate-[blob-float_10s_ease-in-out_infinite]" :class="themeStore.isDark ? 'bg-[rgba(94,106,210,0.15)]' : 'bg-[rgba(94,106,210,0.07)]'" />
    </div>

    <header class="sticky top-0 z-20 border-b backdrop-blur-xl" :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)] bg-[rgba(5,5,6,0.80)]' : 'border-[rgba(0,0,0,0.07)] bg-[rgba(248,248,252,0.80)]'">
      <div class="mx-auto max-w-3xl px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-3">
          <button type="button" class="rounded-lg p-1.5 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50" :class="themeStore.isDark ? 'text-[#8A8F98] hover:bg-white/[0.06] hover:text-[#EDEDEF]' : 'text-[#6B7080] hover:bg-black/[0.05] hover:text-[#111118]'" aria-label="Kembali ke daftar chapter" @click="router.push(`/admin/novels/${novelId}/chapters`)">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span class="rounded-full border px-3 py-0.5 font-mono text-xs tracking-widest uppercase" :class="themeStore.isDark ? 'border-[rgba(94,106,210,0.30)] text-[#5E6AD2]' : 'border-[rgba(94,106,210,0.25)] text-[#5E6AD2]'">Admin</span>
          <h1 class="text-lg font-semibold tracking-tight" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">{{ pageTitle }}</h1>
        </div>
      </div>
    </header>

    <main class="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <!-- Loading state -->
      <div v-if="isLoadingData" class="flex items-center justify-center py-16">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-t-[#5E6AD2]" :class="themeStore.isDark ? 'border-white/[0.08]' : 'border-black/[0.07]'" role="status" aria-label="Memuat data..." />
        <span class="ml-3 text-sm" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'">Memuat data...</span>
      </div>

      <!-- Load error -->
      <div v-else-if="loadError" class="rounded-2xl border p-4" :class="themeStore.isDark ? 'border-red-500/20 bg-red-500/10' : 'border-red-200 bg-red-50'" role="alert">
        <p class="text-sm" :class="themeStore.isDark ? 'text-red-400' : 'text-red-600'">{{ loadError }}</p>
        <button type="button" class="mt-2 text-sm font-medium underline" :class="themeStore.isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-800'" @click="loadData">Coba lagi</button>
      </div>

      <!-- Form -->
      <form v-else class="space-y-6" novalidate @submit.prevent="handleSubmit">
        <!-- Submit error -->
        <div v-if="submitError" class="rounded-2xl border p-4" :class="themeStore.isDark ? 'border-red-500/20 bg-red-500/10' : 'border-red-200 bg-red-50'" role="alert" aria-live="assertive">
          <p class="text-sm" :class="themeStore.isDark ? 'text-red-400' : 'text-red-600'">{{ submitError }}</p>
        </div>

        <!-- Form card -->
        <div class="rounded-2xl border p-6 space-y-5" :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-white/[0.07] to-white/[0.02]' : 'border-[rgba(0,0,0,0.07)] bg-white'">

          <!-- Nomor Chapter -->
          <div>
            <label for="chapter-number" class="mb-1.5 block text-sm font-medium" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">Nomor Chapter</label>
            <input id="chapter-number" v-model.number="form.number" type="number" min="1" :disabled="isSubmitting" class="w-full rounded-lg border px-3.5 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50" :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.08)] bg-[#0F0F12] text-[#EDEDEF] placeholder-[#8A8F98] focus:border-[#5E6AD2] focus:ring-[#5E6AD2]/20' : 'border-[rgba(0,0,0,0.10)] bg-white text-[#111118] placeholder-[#9CA3AF] focus:border-[#5E6AD2] focus:ring-[#5E6AD2]/15'" placeholder="Contoh: 1" />
          </div>

          <!-- Judul -->
          <div>
            <label for="chapter-title" class="mb-1.5 block text-sm font-medium" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">Judul <span class="text-red-400" aria-hidden="true">*</span></label>
            <input id="chapter-title" v-model="form.title" type="text" autocomplete="off" :disabled="isSubmitting" :aria-invalid="titleError !== null" :aria-describedby="titleError ? 'title-error' : undefined" class="w-full rounded-lg border px-3.5 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50" :class="[titleError ? 'border-red-500/40 focus:border-red-500 focus:ring-red-500/20' : themeStore.isDark ? 'border-[rgba(255,255,255,0.08)] bg-[#0F0F12] text-[#EDEDEF] placeholder-[#8A8F98] focus:border-[#5E6AD2] focus:ring-[#5E6AD2]/20' : 'border-[rgba(0,0,0,0.10)] bg-white text-[#111118] placeholder-[#9CA3AF] focus:border-[#5E6AD2] focus:ring-[#5E6AD2]/15']" placeholder="Masukkan judul chapter" />
            <p v-if="titleError" id="title-error" class="mt-1.5 text-xs text-red-400" role="alert">{{ titleError }}</p>
          </div>

          <!-- Konten -->
          <div>
            <label for="chapter-content" class="mb-1.5 block text-sm font-medium" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">Konten <span class="text-red-400" aria-hidden="true">*</span></label>
            <textarea id="chapter-content" v-model="form.content" rows="16" :disabled="isSubmitting" :aria-invalid="contentError !== null" :aria-describedby="contentError ? 'content-error' : undefined" class="w-full resize-y rounded-lg border px-3.5 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50" :class="[contentError ? 'border-red-500/40 focus:border-red-500 focus:ring-red-500/20' : themeStore.isDark ? 'border-[rgba(255,255,255,0.08)] bg-[#0F0F12] text-[#EDEDEF] placeholder-[#8A8F98] focus:border-[#5E6AD2] focus:ring-[#5E6AD2]/20' : 'border-[rgba(0,0,0,0.10)] bg-white text-[#111118] placeholder-[#9CA3AF] focus:border-[#5E6AD2] focus:ring-[#5E6AD2]/15']" placeholder="Masukkan konten chapter..." />
            <p v-if="contentError" id="content-error" class="mt-1.5 text-xs text-red-400" role="alert">{{ contentError }}</p>
          </div>

          <!-- Tanggal Rilis -->
          <div>
            <label for="chapter-scheduled-at" class="mb-1.5 block text-sm font-medium" :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'">
              Tanggal Rilis
              <span class="ml-1 font-normal" :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'">(opsional â€” kosongkan untuk rilis langsung)</span>
            </label>
            <input id="chapter-scheduled-at" v-model="form.scheduledAt" type="datetime-local" :disabled="isSubmitting" :aria-invalid="scheduledAtError !== null" :aria-describedby="scheduledAtError ? 'scheduled-at-error' : undefined" class="w-full rounded-lg border px-3.5 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50" :class="[scheduledAtError ? 'border-red-500/40 focus:border-red-500 focus:ring-red-500/20' : themeStore.isDark ? 'border-[rgba(255,255,255,0.08)] bg-[#0F0F12] text-[#EDEDEF] focus:border-[#5E6AD2] focus:ring-[#5E6AD2]/20' : 'border-[rgba(0,0,0,0.10)] bg-white text-[#111118] focus:border-[#5E6AD2] focus:ring-[#5E6AD2]/15']" />
            <p v-if="scheduledAtError" id="scheduled-at-error" class="mt-1.5 text-xs text-red-400" role="alert">{{ scheduledAtError }}</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 border-t pt-6" :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)]' : 'border-[rgba(0,0,0,0.06)]'">
          <button type="button" :disabled="isSubmitting" class="rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60" :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.08)] bg-white/[0.04] text-[#EDEDEF] hover:bg-white/[0.07] focus:ring-offset-[#050506]' : 'border-[rgba(0,0,0,0.08)] bg-black/[0.03] text-[#111118] hover:bg-black/[0.06] focus:ring-offset-[#F8F8FC]'" @click="router.push(`/admin/novels/${novelId}/chapters`)">Batal</button>
          <button type="submit" :disabled="isSubmitting" class="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2" :class="themeStore.isDark ? 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3)] hover:bg-[#6872D9] focus:ring-offset-[#050506]' : 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.4),0_4px_12px_rgba(94,106,210,0.2)] hover:bg-[#6872D9] focus:ring-offset-[#F8F8FC]'">
            <span v-if="isSubmitting" class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
            {{ isSubmitting ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Tambah Chapter') }}
          </button>
        </div>
      </form>
    </main>
  </div>
</template>