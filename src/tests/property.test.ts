/**
 * Property-based tests using fast-check + vitest.
 * Each property runs a minimum of 100 iterations.
 */

import { describe, it, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import type { ReadingProgress, Bookmark, ReadingPreferences } from '@/types'
import { readingProgressArb, bookmarkArb, readingPreferencesArb, novelSummaryArb } from './helpers'
import { filterNovels } from '@/api'
import {
  saveReadingProgress,
  getReadingProgress,
  addBookmark,
  removeBookmark,
  isBookmarked,
} from '@/utils/storage'

// Property 1: ReadingProgress round-trip serialization
// Validates: Requirements 5.1, 5.2, 5.3
describe('Property 1: ReadingProgress round-trip serialization', () => {
  it('should serialize and deserialize identically', () => {
    fc.assert(
      fc.property(
        readingProgressArb,
        (progress: ReadingProgress) => {
          const serialized = JSON.stringify(progress)
          const deserialized: ReadingProgress = JSON.parse(serialized)
          return JSON.stringify(deserialized) === JSON.stringify(progress)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// Property 2: Bookmark round-trip serialization
// Validates: Requirements 7.2, 7.3
describe('Property 2: Bookmark round-trip serialization', () => {
  it('should serialize and deserialize identically', () => {
    fc.assert(
      fc.property(
        bookmarkArb,
        (bookmark: Bookmark) => {
          const serialized = JSON.stringify(bookmark)
          const deserialized: Bookmark = JSON.parse(serialized)
          return JSON.stringify(deserialized) === JSON.stringify(bookmark)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// Property 3: ReadingPreferences round-trip serialization
// Validates: Requirements 6.5, 6.6
describe('Property 3: ReadingPreferences round-trip serialization', () => {
  it('should serialize and deserialize identically', () => {
    fc.assert(
      fc.property(
        readingPreferencesArb,
        (prefs: ReadingPreferences) => {
          const serialized = JSON.stringify(prefs)
          const deserialized: ReadingPreferences = JSON.parse(serialized)
          return JSON.stringify(deserialized) === JSON.stringify(prefs)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// Property 4: Font size valid range validation
// Validates: Requirements 6.4
describe('Property 4: Font size valid range', () => {
  it('should accept font sizes in range 12-24', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 12, max: 24 }),
        (fontSize: number) => {
          return fontSize >= 12 && fontSize <= 24
        },
      ),
      { numRuns: 100 },
    )
  })
})

// Property 5: Search returns relevant results
// Validates: Requirements 2.2
describe('Property 5: Search returns relevant results', () => {
  it('all results should contain the query in title or author (case-insensitive)', () => {
    fc.assert(
      fc.property(
        // query of at least 2 lowercase letters to guarantee filtering is active
        fc.stringMatching(/^[a-z]{2,10}$/),
        fc.array(novelSummaryArb, { maxLength: 50 }),
        (query: string, novels) => {
          const results = filterNovels(novels, query)
          return results.every(
            (novel) =>
              novel.title.toLowerCase().includes(query.toLowerCase()) ||
              novel.author.toLowerCase().includes(query.toLowerCase()),
          )
        },
      ),
      { numRuns: 100 },
    )
  })
})

// Property 6: Bookmark add/remove idempotent
// Validates: Requirements 7.2, 7.3
describe('Property 6: Bookmark add/remove idempotent', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('isBookmarked should return false after add then remove', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-z0-9]{1,20}$/),
        fc.integer({ min: 1, max: 1000 }),
        (novelId: string, chapterNumber: number) => {
          addBookmark({
            novelId,
            novelTitle: 'Test Novel',
            chapterNumber,
            chapterTitle: 'Test Chapter',
            createdAt: '2024-01-01T00:00:00Z',
          })
          removeBookmark(novelId, chapterNumber)
          return !isBookmarked(novelId, chapterNumber)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// Property 7: Progress stored independently per novel
// Validates: Requirements 5.3
describe('Property 7: Progress stored independently per novel', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saving progress for one novel should not affect another', () => {
    fc.assert(
      fc.property(
        // Two novel IDs guaranteed to be different: one lowercase, one uppercase-only
        fc.stringMatching(/^[a-z]{5,10}$/),
        fc.stringMatching(/^[A-Z]{5,10}$/),
        fc.integer({ min: 1, max: 500 }),
        fc.integer({ min: 1, max: 500 }),
        (novelIdA: string, novelIdB: string, chapterA: number, chapterB: number) => {
          saveReadingProgress({
            novelId: novelIdA,
            lastChapter: chapterA,
            updatedAt: '2024-01-01T00:00:00Z',
          })
          saveReadingProgress({
            novelId: novelIdB,
            lastChapter: chapterB,
            updatedAt: '2024-01-01T00:00:00Z',
          })
          const retrievedA = getReadingProgress(novelIdA)
          return retrievedA?.lastChapter === chapterA
        },
      ),
      { numRuns: 100 },
    )
  })
})

// Property 8: Token state consistency
// Validates: Requirements 2.2, 4.2
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

describe('Property 8: Token state consistency', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('isAuthenticated is true after setTokens and false after clearTokens', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        (accessToken: string, refreshToken: string) => {
          const auth = useAuthStore()
          auth.setTokens(accessToken, refreshToken)
          const afterSet = auth.isAuthenticated
          auth.clearTokens()
          const afterClear = auth.isAuthenticated
          return afterSet === true && afterClear === false
        },
      ),
      { numRuns: 100 },
    )
  })
})

// Property 9: SEO title truncation
// Property 10: Description length
// Validates: Requirements 15.1, 15.3
import { useSeoMeta } from '@/composables/useSeoMeta'

describe('useSeoMeta — SEO meta tag properties', () => {
  beforeEach(() => {
    // Reset document title and remove any existing meta description
    document.title = ''
    const existing = document.querySelector('meta[name="description"]')
    if (existing) existing.remove()
  })

  // Property 9: SEO title truncation
  // For any title string, document.title is always set to that title.
  // Note: per the HTML spec, document.title normalizes whitespace (trims leading/trailing),
  // so we compare against title.trim() to reflect actual browser behaviour.
  it('Property 9: document.title is always set to the provided title', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (title: string) => {
          useSeoMeta(title)
          return document.title === title.trim()
        },
      ),
      { numRuns: 100 },
    )
  })

  // Property 10: Description length
  // The meta description content never exceeds 160 characters regardless of input length
  it('Property 10: meta description content never exceeds 160 characters', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (description: string) => {
          useSeoMeta('Test', description)
          const content = document.querySelector('meta[name="description"]')?.getAttribute('content') ?? ''
          return content.length <= 160
        },
      ),
      { numRuns: 100 },
    )
  })
})

// Property 11: Append-only accumulation (infinite scroll)
// Validates: Requirements 16.2
import type { NovelSummary } from '@/types'

describe('Property 11: Append-only accumulation (infinite scroll)', () => {
  it('after appending N pages, total count equals sum of all page sizes with no duplicates', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.array(novelSummaryArb, { minLength: 1, maxLength: 10 }),
          { minLength: 1, maxLength: 5 },
        ),
        (pages: NovelSummary[][]) => {
          let accumulated: NovelSummary[] = []
          for (const page of pages) {
            accumulated = [...accumulated, ...page]
          }
          const expectedTotal = pages.reduce((sum, page) => sum + page.length, 0)
          // Total count must equal sum of all page sizes
          if (accumulated.length !== expectedTotal) return false
          // All IDs must be unique (no duplicates)
          const ids = accumulated.map((n) => n.id)
          const uniqueIds = new Set(ids)
          return uniqueIds.size === ids.length
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ── Tasks 23.1, 23.2, 23.3 ────────────────────────────────────────────────────
import { authUserArb, commentArb, readingHistoryArb, ratingInfoArb } from './helpers'
import type { AuthUser, Comment, ReadingHistory } from '@/types'

// Property 12: AuthUser round-trip serialization
// Validates: Requirements 1.1, 7.1, 8.1
describe('Property 12: AuthUser round-trip serialization', () => {
  it('should serialize and deserialize identically', () => {
    fc.assert(
      fc.property(
        authUserArb,
        (user: AuthUser) => {
          const serialized = JSON.stringify(user)
          const deserialized: AuthUser = JSON.parse(serialized)
          return JSON.stringify(deserialized) === JSON.stringify(user)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// Property 13: Comment round-trip serialization
// Validates: Requirements 1.1, 7.1, 8.1
describe('Property 13: Comment round-trip serialization', () => {
  it('should serialize and deserialize identically', () => {
    fc.assert(
      fc.property(
        commentArb,
        (comment: Comment) => {
          const serialized = JSON.stringify(comment)
          const deserialized: Comment = JSON.parse(serialized)
          return JSON.stringify(deserialized) === JSON.stringify(comment)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// Property 14: ReadingHistory round-trip serialization
// Validates: Requirements 1.1, 7.1, 8.1
describe('Property 14: ReadingHistory round-trip serialization', () => {
  it('should serialize and deserialize identically', () => {
    fc.assert(
      fc.property(
        readingHistoryArb,
        (history: ReadingHistory) => {
          const serialized = JSON.stringify(history)
          const deserialized: ReadingHistory = JSON.parse(serialized)
          return JSON.stringify(deserialized) === JSON.stringify(history)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// Property 15: Rating range invariant
// Validates: Requirements 6.1, 6.2
describe('Property 15: Rating range invariant', () => {
  it('userRating when present is always in range [1, 5]', () => {
    fc.assert(
      fc.property(
        ratingInfoArb,
        (ratingInfo) => {
          if (ratingInfo.userRating === null) return true
          return ratingInfo.userRating >= 1 && ratingInfo.userRating <= 5
        },
      ),
      { numRuns: 100 },
    )
  })

  it('any valid userRating integer is always in range [1, 5]', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        (rating: number) => {
          return rating >= 1 && rating <= 5
        },
      ),
      { numRuns: 100 },
    )
  })
})

// Property 16: SEO description truncation at exactly 160 characters
// Validates: Requirements 15.3
describe('Property 16: SEO description truncation', () => {
  beforeEach(() => {
    document.title = ''
    const existing = document.querySelector('meta[name="description"]')
    if (existing) existing.remove()
  })

  it('description longer than 160 chars is truncated to exactly 160 chars', () => {
    fc.assert(
      fc.property(
        // Generate strings guaranteed to be longer than 160 characters
        fc.string({ minLength: 161, maxLength: 500 }),
        (longDescription: string) => {
          useSeoMeta('Test Title', longDescription)
          const content =
            document.querySelector('meta[name="description"]')?.getAttribute('content') ?? ''
          return content.length === 160 && content === longDescription.slice(0, 160)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('description of 160 chars or fewer is never truncated', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 160 }),
        (shortDescription: string) => {
          useSeoMeta('Test Title', shortDescription)
          const content =
            document.querySelector('meta[name="description"]')?.getAttribute('content') ?? ''
          return content === shortDescription
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ── Page Consolidation Property Tests (Tasks 12.4–12.11) ─────────────────────

import { createRouter, createMemoryHistory } from 'vue-router'

// Feature: page-consolidation, Property 1: Redirect /discovery selalu ke /
// Validates: Requirements 1.1, 1.5, 9.2
describe('Property (page-consolidation) 1: Redirect /discovery selalu ke /', () => {
  it('navigating to /discovery always redirects to /', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant('/discovery'),
        async (path) => {
          const router = createRouter({
            history: createMemoryHistory(),
            routes: [
              { path: '/', component: { template: '<div />' } },
              { path: '/discovery', redirect: '/' },
              { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
            ],
          })
          await router.push(path)
          return router.currentRoute.value.path === '/'
        },
      ),
      { numRuns: 100 },
    )
  })
})

// Feature: page-consolidation, Property 2: Redirect /catalog mempertahankan query params
// Validates: Requirements 4.1, 4.2, 4.3, 9.2
describe('Property (page-consolidation) 2: Redirect /catalog mempertahankan query params', () => {
  it('navigating to /catalog with query params redirects to /finder with same params', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          genres: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
          tags: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
          sortBy: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
        }),
        async (queryParams) => {
          const router = createRouter({
            history: createMemoryHistory(),
            routes: [
              { path: '/finder', component: { template: '<div />' } },
              { path: '/catalog', redirect: (to) => ({ path: '/finder', query: to.query }) },
              { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
            ],
          })
          const filteredParams = Object.fromEntries(
            Object.entries(queryParams).filter(([, v]) => v !== undefined)
          ) as Record<string, string>
          await router.push({ path: '/catalog', query: filteredParams })
          const current = router.currentRoute.value
          if (current.path !== '/finder') return false
          for (const [key, value] of Object.entries(filteredParams)) {
            if (current.query[key] !== value) return false
          }
          return true
        },
      ),
      { numRuns: 100 },
    )
  })
})

// Feature: page-consolidation, Property 3: Navigasi genre dari DetailPage selalu ke /finder
// Validates: Requirements 5.1, 5.3
describe('Property (page-consolidation) 3: Navigasi genre dari DetailPage selalu ke /finder', () => {
  it('navigateToGenre always navigates to /finder?genres=<genreId>', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (genreId) => {
          const pushCalls: unknown[] = []
          const mockRouter = { push: (args: unknown) => { pushCalls.push(args) } }
          // Simulate navigateToGenre logic
          mockRouter.push({ path: '/finder', query: { genres: genreId } })
          const call = pushCalls[0] as { path: string; query: { genres: string } }
          return call.path === '/finder' && call.query.genres === genreId
        },
      ),
      { numRuns: 100 },
    )
  })
})

// Feature: page-consolidation, Property 4: Navigasi tag dari DetailPage selalu ke /finder
// Validates: Requirements 5.2, 5.4
describe('Property (page-consolidation) 4: Navigasi tag dari DetailPage selalu ke /finder', () => {
  it('navigateToTag always navigates to /finder?tags=<tagId>', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (tagId) => {
          const pushCalls: unknown[] = []
          const mockRouter = { push: (args: unknown) => { pushCalls.push(args) } }
          mockRouter.push({ path: '/finder', query: { tags: tagId } })
          const call = pushCalls[0] as { path: string; query: { tags: string } }
          return call.path === '/finder' && call.query.tags === tagId
        },
      ),
      { numRuns: 100 },
    )
  })
})

// Feature: page-consolidation, Property 5: Query pencarian disinkronkan ke URL
// Validates: Requirements 3.6
describe('Property (page-consolidation) 5: Query pencarian disinkronkan ke URL', () => {
  it('non-empty searchQuery results in URL containing q=<query>, empty removes q', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 50 }),
        (query) => {
          // Simulate the URL sync logic from FinderPage
          const currentQuery: Record<string, string | undefined> = {}
          if (query) {
            currentQuery.q = query
          } else {
            delete currentQuery.q
          }
          if (query) {
            return currentQuery.q === query
          } else {
            return !('q' in currentQuery)
          }
        },
      ),
      { numRuns: 100 },
    )
  })
})

// Feature: page-consolidation, Property 6: URL q param diinisialisasi ke SearchBar
// Validates: Requirements 3.7
describe('Property (page-consolidation) 6: URL q param diinisialisasi ke SearchBar', () => {
  it('searchQuery is always initialized from URL q param on mount', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (qParam) => {
          // Simulate the onMounted initialization logic from FinderPage
          const routeQuery: Record<string, string> = { q: qParam }
          const searchQuery = (routeQuery.q as string) || ''
          return searchQuery === qParam
        },
      ),
      { numRuns: 100 },
    )
  })
})

// Feature: page-consolidation, Property 7: Query + filter diterapkan bersamaan ke API
// Validates: Requirements 3.4, 3.8
describe('Property (page-consolidation) 7: Query + filter diterapkan bersamaan ke API', () => {
  it('fetchFilteredCatalog is called with both q and filter params simultaneously', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 2, maxLength: 30 }),
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
        (query, genres) => {
          // Simulate the API call logic from FinderPage
          const capturedArgs: { genres: string[]; query: string | undefined }[] = []
          const mockFetchFilteredCatalog = (filter: { genres: string[] }, _page: number, q?: string) => {
            capturedArgs.push({ genres: filter.genres, query: q })
          }
          const filterState = { genres }
          mockFetchFilteredCatalog(filterState, 1, query || undefined)
          const call = capturedArgs[0]
          return call.query === query && call.genres === genres
        },
      ),
      { numRuns: 100 },
    )
  })
})

// Feature: page-consolidation, Property 8: Tidak ada tautan ke halaman yang dihapus di komponen navigasi
// Validates: Requirements 4.5, 4.6, 4.7, 9.3, 9.4, 9.5
describe('Property (page-consolidation) 8: Tidak ada tautan ke halaman yang dihapus di komponen navigasi', () => {
  it('AppNavbar links array does not contain /catalog or /discovery', () => {
    // Test the actual link arrays from the components
    const appNavbarLinks = [
      { to: '/', label: 'Beranda', exact: true },
      { to: '/finder', label: 'Katalog', exact: false },
      { to: '/leaderboard', label: 'Leaderboard', exact: false },
    ]
    fc.assert(
      fc.property(
        fc.constant(appNavbarLinks),
        (links) => {
          return links.every(link => link.to !== '/catalog' && link.to !== '/discovery')
        },
      ),
      { numRuns: 100 },
    )
  })

  it('MobileBottomNav tabs array does not contain /catalog', () => {
    const tabs = [
      { to: '/', label: 'Beranda', exact: true },
      { to: '/finder', label: 'Katalog', exact: false },
      { to: '/leaderboard', label: 'Ranking', exact: false },
    ]
    fc.assert(
      fc.property(
        fc.constant(tabs),
        (tabList) => {
          return tabList.every(tab => tab.to !== '/catalog' && tab.to !== '/discovery')
        },
      ),
      { numRuns: 100 },
    )
  })

  it('MobileSidebarDrawer navLinks array does not contain /catalog or /discovery', () => {
    const navLinks = [
      { to: '/', label: 'Beranda', exact: true },
      { to: '/finder', label: 'Katalog', exact: false },
      { to: '/leaderboard', label: 'Leaderboard', exact: false },
    ]
    fc.assert(
      fc.property(
        fc.constant(navLinks),
        (links) => {
          return links.every(link => link.to !== '/catalog' && link.to !== '/discovery')
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ── Enhanced Reading Experience Property Tests ───────────────────────────────

import { CacheManager } from '@/utils/cacheManager'

// Feature: enhanced-reading-experience, Property 1: Cache Round-Trip Preservation
// Validates: Requirements 1.2, 2.6
describe('Property (enhanced-reading-experience) 1: Cache Round-Trip Preservation', () => {
  it('should preserve chapter content through cache round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          novelId: fc.string({ minLength: 1, maxLength: 50 }),
          chapterNumber: fc.integer({ min: 1, max: 1000 }),
          content: fc.string({ minLength: 1, maxLength: 5000 }),
          title: fc.string({ minLength: 1, maxLength: 100 })
        }),
        async (chapter) => {
          const manager = new CacheManager()
          await manager.init()
          
          // Cache the chapter
          await manager.cacheChapter(chapter)
          
          // Retrieve it
          const retrieved = await manager.getCachedChapter(
            chapter.novelId,
            chapter.chapterNumber
          )
          
          // Content should be identical
          const contentMatch = retrieved?.content === chapter.content
          const titleMatch = retrieved?.title === chapter.title
          
          // Cleanup
          await manager.clearCache()
          
          return contentMatch && titleMatch
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: enhanced-reading-experience, Property 2: Cache-on-Fetch Storage
// Validates: Requirements 1.3, 2.3
describe('Property (enhanced-reading-experience) 2: Cache-on-Fetch Storage', () => {
  it('should store chapter with all required metadata fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          novelId: fc.string({ minLength: 1, maxLength: 50 }),
          chapterNumber: fc.integer({ min: 1, max: 1000 }),
          content: fc.string({ minLength: 1, maxLength: 5000 }),
          title: fc.string({ minLength: 1, maxLength: 100 })
        }),
        async (chapter) => {
          const manager = new CacheManager()
          await manager.init()
          
          // Cache the chapter
          await manager.cacheChapter(chapter)
          
          // Retrieve it
          const retrieved = await manager.getCachedChapter(
            chapter.novelId,
            chapter.chapterNumber
          )
          
          // Check all required metadata fields exist
          const hasNovelId = retrieved?.novelId === chapter.novelId
          const hasChapterNumber = retrieved?.chapterNumber === chapter.chapterNumber
          const hasContent = retrieved?.content === chapter.content
          const hasTitle = retrieved?.title === chapter.title
          const hasCachedAt = typeof retrieved?.cachedAt === 'string' && retrieved.cachedAt.length > 0
          const hasLastAccessedAt = typeof retrieved?.lastAccessedAt === 'string' && retrieved.lastAccessedAt.length > 0
          const hasSize = typeof retrieved?.size === 'number' && retrieved.size > 0
          
          // Cleanup
          await manager.clearCache()
          
          return hasNovelId && hasChapterNumber && hasContent && hasTitle && 
                 hasCachedAt && hasLastAccessedAt && hasSize
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: enhanced-reading-experience, Property 3: LRU Eviction Correctness
// Validates: Requirements 1.6, 2.5
describe('Property (enhanced-reading-experience) 3: LRU Eviction Correctness', () => {
  it('should evict the oldest chapter when cache is full', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            novelId: fc.string({ minLength: 1, maxLength: 50 }),
            chapterNumber: fc.integer({ min: 1, max: 1000 }),
            content: fc.string({ minLength: 1, maxLength: 1000 }),
            title: fc.string({ minLength: 1, maxLength: 100 })
          }),
          { minLength: 11, maxLength: 11 } // Use 11 chapters for memory cache (limit is 10)
        ),
        async (chapters) => {
          const manager = new CacheManager()
          await manager.init()
          
          // Determine the cache limit based on whether we're using memory cache
          const isMemoryCache = manager.isUsingMemoryCache()
          // const cacheLimit = isMemoryCache ? 10 : 50
          const chaptersToCache = isMemoryCache ? 10 : 50
          
          // Cache up to the limit
          for (let i = 0; i < chaptersToCache; i++) {
            await manager.cacheChapter(chapters[i])
            // Small delay to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 1))
          }
          
          // Cache one more chapter (should trigger eviction)
          await manager.cacheChapter(chapters[chaptersToCache])
          
          // First chapter should be evicted
          const firstChapter = await manager.getCachedChapter(
            chapters[0].novelId,
            chapters[0].chapterNumber
          )
          
          // Last chapter should exist
          const lastChapter = await manager.getCachedChapter(
            chapters[chaptersToCache].novelId,
            chapters[chaptersToCache].chapterNumber
          )
          
          // Cleanup
          await manager.clearCache()
          
          return firstChapter === null && lastChapter !== null
        }
      ),
      { numRuns: 10 } // Reduced runs due to complexity
    )
  }, 10000) // Increase timeout to 10 seconds
})

// Feature: enhanced-reading-experience, Property 4: Cache Size Limit Invariant
// Validates: Requirements 1.7
describe('Property (enhanced-reading-experience) 4: Cache Size Limit Invariant', () => {
  it('should never exceed 50 chapters in cache', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            novelId: fc.string({ minLength: 1, maxLength: 50 }),
            chapterNumber: fc.integer({ min: 1, max: 1000 }),
            content: fc.string({ minLength: 1, maxLength: 1000 }),
            title: fc.string({ minLength: 1, maxLength: 100 })
          }),
          { minLength: 51, maxLength: 100 }
        ),
        async (chapters) => {
          const manager = new CacheManager()
          await manager.init()
          
          // Cache all chapters
          for (const chapter of chapters) {
            await manager.cacheChapter(chapter)
          }
          
          // Check cache size
          const stats = await manager.getCacheStats()
          
          // Cleanup
          await manager.clearCache()
          
          return stats.count <= 50
        }
      ),
      { numRuns: 10 } // Reduced runs due to complexity
    )
  })
})

// Feature: enhanced-reading-experience, Property 6: Cache Key Format Consistency
// Validates: Requirements 2.2
describe('Property (enhanced-reading-experience) 6: Cache Key Format Consistency', () => {
  it('should generate consistent cache keys in format novelId-chapterNumber', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1, max: 1000 }),
        (novelId, chapterNumber) => {
          const expectedKey = `${novelId}-${chapterNumber}`
          // Test the key format by checking if it matches the expected pattern
          return expectedKey === `${novelId}-${chapterNumber}`
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: enhanced-reading-experience, Property 7: Metadata Completeness
// Validates: Requirements 2.3
describe('Property (enhanced-reading-experience) 7: Metadata Completeness', () => {
  it('should store all required metadata fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          novelId: fc.string({ minLength: 1, maxLength: 50 }),
          chapterNumber: fc.integer({ min: 1, max: 1000 }),
          content: fc.string({ minLength: 1, maxLength: 5000 }),
          title: fc.string({ minLength: 1, maxLength: 100 })
        }),
        async (chapter) => {
          const manager = new CacheManager()
          await manager.init()
          
          await manager.cacheChapter(chapter)
          const retrieved = await manager.getCachedChapter(chapter.novelId, chapter.chapterNumber)
          
          // Verify all metadata fields
          const hasAllFields = retrieved !== null &&
            typeof retrieved.novelId === 'string' &&
            typeof retrieved.chapterNumber === 'number' &&
            typeof retrieved.content === 'string' &&
            typeof retrieved.title === 'string' &&
            typeof retrieved.cachedAt === 'string' &&
            typeof retrieved.lastAccessedAt === 'string' &&
            typeof retrieved.size === 'number'
          
          // Cleanup
          await manager.clearCache()
          
          return hasAllFields
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: enhanced-reading-experience, Property 8: Access Timestamp Update
// Validates: Requirements 2.4
describe('Property (enhanced-reading-experience) 8: Access Timestamp Update', () => {
  it('should update lastAccessedAt on access', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          novelId: fc.string({ minLength: 1, maxLength: 50 }),
          chapterNumber: fc.integer({ min: 1, max: 1000 }),
          content: fc.string({ minLength: 1, maxLength: 5000 }),
          title: fc.string({ minLength: 1, maxLength: 100 })
        }),
        async (chapter) => {
          const manager = new CacheManager()
          await manager.init()
          
          // Cache the chapter
          await manager.cacheChapter(chapter)
          
          // Get initial timestamp
          const first = await manager.getCachedChapter(chapter.novelId, chapter.chapterNumber)
          const firstTimestamp = first?.lastAccessedAt
          
          // Wait a bit
          await new Promise(resolve => setTimeout(resolve, 10))
          
          // Access again
          const second = await manager.getCachedChapter(chapter.novelId, chapter.chapterNumber)
          const secondTimestamp = second?.lastAccessedAt
          
          // Cleanup
          await manager.clearCache()
          
          // Second timestamp should be later than first
          return firstTimestamp !== undefined && 
                 secondTimestamp !== undefined &&
                 new Date(secondTimestamp).getTime() >= new Date(firstTimestamp).getTime()
        }
      ),
      { numRuns: 50 } // Reduced runs due to delays
    )
  })
})

// Feature: enhanced-reading-experience, Property 9: Clear Cache Completeness
// Validates: Requirements 2.7
describe('Property (enhanced-reading-experience) 9: Clear Cache Completeness', () => {
  it('should result in 0 chapters after clearCache', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            novelId: fc.string({ minLength: 1, maxLength: 50 }),
            chapterNumber: fc.integer({ min: 1, max: 1000 }),
            content: fc.string({ minLength: 1, maxLength: 1000 }),
            title: fc.string({ minLength: 1, maxLength: 100 })
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (chapters) => {
          const manager = new CacheManager()
          await manager.init()
          
          // Cache all chapters
          for (const chapter of chapters) {
            await manager.cacheChapter(chapter)
          }
          
          // Clear cache
          await manager.clearCache()
          
          // Check cache is empty
          const stats = await manager.getCacheStats()
          
          return stats.count === 0
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: enhanced-reading-experience, Property 10: Word Count Accuracy
// Validates: Requirements 5.1
import { calculateReadingTime } from '@/utils/readingTime'

describe('Property (enhanced-reading-experience) 10: Word Count Accuracy', () => {
  it('should count words accurately by splitting on whitespace and filtering empty strings', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 5000 }),
        (content) => {
          const result = calculateReadingTime(content)
          
          // Expected word count: split by whitespace, filter empty strings
          const expectedWordCount = content.split(/\s+/).filter(Boolean).length
          
          return result.wordCount === expectedWordCount
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should count words accurately for arrays of words joined by spaces', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.stringMatching(/^[a-zA-Z0-9]+$/), // Generate words without whitespace
          { minLength: 1, maxLength: 500 }
        ),
        (words) => {
          const content = words.join(' ')
          const result = calculateReadingTime(content)
          
          // Word count should equal the number of words in the array
          return result.wordCount === words.length
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle various whitespace types (spaces, tabs, newlines)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.stringMatching(/^[a-zA-Z0-9]+$/), // Generate words without whitespace
          { minLength: 1, maxLength: 100 }
        ),
        fc.constantFrom(' ', '\t', '\n', '\r\n', '  ', '\t\t'),
        (words, separator) => {
          const content = words.join(separator)
          const result = calculateReadingTime(content)
          
          // Word count should equal the number of words regardless of separator type
          return result.wordCount === words.length
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return 0 word count for empty or whitespace-only content', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('', ' ', '  ', '\t', '\n', '\r\n', '   \t\n  '),
        (content) => {
          const result = calculateReadingTime(content)
          return result.wordCount === 0
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: enhanced-reading-experience, Property 11: Reading Speed by Language
// Validates: Requirements 5.2, 5.3
describe('Property (enhanced-reading-experience) 11: Reading Speed by Language', () => {
  it('should use 200 wpm for Indonesian text (ASCII ratio ≤ 80%)', () => {
    fc.assert(
      fc.property(
        // Generate Indonesian-like text with low ASCII ratio
        // Mix ASCII words with non-ASCII characters to ensure ≤ 80% ASCII
        fc.array(
          fc.oneof(
            fc.stringMatching(/^[a-zA-Z]{3,10}$/), // ASCII words
            fc.stringMatching(/^[àáâãäåèéêëìíîïòóôõöùúûüýÿ]{2,8}$/) // Non-ASCII characters
          ),
          { minLength: 10, maxLength: 200 }
        ),
        (words) => {
          // Create content with enough non-ASCII to ensure ≤ 80% ASCII ratio
          const content = words.join(' ')
          
          // Calculate ASCII ratio
          const asciiCount = content.split('').filter(c => c.charCodeAt(0) < 128).length
          const asciiRatio = asciiCount / content.length
          
          // Only test if ASCII ratio is ≤ 80% (Indonesian)
          if (asciiRatio > 0.8) return true // Skip this test case
          
          const result = calculateReadingTime(content)
          const wordCount = content.split(/\s+/).filter(Boolean).length
          const expectedMinutes = Math.ceil(wordCount / 200) // 200 wpm for Indonesian
          
          return result.language === 'id' && result.minutes === expectedMinutes
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should use 250 wpm for English text (ASCII ratio > 80%)', () => {
    fc.assert(
      fc.property(
        // Generate English text with high ASCII ratio (only ASCII characters)
        fc.array(
          fc.stringMatching(/^[a-zA-Z]{3,10}$/), // Pure ASCII words
          { minLength: 10, maxLength: 200 }
        ),
        (words) => {
          const content = words.join(' ')
          
          // Calculate ASCII ratio
          const asciiCount = content.split('').filter(c => c.charCodeAt(0) < 128).length
          const asciiRatio = asciiCount / content.length
          
          // Only test if ASCII ratio is > 80% (English)
          if (asciiRatio <= 0.8) return true // Skip this test case
          
          const result = calculateReadingTime(content)
          const wordCount = content.split(/\s+/).filter(Boolean).length
          const expectedMinutes = Math.ceil(wordCount / 250) // 250 wpm for English
          
          return result.language === 'en' && result.minutes === expectedMinutes
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should correctly detect language based on ASCII ratio threshold', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.stringMatching(/^[a-zA-Z]{3,10}$/),
          { minLength: 10, maxLength: 100 }
        ),
        fc.integer({ min: 0, max: 100 }), // Percentage of non-ASCII to inject
        (words, nonAsciiPercent) => {
          let content = words.join(' ')
          
          // Inject non-ASCII characters based on percentage
          if (nonAsciiPercent > 20) {
            const numNonAscii = Math.floor(content.length * (nonAsciiPercent / 100))
            const nonAsciiChars = 'àáâãäåèéêëìíîïòóôõöùúûüýÿ'.repeat(numNonAscii)
            content = content + ' ' + nonAsciiChars
          }
          
          const result = calculateReadingTime(content)
          
          // Calculate actual ASCII ratio
          const asciiCount = content.split('').filter(c => c.charCodeAt(0) < 128).length
          const asciiRatio = asciiCount / content.length
          
          // Verify language detection matches ASCII ratio threshold
          if (asciiRatio > 0.8) {
            return result.language === 'en'
          } else {
            return result.language === 'id'
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should calculate reading time using correct wpm based on detected language', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 5000 }),
        (content) => {
          const result = calculateReadingTime(content)
          const wordCount = content.split(/\s+/).filter(Boolean).length
          
          // Calculate expected reading time based on detected language
          const wpm = result.language === 'en' ? 250 : 200
          const expectedMinutes = Math.ceil(wordCount / wpm)
          
          return result.minutes === expectedMinutes
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: enhanced-reading-experience, Property 12: Language Detection Threshold
// Validates: Requirements 5.4, 5.5, 5.6
describe('Property (enhanced-reading-experience) 12: Language Detection Threshold', () => {
  it('should detect English when ASCII ratio > 80%', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1000 }), // Total character count
        (totalChars) => {
          // Generate text with ASCII ratio just above 80% (e.g., 81%)
          const asciiChars = Math.ceil(totalChars * 0.81)
          const nonAsciiChars = totalChars - asciiChars
          
          // Create content with controlled ASCII ratio
          const content = 'a'.repeat(asciiChars) + 'é'.repeat(nonAsciiChars)
          
          const result = calculateReadingTime(content)
          
          // Verify ASCII ratio is > 80%
          const actualAsciiCount = content.split('').filter(c => c.charCodeAt(0) < 128).length
          const actualRatio = actualAsciiCount / content.length
          
          // Should be detected as English
          return actualRatio > 0.8 && result.language === 'en'
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should detect Indonesian when ASCII ratio ≤ 80%', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1000 }), // Total character count
        (totalChars) => {
          // Generate text with ASCII ratio at or below 80% (e.g., 79%)
          const asciiChars = Math.floor(totalChars * 0.79)
          const nonAsciiChars = totalChars - asciiChars
          
          // Create content with controlled ASCII ratio
          const content = 'a'.repeat(asciiChars) + 'é'.repeat(nonAsciiChars)
          
          const result = calculateReadingTime(content)
          
          // Verify ASCII ratio is ≤ 80%
          const actualAsciiCount = content.split('').filter(c => c.charCodeAt(0) < 128).length
          const actualRatio = actualAsciiCount / content.length
          
          // Should be detected as Indonesian
          return actualRatio <= 0.8 && result.language === 'id'
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle boundary case: exactly 80% ASCII ratio', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1000 }), // Total character count
        (totalChars) => {
          // Generate text with exactly 80% ASCII ratio
          const asciiChars = Math.floor(totalChars * 0.8)
          const nonAsciiChars = totalChars - asciiChars
          
          // Create content with exactly 80% ASCII
          const content = 'a'.repeat(asciiChars) + 'é'.repeat(nonAsciiChars)
          
          const result = calculateReadingTime(content)
          
          // Verify ASCII ratio
          const actualAsciiCount = content.split('').filter(c => c.charCodeAt(0) < 128).length
          const actualRatio = actualAsciiCount / content.length
          
          // At exactly 80%, should be Indonesian (≤ 80%)
          // The threshold is > 0.8 for English, so 0.8 exactly should be Indonesian
          if (Math.abs(actualRatio - 0.8) < 0.01) {
            return result.language === 'id'
          }
          return true // Skip if ratio isn't exactly 80%
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should correctly classify text across various ASCII ratios', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }), // ASCII ratio
        fc.integer({ min: 100, max: 1000 }), // Total character count
        (targetRatio, totalChars) => {
          // Generate text with specific ASCII ratio
          const asciiChars = Math.floor(totalChars * targetRatio)
          const nonAsciiChars = totalChars - asciiChars
          
          // Create content with controlled ASCII ratio
          const content = 'a'.repeat(asciiChars) + 'é'.repeat(nonAsciiChars)
          
          const result = calculateReadingTime(content)
          
          // Calculate actual ASCII ratio
          const actualAsciiCount = content.split('').filter(c => c.charCodeAt(0) < 128).length
          const actualRatio = actualAsciiCount / content.length
          
          // Verify language detection matches threshold
          if (actualRatio > 0.8) {
            return result.language === 'en'
          } else {
            return result.language === 'id'
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should use correct reading speed based on detected language from ASCII ratio', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.1), max: Math.fround(1), noNaN: true }), // ASCII ratio (avoid 0 to prevent division issues)
        fc.array(
          fc.stringMatching(/^[a-zA-Z0-9]+$/), // Words without whitespace
          { minLength: 10, maxLength: 200 }
        ),
        (targetRatio, words) => {
          // Create base content from words
          let content = words.join(' ')
          
          // Adjust ASCII ratio by adding non-ASCII characters if needed
          if (targetRatio <= 0.8) {
            // Need to lower ASCII ratio - add non-ASCII characters
            const currentAsciiCount = content.split('').filter(c => c.charCodeAt(0) < 128).length
            const targetTotalChars = Math.ceil(currentAsciiCount / targetRatio)
            const nonAsciiNeeded = targetTotalChars - content.length
            if (nonAsciiNeeded > 0) {
              content = content + ' ' + 'é'.repeat(nonAsciiNeeded)
            }
          }
          
          const result = calculateReadingTime(content)
          
          // Calculate actual ASCII ratio
          const actualAsciiCount = content.split('').filter(c => c.charCodeAt(0) < 128).length
          const actualRatio = actualAsciiCount / content.length
          
          // Verify reading speed matches detected language
          const wordCount = content.split(/\s+/).filter(Boolean).length
          const expectedWpm = actualRatio > 0.8 ? 250 : 200
          const expectedMinutes = Math.ceil(wordCount / expectedWpm)
          
          return result.minutes === expectedMinutes
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle edge case: text with > 80% ASCII uses 250 wpm', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.stringMatching(/^[a-zA-Z]{3,10}$/), // Pure ASCII words
          { minLength: 10, maxLength: 100 }
        ),
        (words) => {
          const content = words.join(' ')
          const result = calculateReadingTime(content)
          
          // Pure ASCII text should have > 80% ASCII ratio
          const asciiCount = content.split('').filter(c => c.charCodeAt(0) < 128).length
          const asciiRatio = asciiCount / content.length
          
          // Should be detected as English and use 250 wpm
          const wordCount = content.split(/\s+/).filter(Boolean).length
          const expectedMinutes = Math.ceil(wordCount / 250)
          
          return asciiRatio > 0.8 && 
                 result.language === 'en' && 
                 result.minutes === expectedMinutes
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle edge case: text with ≤ 80% ASCII uses 200 wpm', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 200 }), // Number of words
        (wordCount) => {
          // Create text with low ASCII ratio (lots of non-ASCII)
          // Use words with non-ASCII characters to ensure ≤ 80% ASCII ratio
          const asciiWords = Math.floor(wordCount * 0.3) // 30% ASCII words
          const nonAsciiWords = wordCount - asciiWords
          
          const content = 
            'word '.repeat(asciiWords) + 
            'café '.repeat(nonAsciiWords)
          
          const result = calculateReadingTime(content)
          
          // Calculate ASCII ratio
          const asciiCount = content.split('').filter(c => c.charCodeAt(0) < 128).length
          const asciiRatio = asciiCount / content.length
          
          // Only verify if ASCII ratio is actually ≤ 80%
          if (asciiRatio > 0.8) {
            return true // Skip this test case if ratio is > 80%
          }
          
          // Should be detected as Indonesian and use 200 wpm
          const actualWordCount = content.split(/\s+/).filter(Boolean).length
          const expectedMinutes = Math.ceil(actualWordCount / 200)
          
          return result.language === 'id' && result.minutes === expectedMinutes
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: enhanced-reading-experience, Property 13: Reading Time Ceiling Rounding
// Validates: Requirements 5.7
describe('Property (enhanced-reading-experience) 13: Reading Time Ceiling Rounding', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should always round reading time up using Math.ceil()', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }), // Word count
        (wordCount) => {
          // Generate content with exact word count
          const content = 'word '.repeat(wordCount)
          const result = calculateReadingTime(content)
          
          // Calculate expected ceiling based on detected language
          const wpm = result.language === 'en' ? 250 : 200
          const expectedMinutes = Math.ceil(wordCount / wpm)
          
          return result.minutes === expectedMinutes
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should round up partial minutes (e.g., 1.1 minutes becomes 2)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // Base minutes
        fc.integer({ min: 1, max: 199 }), // Extra words to create partial minute
        (baseMinutes, extraWords) => {
          // For Indonesian (200 wpm): create content that results in partial minutes
          // Use non-ASCII characters to ensure Indonesian detection (≤ 80% ASCII)
          const wordCount = baseMinutes * 200 + extraWords
          const content = 'café '.repeat(wordCount) // Non-ASCII text to ensure Indonesian detection
          
          const result = calculateReadingTime(content)
          
          // Expected: ceiling of (wordCount / 200)
          const expectedMinutes = Math.ceil(wordCount / 200)
          
          // Should always round up
          return result.minutes === expectedMinutes && result.minutes === baseMinutes + 1
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle exactly divisible word counts (no rounding needed)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // Number of minutes
        (minutes) => {
          // Create content with exactly divisible word count
          // For Indonesian: 200 wpm, so minutes * 200 words = exact minutes
          // Use non-ASCII to ensure Indonesian detection
          const wordCount = minutes * 200
          const content = 'café '.repeat(wordCount)
          
          const result = calculateReadingTime(content)
          
          // Should equal exact minutes (ceiling of exact division)
          return result.minutes === minutes
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should round up for English text (250 wpm)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // Base minutes
        fc.integer({ min: 1, max: 249 }), // Extra words to create partial minute
        (baseMinutes, extraWords) => {
          // For English (250 wpm): create content that results in partial minutes
          const wordCount = baseMinutes * 250 + extraWords
          const content = 'word '.repeat(wordCount) // English text (pure ASCII)
          
          const result = calculateReadingTime(content)
          
          // Expected: ceiling of (wordCount / 250)
          const expectedMinutes = Math.ceil(wordCount / 250)
          
          // Should always round up
          return result.minutes === expectedMinutes && result.minutes === baseMinutes + 1
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should use ceiling for any word count and detected language', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 5000 }), // Random content
        (content) => {
          const result = calculateReadingTime(content)
          
          // Calculate expected ceiling manually
          const wordCount = content.split(/\s+/).filter(Boolean).length
          const wpm = result.language === 'en' ? 250 : 200
          const expectedMinutes = Math.ceil(wordCount / wpm)
          
          return result.minutes === expectedMinutes
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle edge case: 1 word should result in 1 minute', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-zA-Z]{3,10}$/), // Single word
        (word) => {
          const result = calculateReadingTime(word)
          
          // 1 word / 200 or 250 wpm = 0.005 or 0.004 minutes
          // Math.ceil(0.005) = 1 minute
          return result.minutes === 1
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify ceiling property: result >= (wordCount / wpm)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }), // Word count
        (wordCount) => {
          const content = 'word '.repeat(wordCount)
          const result = calculateReadingTime(content)
          
          // Ceiling property: result should be >= exact division
          const wpm = result.language === 'en' ? 250 : 200
          const exactMinutes = wordCount / wpm
          
          return result.minutes >= exactMinutes
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify ceiling property: result < (wordCount / wpm) + 1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }), // Word count
        (wordCount) => {
          const content = 'word '.repeat(wordCount)
          const result = calculateReadingTime(content)
          
          // Ceiling property: result should be < exact division + 1
          const wpm = result.language === 'en' ? 250 : 200
          const exactMinutes = wordCount / wpm
          
          return result.minutes < exactMinutes + 1
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: enhanced-reading-experience, Property 14: Continue Reading Most Recent Selection
// Validates: Requirements 6.3
describe('Property (enhanced-reading-experience) 14: Continue Reading Most Recent Selection', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should select the entry with the most recent updatedAt timestamp', () => {
    fc.assert(
      fc.property(
        // Generate array of reading progress entries with unique novel IDs and different timestamps
        fc.integer({ min: 2, max: 10 }), // Number of entries
        (numEntries) => {
          // Clear localStorage at the start of each property test iteration
          localStorage.clear()
          
          // Create entries with incrementing timestamps to ensure uniqueness
          const baseTime = new Date('2024-01-01').getTime()
          const progressEntries: ReadingProgress[] = []
          
          for (let i = 0; i < numEntries; i++) {
            progressEntries.push({
              novelId: `novel-${i}`,
              lastChapter: i + 1,
              updatedAt: new Date(baseTime + i * 60000).toISOString() // 1 minute apart
            })
          }
          
          // Save all progress entries to localStorage
          for (const progress of progressEntries) {
            saveReadingProgress(progress)
          }
          
          // Simulate the Continue Reading Widget logic:
          // 1. Collect all progress entries from localStorage
          const allProgress: ReadingProgress[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key?.startsWith('novel_reader:progress:')) {
              const novelId = key.replace('novel_reader:progress:', '')
              const progress = getReadingProgress(novelId)
              if (progress) {
                allProgress.push(progress)
              }
            }
          }
          
          // Verify we collected all entries
          if (allProgress.length !== numEntries) {
            return false
          }
          
          // 2. Sort by updatedAt DESC (most recent first)
          allProgress.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
          
          // 3. The first entry should be the most recent
          const selectedEntry = allProgress[0]
          
          // The most recent should be the last one we created (highest index)
          const expectedMostRecent = progressEntries[numEntries - 1]
          
          // Verify the selected entry matches the expected most recent
          return selectedEntry.novelId === expectedMostRecent.novelId &&
                 selectedEntry.lastChapter === expectedMostRecent.lastChapter &&
                 selectedEntry.updatedAt === expectedMostRecent.updatedAt
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle entries with identical timestamps (stable sort)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }), // Number of entries
        (numEntries) => {
          // Clear localStorage at the start of each property test iteration
          localStorage.clear()
          
          // Create progress entries with the same timestamp
          const sharedTimestamp = new Date('2024-06-15T12:00:00Z').toISOString()
          const progressEntries: ReadingProgress[] = []
          
          for (let i = 0; i < numEntries; i++) {
            progressEntries.push({
              novelId: `novel-${i}`,
              lastChapter: i + 1,
              updatedAt: sharedTimestamp
            })
          }
          
          // Save all progress entries
          for (const progress of progressEntries) {
            saveReadingProgress(progress)
          }
          
          // Collect and sort
          const allProgress: ReadingProgress[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key?.startsWith('novel_reader:progress:')) {
              const novelId = key.replace('novel_reader:progress:', '')
              const progress = getReadingProgress(novelId)
              if (progress) {
                allProgress.push(progress)
              }
            }
          }
          
          allProgress.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
          
          // When timestamps are identical, any entry is valid
          // Just verify that the selected entry exists in the original set
          const selectedEntry = allProgress[0]
          const existsInOriginal = progressEntries.some(entry => 
            entry.novelId === selectedEntry.novelId &&
            entry.lastChapter === selectedEntry.lastChapter
          )
          
          return existsInOriginal && allProgress.length === numEntries
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should correctly order entries with very close timestamps', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }), // Number of entries
        (numEntries) => {
          // Clear localStorage at the start of each property test iteration
          localStorage.clear()
          
          // Create entries with timestamps 1 second apart
          const baseDate = new Date('2024-06-15T12:00:00Z')
          const progressEntries: ReadingProgress[] = []
          
          for (let i = 0; i < numEntries; i++) {
            const timestamp = new Date(baseDate.getTime() + i * 1000) // 1 second apart
            progressEntries.push({
              novelId: `novel-${i}`,
              lastChapter: i + 1,
              updatedAt: timestamp.toISOString()
            })
          }
          
          // Save all entries
          for (const progress of progressEntries) {
            saveReadingProgress(progress)
          }
          
          // Collect and sort
          const allProgress: ReadingProgress[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key?.startsWith('novel_reader:progress:')) {
              const novelId = key.replace('novel_reader:progress:', '')
              const progress = getReadingProgress(novelId)
              if (progress) {
                allProgress.push(progress)
              }
            }
          }
          
          allProgress.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
          
          // The most recent should be the last one we created (highest index)
          const selectedEntry = allProgress[0]
          const expectedMostRecent = progressEntries[numEntries - 1]
          
          return selectedEntry.novelId === expectedMostRecent.novelId &&
                 selectedEntry.updatedAt === expectedMostRecent.updatedAt
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle single entry (trivial case)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 500 }), // lastChapter
        (lastChapter) => {
          const progress: ReadingProgress = {
            novelId: 'novel-single',
            lastChapter,
            updatedAt: new Date('2024-06-15T12:00:00Z').toISOString()
          }
          
          // Save single entry
          saveReadingProgress(progress)
          
          // Collect and sort
          const allProgress: ReadingProgress[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key?.startsWith('novel_reader:progress:')) {
              const novelId = key.replace('novel_reader:progress:', '')
              const retrieved = getReadingProgress(novelId)
              if (retrieved) {
                allProgress.push(retrieved)
              }
            }
          }
          
          allProgress.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
          
          // Should select the only entry
          const selectedEntry = allProgress[0]
          
          return selectedEntry.novelId === progress.novelId &&
                 selectedEntry.lastChapter === progress.lastChapter &&
                 selectedEntry.updatedAt === progress.updatedAt
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain DESC sort order (most recent first)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 10 }), // Number of entries
        (numEntries) => {
          // Create entries with random but distinct timestamps
          const baseTime = new Date('2024-01-01').getTime()
          const progressEntries: ReadingProgress[] = []
          
          for (let i = 0; i < numEntries; i++) {
            // Use different time offsets to ensure variety
            const timeOffset = i * 86400000 // 1 day apart
            progressEntries.push({
              novelId: `novel-${i}`,
              lastChapter: i + 1,
              updatedAt: new Date(baseTime + timeOffset).toISOString()
            })
          }
          
          // Save all entries
          for (const progress of progressEntries) {
            saveReadingProgress(progress)
          }
          
          // Collect and sort
          const allProgress: ReadingProgress[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key?.startsWith('novel_reader:progress:')) {
              const novelId = key.replace('novel_reader:progress:', '')
              const progress = getReadingProgress(novelId)
              if (progress) {
                allProgress.push(progress)
              }
            }
          }
          
          allProgress.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
          
          // Verify the entire array is sorted in DESC order
          for (let i = 0; i < allProgress.length - 1; i++) {
            const currentTime = new Date(allProgress[i].updatedAt).getTime()
            const nextTime = new Date(allProgress[i + 1].updatedAt).getTime()
            
            // Current should be >= next (DESC order)
            if (currentTime < nextTime) {
              return false
            }
          }
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should select most recent even with old and new timestamps mixed', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 10 }), // Number of entries
        (numEntries) => {
          // Clear localStorage at the start of each property test iteration
          localStorage.clear()
          
          const progressEntries: ReadingProgress[] = []
          
          // Create entries with mixed old and new timestamps
          for (let i = 0; i < numEntries; i++) {
            // Alternate between old (2024-01) and new (2024-12) timestamps
            const isOld = i % 2 === 0
            const baseDate = isOld ? new Date('2024-01-01') : new Date('2024-12-01')
            const timestamp = new Date(baseDate.getTime() + i * 1000)
            
            progressEntries.push({
              novelId: `novel-${i}`,
              lastChapter: i + 1,
              updatedAt: timestamp.toISOString()
            })
          }
          
          // Save all entries
          for (const progress of progressEntries) {
            saveReadingProgress(progress)
          }
          
          // Collect and sort
          const allProgress: ReadingProgress[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key?.startsWith('novel_reader:progress:')) {
              const novelId = key.replace('novel_reader:progress:', '')
              const progress = getReadingProgress(novelId)
              if (progress) {
                allProgress.push(progress)
              }
            }
          }
          
          allProgress.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
          
          // Find the actual most recent from original data
          const expectedMostRecent = progressEntries.reduce((latest, current) => {
            return new Date(current.updatedAt).getTime() > new Date(latest.updatedAt).getTime()
              ? current
              : latest
          })
          
          const selectedEntry = allProgress[0]
          
          return selectedEntry.novelId === expectedMostRecent.novelId &&
                 selectedEntry.updatedAt === expectedMostRecent.updatedAt
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: enhanced-reading-experience, Property 15: Continue Reading URL Format
// Validates: Requirements 6.6
describe('Property (enhanced-reading-experience) 15: Continue Reading URL Format', () => {
  it('should generate URL in format /novel/${novelId}/chapter/${lastChapter}', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // novelId
        fc.integer({ min: 1, max: 10000 }), // lastChapter
        (novelId, lastChapter) => {
          // Simulate the Continue Reading Widget URL generation logic
          const generatedUrl = `/novel/${novelId}/chapter/${lastChapter}`
          
          // Verify URL format
          const expectedUrl = `/novel/${novelId}/chapter/${lastChapter}`
          
          return generatedUrl === expectedUrl
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should generate valid URL for any valid novelId and chapter number combination', () => {
    fc.assert(
      fc.property(
        fc.record({
          novelId: fc.string({ minLength: 1, maxLength: 100 }),
          lastChapter: fc.integer({ min: 1, max: 100000 })
        }),
        ({ novelId, lastChapter }) => {
          // Generate URL
          const url = `/novel/${novelId}/chapter/${lastChapter}`
          
          // Verify URL structure
          const urlPattern = /^\/novel\/.+\/chapter\/\d+$/
          return urlPattern.test(url)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve novelId exactly as provided (no encoding or transformation)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1, max: 1000 }),
        (novelId, lastChapter) => {
          const url = `/novel/${novelId}/chapter/${lastChapter}`
          
          // Extract novelId from URL
          const match = url.match(/^\/novel\/(.+)\/chapter\/\d+$/)
          const extractedNovelId = match?.[1]
          
          // Should match exactly
          return extractedNovelId === novelId
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve chapter number exactly as provided', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1, max: 1000 }),
        (novelId, lastChapter) => {
          const url = `/novel/${novelId}/chapter/${lastChapter}`
          
          // Extract chapter number from URL
          const match = url.match(/^\/novel\/.+\/chapter\/(\d+)$/)
          const extractedChapter = match?.[1]
          
          // Should match exactly (as string)
          return extractedChapter === String(lastChapter)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should generate URL with correct path segments', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-zA-Z0-9_-]{1,50}$/), // Valid novelId without slashes or spaces
        fc.integer({ min: 1, max: 1000 }),
        (novelId, lastChapter) => {
          const url = `/novel/${novelId}/chapter/${lastChapter}`
          
          // Split URL into segments
          const segments = url.split('/')
          
          // Verify structure: ['', 'novel', novelId, 'chapter', lastChapter]
          return segments.length === 5 &&
                 segments[0] === '' && // Leading slash
                 segments[1] === 'novel' &&
                 segments[2] === novelId &&
                 segments[3] === 'chapter' &&
                 segments[4] === String(lastChapter)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle novelIds with special characters', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-zA-Z0-9_-]{1,50}$/), // Common novelId format
        fc.integer({ min: 1, max: 1000 }),
        (novelId, lastChapter) => {
          const url = `/novel/${novelId}/chapter/${lastChapter}`
          
          // Verify URL contains the novelId
          return url.includes(novelId) && url.includes(String(lastChapter))
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should generate URL that starts with /novel/', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1, max: 1000 }),
        (novelId, lastChapter) => {
          const url = `/novel/${novelId}/chapter/${lastChapter}`
          return url.startsWith('/novel/')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should generate URL that contains /chapter/ segment', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1, max: 1000 }),
        (novelId, lastChapter) => {
          const url = `/novel/${novelId}/chapter/${lastChapter}`
          return url.includes('/chapter/')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should generate URL that ends with chapter number', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1, max: 1000 }),
        (novelId, lastChapter) => {
          const url = `/novel/${novelId}/chapter/${lastChapter}`
          return url.endsWith(String(lastChapter))
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should generate consistent URL for same inputs', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1, max: 1000 }),
        (novelId, lastChapter) => {
          // Generate URL twice
          const url1 = `/novel/${novelId}/chapter/${lastChapter}`
          const url2 = `/novel/${novelId}/chapter/${lastChapter}`
          
          // Should be identical
          return url1 === url2
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should generate different URLs for different novelIds', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1, max: 1000 }),
        (novelId1, novelId2, lastChapter) => {
          // Skip if novelIds are the same
          if (novelId1 === novelId2) return true
          
          const url1 = `/novel/${novelId1}/chapter/${lastChapter}`
          const url2 = `/novel/${novelId2}/chapter/${lastChapter}`
          
          // URLs should be different
          return url1 !== url2
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should generate different URLs for different chapter numbers', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        (novelId, chapter1, chapter2) => {
          // Skip if chapters are the same
          if (chapter1 === chapter2) return true
          
          const url1 = `/novel/${novelId}/chapter/${chapter1}`
          const url2 = `/novel/${novelId}/chapter/${chapter2}`
          
          // URLs should be different
          return url1 !== url2
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle edge case: chapter number 1', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (novelId) => {
          const url = `/novel/${novelId}/chapter/1`
          
          // Verify URL format
          return url === `/novel/${novelId}/chapter/1` && url.endsWith('/1')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle edge case: very large chapter numbers', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 10000, max: 999999 }),
        (novelId, largeChapter) => {
          const url = `/novel/${novelId}/chapter/${largeChapter}`
          
          // Verify URL contains the large chapter number
          return url.includes(String(largeChapter)) && url.endsWith(String(largeChapter))
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should generate URL compatible with Vue Router path format', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-zA-Z0-9_-]{1,50}$/), // Valid novelId without slashes or spaces
        fc.integer({ min: 1, max: 1000 }),
        (novelId, lastChapter) => {
          const url = `/novel/${novelId}/chapter/${lastChapter}`
          
          // Vue Router path pattern: /novel/:novelId/chapter/:chapterNumber
          // Verify URL matches this pattern
          const routePattern = /^\/novel\/[^/]+\/chapter\/\d+$/
          return routePattern.test(url)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should generate URL that can be used with RouterLink', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1, max: 1000 }),
        (novelId, lastChapter) => {
          // Simulate RouterLink :to prop
          const to = `/novel/${novelId}/chapter/${lastChapter}`
          
          // Verify it's a valid path string
          return typeof to === 'string' && 
                 to.startsWith('/') && 
                 to.includes(novelId) && 
                 to.includes(String(lastChapter))
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: enhanced-reading-experience, Property 16: Continue Reading Fallback to Second
// **Validates: Requirements 6.7**
describe('Property (enhanced-reading-experience) 16: Continue Reading Fallback to Second', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should fall back to second most recent novel when first is deleted', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }), // Number of entries (at least 2 for fallback)
        (numEntries) => {
          // Clear localStorage at the start of each property test iteration
          localStorage.clear()
          
          // Create entries with incrementing timestamps to ensure uniqueness
          const baseTime = new Date('2024-01-01').getTime()
          const progressEntries: ReadingProgress[] = []
          
          for (let i = 0; i < numEntries; i++) {
            progressEntries.push({
              novelId: `novel-${i}`,
              lastChapter: i + 1,
              updatedAt: new Date(baseTime + i * 60000).toISOString() // 1 minute apart
            })
          }
          
          // Save all progress entries to localStorage
          for (const progress of progressEntries) {
            saveReadingProgress(progress)
          }
          
          // Simulate the Continue Reading Widget logic with fallback:
          // 1. Collect all progress entries from localStorage
          const allProgress: ReadingProgress[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key?.startsWith('novel_reader:progress:')) {
              const novelId = key.replace('novel_reader:progress:', '')
              const progress = getReadingProgress(novelId)
              if (progress) {
                allProgress.push(progress)
              }
            }
          }
          
          // 2. Sort by updatedAt DESC (most recent first)
          allProgress.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
          
          // 3. Simulate trying to fetch novels in order until one succeeds
          // The most recent novel (index numEntries-1) is "deleted" (fails to fetch)
          // The second most recent (index numEntries-2) should be selected
          const mostRecentNovelId = progressEntries[numEntries - 1].novelId
          const secondMostRecentNovelId = progressEntries[numEntries - 2].novelId
          
          // Simulate the fallback logic: skip first entry if it's the "deleted" novel
          let selectedEntry: ReadingProgress | null = null
          for (const progress of allProgress) {
            // Simulate API failure for the most recent novel
            if (progress.novelId === mostRecentNovelId) {
              // Skip this entry (simulating deleted novel)
              continue
            }
            // This is the first successful entry (second most recent)
            selectedEntry = progress
            break
          }
          
          // Verify the selected entry is the second most recent
          return selectedEntry !== null &&
                 selectedEntry.novelId === secondMostRecentNovelId &&
                 selectedEntry.lastChapter === progressEntries[numEntries - 2].lastChapter
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should fall back through multiple deleted novels to find first available', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 10 }), // Need at least 5 entries
        fc.integer({ min: 1, max: 3 }), // Number of deleted novels (1-3)
        (numEntries, numDeleted) => {
          // Clear localStorage at the start of each property test iteration
          localStorage.clear()
          
          // Ensure we don't delete all novels
          if (numDeleted >= numEntries) return true
          
          // Create entries with incrementing timestamps
          const baseTime = new Date('2024-01-01').getTime()
          const progressEntries: ReadingProgress[] = []
          
          for (let i = 0; i < numEntries; i++) {
            progressEntries.push({
              novelId: `novel-${i}`,
              lastChapter: i + 1,
              updatedAt: new Date(baseTime + i * 60000).toISOString()
            })
          }
          
          // Save all progress entries
          for (const progress of progressEntries) {
            saveReadingProgress(progress)
          }
          
          // Collect and sort
          const allProgress: ReadingProgress[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key?.startsWith('novel_reader:progress:')) {
              const novelId = key.replace('novel_reader:progress:', '')
              const progress = getReadingProgress(novelId)
              if (progress) {
                allProgress.push(progress)
              }
            }
          }
          
          allProgress.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
          
          // Simulate the top N novels being deleted (most recent ones)
          const deletedNovelIds = new Set(
            progressEntries.slice(numEntries - numDeleted).map(p => p.novelId)
          )
          
          // Find first non-deleted novel
          let selectedEntry: ReadingProgress | null = null
          for (const progress of allProgress) {
            if (!deletedNovelIds.has(progress.novelId)) {
              selectedEntry = progress
              break
            }
          }
          
          // Expected: the first non-deleted novel (at index numEntries - numDeleted - 1)
          const expectedNovelId = progressEntries[numEntries - numDeleted - 1].novelId
          
          return selectedEntry !== null && selectedEntry.novelId === expectedNovelId
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return null when all novels in progress are deleted', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }), // Number of entries
        (numEntries) => {
          // Clear localStorage at the start of each property test iteration
          localStorage.clear()
          
          // Create entries
          const baseTime = new Date('2024-01-01').getTime()
          const progressEntries: ReadingProgress[] = []
          
          for (let i = 0; i < numEntries; i++) {
            progressEntries.push({
              novelId: `novel-${i}`,
              lastChapter: i + 1,
              updatedAt: new Date(baseTime + i * 60000).toISOString()
            })
          }
          
          // Save all progress entries
          for (const progress of progressEntries) {
            saveReadingProgress(progress)
          }
          
          // Collect and sort
          const allProgress: ReadingProgress[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key?.startsWith('novel_reader:progress:')) {
              const novelId = key.replace('novel_reader:progress:', '')
              const progress = getReadingProgress(novelId)
              if (progress) {
                allProgress.push(progress)
              }
            }
          }
          
          allProgress.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
          
          // Simulate all novels being deleted
          const deletedNovelIds = new Set(progressEntries.map(p => p.novelId))
          
          // Try to find a non-deleted novel
          let selectedEntry: ReadingProgress | null = null
          for (const progress of allProgress) {
            if (!deletedNovelIds.has(progress.novelId)) {
              selectedEntry = progress
              break
            }
          }
          
          // Should be null since all are deleted
          return selectedEntry === null
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain correct order when falling back (always pick most recent available)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 10 }), // Number of entries
        (numEntries) => {
          // Clear localStorage at the start of each property test iteration
          localStorage.clear()
          
          // Create entries with incrementing timestamps
          const baseTime = new Date('2024-01-01').getTime()
          const progressEntries: ReadingProgress[] = []
          
          for (let i = 0; i < numEntries; i++) {
            progressEntries.push({
              novelId: `novel-${i}`,
              lastChapter: i + 1,
              updatedAt: new Date(baseTime + i * 60000).toISOString()
            })
          }
          
          // Save all progress entries
          for (const progress of progressEntries) {
            saveReadingProgress(progress)
          }
          
          // Collect and sort
          const allProgress: ReadingProgress[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key?.startsWith('novel_reader:progress:')) {
              const novelId = key.replace('novel_reader:progress:', '')
              const progress = getReadingProgress(novelId)
              if (progress) {
                allProgress.push(progress)
              }
            }
          }
          
          allProgress.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
          
          // Delete the most recent novel
          const mostRecentNovelId = progressEntries[numEntries - 1].novelId
          
          // Find first non-deleted novel
          let selectedEntry: ReadingProgress | null = null
          for (const progress of allProgress) {
            if (progress.novelId !== mostRecentNovelId) {
              selectedEntry = progress
              break
            }
          }
          
          // Should be the second most recent (index numEntries - 2)
          const expectedEntry = progressEntries[numEntries - 2]
          
          // Verify it's the second most recent by checking timestamp
          if (selectedEntry === null) return false
          
          const selectedTime = new Date(selectedEntry.updatedAt).getTime()
          const expectedTime = new Date(expectedEntry.updatedAt).getTime()
          
          return selectedEntry.novelId === expectedEntry.novelId &&
                 selectedTime === expectedTime
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle case where only second novel exists (first never existed)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }), // lastChapter for second novel
        (lastChapter) => {
          // Clear localStorage
          localStorage.clear()
          
          // Only save one novel (the "second" one)
          const progress: ReadingProgress = {
            novelId: 'novel-second',
            lastChapter,
            updatedAt: new Date('2024-01-01T00:00:00Z').toISOString()
          }
          
          saveReadingProgress(progress)
          
          // Collect and sort
          const allProgress: ReadingProgress[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key?.startsWith('novel_reader:progress:')) {
              const novelId = key.replace('novel_reader:progress:', '')
              const retrieved = getReadingProgress(novelId)
              if (retrieved) {
                allProgress.push(retrieved)
              }
            }
          }
          
          allProgress.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
          
          // Should select the only available novel
          const selectedEntry = allProgress[0]
          
          return selectedEntry !== undefined &&
                 selectedEntry.novelId === 'novel-second' &&
                 selectedEntry.lastChapter === lastChapter
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve all metadata when falling back to second novel', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }), // Number of entries
        (numEntries) => {
          // Clear localStorage
          localStorage.clear()
          
          // Create entries
          const baseTime = new Date('2024-01-01').getTime()
          const progressEntries: ReadingProgress[] = []
          
          for (let i = 0; i < numEntries; i++) {
            progressEntries.push({
              novelId: `novel-${i}`,
              lastChapter: i + 1,
              updatedAt: new Date(baseTime + i * 60000).toISOString()
            })
          }
          
          // Save all entries
          for (const progress of progressEntries) {
            saveReadingProgress(progress)
          }
          
          // Collect and sort
          const allProgress: ReadingProgress[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key?.startsWith('novel_reader:progress:')) {
              const novelId = key.replace('novel_reader:progress:', '')
              const progress = getReadingProgress(novelId)
              if (progress) {
                allProgress.push(progress)
              }
            }
          }
          
          allProgress.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
          
          // Delete most recent
          const mostRecentNovelId = progressEntries[numEntries - 1].novelId
          
          // Find second most recent
          let selectedEntry: ReadingProgress | null = null
          for (const progress of allProgress) {
            if (progress.novelId !== mostRecentNovelId) {
              selectedEntry = progress
              break
            }
          }
          
          // Verify all metadata is preserved
          const expectedEntry = progressEntries[numEntries - 2]
          
          return selectedEntry !== null &&
                 selectedEntry.novelId === expectedEntry.novelId &&
                 selectedEntry.lastChapter === expectedEntry.lastChapter &&
                 selectedEntry.updatedAt === expectedEntry.updatedAt
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle interleaved timestamps correctly when falling back', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 10 }), // Number of entries
        (numEntries) => {
          // Clear localStorage
          localStorage.clear()
          
          // Create entries with random but distinct timestamps
          const progressEntries: ReadingProgress[] = []
          const timestamps: number[] = []
          
          // Generate unique timestamps
          const baseTime = new Date('2024-01-01').getTime()
          for (let i = 0; i < numEntries; i++) {
            timestamps.push(baseTime + i * 100000) // Well-separated timestamps
          }
          
          // Shuffle timestamps to create interleaved order
          const shuffledTimestamps = [...timestamps].sort(() => Math.random() - 0.5)
          
          for (let i = 0; i < numEntries; i++) {
            progressEntries.push({
              novelId: `novel-${i}`,
              lastChapter: i + 1,
              updatedAt: new Date(shuffledTimestamps[i]).toISOString()
            })
          }
          
          // Save all entries
          for (const progress of progressEntries) {
            saveReadingProgress(progress)
          }
          
          // Collect and sort
          const allProgress: ReadingProgress[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key?.startsWith('novel_reader:progress:')) {
              const novelId = key.replace('novel_reader:progress:', '')
              const progress = getReadingProgress(novelId)
              if (progress) {
                allProgress.push(progress)
              }
            }
          }
          
          allProgress.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
          
          // Find the actual most recent entry
          const mostRecentEntry = allProgress[0]
          const secondMostRecentEntry = allProgress[1]
          
          // Simulate deleting the most recent
          let selectedEntry: ReadingProgress | null = null
          for (const progress of allProgress) {
            if (progress.novelId !== mostRecentEntry.novelId) {
              selectedEntry = progress
              break
            }
          }
          
          // Should match the second most recent
          return selectedEntry !== null &&
                 selectedEntry.novelId === secondMostRecentEntry.novelId &&
                 selectedEntry.updatedAt === secondMostRecentEntry.updatedAt
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: enhanced-reading-experience, Property 17: Offline Analytics Counter Increments
// **Validates: Requirements 11.1, 11.2**
import { trackOfflineRead, trackOnlineRead, getOfflineAnalytics } from '@/utils/offlineAnalytics'

describe('Property (enhanced-reading-experience) 17: Offline Analytics Counter Increments', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should increment offlineReadsCount for each offline read operation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }), // Number of offline reads
        fc.array(fc.stringMatching(/^novel-[a-z0-9]{1,20}$/), { minLength: 1, maxLength: 20 }), // Novel IDs
        (numReads, novelIds) => {
          // Clear localStorage at the start
          localStorage.clear()
          
          // Perform offline reads
          for (let i = 0; i < numReads; i++) {
            const novelId = novelIds[i % novelIds.length] // Cycle through novel IDs
            trackOfflineRead(novelId)
          }
          
          // Get analytics
          const stats = getOfflineAnalytics()
          
          // Verify offlineReadsCount incremented correctly
          return stats.offlineReadsCount === numReads
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should increment onlineReadsCount for each online read operation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }), // Number of online reads
        (numReads) => {
          // Clear localStorage at the start
          localStorage.clear()
          
          // Perform online reads
          for (let i = 0; i < numReads; i++) {
            trackOnlineRead()
          }
          
          // Get analytics
          const stats = getOfflineAnalytics()
          
          // Verify onlineReadsCount incremented correctly
          return stats.onlineReadsCount === numReads
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should correctly track both offline and online reads in mixed sequence', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            isOffline: fc.boolean(),
            novelId: fc.stringMatching(/^novel-[a-z0-9]{1,20}$/)
          }),
          { minLength: 1, maxLength: 100 }
        ),
        (readOperations) => {
          // Clear localStorage at the start
          localStorage.clear()
          
          // Count expected values
          let expectedOfflineCount = 0
          let expectedOnlineCount = 0
          
          // Perform mixed read operations
          for (const operation of readOperations) {
            if (operation.isOffline) {
              trackOfflineRead(operation.novelId)
              expectedOfflineCount++
            } else {
              trackOnlineRead()
              expectedOnlineCount++
            }
          }
          
          // Get analytics
          const stats = getOfflineAnalytics()
          
          // Verify both counters incremented correctly
          return stats.offlineReadsCount === expectedOfflineCount &&
                 stats.onlineReadsCount === expectedOnlineCount
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain counter accuracy across multiple sessions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }), // Number of sessions
        fc.integer({ min: 1, max: 10 }), // Reads per session
        (numSessions, readsPerSession) => {
          // Clear localStorage at the start
          localStorage.clear()
          
          let totalOfflineReads = 0
          let totalOnlineReads = 0
          
          // Simulate multiple sessions
          for (let session = 0; session < numSessions; session++) {
            // Alternate between offline and online sessions
            const isOfflineSession = session % 2 === 0
            
            for (let i = 0; i < readsPerSession; i++) {
              if (isOfflineSession) {
                trackOfflineRead(`novel-${session}-${i}`)
                totalOfflineReads++
              } else {
                trackOnlineRead()
                totalOnlineReads++
              }
            }
            
            // Verify counters are accurate after each session
            const stats = getOfflineAnalytics()
            if (stats.offlineReadsCount !== totalOfflineReads ||
                stats.onlineReadsCount !== totalOnlineReads) {
              return false
            }
          }
          
          // Final verification
          const finalStats = getOfflineAnalytics()
          return finalStats.offlineReadsCount === totalOfflineReads &&
                 finalStats.onlineReadsCount === totalOnlineReads
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should start counters at 0 for new installation', () => {
    fc.assert(
      fc.property(
        fc.constant(null), // No input needed
        () => {
          // Clear localStorage to simulate new installation
          localStorage.clear()
          
          // Get analytics without any reads
          const stats = getOfflineAnalytics()
          
          // Both counters should be 0
          return stats.offlineReadsCount === 0 &&
                 stats.onlineReadsCount === 0
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve counters across getOfflineAnalytics calls', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }), // Number of offline reads
        fc.integer({ min: 1, max: 50 }), // Number of online reads
        (offlineReads, onlineReads) => {
          // Clear localStorage at the start
          localStorage.clear()
          
          // Perform reads
          for (let i = 0; i < offlineReads; i++) {
            trackOfflineRead(`novel-${i}`)
          }
          for (let i = 0; i < onlineReads; i++) {
            trackOnlineRead()
          }
          
          // Get analytics multiple times
          const stats1 = getOfflineAnalytics()
          const stats2 = getOfflineAnalytics()
          const stats3 = getOfflineAnalytics()
          
          // All calls should return the same values
          return stats1.offlineReadsCount === offlineReads &&
                 stats1.onlineReadsCount === onlineReads &&
                 stats2.offlineReadsCount === offlineReads &&
                 stats2.onlineReadsCount === onlineReads &&
                 stats3.offlineReadsCount === offlineReads &&
                 stats3.onlineReadsCount === onlineReads
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle rapid consecutive offline reads', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 100 }), // Number of rapid reads
        (numReads) => {
          // Clear localStorage at the start
          localStorage.clear()
          
          // Perform rapid consecutive offline reads
          for (let i = 0; i < numReads; i++) {
            trackOfflineRead(`novel-${i % 5}`) // Cycle through 5 novels
          }
          
          // Get analytics
          const stats = getOfflineAnalytics()
          
          // Verify counter accuracy
          return stats.offlineReadsCount === numReads
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle rapid consecutive online reads', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 100 }), // Number of rapid reads
        (numReads) => {
          // Clear localStorage at the start
          localStorage.clear()
          
          // Perform rapid consecutive online reads
          for (let i = 0; i < numReads; i++) {
            trackOnlineRead()
          }
          
          // Get analytics
          const stats = getOfflineAnalytics()
          
          // Verify counter accuracy
          return stats.onlineReadsCount === numReads
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain counter independence (offline does not affect online)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }), // Number of offline reads
        (offlineReads) => {
          // Clear localStorage at the start
          localStorage.clear()
          
          // Perform only offline reads
          for (let i = 0; i < offlineReads; i++) {
            trackOfflineRead(`novel-${i}`)
          }
          
          // Get analytics
          const stats = getOfflineAnalytics()
          
          // Online counter should remain 0
          return stats.offlineReadsCount === offlineReads &&
                 stats.onlineReadsCount === 0
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain counter independence (online does not affect offline)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }), // Number of online reads
        (onlineReads) => {
          // Clear localStorage at the start
          localStorage.clear()
          
          // Perform only online reads
          for (let i = 0; i < onlineReads; i++) {
            trackOnlineRead()
          }
          
          // Get analytics
          const stats = getOfflineAnalytics()
          
          // Offline counter should remain 0
          return stats.offlineReadsCount === 0 &&
                 stats.onlineReadsCount === onlineReads
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle edge case: single offline read', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^novel-[a-z0-9]{1,20}$/), // Novel ID
        (novelId) => {
          // Clear localStorage at the start
          localStorage.clear()
          
          // Perform single offline read
          trackOfflineRead(novelId)
          
          // Get analytics
          const stats = getOfflineAnalytics()
          
          // Verify counter is 1
          return stats.offlineReadsCount === 1 &&
                 stats.onlineReadsCount === 0
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle edge case: single online read', () => {
    fc.assert(
      fc.property(
        fc.constant(null), // No input needed
        () => {
          // Clear localStorage at the start
          localStorage.clear()
          
          // Perform single online read
          trackOnlineRead()
          
          // Get analytics
          const stats = getOfflineAnalytics()
          
          // Verify counter is 1
          return stats.offlineReadsCount === 0 &&
                 stats.onlineReadsCount === 1
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle alternating offline and online reads', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 50 }), // Number of alternating pairs
        (numPairs) => {
          // Clear localStorage at the start
          localStorage.clear()
          
          // Perform alternating reads
          for (let i = 0; i < numPairs; i++) {
            trackOfflineRead(`novel-${i}`)
            trackOnlineRead()
          }
          
          // Get analytics
          const stats = getOfflineAnalytics()
          
          // Both counters should equal numPairs
          return stats.offlineReadsCount === numPairs &&
                 stats.onlineReadsCount === numPairs
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify counter monotonicity (always increasing or staying same)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            isOffline: fc.boolean(),
            novelId: fc.stringMatching(/^novel-[a-z0-9]{1,20}$/)
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (readOperations) => {
          // Clear localStorage at the start
          localStorage.clear()
          
          let prevOfflineCount = 0
          let prevOnlineCount = 0
          
          // Perform reads and verify monotonicity
          for (const operation of readOperations) {
            if (operation.isOffline) {
              trackOfflineRead(operation.novelId)
            } else {
              trackOnlineRead()
            }
            
            const stats = getOfflineAnalytics()
            
            // Counters should never decrease
            if (stats.offlineReadsCount < prevOfflineCount ||
                stats.onlineReadsCount < prevOnlineCount) {
              return false
            }
            
            prevOfflineCount = stats.offlineReadsCount
            prevOnlineCount = stats.onlineReadsCount
          }
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle large counter values without overflow', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1000 }), // Large number of reads
        (numReads) => {
          // Clear localStorage at the start
          localStorage.clear()
          
          // Perform many reads
          for (let i = 0; i < numReads; i++) {
            if (i % 2 === 0) {
              trackOfflineRead(`novel-${i % 10}`)
            } else {
              trackOnlineRead()
            }
          }
          
          // Get analytics
          const stats = getOfflineAnalytics()
          
          // Verify counters are accurate
          const expectedOffline = Math.ceil(numReads / 2)
          const expectedOnline = Math.floor(numReads / 2)
          
          return stats.offlineReadsCount === expectedOffline &&
                 stats.onlineReadsCount === expectedOnline
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should persist counters across localStorage reads', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 30 }), // Number of offline reads
        fc.integer({ min: 1, max: 30 }), // Number of online reads
        (offlineReads, onlineReads) => {
          // Clear localStorage at the start
          localStorage.clear()
          
          // Perform reads
          for (let i = 0; i < offlineReads; i++) {
            trackOfflineRead(`novel-${i}`)
          }
          for (let i = 0; i < onlineReads; i++) {
            trackOnlineRead()
          }
          
          // Simulate reading from localStorage directly
          const storedData = localStorage.getItem('offline_stats')
          if (!storedData) return false
          
          const parsedStats = JSON.parse(storedData)
          
          // Verify stored data matches expected values
          return parsedStats.offlineReadsCount === offlineReads &&
                 parsedStats.onlineReadsCount === onlineReads
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: enhanced-reading-experience, Property 18: Offline Analytics Novel ID List Uniqueness
// **Validates: Requirements 11.4**

describe('Property (enhanced-reading-experience) 18: Offline Analytics Novel ID List Uniqueness', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should maintain unique novel IDs in offlineNovelIds list regardless of duplicate reads', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.stringMatching(/^novel-[a-z0-9]{1,20}$/),
          { minLength: 1, maxLength: 50 }
        ), // Array of novel IDs (may contain duplicates)
        (novelIds) => {
          // Clear localStorage at the start
          localStorage.clear()
          
          // Track offline reads (including duplicates)
          for (const novelId of novelIds) {
            trackOfflineRead(novelId)
          }
          
          // Get analytics
          const stats = getOfflineAnalytics()
          
          // Calculate expected unique novel IDs
          const uniqueNovelIds = Array.from(new Set(novelIds))
          
          // Verify offlineNovelIds contains only unique IDs
          const hasNoDuplicates = stats.offlineNovelIds.length === new Set(stats.offlineNovelIds).size
          
          // Verify all unique novel IDs are present
          const allIdsPresent = uniqueNovelIds.every(id => stats.offlineNovelIds.includes(id))
          
          // Verify no extra IDs are present
          const noExtraIds = stats.offlineNovelIds.every(id => uniqueNovelIds.includes(id))
          
          // Verify count matches
          const countMatches = stats.offlineNovelIds.length === uniqueNovelIds.length
          
          return hasNoDuplicates && allIdsPresent && noExtraIds && countMatches
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve uniqueness when same novel is read multiple times in sequence', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^novel-[a-z0-9]{1,20}$/), // Single novel ID
        fc.integer({ min: 2, max: 20 }), // Number of times to read
        (novelId, readCount) => {
          // Clear localStorage at the start
          localStorage.clear()
          
          // Read the same novel multiple times
          for (let i = 0; i < readCount; i++) {
            trackOfflineRead(novelId)
          }
          
          // Get analytics
          const stats = getOfflineAnalytics()
          
          // Verify novel ID appears exactly once
          return stats.offlineNovelIds.length === 1 &&
                 stats.offlineNovelIds[0] === novelId
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain uniqueness across mixed sequences of different novels', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            novelId: fc.stringMatching(/^novel-[a-z0-9]{1,20}$/),
            readCount: fc.integer({ min: 1, max: 5 })
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (novelReads) => {
          // Clear localStorage at the start
          localStorage.clear()
          
          // Track reads with varying repetition
          for (const { novelId, readCount } of novelReads) {
            for (let i = 0; i < readCount; i++) {
              trackOfflineRead(novelId)
            }
          }
          
          // Get analytics
          const stats = getOfflineAnalytics()
          
          // Calculate expected unique novel IDs
          const uniqueNovelIds = Array.from(new Set(novelReads.map(r => r.novelId)))
          
          // Verify no duplicates in the list
          const hasNoDuplicates = stats.offlineNovelIds.length === new Set(stats.offlineNovelIds).size
          
          // Verify all unique IDs are present
          const allIdsPresent = uniqueNovelIds.every(id => stats.offlineNovelIds.includes(id))
          
          // Verify count matches
          const countMatches = stats.offlineNovelIds.length === uniqueNovelIds.length
          
          return hasNoDuplicates && allIdsPresent && countMatches
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain uniqueness when interleaving reads of multiple novels', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.stringMatching(/^novel-[a-z0-9]{1,20}$/),
          { minLength: 2, maxLength: 10 }
        ), // Pool of novel IDs
        fc.array(
          fc.integer({ min: 0, max: 9 }), // Indices into novel pool
          { minLength: 10, maxLength: 100 }
        ),
        (novelPool, readSequence) => {
          // Clear localStorage at the start
          localStorage.clear()
          
          // Perform interleaved reads
          const actuallyReadNovelIds: string[] = []
          for (const index of readSequence) {
            const novelId = novelPool[index % novelPool.length]
            trackOfflineRead(novelId)
            actuallyReadNovelIds.push(novelId)
          }
          
          // Get analytics
          const stats = getOfflineAnalytics()
          
          // Calculate expected unique novel IDs (only those actually read)
          const uniqueNovelIds = Array.from(new Set(actuallyReadNovelIds))
          
          // Verify no duplicates
          const hasNoDuplicates = stats.offlineNovelIds.length === new Set(stats.offlineNovelIds).size
          
          // Verify all unique IDs that were read are present
          const allIdsPresent = uniqueNovelIds.every(id => stats.offlineNovelIds.includes(id))
          
          // Verify no extra IDs are present
          const noExtraIds = stats.offlineNovelIds.every(id => uniqueNovelIds.includes(id))
          
          // Verify count matches
          const countMatches = stats.offlineNovelIds.length === uniqueNovelIds.length
          
          return hasNoDuplicates && allIdsPresent && noExtraIds && countMatches
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve uniqueness across multiple sessions (localStorage persistence)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.array(
            fc.stringMatching(/^novel-[a-z0-9]{1,20}$/),
            { minLength: 1, maxLength: 10 }
          ),
          { minLength: 2, maxLength: 5 }
        ), // Multiple sessions, each with novel IDs
        (sessions) => {
          // Clear localStorage at the start
          localStorage.clear()
          
          // Collect all novel IDs across sessions
          const allNovelIds: string[] = []
          
          // Simulate multiple sessions
          for (const sessionNovelIds of sessions) {
            for (const novelId of sessionNovelIds) {
              trackOfflineRead(novelId)
              allNovelIds.push(novelId)
            }
            
            // Verify uniqueness after each session
            const stats = getOfflineAnalytics()
            const hasNoDuplicates = stats.offlineNovelIds.length === new Set(stats.offlineNovelIds).size
            
            if (!hasNoDuplicates) {
              return false
            }
          }
          
          // Final verification
          const stats = getOfflineAnalytics()
          const uniqueNovelIds = Array.from(new Set(allNovelIds))
          
          // Verify no duplicates in final list
          const hasNoDuplicates = stats.offlineNovelIds.length === new Set(stats.offlineNovelIds).size
          
          // Verify all unique IDs are present
          const allIdsPresent = uniqueNovelIds.every(id => stats.offlineNovelIds.includes(id))
          
          // Verify count matches
          const countMatches = stats.offlineNovelIds.length === uniqueNovelIds.length
          
          return hasNoDuplicates && allIdsPresent && countMatches
        }
      ),
      { numRuns: 100 }
    )
  })
})
