/**
 * Unit tests for ReadingPage enhancements.
 * Tests reading time display, offline badge visibility, and offline analytics tracking.
 * Requirements: 5.9, 7.6, 11.1, 11.2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import ReadingPage from './ReadingPage.vue'
import * as api from '@/api'
import * as offlineAnalytics from '@/utils/offlineAnalytics'
import type { ChapterContent } from '@/types'

// Mock the API module
vi.mock('@/api', () => ({
  fetchChapter: vi.fn(),
  recordHistory: vi.fn().mockResolvedValue(undefined),
  fetchHighlights: vi.fn().mockResolvedValue([]),
  createHighlight: vi.fn(),
  deleteHighlight: vi.fn(),
  submitReport: vi.fn(),
  ApiError: class ApiError extends Error {
    statusCode: number
    constructor(message: string, statusCode: number) {
      super(message)
      this.name = 'ApiError'
      this.statusCode = statusCode
    }
  },
}))

// Mock the offlineAnalytics module
vi.mock('@/utils/offlineAnalytics', () => ({
  trackOfflineRead: vi.fn(),
  trackOnlineRead: vi.fn(),
  getOfflineAnalytics: vi.fn().mockReturnValue({
    offlineReadsCount: 0,
    onlineReadsCount: 0,
    lastOfflineReadAt: null,
    offlineNovelIds: [],
  }),
  resetOfflineAnalytics: vi.fn(),
}))

// Mock the readingTime utility
vi.mock('@/utils/readingTime', () => ({
  calculateReadingTime: vi.fn((content: string) => {
    const wordCount = content.split(/\s+/).filter(Boolean).length
    const minutes = Math.ceil(wordCount / 200) // Assume Indonesian
    return { minutes, wordCount, language: 'id' as const }
  }),
}))

describe('ReadingPage - Enhancements', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()

    // Create a minimal router for testing
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { 
          path: '/novel/:novelId/chapter/:chapterNumber', 
          name: 'reading',
          component: ReadingPage 
        },
      ],
    })
  })

  afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  // Requirement 5.9: Reading time displays correctly
  describe('Reading time display', () => {
    it('displays reading time estimate for chapter content', async () => {
      // Mock chapter with 200 words (1 minute read time)
      const mockChapter: ChapterContent = {
        novelId: 'novel-123',
        chapterNumber: 1,
        title: 'Chapter 1',
        content: 'kata '.repeat(200), // 200 words
        totalChapters: 10,
      }
      vi.mocked(api.fetchChapter).mockResolvedValue(mockChapter)

      // Navigate to the reading page
      await router.push('/novel/novel-123/chapter/1')
      await router.isReady()

      const wrapper = mount(ReadingPage, {
        global: {
          plugins: [router],
        },
      })

      // Wait for async operations
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Assert: Reading time should be displayed
      expect(wrapper.text()).toContain('Estimasi waktu baca')
      expect(wrapper.text()).toContain('1 menit')
    })

    it('displays "< 1 menit" for very short content', async () => {
      // Mock chapter with 50 words (< 1 minute read time)
      const mockChapter: ChapterContent = {
        novelId: 'novel-123',
        chapterNumber: 1,
        title: 'Chapter 1',
        content: 'kata '.repeat(50), // 50 words
        totalChapters: 10,
      }
      vi.mocked(api.fetchChapter).mockResolvedValue(mockChapter)

      // Navigate to the reading page
      await router.push('/novel/novel-123/chapter/1')
      await router.isReady()

      const wrapper = mount(ReadingPage, {
        global: {
          plugins: [router],
        },
      })

      // Wait for async operations
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Assert: Should display "< 1 menit"
      expect(wrapper.text()).toContain('Estimasi waktu baca')
      expect(wrapper.text()).toContain('< 1 menit')
    })

    it('displays correct reading time for longer content', async () => {
      // Mock chapter with 1000 words (5 minutes read time at 200 wpm)
      const mockChapter: ChapterContent = {
        novelId: 'novel-123',
        chapterNumber: 1,
        title: 'Chapter 1',
        content: 'kata '.repeat(1000), // 1000 words
        totalChapters: 10,
      }
      vi.mocked(api.fetchChapter).mockResolvedValue(mockChapter)

      // Navigate to the reading page
      await router.push('/novel/novel-123/chapter/1')
      await router.isReady()

      const wrapper = mount(ReadingPage, {
        global: {
          plugins: [router],
        },
      })

      // Wait for async operations
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Assert: Should display 5 minutes
      expect(wrapper.text()).toContain('Estimasi waktu baca')
      expect(wrapper.text()).toContain('5 menit')
    })

    it('does not display reading time when chapter is loading', async () => {
      // Mock delayed API response
      vi.mocked(api.fetchChapter).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          novelId: 'novel-123',
          chapterNumber: 1,
          title: 'Chapter 1',
          content: 'kata '.repeat(200),
          totalChapters: 10,
        }), 200))
      )

      // Navigate to the reading page
      await router.push('/novel/novel-123/chapter/1')
      await router.isReady()

      const wrapper = mount(ReadingPage, {
        global: {
          plugins: [router],
        },
      })

      // Assert: Reading time should not be visible during loading
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).not.toContain('Estimasi waktu baca')

      // Wait for loading to complete (including setTimeout delay)
      await new Promise(resolve => setTimeout(resolve, 250))
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Assert: Reading time should now be visible
      expect(wrapper.text()).toContain('Estimasi waktu baca')
    })

    it('updates reading time when navigating to different chapter', async () => {
      // Mock first chapter with 200 words
      const mockChapter1: ChapterContent = {
        novelId: 'novel-123',
        chapterNumber: 1,
        title: 'Chapter 1',
        content: 'kata '.repeat(200), // 1 minute
        totalChapters: 10,
      }

      // Mock second chapter with 600 words
      const mockChapter2: ChapterContent = {
        novelId: 'novel-123',
        chapterNumber: 2,
        title: 'Chapter 2',
        content: 'kata '.repeat(600), // 3 minutes
        totalChapters: 10,
      }

      vi.mocked(api.fetchChapter)
        .mockResolvedValueOnce(mockChapter1)
        .mockResolvedValueOnce(mockChapter2)

      // Navigate to first chapter
      await router.push('/novel/novel-123/chapter/1')
      await router.isReady()

      const wrapper = mount(ReadingPage, {
        global: {
          plugins: [router],
        },
      })

      // Wait for first chapter to load
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Assert: First chapter reading time
      expect(wrapper.text()).toContain('1 menit')

      // Navigate to second chapter
      await router.push('/novel/novel-123/chapter/2')
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Assert: Second chapter reading time
      expect(wrapper.text()).toContain('3 menit')
    })
  })

  // Requirement 7.6: Offline badge shows when offline
  describe('Offline badge display', () => {
    it('shows offline badge when navigator.onLine is false', async () => {
      // Mock navigator.onLine to be false
      vi.stubGlobal('navigator', { onLine: false })

      const mockChapter: ChapterContent = {
        novelId: 'novel-123',
        chapterNumber: 1,
        title: 'Chapter 1',
        content: 'Test content',
        totalChapters: 10,
      }
      vi.mocked(api.fetchChapter).mockResolvedValue(mockChapter)

      // Navigate to the reading page
      await router.push('/novel/novel-123/chapter/1')
      await router.isReady()

      const wrapper = mount(ReadingPage, {
        global: {
          plugins: [router],
        },
      })

      // Wait for async operations
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Assert: Offline badge should be visible
      expect(wrapper.text()).toContain('Dibaca Offline')
    })

    it('hides offline badge when navigator.onLine is true', async () => {
      // Mock navigator.onLine to be true
      vi.stubGlobal('navigator', { onLine: true })

      const mockChapter: ChapterContent = {
        novelId: 'novel-123',
        chapterNumber: 1,
        title: 'Chapter 1',
        content: 'Test content',
        totalChapters: 10,
      }
      vi.mocked(api.fetchChapter).mockResolvedValue(mockChapter)

      // Navigate to the reading page
      await router.push('/novel/novel-123/chapter/1')
      await router.isReady()

      const wrapper = mount(ReadingPage, {
        global: {
          plugins: [router],
        },
      })

      // Wait for async operations
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Assert: Offline badge should not be visible
      expect(wrapper.text()).not.toContain('Dibaca Offline')
    })

    it('shows offline badge when offline event is fired', async () => {
      // Start with online state
      vi.stubGlobal('navigator', { onLine: true })

      const mockChapter: ChapterContent = {
        novelId: 'novel-123',
        chapterNumber: 1,
        title: 'Chapter 1',
        content: 'Test content',
        totalChapters: 10,
      }
      vi.mocked(api.fetchChapter).mockResolvedValue(mockChapter)

      // Navigate to the reading page
      await router.push('/novel/novel-123/chapter/1')
      await router.isReady()

      const wrapper = mount(ReadingPage, {
        global: {
          plugins: [router],
        },
      })

      // Wait for async operations
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Initially hidden
      expect(wrapper.text()).not.toContain('Dibaca Offline')

      // Simulate offline event
      window.dispatchEvent(new Event('offline'))
      await wrapper.vm.$nextTick()

      // Assert: Offline badge should now be visible
      expect(wrapper.text()).toContain('Dibaca Offline')
    })

    it('hides offline badge when online event is fired', async () => {
      // Start with offline state
      vi.stubGlobal('navigator', { onLine: false })

      const mockChapter: ChapterContent = {
        novelId: 'novel-123',
        chapterNumber: 1,
        title: 'Chapter 1',
        content: 'Test content',
        totalChapters: 10,
      }
      vi.mocked(api.fetchChapter).mockResolvedValue(mockChapter)

      // Navigate to the reading page
      await router.push('/novel/novel-123/chapter/1')
      await router.isReady()

      const wrapper = mount(ReadingPage, {
        global: {
          plugins: [router],
        },
      })

      // Wait for async operations
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Initially visible
      expect(wrapper.text()).toContain('Dibaca Offline')

      // Simulate online event
      window.dispatchEvent(new Event('online'))
      await wrapper.vm.$nextTick()

      // Assert: Offline badge should now be hidden
      expect(wrapper.text()).not.toContain('Dibaca Offline')
    })

    it('displays offline badge with correct styling', async () => {
      // Mock navigator.onLine to be false
      vi.stubGlobal('navigator', { onLine: false })

      const mockChapter: ChapterContent = {
        novelId: 'novel-123',
        chapterNumber: 1,
        title: 'Chapter 1',
        content: 'Test content',
        totalChapters: 10,
      }
      vi.mocked(api.fetchChapter).mockResolvedValue(mockChapter)

      // Navigate to the reading page
      await router.push('/novel/novel-123/chapter/1')
      await router.isReady()

      const wrapper = mount(ReadingPage, {
        global: {
          plugins: [router],
        },
      })

      // Wait for async operations
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Find the offline badge
      const badge = wrapper.findAll('span').find(span => 
        span.text().includes('Dibaca Offline')
      )

      expect(badge).toBeDefined()
      
      // Check for amber color classes (light mode)
      const classes = badge?.classes() || []
      expect(
        classes.some(c => c.includes('amber'))
      ).toBe(true)
    })

    it('displays offline badge with icon', async () => {
      // Mock navigator.onLine to be false
      vi.stubGlobal('navigator', { onLine: false })

      const mockChapter: ChapterContent = {
        novelId: 'novel-123',
        chapterNumber: 1,
        title: 'Chapter 1',
        content: 'Test content',
        totalChapters: 10,
      }
      vi.mocked(api.fetchChapter).mockResolvedValue(mockChapter)

      // Navigate to the reading page
      await router.push('/novel/novel-123/chapter/1')
      await router.isReady()

      const wrapper = mount(ReadingPage, {
        global: {
          plugins: [router],
        },
      })

      // Wait for async operations
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Find the offline badge
      const badge = wrapper.findAll('span').find(span => 
        span.text().includes('Dibaca Offline')
      )

      // Check for SVG icon
      const icon = badge?.find('svg')
      expect(icon?.exists()).toBe(true)
      expect(icon?.attributes('aria-hidden')).toBe('true')
    })
  })

  // Requirements 11.1, 11.2: Offline analytics counters increment correctly
  describe('Offline analytics tracking', () => {
    it('calls trackOnlineRead when chapter is loaded online', async () => {
      // Mock navigator.onLine to be true
      vi.stubGlobal('navigator', { onLine: true })

      const mockChapter: ChapterContent = {
        novelId: 'novel-123',
        chapterNumber: 1,
        title: 'Chapter 1',
        content: 'Test content',
        totalChapters: 10,
      }
      vi.mocked(api.fetchChapter).mockResolvedValue(mockChapter)

      // Navigate to the reading page
      await router.push('/novel/novel-123/chapter/1')
      await router.isReady()

      const wrapper = mount(ReadingPage, {
        global: {
          plugins: [router],
        },
      })

      // Wait for async operations
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Assert: trackOnlineRead should have been called
      expect(offlineAnalytics.trackOnlineRead).toHaveBeenCalledOnce()
      expect(offlineAnalytics.trackOfflineRead).not.toHaveBeenCalled()
    })

    it('calls trackOfflineRead with novelId when chapter is loaded offline', async () => {
      // Mock navigator.onLine to be false
      vi.stubGlobal('navigator', { onLine: false })

      const mockChapter: ChapterContent = {
        novelId: 'novel-456',
        chapterNumber: 2,
        title: 'Chapter 2',
        content: 'Test content',
        totalChapters: 10,
      }
      vi.mocked(api.fetchChapter).mockResolvedValue(mockChapter)

      // Navigate to the reading page
      await router.push('/novel/novel-456/chapter/2')
      await router.isReady()

      const wrapper = mount(ReadingPage, {
        global: {
          plugins: [router],
        },
      })

      // Wait for async operations
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Assert: trackOfflineRead should have been called with novelId
      expect(offlineAnalytics.trackOfflineRead).toHaveBeenCalledOnce()
      expect(offlineAnalytics.trackOfflineRead).toHaveBeenCalledWith('novel-456')
      expect(offlineAnalytics.trackOnlineRead).not.toHaveBeenCalled()
    })

    it('tracks analytics for each chapter navigation', async () => {
      // Mock navigator.onLine to be true
      vi.stubGlobal('navigator', { onLine: true })

      const mockChapter1: ChapterContent = {
        novelId: 'novel-123',
        chapterNumber: 1,
        title: 'Chapter 1',
        content: 'Test content 1',
        totalChapters: 10,
      }

      const mockChapter2: ChapterContent = {
        novelId: 'novel-123',
        chapterNumber: 2,
        title: 'Chapter 2',
        content: 'Test content 2',
        totalChapters: 10,
      }

      vi.mocked(api.fetchChapter)
        .mockResolvedValueOnce(mockChapter1)
        .mockResolvedValueOnce(mockChapter2)

      // Navigate to first chapter
      await router.push('/novel/novel-123/chapter/1')
      await router.isReady()

      const wrapper = mount(ReadingPage, {
        global: {
          plugins: [router],
        },
      })

      // Wait for first chapter to load
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Assert: trackOnlineRead called once
      expect(offlineAnalytics.trackOnlineRead).toHaveBeenCalledTimes(1)

      // Navigate to second chapter
      await router.push('/novel/novel-123/chapter/2')
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Assert: trackOnlineRead called twice
      expect(offlineAnalytics.trackOnlineRead).toHaveBeenCalledTimes(2)
    })

    it('does not track analytics when chapter load fails', async () => {
      // Mock navigator.onLine to be true
      vi.stubGlobal('navigator', { onLine: true })

      // Mock API to reject
      vi.mocked(api.fetchChapter).mockRejectedValue(new Error('Chapter not found'))

      // Navigate to the reading page
      await router.push('/novel/novel-123/chapter/1')
      await router.isReady()

      const wrapper = mount(ReadingPage, {
        global: {
          plugins: [router],
        },
      })

      // Wait for async operations
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Assert: Analytics should not be tracked on error
      expect(offlineAnalytics.trackOnlineRead).not.toHaveBeenCalled()
      expect(offlineAnalytics.trackOfflineRead).not.toHaveBeenCalled()
    })

    it('tracks correct analytics when connection status changes between chapters', async () => {
      // Start online
      vi.stubGlobal('navigator', { onLine: true })

      const mockChapter1: ChapterContent = {
        novelId: 'novel-123',
        chapterNumber: 1,
        title: 'Chapter 1',
        content: 'Test content 1',
        totalChapters: 10,
      }

      const mockChapter2: ChapterContent = {
        novelId: 'novel-123',
        chapterNumber: 2,
        title: 'Chapter 2',
        content: 'Test content 2',
        totalChapters: 10,
      }

      vi.mocked(api.fetchChapter)
        .mockResolvedValueOnce(mockChapter1)
        .mockResolvedValueOnce(mockChapter2)

      // Navigate to first chapter (online)
      await router.push('/novel/novel-123/chapter/1')
      await router.isReady()

      const wrapper = mount(ReadingPage, {
        global: {
          plugins: [router],
        },
      })

      // Wait for first chapter to load
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Assert: trackOnlineRead called
      expect(offlineAnalytics.trackOnlineRead).toHaveBeenCalledTimes(1)
      expect(offlineAnalytics.trackOfflineRead).not.toHaveBeenCalled()

      // Go offline
      vi.stubGlobal('navigator', { onLine: false })

      // Navigate to second chapter (offline)
      await router.push('/novel/novel-123/chapter/2')
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Assert: trackOfflineRead called
      expect(offlineAnalytics.trackOnlineRead).toHaveBeenCalledTimes(1)
      expect(offlineAnalytics.trackOfflineRead).toHaveBeenCalledTimes(1)
      expect(offlineAnalytics.trackOfflineRead).toHaveBeenCalledWith('novel-123')
    })

    it('tracks analytics only after successful chapter load', async () => {
      // Mock navigator.onLine to be true
      vi.stubGlobal('navigator', { onLine: true })

      const mockChapter: ChapterContent = {
        novelId: 'novel-123',
        chapterNumber: 1,
        title: 'Chapter 1',
        content: 'Test content',
        totalChapters: 10,
      }

      // Mock delayed API response
      vi.mocked(api.fetchChapter).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockChapter), 100))
      )

      // Navigate to the reading page
      await router.push('/novel/novel-123/chapter/1')
      await router.isReady()

      const wrapper = mount(ReadingPage, {
        global: {
          plugins: [router],
        },
      })

      // Assert: Analytics not tracked yet (still loading)
      await wrapper.vm.$nextTick()
      expect(offlineAnalytics.trackOnlineRead).not.toHaveBeenCalled()

      // Wait for loading to complete (including setTimeout delay)
      await new Promise(resolve => setTimeout(resolve, 150))
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Assert: Analytics tracked after successful load
      expect(offlineAnalytics.trackOnlineRead).toHaveBeenCalledOnce()
    })
  })

  // Integration test: All enhancements work together
  describe('Integration - All enhancements', () => {
    it('displays reading time, offline badge, and tracks analytics together when offline', async () => {
      // Mock navigator.onLine to be false
      vi.stubGlobal('navigator', { onLine: false })

      const mockChapter: ChapterContent = {
        novelId: 'novel-789',
        chapterNumber: 5,
        title: 'Chapter 5',
        content: 'kata '.repeat(400), // 2 minutes
        totalChapters: 10,
      }
      vi.mocked(api.fetchChapter).mockResolvedValue(mockChapter)

      // Navigate to the reading page
      await router.push('/novel/novel-789/chapter/5')
      await router.isReady()

      const wrapper = mount(ReadingPage, {
        global: {
          plugins: [router],
        },
      })

      // Wait for async operations
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Assert: All enhancements are present
      expect(wrapper.text()).toContain('Estimasi waktu baca')
      expect(wrapper.text()).toContain('2 menit')
      expect(wrapper.text()).toContain('Dibaca Offline')
      expect(offlineAnalytics.trackOfflineRead).toHaveBeenCalledWith('novel-789')
      expect(offlineAnalytics.trackOnlineRead).not.toHaveBeenCalled()
    })

    it('displays reading time without offline badge when online', async () => {
      // Mock navigator.onLine to be true
      vi.stubGlobal('navigator', { onLine: true })

      const mockChapter: ChapterContent = {
        novelId: 'novel-789',
        chapterNumber: 5,
        title: 'Chapter 5',
        content: 'kata '.repeat(400), // 2 minutes
        totalChapters: 10,
      }
      vi.mocked(api.fetchChapter).mockResolvedValue(mockChapter)

      // Navigate to the reading page
      await router.push('/novel/novel-789/chapter/5')
      await router.isReady()

      const wrapper = mount(ReadingPage, {
        global: {
          plugins: [router],
        },
      })

      // Wait for async operations
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Assert: Reading time present, offline badge absent
      expect(wrapper.text()).toContain('Estimasi waktu baca')
      expect(wrapper.text()).toContain('2 menit')
      expect(wrapper.text()).not.toContain('Dibaca Offline')
      expect(offlineAnalytics.trackOnlineRead).toHaveBeenCalledOnce()
      expect(offlineAnalytics.trackOfflineRead).not.toHaveBeenCalled()
    })
  })
})
