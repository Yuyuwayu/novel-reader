<script setup lang="ts">
// CommentSection: displays and manages comments for a chapter.
// Fetches comments on mount, allows authenticated users to post/delete.

import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchComments, postComment, deleteComment } from '@/api'
import { ApiError } from '@/api'
import type { Comment } from '@/types'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { formatRelativeTime } from '@/utils/formatRelativeTime'

interface Props {
  novelId: string
  chapterNumber: number
}

const props = defineProps<Props>()

const auth = useAuthStore()
const themeStore = useThemeStore()

const comments = ref<Comment[]>([])
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const newCommentText = ref('')
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)
const validationError = ref<string | null>(null)

async function loadComments(): Promise<void> {
  isLoading.value = true
  errorMessage.value = null
  try {
    comments.value = await fetchComments(props.novelId, props.chapterNumber)
  } catch (err) {
    if (err instanceof ApiError) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = 'Gagal memuat komentar. Silakan coba lagi.'
    }
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit(): Promise<void> {
  validationError.value = null
  submitError.value = null
  const text = newCommentText.value.trim()
  if (!text) {
    validationError.value = 'Komentar tidak boleh kosong.'
    return
  }
  isSubmitting.value = true
  try {
    const created = await postComment(props.novelId, props.chapterNumber, text)
    comments.value.unshift(created)
    newCommentText.value = ''
  } catch (err) {
    if (err instanceof ApiError) {
      submitError.value = err.message
    } else {
      submitError.value = 'Gagal mengirim komentar. Silakan coba lagi.'
    }
  } finally {
    isSubmitting.value = false
  }
}

async function handleDelete(commentId: string): Promise<void> {
  try {
    await deleteComment(props.novelId, props.chapterNumber, commentId)
    comments.value = comments.value.filter((c) => c.id !== commentId)
  } catch {
    // Silently ignore delete errors
  }
}

onMounted(() => { loadComments() })
</script>

<template>
  <section class="mt-10" aria-label="Komentar">
    <h3
      class="mb-5 text-base font-semibold tracking-tight"
      :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'"
    >Komentar</h3>

    <!-- Loading skeleton -->
    <div v-if="isLoading" class="space-y-2" aria-busy="true" aria-label="Memuat komentar...">
      <div
        v-for="n in 3"
        :key="n"
        class="rounded-xl border p-4"
        :class="themeStore.isDark ? 'border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-white/[0.07] to-white/[0.02]' : 'border-[rgba(0,0,0,0.07)] bg-white'"
      >
        <div class="flex items-center gap-3">
          <div class="h-8 w-8 animate-pulse rounded-full" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
          <div class="flex-1 space-y-2">
            <div class="h-3 w-1/4 animate-pulse rounded" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
            <div class="h-3 w-3/4 animate-pulse rounded" :class="themeStore.isDark ? 'bg-white/[0.06]' : 'bg-black/[0.05]'" />
          </div>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div
      v-else-if="errorMessage"
      class="flex flex-col items-center gap-3 rounded-2xl border p-6 text-center"
      :class="themeStore.isDark ? 'border-red-500/20 bg-red-500/10' : 'border-red-200 bg-red-50'"
    >
      <p class="text-sm" :class="themeStore.isDark ? 'text-red-400' : 'text-red-600'">{{ errorMessage }}</p>
      <button
        type="button"
        class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/50"
        @click="loadComments"
      >Coba Lagi</button>
    </div>

    <!-- Comment list + form -->
    <template v-else>
      <!-- Comment input (authenticated) -->
      <div v-if="auth.isAuthenticated" class="mb-6">
        <label
          for="comment-input"
          class="mb-1.5 block text-sm font-medium"
          :class="themeStore.isDark ? 'text-[#EDEDEF]' : 'text-[#111118]'"
        >Tulis komentar</label>
        <textarea
          id="comment-input"
          v-model="newCommentText"
          rows="3"
          placeholder="Tulis komentar kamu di sini..."
          class="w-full resize-none rounded-lg border px-3 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2"
          :class="themeStore.isDark
            ? 'border-[rgba(255,255,255,0.08)] bg-[#0F0F12] text-[#EDEDEF] placeholder-[#8A8F98] focus:border-[#5E6AD2] focus:ring-[#5E6AD2]/20'
            : 'border-[rgba(0,0,0,0.10)] bg-white text-[#111118] placeholder-[#9CA3AF] focus:border-[#5E6AD2] focus:ring-[#5E6AD2]/15'"
          :disabled="isSubmitting"
        />
        <p v-if="validationError" class="mt-1 text-xs text-red-400" role="alert">{{ validationError }}</p>
        <p v-if="submitError" class="mt-1 text-xs text-red-400" role="alert">{{ submitError }}</p>
        <div class="mt-2.5 flex justify-end">
          <button
            type="button"
            :disabled="isSubmitting"
            class="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
            :class="themeStore.isDark
              ? 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3)] hover:bg-[#6872D9] focus:ring-offset-[#050506]'
              : 'bg-[#5E6AD2] shadow-[0_0_0_1px_rgba(94,106,210,0.4),0_4px_12px_rgba(94,106,210,0.2)] hover:bg-[#6872D9] focus:ring-offset-[#F8F8FC]'"
            @click="handleSubmit"
          >
            {{ isSubmitting ? 'Mengirim...' : 'Kirim' }}
          </button>
        </div>
      </div>

      <!-- Login prompt (guest) -->
      <div
        v-else
        class="mb-6 rounded-xl border px-4 py-3 text-sm"
        :class="themeStore.isDark
          ? 'border-[rgba(255,255,255,0.06)] bg-white/[0.03] text-[#8A8F98]'
          : 'border-[rgba(0,0,0,0.07)] bg-black/[0.02] text-[#6B7080]'"
      >
        <RouterLink to="/login" class="font-medium text-[#5E6AD2] hover:text-[#6872D9] hover:underline focus:outline-none">Login</RouterLink>
        untuk berkomentar.
      </div>

      <!-- Empty state -->
      <div
        v-if="comments.length === 0"
        class="py-8 text-center font-mono text-xs"
        :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'"
      >
        Belum ada komentar. Jadilah yang pertama!
      </div>

      <!-- Comment list -->
      <ul v-else class="space-y-2">
        <li
          v-for="comment in comments"
          :key="comment.id"
          class="rounded-xl border p-4 transition-colors duration-150"
          :class="themeStore.isDark
            ? 'border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-white/[0.07] to-white/[0.02]'
            : 'border-[rgba(0,0,0,0.07)] bg-white'"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <RouterLink
                  :to="'/user/' + comment.username"
                  class="text-sm font-semibold transition-colors duration-150 focus:outline-none focus:underline"
                  :class="themeStore.isDark
                    ? 'text-[#EDEDEF] hover:text-[#5E6AD2]'
                    : 'text-[#111118] hover:text-[#5E6AD2]'"
                >{{ comment.username }}</RouterLink>
                <span
                  class="font-mono text-xs"
                  :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#9CA3AF]'"
                >{{ formatRelativeTime(comment.createdAt) }}</span>
              </div>
              <p
                class="mt-1.5 whitespace-pre-line text-sm"
                :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'"
              >{{ comment.text }}</p>
            </div>

            <!-- Delete button (own comments only) -->
            <button
              v-if="comment.userId === auth.user?.id"
              type="button"
              :aria-label="`Hapus komentar dari ${comment.username}`"
              class="flex-shrink-0 rounded-lg p-1.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/40"
              :class="themeStore.isDark
                ? 'text-[#8A8F98] hover:bg-red-500/10 hover:text-red-400'
                : 'text-[#9CA3AF] hover:bg-red-50 hover:text-red-500'"
              @click="handleDelete(comment.id)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </li>
      </ul>
    </template>
  </section>
</template>
