<script setup lang="ts">
// CoverUpload: file input with preview, validation, and upload for novel cover images.
// Validates MIME type (image/jpeg, image/png, image/webp) and max size (2 MB).
// Calls adminUploadCover(file) and emits the returned URL via update:modelValue.
// Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6

import { ref, onUnmounted } from 'vue'
import { adminUploadCover } from '@/api/index'

const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB

interface Props {
  modelValue: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', url: string): void
}>()

const previewUrl = ref<string | null>(props.modelValue ?? null)
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

// Track object URLs created so we can revoke them on unmount to avoid memory leaks
let currentObjectUrl: string | null = null

onUnmounted(() => {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl)
  }
})

function revokeCurrentObjectUrl(): void {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl)
    currentObjectUrl = null
  }
}

function validateFile(file: File): string | null {
  if (!ACCEPTED_MIME_TYPES.includes(file.type as typeof ACCEPTED_MIME_TYPES[number])) {
    return 'Format file tidak didukung. Gunakan JPEG, PNG, atau WebP.'
  }
  if (file.size > MAX_SIZE_BYTES) {
    return 'Ukuran file melebihi batas maksimal 2 MB.'
  }
  return null
}

async function handleFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  // Reset state
  errorMessage.value = null

  // Validate
  const validationError = validateFile(file)
  if (validationError) {
    errorMessage.value = validationError
    // Reset the input so the same file can be re-selected after fixing the error
    input.value = ''
    return
  }

  // Show preview immediately using object URL
  revokeCurrentObjectUrl()
  currentObjectUrl = URL.createObjectURL(file)
  previewUrl.value = currentObjectUrl

  // Upload
  isLoading.value = true
  try {
    const result = await adminUploadCover(file)
    emit('update:modelValue', result.url)
  } catch (err) {
    errorMessage.value =
      err instanceof Error ? err.message : 'Upload gagal. Silakan coba lagi.'
    // Revert preview to the original modelValue on failure
    revokeCurrentObjectUrl()
    previewUrl.value = props.modelValue ?? null
  } finally {
    isLoading.value = false
    // Reset input value so the same file can be re-selected if needed
    input.value = ''
  }
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <!-- Current / preview image -->
    <div
      v-if="previewUrl"
      class="relative w-full max-w-xs overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
    >
      <img
        :src="previewUrl"
        alt="Preview cover novel"
        class="h-48 w-full object-cover"
      />
      <!-- Loading overlay -->
      <div
        v-if="isLoading"
        class="absolute inset-0 flex items-center justify-center bg-black/40"
        aria-hidden="true"
      >
        <div
          class="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white"
        ></div>
      </div>
    </div>

    <!-- Placeholder when no image -->
    <div
      v-else
      class="flex h-48 w-full max-w-xs items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400"
    >
      <div class="flex flex-col items-center gap-2 text-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-10 w-10"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span>Belum ada cover</span>
      </div>
    </div>

    <!-- File input -->
    <label class="flex flex-col gap-1">
      <span class="text-sm font-medium text-gray-700">
        {{ previewUrl ? 'Ganti cover' : 'Pilih cover' }}
      </span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        :disabled="isLoading"
        class="block w-full max-w-xs cursor-pointer rounded-lg border border-gray-300 bg-white text-sm text-gray-500 file:mr-4 file:cursor-pointer file:rounded-l-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Upload cover novel"
        @change="handleFileChange"
      />
      <p class="text-xs text-gray-400">JPEG, PNG, atau WebP · Maks. 2 MB</p>
    </label>

    <!-- Loading status text -->
    <p
      v-if="isLoading"
      class="text-sm text-blue-600"
      role="status"
      aria-live="polite"
    >
      Mengunggah cover...
    </p>

    <!-- Error message -->
    <p
      v-if="errorMessage"
      class="text-sm text-red-600"
      role="alert"
      aria-live="assertive"
    >
      {{ errorMessage }}
    </p>
  </div>
</template>
