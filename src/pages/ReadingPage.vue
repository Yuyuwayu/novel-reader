<script setup lang="ts">
// Reading page: displays full chapter content with navigation, settings, bookmark toggle, and comments.
// Saves reading progress and server-side history on successful chapter load.
// Enhanced with: font family, line spacing, content width, keyboard navigation,
// read time estimate, scroll-to-top button, reading progress bar, and text highlights.
// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 6.1, 7.1, 7.2, 7.3, 9.2, 10.4, 15.4,
//               25.1, 25.2, 25.3, 25.4, 25.5, 25.6, 25.7, 25.8, 26.1, 26.2, 26.3, 26.4

import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useSeoMeta } from '@/composables/useSeoMeta'
import { fetchChapter, recordHistory, fetchHighlights, createHighlight, deleteHighlight, submitReport, fetchDefinition, translateChapter } from '@/api'
import { ApiError } from '@/api'
import type { ChapterContent, Highlight, Report } from '@/types'
import { useProgressStore } from '@/stores/progress'
import { useBookmarksStore } from '@/stores/bookmarks'
import { usePreferencesStore } from '@/stores/preferences'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { calculateReadingTime } from '@/utils/readingTime'
import { trackOfflineRead, trackOnlineRead } from '@/utils/offlineAnalytics'
import ChapterNavigation from '@/components/ChapterNavigation.vue'
import SettingsPanel from '@/components/SettingsPanel.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'
import CommentSection from '@/components/CommentSection.vue'
import ReadingProgressBar from '@/components/ReadingProgressBar.vue'
import AutoScrollWidget from '@/components/AutoScrollWidget.vue'

// ── Route & stores ────────────────────────────────────────────────────────────

const route = useRoute()
const router = useRouter()
const progressStore = useProgressStore()
const bookmarksStore = useBookmarksStore()
const preferencesStore = usePreferencesStore()
const authStore = useAuthStore()
const themeStore = useThemeStore()

// ── Route params ──────────────────────────────────────────────────────────────

const novelId = computed(() => route.params.novelId as string)
const chapterNumber = computed(() => Number(route.params.chapterNumber))

// ── State ─────────────────────────────────────────────────────────────────────

const chapter = ref<ChapterContent | null>(null)
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

// ── Chapter Translation (Req: Auto Translate) ─────────────────────────────────

const isTranslating = ref(false)
const translationError = ref<string | null>(null)

async function handleTranslateChapter(): Promise<void> {
  if (isTranslating.value || !chapter.value) return
  
  isTranslating.value = true
  translationError.value = null
  
  try {
    const translatedChapter = await translateChapter(novelId.value, chapterNumber.value)
    // Replace the current chapter content with the translated one
    chapter.value = translatedChapter
  } catch (err) {
    translationError.value = err instanceof Error ? err.message : 'Terjadi kesalahan saat menerjemahkan.'
  } finally {
    isTranslating.value = false
  }
}

// ── Reading progress bar (Req 25.5) ──────────────────────────────────────────

const scrollProgress = ref(0)

function onScroll(): void {
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
  if (scrollHeight <= 0) {
    scrollProgress.value = 100
    return
  }
  scrollProgress.value = (window.scrollY / scrollHeight) * 100
}

// ── Scroll-to-top button (Req 25.7) ──────────────────────────────────────────

const showScrollTop = ref(false)

function onScrollForButton(): void {
  showScrollTop.value = window.scrollY > 300
}

function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Combined scroll handler (passive for performance)
function handleScroll(): void {
  onScroll()
  onScrollForButton()
}

// ── SEO ───────────────────────────────────────────────────────────────────────

watch(chapter, (c) => {
  if (c) {
    useSeoMeta(`Chapter ${c.chapterNumber}: ${c.title} — Novel Reader`)
  }
})

// ── Preferences (reactive) ────────────────────────────────────────────────────

const theme = computed(() => preferencesStore.preferences.theme)
const fontSizePx = computed(() => preferencesStore.preferences.fontSizePx)
const fontFamily = computed(() => preferencesStore.preferences.fontFamily)
const lineSpacing = computed(() => preferencesStore.preferences.lineSpacing)
const contentWidth = computed(() => preferencesStore.preferences.contentWidth)

// ── Read time estimate (Req 25.6, 5.9) ───────────────────────────────────────

const readingTime = computed(() => {
  if (!chapter.value) return null
  return calculateReadingTime(chapter.value.content)
})

// ── Offline state (Req 7.6, 11.2) ────────────────────────────────────────────

const isOffline = ref(!navigator.onLine)

// ── Bookmark state ────────────────────────────────────────────────────────────

