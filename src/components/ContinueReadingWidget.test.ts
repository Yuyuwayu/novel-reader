/**
 * Integration tests for ContinueReadingWidget component.
 * Tests widget display with Progress Store integration, hiding when no progress exists,
 * and correct navigation URL generation.
 * Requirements: 6.1, 6.2, 6.3, 6.6
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import ContinueReadingWidget from './ContinueReadingWidget.vue'
import * as api from '@/api'
import type { NovelDetail, ReadingProgress } from '@/types'

// Mock the API module
vi.mock('@/api', () => ({
  fetchNovelDetail: vi.fn(),
}))

// Mock the storage utility - but use real implementation for getReadingProgress
vi.mock('@/utils/storage', async () => {
  const actual = await vi.importActual<typeof import('@/utils/storage')>('@/utils/storage')
  return {
    ...actual,
    isStorageAvailable: vi.fn(() => true),
  }
})

describe('ContinueReadingWidget - Integration Tests', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()

    // Create a minimal router for RouterLink testing
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/novel/:novelId', component: { template: '<div>Detail</div>' } },
        { path: '/novel/:novelId/chapter/:chapterNumber', component: { template: '<div>Reading</div>' } },
      ],
    })
  })

  afterEach(() => {
    localStorage.clear()
  })

  // Requirement 6.1: Widget displays last read novel from Progress Store
  it('displays the last read novel from Progress Store', async () => {
    // Setup: Save reading progress to localStorage
    const progress: ReadingProgress = {
      novelId: 'novel-123',
      lastChapter: 5,
      updatedAt: '2024-01-15T10:00:00Z',
    }
    localStorage.setItem('novel_reader:progress:novel-123', JSON.stringify(progress))

    // Mock API response for novel detail
    const mockNovel: NovelDetail = {
      id: 'novel-123',
      title: 'Test Novel',
      author: 'Test Author',
      genre: ['Fantasy'],
      synopsis: 'A test synopsis',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      status: 'ongoing',
      chapters: Array.from({ length: 10 }, (_, i) => ({
        number: i + 1,
        title: `Chapter ${i + 1}`,
      })),
    }
    vi.mocked(api.fetchNovelDetail).mockResolvedValue(mockNovel)

    const wrapper = mount(ContinueReadingWidget, {
      global: {
        plugins: [router],
      },
    })

    // Wait for async operations to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()

    // Assert: Widget should display the novel information
    expect(wrapper.text()).toContain('Lanjutkan Membaca')
    expect(wrapper.text()).toContain('Test Novel')
    expect(wrapper.text()).toContain('Chapter 5 dari 10')
    expect(wrapper.find('img').attributes('src')).toBe('https://example.com/thumb.jpg')
    expect(wrapper.find('img').attributes('alt')).toBe('Test Novel')
  })

  // Requirement 6.2: Widget hides when no progress exists
  it('hides the widget when no reading progress exists', async () => {
    // Setup: No progress in localStorage
    localStorage.clear()

    const wrapper = mount(ContinueReadingWidget, {
      global: {
        plugins: [router],
      },
    })

    // Wait for async operations to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()

    // Assert: Widget should not be visible
    expect(wrapper.find('.continue-reading-widget').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Lanjutkan Membaca')
  })

  // Requirement 6.3: Widget displays most recent novel when multiple exist
  it('displays the most recent novel when multiple progress entries exist', async () => {
    // Setup: Save multiple reading progress entries with different timestamps
    const progress1: ReadingProgress = {
      novelId: 'novel-old',
      lastChapter: 3,
      updatedAt: '2024-01-10T10:00:00Z', // Older
    }
    const progress2: ReadingProgress = {
      novelId: 'novel-recent',
      lastChapter: 7,
      updatedAt: '2024-01-20T10:00:00Z', // More recent
    }
    localStorage.setItem('novel_reader:progress:novel-old', JSON.stringify(progress1))
    localStorage.setItem('novel_reader:progress:novel-recent', JSON.stringify(progress2))

    // Mock API response for the most recent novel
    const mockNovel: NovelDetail = {
      id: 'novel-recent',
      title: 'Recent Novel',
      author: 'Recent Author',
      genre: ['Adventure'],
      synopsis: 'A recent test synopsis',
      thumbnailUrl: 'https://example.com/recent-thumb.jpg',
      status: 'ongoing',
      chapters: Array.from({ length: 15 }, (_, i) => ({
        number: i + 1,
        title: `Chapter ${i + 1}`,
      })),
    }
    vi.mocked(api.fetchNovelDetail).mockResolvedValue(mockNovel)

    const wrapper = mount(ContinueReadingWidget, {
      global: {
        plugins: [router],
      },
    })

    // Wait for async operations to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()

    // Assert: Widget should display the most recent novel
    expect(wrapper.text()).toContain('Recent Novel')
    expect(wrapper.text()).toContain('Chapter 7 dari 15')
    expect(wrapper.text()).not.toContain('novel-old')
  })

  // Requirement 6.6: Widget generates correct navigation URL
  it('generates correct navigation URL for continue reading button', async () => {
    // Setup: Save reading progress
    const progress: ReadingProgress = {
      novelId: 'novel-456',
      lastChapter: 12,
      updatedAt: '2024-01-15T10:00:00Z',
    }
    localStorage.setItem('novel_reader:progress:novel-456', JSON.stringify(progress))

    // Mock API response
    const mockNovel: NovelDetail = {
      id: 'novel-456',
      title: 'URL Test Novel',
      author: 'URL Author',
      genre: ['Mystery'],
      synopsis: 'Testing URL generation',
      thumbnailUrl: 'https://example.com/url-thumb.jpg',
      status: 'ongoing',
      chapters: Array.from({ length: 20 }, (_, i) => ({
        number: i + 1,
        title: `Chapter ${i + 1}`,
      })),
    }
    vi.mocked(api.fetchNovelDetail).mockResolvedValue(mockNovel)

    const wrapper = mount(ContinueReadingWidget, {
      global: {
        plugins: [router],
      },
    })

    // Wait for async operations to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()

    // Assert: Button should have correct RouterLink to attribute
    const continueButton = wrapper.findAll('a').find(link => 
      link.text().includes('Lanjutkan Membaca')
    )
    expect(continueButton).toBeDefined()
    expect(continueButton?.attributes('href')).toBe('/novel/novel-456/chapter/12')
  })

  // Requirement 6.6: Widget thumbnail links to novel detail page
  it('generates correct navigation URL for novel thumbnail', async () => {
    // Setup: Save reading progress
    const progress: ReadingProgress = {
      novelId: 'novel-789',
      lastChapter: 8,
      updatedAt: '2024-01-15T10:00:00Z',
    }
    localStorage.setItem('novel_reader:progress:novel-789', JSON.stringify(progress))

    // Mock API response
    const mockNovel: NovelDetail = {
      id: 'novel-789',
      title: 'Thumbnail Test Novel',
      author: 'Thumbnail Author',
      genre: ['Romance'],
      synopsis: 'Testing thumbnail link',
      thumbnailUrl: 'https://example.com/thumb-test.jpg',
      status: 'ongoing',
      chapters: Array.from({ length: 25 }, (_, i) => ({
        number: i + 1,
        title: `Chapter ${i + 1}`,
      })),
    }
    vi.mocked(api.fetchNovelDetail).mockResolvedValue(mockNovel)

    const wrapper = mount(ContinueReadingWidget, {
      global: {
        plugins: [router],
      },
    })

    // Wait for async operations to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()

    // Assert: Thumbnail link should point to novel detail page
    const thumbnailLink = wrapper.findAll('a').find(link => 
      link.find('img').exists()
    )
    expect(thumbnailLink).toBeDefined()
    expect(thumbnailLink?.attributes('href')).toBe('/novel/novel-789')
  })

  // Requirement 6.2: Widget hides when API call fails (deleted novel)
  it('hides the widget when the novel has been deleted', async () => {
    // Setup: Save reading progress for a deleted novel
    const progress: ReadingProgress = {
      novelId: 'deleted-novel',
      lastChapter: 5,
      updatedAt: '2024-01-15T10:00:00Z',
    }
    localStorage.setItem('novel_reader:progress:deleted-novel', JSON.stringify(progress))

    // Mock API to reject (novel not found)
    vi.mocked(api.fetchNovelDetail).mockRejectedValue(new Error('Novel not found'))

    const wrapper = mount(ContinueReadingWidget, {
      global: {
        plugins: [router],
      },
    })

    // Wait for async operations to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()

    // Assert: Widget should not be visible
    expect(wrapper.find('.continue-reading-widget').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Lanjutkan Membaca')
  })

  // Requirement 6.7: Widget falls back to second novel when first is deleted
  it('displays second-to-last novel when the most recent is deleted', async () => {
    // Setup: Save two progress entries
    const progress1: ReadingProgress = {
      novelId: 'deleted-novel',
      lastChapter: 10,
      updatedAt: '2024-01-20T10:00:00Z', // Most recent (but deleted)
    }
    const progress2: ReadingProgress = {
      novelId: 'valid-novel',
      lastChapter: 5,
      updatedAt: '2024-01-15T10:00:00Z', // Second most recent (valid)
    }
    localStorage.setItem('novel_reader:progress:deleted-novel', JSON.stringify(progress1))
    localStorage.setItem('novel_reader:progress:valid-novel', JSON.stringify(progress2))

    // Mock API: first call fails (deleted), second call succeeds
    const mockNovel: NovelDetail = {
      id: 'valid-novel',
      title: 'Valid Novel',
      author: 'Valid Author',
      genre: ['Sci-Fi'],
      synopsis: 'A valid novel',
      thumbnailUrl: 'https://example.com/valid-thumb.jpg',
      status: 'ongoing',
      chapters: Array.from({ length: 12 }, (_, i) => ({
        number: i + 1,
        title: `Chapter ${i + 1}`,
      })),
    }
    vi.mocked(api.fetchNovelDetail)
      .mockRejectedValueOnce(new Error('Novel not found')) // First call fails
      .mockResolvedValueOnce(mockNovel) // Second call succeeds

    const wrapper = mount(ContinueReadingWidget, {
      global: {
        plugins: [router],
      },
    })

    // Wait for async operations to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()

    // Assert: Widget should display the second novel
    expect(wrapper.text()).toContain('Valid Novel')
    expect(wrapper.text()).toContain('Chapter 5 dari 12')
    expect(wrapper.text()).not.toContain('deleted-novel')
  })

  // Requirement 6.9: Widget displays progress indicator
  it('displays progress indicator with percentage', async () => {
    // Setup: Save reading progress
    const progress: ReadingProgress = {
      novelId: 'novel-progress',
      lastChapter: 25,
      updatedAt: '2024-01-15T10:00:00Z',
    }
    localStorage.setItem('novel_reader:progress:novel-progress', JSON.stringify(progress))

    // Mock API response with 50 total chapters (25/50 = 50%)
    const mockNovel: NovelDetail = {
      id: 'novel-progress',
      title: 'Progress Novel',
      author: 'Progress Author',
      genre: ['Action'],
      synopsis: 'Testing progress indicator',
      thumbnailUrl: 'https://example.com/progress-thumb.jpg',
      status: 'ongoing',
      chapters: Array.from({ length: 50 }, (_, i) => ({
        number: i + 1,
        title: `Chapter ${i + 1}`,
      })),
    }
    vi.mocked(api.fetchNovelDetail).mockResolvedValue(mockNovel)

    const wrapper = mount(ContinueReadingWidget, {
      global: {
        plugins: [router],
      },
    })

    // Wait for async operations to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()

    // Assert: Widget should display progress percentage
    expect(wrapper.text()).toContain('50% selesai')
    expect(wrapper.text()).toContain('Chapter 25 dari 50')
  })

  // Edge case: Widget handles loading state
  it('displays loading state while fetching novel data', async () => {
    // Setup: Save reading progress
    const progress: ReadingProgress = {
      novelId: 'novel-loading',
      lastChapter: 3,
      updatedAt: '2024-01-15T10:00:00Z',
    }
    localStorage.setItem('novel_reader:progress:novel-loading', JSON.stringify(progress))

    // Mock API with delayed response
    const mockNovel: NovelDetail = {
      id: 'novel-loading',
      title: 'Loading Novel',
      author: 'Loading Author',
      genre: ['Drama'],
      synopsis: 'Testing loading state',
      thumbnailUrl: 'https://example.com/loading-thumb.jpg',
      status: 'ongoing',
      chapters: Array.from({ length: 10 }, (_, i) => ({
        number: i + 1,
        title: `Chapter ${i + 1}`,
      })),
    }
    vi.mocked(api.fetchNovelDetail).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockNovel), 200))
    )

    const wrapper = mount(ContinueReadingWidget, {
      global: {
        plugins: [router],
      },
    })

    // Assert: Loading state should be visible initially
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.animate-pulse').exists()).toBe(true)

    // Wait for loading to complete
    await new Promise(resolve => setTimeout(resolve, 300))
    await wrapper.vm.$nextTick()

    // Assert: Content should be visible after loading
    expect(wrapper.find('.animate-pulse').exists()).toBe(false)
    expect(wrapper.text()).toContain('Loading Novel')
  })

  // Edge case: Widget handles localStorage unavailable
  it('hides the widget when localStorage is unavailable', async () => {
    // Mock isStorageAvailable to return false
    const { isStorageAvailable } = await import('@/utils/storage')
    vi.mocked(isStorageAvailable).mockReturnValue(false)

    const wrapper = mount(ContinueReadingWidget, {
      global: {
        plugins: [router],
      },
    })

    // Wait for async operations to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()

    // Assert: Widget should not be visible
    expect(wrapper.find('.continue-reading-widget').exists()).toBe(false)
  })
})
