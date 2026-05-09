/**
 * Integration tests for HomePage - Continue Reading Widget integration.
 * Tests widget placement after Hero section and authentication-based visibility.
 * Requirements: 6.1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import HomePage from './HomePage.vue'
import { useAuthStore } from '@/stores/auth'
import * as api from '@/api'
import type { HomeData, NovelDetail, ReadingProgress } from '@/types'

// Mock the API module
vi.mock('@/api', () => ({
  fetchHomeData: vi.fn(),
  fetchRandomPick: vi.fn(),
  fetchNewAdditions: vi.fn(),
  fetchNovelDetail: vi.fn(),
}))

// Mock the storage utility
vi.mock('@/utils/storage', async () => {
  const actual = await vi.importActual<typeof import('@/utils/storage')>('@/utils/storage')
  return {
    ...actual,
    isStorageAvailable: vi.fn(() => true),
  }
})

describe('HomePage - Continue Reading Widget Integration', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()

    // Create a minimal router for testing
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: HomePage },
        { path: '/novel/:novelId', component: { template: '<div>Detail</div>' } },
        { path: '/novel/:novelId/chapter/:chapterNumber', component: { template: '<div>Reading</div>' } },
      ],
    })

    // Mock home data API response
    const mockHomeData: HomeData = {
      featured: [],
      trending: [],
      latestUpdates: [],
      popularByGenre: {
        Fantasy: [],
        Romance: [],
      },
      leaderboardPreview: {
        daily: [],
        weekly: [],
        allTime: [],
      },
      randomPick: [],
      newAdditions: [],
    }
    vi.mocked(api.fetchHomeData).mockResolvedValue(mockHomeData)
    vi.mocked(api.fetchNewAdditions).mockResolvedValue([])
  })

  afterEach(() => {
    localStorage.clear()
  })

  // Requirement 6.1: Widget appears on HomePage after Hero section
  describe('Widget placement', () => {
    it('renders Continue Reading Widget after Hero section when authenticated', async () => {
      // Setup: Authenticate user
      const authStore = useAuthStore()
      authStore.accessToken = 'mock-access-token' // Required for isAuthenticated
      authStore.user = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      }

      // Setup: Save reading progress
      const progress: ReadingProgress = {
        novelId: 'novel-123',
        lastChapter: 5,
        updatedAt: '2024-01-15T10:00:00Z',
      }
      localStorage.setItem('novel_reader:progress:novel-123', JSON.stringify(progress))

      // Mock novel detail for Continue Reading Widget
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

      // Navigate to HomePage
      await router.push('/')
      await router.isReady()

      const wrapper = mount(HomePage, {
        global: {
          plugins: [router],
        },
      })

      // Wait for async operations (HomePage + ContinueReadingWidget)
      await flushPromises()
      await wrapper.vm.$nextTick()
      // Additional wait for ContinueReadingWidget's async loadLastRead
      await new Promise(resolve => setTimeout(resolve, 150))
      await wrapper.vm.$nextTick()

      // Assert: Continue Reading Widget should be present
      expect(wrapper.text()).toContain('Lanjutkan Membaca')
      expect(wrapper.text()).toContain('Test Novel')

      // Assert: Widget should appear after Hero section
      const pageText = wrapper.text()
      const heroIndex = pageText.indexOf('Novel Unggulan')
      const widgetIndex = pageText.indexOf('Lanjutkan Membaca')
      const trendingIndex = pageText.indexOf('Sedang Populer')

      // Widget should appear after Hero and before Trending
      expect(heroIndex).toBeGreaterThan(-1)
      expect(widgetIndex).toBeGreaterThan(heroIndex)
      expect(trendingIndex).toBeGreaterThan(widgetIndex)
    })

    it('positions Continue Reading Widget between Hero and Trending sections', async () => {
      // Setup: Authenticate user
      const authStore = useAuthStore()
      authStore.accessToken = 'mock-access-token' // Required for isAuthenticated
      authStore.user = {
        id: 'user-456',
        username: 'testuser2',
        email: 'test2@example.com',
        role: 'user',
      }

      // Setup: Save reading progress
      const progress: ReadingProgress = {
        novelId: 'novel-456',
        lastChapter: 3,
        updatedAt: '2024-01-15T10:00:00Z',
      }
      localStorage.setItem('novel_reader:progress:novel-456', JSON.stringify(progress))

      // Mock novel detail
      const mockNovel: NovelDetail = {
        id: 'novel-456',
        title: 'Position Test Novel',
        author: 'Position Author',
        genre: ['Adventure'],
        synopsis: 'Testing position',
        thumbnailUrl: 'https://example.com/position-thumb.jpg',
        status: 'ongoing',
        chapters: Array.from({ length: 15 }, (_, i) => ({
          number: i + 1,
          title: `Chapter ${i + 1}`,
        })),
      }
      vi.mocked(api.fetchNovelDetail).mockResolvedValue(mockNovel)

      // Navigate to HomePage
      await router.push('/')
      await router.isReady()

      const wrapper = mount(HomePage, {
        global: {
          plugins: [router],
        },
      })

      // Wait for async operations (HomePage + ContinueReadingWidget)
      await flushPromises()
      await wrapper.vm.$nextTick()
      // Additional wait for ContinueReadingWidget's async loadLastRead
      await new Promise(resolve => setTimeout(resolve, 150))
      await wrapper.vm.$nextTick()

      // Find all section elements
      const sections = wrapper.findAll('section')
      
      // Find indices of Hero, Continue Reading, and Trending sections
      let heroIndex = -1
      let continueReadingIndex = -1
      let trendingIndex = -1

      sections.forEach((section, index) => {
        const text = section.text()
        if (text.includes('Novel Unggulan')) heroIndex = index
        if (text.includes('Lanjutkan Membaca')) continueReadingIndex = index
        if (text.includes('Sedang Populer')) trendingIndex = index
      })

      // Assert: Continue Reading should be between Hero and Trending
      expect(heroIndex).toBeGreaterThan(-1)
      expect(continueReadingIndex).toBeGreaterThan(heroIndex)
      expect(trendingIndex).toBeGreaterThan(continueReadingIndex)
    })

    it('does not disrupt other sections when Continue Reading Widget is present', async () => {
      // Setup: Authenticate user
      const authStore = useAuthStore()
      authStore.accessToken = 'mock-access-token' // Required for isAuthenticated
      authStore.user = {
        id: 'user-789',
        username: 'testuser3',
        email: 'test3@example.com',
        role: 'user',
      }

      // Setup: Save reading progress
      const progress: ReadingProgress = {
        novelId: 'novel-789',
        lastChapter: 7,
        updatedAt: '2024-01-15T10:00:00Z',
      }
      localStorage.setItem('novel_reader:progress:novel-789', JSON.stringify(progress))

      // Mock novel detail
      const mockNovel: NovelDetail = {
        id: 'novel-789',
        title: 'Disruption Test Novel',
        author: 'Disruption Author',
        genre: ['Mystery'],
        synopsis: 'Testing disruption',
        thumbnailUrl: 'https://example.com/disruption-thumb.jpg',
        status: 'ongoing',
        chapters: Array.from({ length: 20 }, (_, i) => ({
          number: i + 1,
          title: `Chapter ${i + 1}`,
        })),
      }
      vi.mocked(api.fetchNovelDetail).mockResolvedValue(mockNovel)

      // Navigate to HomePage
      await router.push('/')
      await router.isReady()

      const wrapper = mount(HomePage, {
        global: {
          plugins: [router],
        },
      })

      // Wait for async operations (HomePage + ContinueReadingWidget)
      await flushPromises()
      await wrapper.vm.$nextTick()
      // Additional wait for ContinueReadingWidget's async loadLastRead
      await new Promise(resolve => setTimeout(resolve, 150))
      await wrapper.vm.$nextTick()

      // Assert: All expected sections should be present
      expect(wrapper.text()).toContain('Novel Unggulan') // Hero
      expect(wrapper.text()).toContain('Lanjutkan Membaca') // Continue Reading
      expect(wrapper.text()).toContain('Sedang Populer') // Trending
      expect(wrapper.text()).toContain('Update Terbaru') // Latest Updates
      expect(wrapper.text()).toContain('Populer per Genre') // Popular by Genre
      expect(wrapper.text()).toContain('Peringkat Novel') // Leaderboard
      expect(wrapper.text()).toContain('Novel Acak') // Random Pick
      expect(wrapper.text()).toContain('Baru Ditambahkan') // New Additions
    })
  })

  // Requirement 6.1: Widget only shows for authenticated users
  describe('Authentication-based visibility', () => {
    it('shows Continue Reading Widget when user is authenticated', async () => {
      // Setup: Authenticate user
      const authStore = useAuthStore()
      authStore.accessToken = 'mock-access-token' // Required for isAuthenticated
      authStore.user = {
        id: 'user-auth-1',
        username: 'authuser',
        email: 'auth@example.com',
        role: 'user',
      }

      // Setup: Save reading progress
      const progress: ReadingProgress = {
        novelId: 'novel-auth-1',
        lastChapter: 2,
        updatedAt: '2024-01-15T10:00:00Z',
      }
      localStorage.setItem('novel_reader:progress:novel-auth-1', JSON.stringify(progress))

      // Mock novel detail
      const mockNovel: NovelDetail = {
        id: 'novel-auth-1',
        title: 'Auth Test Novel',
        author: 'Auth Author',
        genre: ['Sci-Fi'],
        synopsis: 'Testing auth',
        thumbnailUrl: 'https://example.com/auth-thumb.jpg',
        status: 'ongoing',
        chapters: Array.from({ length: 10 }, (_, i) => ({
          number: i + 1,
          title: `Chapter ${i + 1}`,
        })),
      }
      vi.mocked(api.fetchNovelDetail).mockResolvedValue(mockNovel)

      // Navigate to HomePage
      await router.push('/')
      await router.isReady()

      const wrapper = mount(HomePage, {
        global: {
          plugins: [router],
        },
      })

      // Wait for async operations (HomePage + ContinueReadingWidget)
      await flushPromises()
      await wrapper.vm.$nextTick()
      // Additional wait for ContinueReadingWidget's async loadLastRead
      await new Promise(resolve => setTimeout(resolve, 150))
      await wrapper.vm.$nextTick()

      // Assert: Widget should be visible
      expect(wrapper.text()).toContain('Lanjutkan Membaca')
      expect(wrapper.text()).toContain('Auth Test Novel')
    })

    it('hides Continue Reading Widget when user is not authenticated', async () => {
      // Setup: No authenticated user (guest)
      const authStore = useAuthStore()
      authStore.user = null

      // Setup: Save reading progress (guest can have progress in localStorage)
      const progress: ReadingProgress = {
        novelId: 'novel-guest',
        lastChapter: 5,
        updatedAt: '2024-01-15T10:00:00Z',
      }
      localStorage.setItem('novel_reader:progress:novel-guest', JSON.stringify(progress))

      // Navigate to HomePage
      await router.push('/')
      await router.isReady()

      const wrapper = mount(HomePage, {
        global: {
          plugins: [router],
        },
      })

      // Wait for async operations
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Assert: Widget should NOT be visible
      expect(wrapper.text()).not.toContain('Lanjutkan Membaca')
      
      // Assert: Other sections should still be visible
      expect(wrapper.text()).toContain('Novel Unggulan')
      expect(wrapper.text()).toContain('Sedang Populer')
    })

    it('hides Continue Reading Widget when user logs out', async () => {
      // Setup: Start with authenticated user
      const authStore = useAuthStore()
      authStore.accessToken = 'mock-access-token' // Required for isAuthenticated
      authStore.user = {
        id: 'user-logout',
        username: 'logoutuser',
        email: 'logout@example.com',
        role: 'user',
      }

      // Setup: Save reading progress
      const progress: ReadingProgress = {
        novelId: 'novel-logout',
        lastChapter: 4,
        updatedAt: '2024-01-15T10:00:00Z',
      }
      localStorage.setItem('novel_reader:progress:novel-logout', JSON.stringify(progress))

      // Mock novel detail
      const mockNovel: NovelDetail = {
        id: 'novel-logout',
        title: 'Logout Test Novel',
        author: 'Logout Author',
        genre: ['Drama'],
        synopsis: 'Testing logout',
        thumbnailUrl: 'https://example.com/logout-thumb.jpg',
        status: 'ongoing',
        chapters: Array.from({ length: 12 }, (_, i) => ({
          number: i + 1,
          title: `Chapter ${i + 1}`,
        })),
      }
      vi.mocked(api.fetchNovelDetail).mockResolvedValue(mockNovel)

      // Navigate to HomePage
      await router.push('/')
      await router.isReady()

      const wrapper = mount(HomePage, {
        global: {
          plugins: [router],
        },
      })

      // Wait for async operations (HomePage + ContinueReadingWidget)
      await flushPromises()
      await wrapper.vm.$nextTick()
      // Additional wait for ContinueReadingWidget's async loadLastRead
      await new Promise(resolve => setTimeout(resolve, 150))
      await wrapper.vm.$nextTick()

      // Assert: Widget should be visible initially
      expect(wrapper.text()).toContain('Lanjutkan Membaca')

      // Simulate logout
      authStore.accessToken = null // Clear access token
      authStore.user = null
      await wrapper.vm.$nextTick()

      // Assert: Widget should now be hidden
      expect(wrapper.text()).not.toContain('Lanjutkan Membaca')
    })

    it('shows Continue Reading Widget for admin users', async () => {
      // Setup: Authenticate admin user
      const authStore = useAuthStore()
      authStore.accessToken = 'mock-admin-token' // Required for isAuthenticated
      authStore.user = {
        id: 'admin-1',
        username: 'adminuser',
        email: 'admin@example.com',
        role: 'admin',
      }

      // Setup: Save reading progress
      const progress: ReadingProgress = {
        novelId: 'novel-admin',
        lastChapter: 6,
        updatedAt: '2024-01-15T10:00:00Z',
      }
      localStorage.setItem('novel_reader:progress:novel-admin', JSON.stringify(progress))

      // Mock novel detail
      const mockNovel: NovelDetail = {
        id: 'novel-admin',
        title: 'Admin Test Novel',
        author: 'Admin Author',
        genre: ['Action'],
        synopsis: 'Testing admin',
        thumbnailUrl: 'https://example.com/admin-thumb.jpg',
        status: 'ongoing',
        chapters: Array.from({ length: 15 }, (_, i) => ({
          number: i + 1,
          title: `Chapter ${i + 1}`,
        })),
      }
      vi.mocked(api.fetchNovelDetail).mockResolvedValue(mockNovel)

      // Navigate to HomePage
      await router.push('/')
      await router.isReady()

      const wrapper = mount(HomePage, {
        global: {
          plugins: [router],
        },
      })

      // Wait for async operations (HomePage + ContinueReadingWidget)
      await flushPromises()
      await wrapper.vm.$nextTick()
      // Additional wait for ContinueReadingWidget's async loadLastRead
      await new Promise(resolve => setTimeout(resolve, 150))
      await wrapper.vm.$nextTick()

      // Assert: Widget should be visible for admin
      expect(wrapper.text()).toContain('Lanjutkan Membaca')
      expect(wrapper.text()).toContain('Admin Test Novel')
    })

    it('hides Continue Reading Widget when authenticated but no reading progress exists', async () => {
      // Setup: Authenticate user
      const authStore = useAuthStore()
      authStore.user = {
        id: 'user-no-progress',
        username: 'noprogressuser',
        email: 'noprogress@example.com',
        role: 'user',
      }

      // Setup: No reading progress in localStorage
      localStorage.clear()

      // Navigate to HomePage
      await router.push('/')
      await router.isReady()

      const wrapper = mount(HomePage, {
        global: {
          plugins: [router],
        },
      })

      // Wait for async operations
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Assert: Widget should NOT be visible (no progress to show)
      expect(wrapper.text()).not.toContain('Lanjutkan Membaca')
      
      // Assert: Other sections should still be visible
      expect(wrapper.text()).toContain('Novel Unggulan')
      expect(wrapper.text()).toContain('Sedang Populer')
    })
  })

  // Integration test: Widget visibility changes with authentication state
  describe('Dynamic authentication state changes', () => {
    it('shows widget when user logs in after page load', async () => {
      // Setup: Start as guest
      const authStore = useAuthStore()
      authStore.user = null

      // Setup: Save reading progress
      const progress: ReadingProgress = {
        novelId: 'novel-dynamic',
        lastChapter: 8,
        updatedAt: '2024-01-15T10:00:00Z',
      }
      localStorage.setItem('novel_reader:progress:novel-dynamic', JSON.stringify(progress))

      // Mock novel detail
      const mockNovel: NovelDetail = {
        id: 'novel-dynamic',
        title: 'Dynamic Test Novel',
        author: 'Dynamic Author',
        genre: ['Romance'],
        synopsis: 'Testing dynamic auth',
        thumbnailUrl: 'https://example.com/dynamic-thumb.jpg',
        status: 'ongoing',
        chapters: Array.from({ length: 20 }, (_, i) => ({
          number: i + 1,
          title: `Chapter ${i + 1}`,
        })),
      }
      vi.mocked(api.fetchNovelDetail).mockResolvedValue(mockNovel)

      // Navigate to HomePage
      await router.push('/')
      await router.isReady()

      const wrapper = mount(HomePage, {
        global: {
          plugins: [router],
        },
      })

      // Wait for async operations
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Assert: Widget should NOT be visible initially (guest)
      expect(wrapper.text()).not.toContain('Lanjutkan Membaca')

      // Simulate login
      authStore.accessToken = 'mock-dynamic-token' // Required for isAuthenticated
      authStore.user = {
        id: 'user-dynamic',
        username: 'dynamicuser',
        email: 'dynamic@example.com',
        role: 'user',
      }
      await wrapper.vm.$nextTick()
      await flushPromises()
      // Additional wait for ContinueReadingWidget's async loadLastRead
      await new Promise(resolve => setTimeout(resolve, 150))
      await wrapper.vm.$nextTick()

      // Assert: Widget should now be visible
      expect(wrapper.text()).toContain('Lanjutkan Membaca')
      expect(wrapper.text()).toContain('Dynamic Test Novel')
    })

    it('maintains correct section order when widget appears/disappears', async () => {
      // Setup: Start with authenticated user
      const authStore = useAuthStore()
      authStore.accessToken = 'mock-order-token' // Required for isAuthenticated
      authStore.user = {
        id: 'user-order',
        username: 'orderuser',
        email: 'order@example.com',
        role: 'user',
      }

      // Setup: Save reading progress
      const progress: ReadingProgress = {
        novelId: 'novel-order',
        lastChapter: 3,
        updatedAt: '2024-01-15T10:00:00Z',
      }
      localStorage.setItem('novel_reader:progress:novel-order', JSON.stringify(progress))

      // Mock novel detail
      const mockNovel: NovelDetail = {
        id: 'novel-order',
        title: 'Order Test Novel',
        author: 'Order Author',
        genre: ['Horror'],
        synopsis: 'Testing order',
        thumbnailUrl: 'https://example.com/order-thumb.jpg',
        status: 'ongoing',
        chapters: Array.from({ length: 10 }, (_, i) => ({
          number: i + 1,
          title: `Chapter ${i + 1}`,
        })),
      }
      vi.mocked(api.fetchNovelDetail).mockResolvedValue(mockNovel)

      // Navigate to HomePage
      await router.push('/')
      await router.isReady()

      const wrapper = mount(HomePage, {
        global: {
          plugins: [router],
        },
      })

      // Wait for async operations (HomePage + ContinueReadingWidget)
      await flushPromises()
      await wrapper.vm.$nextTick()
      // Additional wait for ContinueReadingWidget's async loadLastRead
      await new Promise(resolve => setTimeout(resolve, 150))
      await wrapper.vm.$nextTick()

      // Get initial section order
      const pageText1 = wrapper.text()
      const heroIndex1 = pageText1.indexOf('Novel Unggulan')
      const widgetIndex1 = pageText1.indexOf('Lanjutkan Membaca')
      const trendingIndex1 = pageText1.indexOf('Sedang Populer')

      // Assert: Correct order with widget
      expect(heroIndex1).toBeGreaterThan(-1)
      expect(widgetIndex1).toBeGreaterThan(heroIndex1)
      expect(trendingIndex1).toBeGreaterThan(widgetIndex1)

      // Simulate logout
      authStore.accessToken = null // Clear access token
      authStore.user = null
      await wrapper.vm.$nextTick()

      // Get section order after logout
      const pageText2 = wrapper.text()
      const heroIndex2 = pageText2.indexOf('Novel Unggulan')
      const trendingIndex2 = pageText2.indexOf('Sedang Populer')

      // Assert: Correct order without widget
      expect(heroIndex2).toBeGreaterThan(-1)
      expect(trendingIndex2).toBeGreaterThan(heroIndex2)
      expect(pageText2).not.toContain('Lanjutkan Membaca')
    })
  })

  // Edge case: Widget handles API errors gracefully
  describe('Error handling', () => {
    it('does not break HomePage when Continue Reading Widget fails to load', async () => {
      // Setup: Authenticate user
      const authStore = useAuthStore()
      authStore.accessToken = 'mock-error-token' // Required for isAuthenticated
      authStore.user = {
        id: 'user-error',
        username: 'erroruser',
        email: 'error@example.com',
        role: 'user',
      }

      // Setup: Save reading progress
      const progress: ReadingProgress = {
        novelId: 'novel-error',
        lastChapter: 5,
        updatedAt: '2024-01-15T10:00:00Z',
      }
      localStorage.setItem('novel_reader:progress:novel-error', JSON.stringify(progress))

      // Mock API to reject (novel not found)
      vi.mocked(api.fetchNovelDetail).mockRejectedValue(new Error('Novel not found'))

      // Navigate to HomePage
      await router.push('/')
      await router.isReady()

      const wrapper = mount(HomePage, {
        global: {
          plugins: [router],
        },
      })

      // Wait for async operations
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Assert: Widget should not be visible (failed to load)
      expect(wrapper.text()).not.toContain('Lanjutkan Membaca')
      
      // Assert: Other sections should still be visible and functional
      expect(wrapper.text()).toContain('Novel Unggulan')
      expect(wrapper.text()).toContain('Sedang Populer')
      expect(wrapper.text()).toContain('Update Terbaru')
    })
  })
})