const isBookmarked = computed(() =>
  bookmarksStore.isBookmarked(novelId.value, chapterNumber.value)
)

function toggleBookmark(): void {
  if (isBookmarked.value) {
    bookmarksStore.remove(novelId.value, chapterNumber.value)
  } else if (chapter.value) {
    bookmarksStore.add({
      novelId: novelId.value,
      novelTitle: chapter.value.title,
      chapterNumber: chapterNumber.value,
      chapterTitle: chapter.value.title,
      createdAt: new Date().toISOString(),
    })
  }
}

// ── Keyboard navigation (Req 25.4) ────────────────────────────────────────────

function handleKeydown(event: KeyboardEvent): void {
  // Ignore when focus is inside an input/textarea to avoid interfering with typing
  const target = event.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    return
  }

  if (!chapter.value) return

  if (event.key === 'ArrowLeft' && chapterNumber.value > 1) {
    router.push(`/novel/${novelId.value}/chapter/${chapterNumber.value - 1}`)
  } else if (event.key === 'ArrowRight' && chapterNumber.value < chapter.value.totalChapters) {
    router.push(`/novel/${novelId.value}/chapter/${chapterNumber.value + 1}`)
  }
}

// ── Highlights (Req 26.1, 26.2) ───────────────────────────────────────────────

/** All highlights for the current chapter */
const highlights = ref<Highlight[]>([])

/** Ref to the chapter content container element */
const contentContainerRef = ref<HTMLElement | null>(null)

/** Color picker floating menu state */
const colorPickerVisible = ref(false)
const colorPickerX = ref(0)
const colorPickerY = ref(0)

/** The Range captured when user finishes a text selection */
let pendingRange: Range | null = null

/** Active highlight being viewed/edited (for note panel) */
const activeHighlight = ref<Highlight | null>(null)
const notePanelVisible = ref(false)
const noteEditText = ref('')

// ── Glossary / Dictionary (Tap-to-Define) ─────────────────────────────────────

const activeDefinition = ref<{ term: string; definition: string } | null>(null)
const definitionPanelVisible = ref(false)
const isDefining = ref(false)

async function lookupDefinition(): Promise<void> {
  if (!pendingRange) return

  const text = pendingRange.toString().trim()
  if (!text) return

  // Close color picker
  hideColorPicker()
  window.getSelection()?.removeAllRanges()

  isDefining.value = true
  definitionPanelVisible.value = true
  activeDefinition.value = null

  try {
    const result = await fetchDefinition(text)
    activeDefinition.value = result
  } catch (error) {
    activeDefinition.value = { term: text, definition: 'Gagal memuat definisi dari server.' }
  } finally {
    isDefining.value = false
  }
}

function closeDefinitionPanel(): void {
  definitionPanelVisible.value = false
  activeDefinition.value = null
}

/** Map color value to Tailwind background class for mark elements */
const COLOR_BG_MAP: Record<Highlight['color'], string> = {
  yellow: 'bg-yellow-200',
  green: 'bg-green-200',
  blue: 'bg-blue-200',
  pink: 'bg-pink-200',
}

/** Color options for the highlight picker */
const HIGHLIGHT_COLORS = [
  { value: 'yellow' as const, label: 'Kuning', bg: 'bg-yellow-200' },
  { value: 'green' as const, label: 'Hijau', bg: 'bg-green-200' },
  { value: 'blue' as const, label: 'Biru', bg: 'bg-blue-200' },
  { value: 'pink' as const, label: 'Pink', bg: 'bg-pink-200' },
]

async function loadHighlights(): Promise<void> {
  try {
    highlights.value = await fetchHighlights(novelId.value, chapterNumber.value)
    await nextTick()
    applyHighlightsToDOM()
  } catch {
    // Non-critical — fail silently
  }
}

/**
 * Applies all highlights to the chapter content DOM by wrapping text ranges in mark elements.
 * Uses character offsets relative to the content container's text content.
 */
function applyHighlightsToDOM(): void {
  const container = contentContainerRef.value
  if (!container) return

  // Remove any existing mark elements first (re-apply from scratch)
  container.querySelectorAll('mark[data-highlight-id]').forEach((el) => {
    const parent = el.parentNode
    if (parent) {
      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el)
      }
      parent.removeChild(el)
    }
  })

  // Normalize the container to merge adjacent text nodes after removal
  container.normalize()

  // Sort highlights by startOffset descending so we can apply them without offset drift
  const sorted = [...highlights.value].sort((a, b) => b.startOffset - a.startOffset)

  for (const highlight of sorted) {
    try {
      const range = getTextRange(container, highlight.startOffset, highlight.endOffset)
      if (!range) continue

      const mark = document.createElement('mark')
      mark.dataset.highlightId = highlight.id
      mark.className = `${COLOR_BG_MAP[highlight.color]} cursor-pointer rounded px-0.5 transition-opacity hover:opacity-80`
      mark.title = highlight.note || 'Klik untuk lihat catatan'
      mark.addEventListener('click', (e) => {
        e.stopPropagation()
        openNotePanel(highlight)
      })

      range.surroundContents(mark)
    } catch {
      // Range may be invalid if content changed — skip silently
    }
  }
}

