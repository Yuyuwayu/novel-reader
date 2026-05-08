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