/**
 * Creates a DOM Range from character offsets relative to a container element's text content.
 */
function getTextRange(container: HTMLElement, startOffset: number, endOffset: number): Range | null {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  let charCount = 0
  let startNode: Text | null = null
  let endNode: Text | null = null
  let startNodeOffset = 0
  let endNodeOffset = 0

  let node: Node | null
  while ((node = walker.nextNode())) {
    const textNode = node as Text
    const nodeLength = textNode.length

    if (startNode === null && charCount + nodeLength > startOffset) {
      startNode = textNode
      startNodeOffset = startOffset - charCount
    }

    if (endNode === null && charCount + nodeLength >= endOffset) {
      endNode = textNode
      endNodeOffset = endOffset - charCount
      break
    }

    charCount += nodeLength
  }

  if (!startNode || !endNode) return null

  const range = document.createRange()
  range.setStart(startNode, startNodeOffset)
  range.setEnd(endNode, endNodeOffset)
  return range
}

/**
 * Calculates the character offset of a node+offset position relative to a container.
 */
function getCharOffset(container: HTMLElement, node: Node, nodeOffset: number): number {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  let charCount = 0

  let current: Node | null
  while ((current = walker.nextNode())) {
    if (current === node) {
      return charCount + nodeOffset
    }
    charCount += (current as Text).length
  }

  return charCount
}

/** Handles mouseup on the content container to detect text selections */
function onContentMouseUp(event: MouseEvent): void {
  if (!authStore.isAuthenticated) return

  // Ignore clicks on existing mark elements (handled by openNotePanel)
  const target = event.target as HTMLElement
  if (target.closest('mark[data-highlight-id]')) return

  const selection = window.getSelection()
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return
  }

  const range = selection.getRangeAt(0)
  const container = contentContainerRef.value
  if (!container || !container.contains(range.commonAncestorContainer)) {
    return
  }

  // Store the range for use when a color is picked
  pendingRange = range.cloneRange()

  // Position the color picker near the selection end
  const rect = range.getBoundingClientRect()
  colorPickerX.value = rect.left + window.scrollX
  colorPickerY.value = rect.bottom + window.scrollY + 8
  colorPickerVisible.value = true
}

function hideColorPicker(): void {
  colorPickerVisible.value = false
  pendingRange = null
}

/** Called when user picks a highlight color from the floating menu */
async function pickColor(color: Highlight['color']): Promise<void> {
  if (!pendingRange || !contentContainerRef.value) {
    hideColorPicker()
    return
  }

  const container = contentContainerRef.value
  const startOffset = getCharOffset(container, pendingRange.startContainer, pendingRange.startOffset)
  const endOffset = getCharOffset(container, pendingRange.endContainer, pendingRange.endOffset)

  if (startOffset >= endOffset) {
    hideColorPicker()
    return
  }

  // Clear the browser selection
  window.getSelection()?.removeAllRanges()
  hideColorPicker()

  try {
    const newHighlight = await createHighlight({
      novelId: novelId.value,
      chapterNumber: chapterNumber.value,
      startOffset,
      endOffset,
      color,
      note: '',
    })
    highlights.value.push(newHighlight)
    await nextTick()
    applyHighlightsToDOM()
  } catch {
    // Non-critical — fail silently
  }
}

// ── Highlight note panel (Req 26.3, 26.4) ─────────────────────────────────────

function openNotePanel(highlight: Highlight): void {
  activeHighlight.value = highlight
  noteEditText.value = highlight.note
  notePanelVisible.value = true
}

function closeNotePanel(): void {
  notePanelVisible.value = false
  activeHighlight.value = null
  noteEditText.value = ''
}

/** Saves an updated note by deleting the old highlight and creating a new one with the note */
async function saveNote(): Promise<void> {
  if (!activeHighlight.value) return

  const old = activeHighlight.value
  const updatedNote = noteEditText.value

  try {
    await deleteHighlight(old.id)

    const updated = await createHighlight({
      novelId: old.novelId,
      chapterNumber: old.chapterNumber,
      startOffset: old.startOffset,
      endOffset: old.endOffset,
      color: old.color,
      note: updatedNote,
    })

    const idx = highlights.value.findIndex((h) => h.id === old.id)
    if (idx !== -1) {
      highlights.value[idx] = updated
    }

    await nextTick()
    applyHighlightsToDOM()
    closeNotePanel()
  } catch {
    closeNotePanel()
  }
}

/** Deletes a highlight entirely */
async function removeHighlight(highlight: Highlight): Promise<void> {
  try {
    await deleteHighlight(highlight.id)
    highlights.value = highlights.value.filter((h) => h.id !== highlight.id)
    await nextTick()
    applyHighlightsToDOM()
    closeNotePanel()
  } catch {
    closeNotePanel()
  }
}

// ── Report Chapter (Req 29.1, 29.2, 29.3) ────────────────────────────────────

const REPORT_TYPES: Array<{ value: Report['type']; label: string }> = [
  { value: 'wrong_translation', label: 'Terjemahan Salah' },
  { value: 'missing_content', label: 'Konten Hilang' },
  { value: 'duplicate', label: 'Chapter Duplikat' },
  { value: 'inappropriate', label: 'Konten Tidak Sesuai' },
  { value: 'other', label: 'Lainnya' },
]

const reportModalVisible = ref(false)
const reportType = ref<Report['type']>('wrong_translation')
const reportDescription = ref('')
const reportSubmitting = ref(false)
const reportToast = ref<string | null>(null)
let reportToastTimer: ReturnType<typeof setTimeout> | null = null

function openReportModal(): void {
  reportType.value = 'wrong_translation'
  reportDescription.value = ''
  reportModalVisible.value = true
}

function closeReportModal(): void {
  reportModalVisible.value = false
}

function showReportToast(message: string): void {
  reportToast.value = message
  if (reportToastTimer) clearTimeout(reportToastTimer)
  reportToastTimer = setTimeout(() => {
    reportToast.value = null
  }, 3500)
}

async function submitChapterReport(): Promise<void> {
  if (!chapter.value) return

  reportSubmitting.value = true
  try {
    await submitReport({
      novelId: novelId.value,
      chapterNumber: chapterNumber.value,
      type: reportType.value,
      description: reportDescription.value.trim(),
    })
    closeReportModal()
    showReportToast('Laporan berhasil dikirim. Terima kasih!')
  } catch {
    showReportToast('Gagal mengirim laporan. Silakan coba lagi.')
  } finally {
    reportSubmitting.value = false
  }
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function loadChapter(): Promise<void> {
  isLoading.value = true
  errorMessage.value = null
  chapter.value = null
  // Reset scroll progress when loading a new chapter
  scrollProgress.value = 0
  showScrollTop.value = false
  // Clear highlights when navigating to a new chapter
  highlights.value = []
  hideColorPicker()
  closeNotePanel()

  try {
    const data = await fetchChapter(novelId.value, chapterNumber.value)
    chapter.value = data

    // Save reading progress on successful load (Requirement 5.1)
    progressStore.save({
      novelId: novelId.value,
      lastChapter: chapterNumber.value,
      updatedAt: new Date().toISOString(),
    })

    // Record server-side history (fire-and-forget, authenticated only)
    if (authStore.isAuthenticated) {
      recordHistory(novelId.value, chapterNumber.value).catch(() => {
        // Intentionally ignored — history recording is non-critical
      })
    }

    // Load highlights for this chapter (auth only, non-critical)
    if (authStore.isAuthenticated) {
      loadHighlights()
    }

    // Track offline/online analytics (Req 11.1, 11.2, 11.3)
    if (navigator.onLine) {
      trackOnlineRead()
    } else {
      trackOfflineRead(novelId.value)
    }
  } catch (err) {
    if (err instanceof ApiError) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = 'Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.'
    }
  } finally {
    isLoading.value = false
  }
}

// ── Lifecycle & watchers ──────────────────────────────────────────────────────

onMounted(() => {
  loadChapter()
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('keydown', handleKeydown)
  document.addEventListener('mousedown', onDocumentMouseDown)
  
  // Listen to online/offline events (Req 7.6, 11.2)
  window.addEventListener('online', () => { isOffline.value = false })
  window.addEventListener('offline', () => { isOffline.value = true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('mousedown', onDocumentMouseDown)
  window.removeEventListener('online', () => { isOffline.value = false })
  window.removeEventListener('offline', () => { isOffline.value = true })
})

function onDocumentMouseDown(event: MouseEvent): void {
  // Close color picker if click is outside the picker element
  const picker = document.getElementById('highlight-color-picker')
  if (picker && !picker.contains(event.target as Node)) {
    hideColorPicker()
  }
}

// Re-fetch when route params change (navigating between chapters)
watch(
  () => [route.params.novelId, route.params.chapterNumber],
  () => {
    loadChapter()
    // Scroll to top when navigating to a new chapter
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
)
</script>

<template>
  <!-- Reading progress bar fixed at the very top (Req 25.5) -->
  <ReadingProgressBar :progress="scrollProgress" />

  <!-- Apply theme class to the outermost container -->
  <div
    class="min-h-screen transition-colors"
    :class="theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'"
  >
    <!-- Top bar (page-level, below global nav) -->
    <header
      class="sticky top-14 z-10 border-b backdrop-blur-xl transition-colors duration-300"
      :class="themeStore.isDark
        ? 'border-[rgba(255,255,255,0.06)] bg-[rgba(5,5,6,0.85)]'
        : 'border-[rgba(0,0,0,0.07)] bg-[rgba(248,248,252,0.85)]'"
    >
      <div class="mx-auto max-w-5xl px-4 py-3 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between gap-4">
          <!-- Back link -->
          <RouterLink
            :to="`/novel/${novelId}`"
            class="inline-flex items-center gap-1.5 rounded-lg text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
            :class="themeStore.isDark
              ? 'text-[#8A8F98] hover:text-[#EDEDEF] focus:ring-offset-[#050506]'
              : 'text-[#6B7080] hover:text-[#111118] focus:ring-offset-[#F8F8FC]'"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Detail Novel
          </RouterLink>

          <!-- Chapter title (truncated) -->
          <h1
            v-if="chapter"
            class="hidden flex-1 truncate text-center text-sm font-medium sm:block"
            :class="themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]'"
          >
            Chapter {{ chapter.chapterNumber }}: {{ chapter.title }}
          </h1>

          <!-- Right actions: bookmark + settings -->
          <div class="flex items-center gap-2">
            <!-- Bookmark toggle -->
            <button
              v-if="chapter"
              type="button"
              :aria-pressed="isBookmarked"
              :aria-label="isBookmarked ? 'Hapus bookmark' : 'Tambah bookmark'"
              class="rounded-lg border p-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
              :class="[
                isBookmarked
                  ? 'border-amber-400/40 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20'
                  : themeStore.isDark
                    ? 'border-[rgba(255,255,255,0.08)] bg-white/[0.04] text-[#8A8F98] hover:bg-white/[0.08] hover:text-[#EDEDEF] focus:ring-offset-[#050506]'
                    : 'border-[rgba(0,0,0,0.08)] bg-black/[0.03] text-[#6B7080] hover:bg-black/[0.06] hover:text-[#111118] focus:ring-offset-[#F8F8FC]',
              ]"
              @click="toggleBookmark"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                :fill="isBookmarked ? 'currentColor' : 'none'"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>

            <!-- Translate Chapter button -->
            <button
              v-if="chapter && !isLoading"
              type="button"
              :disabled="isTranslating"
              aria-label="Terjemahkan bab ini"
              class="rounded-lg border p-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2"
              :class="themeStore.isDark
                ? 'border-[rgba(255,255,255,0.08)] bg-white/[0.04] text-[#8A8F98] hover:bg-white/[0.08] hover:text-[#EDEDEF] focus:ring-offset-[#050506]'
                : 'border-[rgba(0,0,0,0.08)] bg-black/[0.03] text-[#6B7080] hover:bg-black/[0.06] hover:text-[#111118] focus:ring-offset-[#F8F8FC]'
              "
              @click="handleTranslateChapter"
            >
              <svg 
                v-if="!isTranslating"
                xmlns="http://www.w3.org/2000/svg" 
                class="h-5 w-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <svg
                v-else
                class="h-5 w-5 animate-spin text-[#5E6AD2]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </button>

            <!-- Settings panel -->
            <SettingsPanel />
          </div>
        </div>
      </div>
    </header>

    <!-- Main content — width controlled by contentWidth preference (Req 25.3) -->
    <main
      class="mx-auto px-4 py-8 sm:px-6"
      :style="{ maxWidth: `${contentWidth}px` }"
    >

      <!-- Skeleton loading state -->
      <div v-if="isLoading" aria-busy="true" aria-label="Memuat chapter...">
        <div class="mb-6 animate-pulse">
          <div class="mb-3 h-6 w-2/3 rounded-lg" :class="themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'" />
          <div class="space-y-3">
            <div
              v-for="n in 12"
              :key="n"
              class="h-4 rounded"
              :class="[n % 5 === 0 ? 'w-3/4' : 'w-full', themeStore.isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]']"
            />
          </div>
        </div>
      </div>

      <!-- Error state -->
      <ErrorMessage
        v-else-if="errorMessage"
        :message="errorMessage"
        :retryable="true"
        @retry="loadChapter"
      />

      <!-- Chapter content -->
      <template v-else-if="chapter">
        <!-- Chapter heading -->
        <h2
          class="mb-2 text-xl font-bold sm:text-2xl"
          :class="theme === 'dark' ? 'text-gray-100' : 'text-gray-900'"
        >
          Chapter {{ chapter.chapterNumber }}: {{ chapter.title }}
        </h2>

        <!-- Read time estimate (Req 25.6, 5.9) and offline badge (Req 7.6, 11.2) -->
        <div class="mb-6 flex items-center gap-3">
          <p
            v-if="readingTime"
            class="text-sm"
            :class="theme === 'dark' ? 'text-gray-400' : 'text-gray-500'"
          >
            Estimasi waktu baca: {{ readingTime.wordCount > 0 && (readingTime.wordCount / (readingTime.language === 'en' ? 250 : 200)) < 1 ? '< 1 menit' : `${readingTime.minutes} menit` }}
          </p>
          
          <!-- Offline badge (Req 7.6) -->
          <span
            v-if="isOffline"
            class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"
            :class="theme === 'dark'
              ? 'border-amber-400/40 bg-amber-400/10 text-amber-400'
              : 'border-amber-500/40 bg-amber-50 text-amber-700'"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
            Dibaca Offline
          </span>
        </div>

        <!-- Chapter body — font family and line spacing applied here (Req 25.1, 25.2) -->
        <!-- mouseup handler detects text selections for highlight creation (Req 26.1) -->
        <div
          ref="contentContainerRef"
          class="prose max-w-none"
          :class="[
            fontFamily,
            lineSpacing,
            theme === 'dark' ? 'text-gray-200' : 'text-gray-800',
          ]"
          :style="{ fontSize: `${fontSizePx}px` }"
          @mouseup="onContentMouseUp"
        >
          <!-- Render content preserving line breaks -->
          <p
            v-for="(paragraph, idx) in chapter.content.split('\n\n').filter(Boolean)"
            :key="idx"
            class="mb-4 whitespace-pre-line"
          >
            {{ paragraph }}
          </p>
        </div>

        <!-- Bottom navigation -->
        <div
          class="mt-10 border-t pt-6"
          :class="theme === 'dark' ? 'border-gray-700' : 'border-gray-200'"
        >
          <!-- Report button (Req 29.1) — only shown to authenticated users -->
          <div v-if="authStore.isAuthenticated" class="mb-4 flex justify-end">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:ring-offset-2"
              :class="themeStore.isDark
                ? 'border-[rgba(255,255,255,0.06)] text-[#8A8F98] hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 focus:ring-offset-[#050506]'
                : 'border-[rgba(0,0,0,0.07)] text-[#6B7080] hover:border-red-400/30 hover:bg-red-50 hover:text-red-500 focus:ring-offset-[#F8F8FC]'"
              @click="openReportModal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Laporkan Masalah
            </button>
          </div>

          <ChapterNavigation
            :novel-id="novelId"
            :current-chapter="chapter.chapterNumber"
            :total-chapters="chapter.totalChapters"
          />
        </div>

        <!-- Comment section -->
        <CommentSection
          :novel-id="novelId"
          :chapter-number="chapter.chapterNumber"
        />
        <!-- Definition Panel (Tap-to-Define) -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-transform duration-200"
        enter-from-class="translate-x-full"
        leave-active-class="transition-transform duration-200"
        leave-to-class="translate-x-full"
      >
        <div
          v-if="definitionPanelVisible"
          class="fixed right-0 top-14 z-50 flex h-[calc(100vh-3.5rem)] w-80 flex-col border-l shadow-xl"
          :class="theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'"
          role="dialog"
          aria-label="Glosarium Novel"
        >
          <!-- Panel header -->
          <div
            class="flex items-center justify-between border-b px-4 py-3"
            :class="theme === 'dark' ? 'border-gray-700' : 'border-gray-200'"
          >
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#5E6AD2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477-4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h2
                class="text-sm font-semibold"
                :class="theme === 'dark' ? 'text-gray-100' : 'text-gray-900'"
              >
                Glosarium & Penjelasan
              </h2>
            </div>
            <button
              type="button"
              aria-label="Tutup glosarium"
              class="rounded p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50"
              :class="theme === 'dark' ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-100' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'"
              @click="closeDefinitionPanel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Panel content -->
          <div class="flex-1 overflow-y-auto p-4">
            <div v-if="isDefining" class="flex items-center justify-center py-10">
              <svg class="h-8 w-8 animate-spin text-[#5E6AD2]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div v-else-if="activeDefinition">
              <h3 class="mb-3 text-lg font-bold text-[#5E6AD2]">{{ activeDefinition.term }}</h3>
              <p class="leading-relaxed" :class="theme === 'dark' ? 'text-gray-300' : 'text-gray-700'">
                {{ activeDefinition.definition }}
              </p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </template>
    </main>

    <!-- Report Chapter modal (Req 29.1, 29.2, 29.3) -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-200"
        leave-to-class="opacity-0"
      >
        <div
          v-if="reportModalVisible"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
        >
          <!-- Backdrop -->
          <div
            class="absolute inset-0 bg-black/50"
            @click="closeReportModal"
          />

          <!-- Modal panel -->
          <div
            class="relative w-full max-w-md rounded-xl shadow-xl"
            :class="theme === 'dark' ? 'bg-gray-800' : 'bg-white'"
          >
            <!-- Header -->
            <div
              class="flex items-center justify-between border-b px-5 py-4"
              :class="theme === 'dark' ? 'border-gray-700' : 'border-gray-200'"
            >
              <h2
                id="report-modal-title"
                class="text-base font-semibold"
                :class="theme === 'dark' ? 'text-gray-100' : 'text-gray-900'"
              >
                Laporkan Masalah Chapter
              </h2>
              <button
                type="button"
                aria-label="Tutup modal laporan"
                class="rounded p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="theme === 'dark' ? 'text-gray-400 hover:text-gray-100' : 'text-gray-500 hover:text-gray-900'"
                @click="closeReportModal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Body -->
            <div class="px-5 py-4 space-y-4">
              <!-- Report type dropdown -->
              <div>
                <label
                  for="report-type-select"
                  class="mb-1.5 block text-sm font-medium"
                  :class="theme === 'dark' ? 'text-gray-300' : 'text-gray-700'"
                >
                  Jenis Masalah <span class="text-red-500" aria-hidden="true">*</span>
                </label>
                <select
                  id="report-type-select"
                  v-model="reportType"
                  class="w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :class="
                    theme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-gray-100'
                      : 'border-gray-300 bg-white text-gray-900'
                  "
                >
                  <option
                    v-for="opt in REPORT_TYPES"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </option>
                </select>
              </div>

              <!-- Description textarea -->
              <div>
                <label
                  for="report-description-input"
                  class="mb-1.5 block text-sm font-medium"
                  :class="theme === 'dark' ? 'text-gray-300' : 'text-gray-700'"
                >
                  Deskripsi
                  <span
                    class="ml-1 font-normal"
                    :class="theme === 'dark' ? 'text-gray-500' : 'text-gray-400'"
                  >(opsional, maks 500 karakter)</span>
                </label>
                <textarea
                  id="report-description-input"
                  v-model="reportDescription"
                  rows="4"
                  maxlength="500"
                  placeholder="Jelaskan masalah yang Anda temukan..."
                  class="w-full resize-none rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :class="
                    theme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-500'
                      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                  "
                />
                <p
                  class="mt-1 text-right text-xs"
                  :class="theme === 'dark' ? 'text-gray-500' : 'text-gray-400'"
                >
                  {{ reportDescription.length }}/500
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div
              class="flex items-center justify-end gap-3 border-t px-5 py-4"
              :class="theme === 'dark' ? 'border-gray-700' : 'border-gray-200'"
            >
              <button
                type="button"
                class="rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                :class="
                  theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-600 hover:bg-gray-100'
                "
                :disabled="reportSubmitting"
                @click="closeReportModal"
              >
                Batal
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="reportSubmitting"
                @click="submitChapterReport"
              >
                <svg
                  v-if="reportSubmitting"
                  class="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {{ reportSubmitting ? 'Mengirim...' : 'Kirim Laporan' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Report toast notification -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-all duration-300"
        enter-from-class="opacity-0 translate-y-2"
        leave-active-class="transition-all duration-300"
        leave-to-class="opacity-0 translate-y-2"
      >
        <div
          v-if="reportToast"
          class="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg md:bottom-8"
          :class="
            theme === 'dark'
              ? 'bg-gray-700 text-gray-100'
              : 'bg-gray-900 text-white'
          "
          role="status"
          aria-live="polite"
        >
          {{ reportToast }}
        </div>
      </Transition>
    </Teleport>

    <!-- Floating highlight color picker (Req 26.1) -->
    <!-- Appears above the text selection when user selects text while authenticated -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-150"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-150"
        leave-to-class="opacity-0"
      >
        <div
          v-if="colorPickerVisible"
          id="highlight-color-picker"
          role="menu"
          aria-label="Pilih warna highlight"
          class="absolute z-50 flex items-center gap-1.5 rounded-lg border px-3 py-2 shadow-lg"
          :class="theme === 'dark' ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'"
          :style="{ left: `${colorPickerX}px`, top: `${colorPickerY}px` }"
        >
          <span
            class="mr-1 text-xs font-medium"
            :class="theme === 'dark' ? 'text-gray-400' : 'text-gray-500'"
          >
            Highlight:
          </span>
          <button
            v-for="colorOption in HIGHLIGHT_COLORS"
            :key="colorOption.value"
            type="button"
            :aria-label="`Highlight ${colorOption.label}`"
            class="h-6 w-6 rounded-full border-2 border-transparent transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1"
            :class="[colorOption.bg, `focus:ring-${colorOption.value}-400`]"
            @click="pickColor(colorOption.value)"
          />
          <div class="mx-1 h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
          <!-- Glossary / Dictionary lookup button -->
          <button
            type="button"
            aria-label="Cari arti glosarium"
            class="flex h-7 items-center gap-1 rounded px-2 text-xs font-medium transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 dark:hover:bg-gray-700"
            :class="theme === 'dark' ? 'text-gray-300' : 'text-gray-600'"
            @click="lookupDefinition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>Arti</span>
          </button>
        </div>
      </Transition>
    </Teleport>

    <!-- Highlight note panel (Req 26.3, 26.4) -->
    <!-- Slide-in panel from the right showing note for the clicked highlight -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-transform duration-200"
        enter-from-class="translate-x-full"
        leave-active-class="transition-transform duration-200"
        leave-to-class="translate-x-full"
      >
        <div
          v-if="notePanelVisible && activeHighlight"
          class="fixed right-0 top-14 z-50 flex h-[calc(100vh-3.5rem)] w-80 flex-col border-l shadow-xl"
          :class="theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'"
          role="dialog"
          aria-label="Catatan highlight"
        >
          <!-- Panel header -->
          <div
            class="flex items-center justify-between border-b px-4 py-3"
            :class="theme === 'dark' ? 'border-gray-700' : 'border-gray-200'"
          >
            <div class="flex items-center gap-2">
              <!-- Color indicator -->
              <span
                class="h-4 w-4 rounded-full"
                :class="COLOR_BG_MAP[activeHighlight.color]"
                aria-hidden="true"
              />
              <h3
                class="text-sm font-semibold"
                :class="theme === 'dark' ? 'text-gray-100' : 'text-gray-900'"
              >
                Catatan Highlight
              </h3>
            </div>
            <button
              type="button"
              aria-label="Tutup panel catatan"
              class="rounded p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="theme === 'dark' ? 'text-gray-400 hover:text-gray-100' : 'text-gray-500 hover:text-gray-900'"
              @click="closeNotePanel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Note textarea -->
          <div class="flex-1 overflow-y-auto p-4">
            <label
              for="highlight-note-input"
              class="mb-1.5 block text-xs font-medium"
              :class="theme === 'dark' ? 'text-gray-400' : 'text-gray-500'"
            >
              Catatan (opsional)
            </label>
            <textarea
              id="highlight-note-input"
              v-model="noteEditText"
              rows="6"
              placeholder="Tambahkan catatan untuk highlight ini..."
              class="w-full resize-none rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="
                theme === 'dark'
                  ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-500'
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
              "
            />
          </div>

          <!-- Panel actions -->
          <div
            class="flex items-center justify-between border-t px-4 py-3"
            :class="theme === 'dark' ? 'border-gray-700' : 'border-gray-200'"
          >
            <!-- Delete highlight -->
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:hover:bg-red-900/20"
              @click="removeHighlight(activeHighlight)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Hapus
            </button>

            <!-- Save note -->
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              @click="saveNote"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Simpan
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Scroll-to-top button (Req 25.7) — appears after scrolling 300px -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-200"
      leave-to-class="opacity-0"
    >
      <button
        v-if="showScrollTop"
        type="button"
        aria-label="Kembali ke atas"
        class="fixed bottom-20 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2 md:bottom-6 md:right-6"
        :class="themeStore.isDark
          ? 'border-[rgba(255,255,255,0.08)] bg-white/[0.06] text-[#8A8F98] hover:bg-white/[0.10] hover:text-[#EDEDEF] focus:ring-offset-[#050506]'
          : 'border-[rgba(0,0,0,0.08)] bg-white text-[#6B7080] hover:bg-black/[0.04] hover:text-[#111118] focus:ring-offset-[#F8F8FC]'"
        @click="scrollToTop"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </Transition>

    <!-- Auto-scroll control widget -->
    <AutoScrollWidget v-if="chapter" />
  </div>
</template>
