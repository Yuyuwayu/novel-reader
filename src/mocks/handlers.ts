/**
 * MSW request handlers — intercepts all /api/* requests in the browser.
 * Only active in development mode (see src/main.ts).
 */

import { http, HttpResponse, delay } from 'msw'
import type {
  NovelBookmark,
  RatingInfo,
  Comment,
  ReadingHistory,
  NovelSummary,
  AdminChapterSummary,
  Genre,
  Tag,
} from '@/types'
import {
  NOVELS,
  NOVEL_CHAPTER_COUNTS,
  NOVEL_EXTENDED,
  getCatalogPage,
  buildNovelDetail,
  generateChapterContent,
  getChapterTitle,
  MOCK_USERS,
  bookmarksStore,
  ratingsStore,
  commentsStore,
  historyStore,
  genresStore,
  getAdminChapters,
  adminChaptersStore,
  TAG_CATEGORIES,
  TAGS,
  LEADERBOARD_DAILY,
  LEADERBOARD_WEEKLY,
  LEADERBOARD_ALL_TIME,
  LATEST_UPDATES,
  HOME_DATA,
  NOVEL_STATS,
  NOVEL_RANKINGS,
  NOVEL_PATRONS,
  FOLLOWS,
  NOTIFICATIONS,
  USER_PROFILES,
  readingListsStore,
  highlightsStore,
  reportsStore,
  NEW_ADDITIONS,
  getNovelAddedAt,
} from './data'

// ── Mutable in-memory state for new features ───────────────────────────────────

/** Mutable tags array (copy from TAGS at module init) */
const tagsStore: Tag[] = [...TAGS]

/** Mutable follows array (copy from FOLLOWS at module init) */
const followsStore = [...FOLLOWS]

/** Mutable notifications array (copy from NOTIFICATIONS at module init) */
const notificationsStore = [...NOTIFICATIONS]

const PER_PAGE = 10
const SIMULATED_DELAY_MS = 400

// Mutable admin novels list (starts as a copy of NOVELS)
const adminNovels: NovelSummary[] = [...NOVELS]

export const handlers = [
  // ── Existing handlers ──────────────────────────────────────────────────────

  // GET /api/catalog?page=1&q=query (+ advanced filter params)
  http.get('/api/catalog', async ({ request }) => {
    await delay(SIMULATED_DELAY_MS)

    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'))
    const query = url.searchParams.get('q') ?? undefined

    // Advanced filter params (Task 3.3)
    const genresParam = url.searchParams.get('genres')
    const tagsParam = url.searchParams.get('tags')
    const excludeGenresParam = url.searchParams.get('excludeGenres')
    const excludeTagsParam = url.searchParams.get('excludeTags')
    const statusParam = url.searchParams.get('status')
    const minRatingParam = url.searchParams.get('minRating')
    const minChaptersParam = url.searchParams.get('minChapters')
    const maxChaptersParam = url.searchParams.get('maxChapters')
    const sortByParam = url.searchParams.get('sortBy')
    const updatedAfterParam = url.searchParams.get('updatedAfter')
    const updatedBeforeParam = url.searchParams.get('updatedBefore')

    const hasAdvancedFilters =
      genresParam || tagsParam || excludeGenresParam || excludeTagsParam ||
      statusParam || minRatingParam || minChaptersParam || maxChaptersParam ||
      sortByParam || updatedAfterParam || updatedBeforeParam

    if (!hasAdvancedFilters) {
      // Fast path: use existing getCatalogPage for simple queries
      const response = getCatalogPage(page, PER_PAGE, query)
      return HttpResponse.json(response)
    }

    // Advanced filtering
    const filterGenres = genresParam ? genresParam.split(',').filter(Boolean) : []
    const filterTags = tagsParam ? tagsParam.split(',').filter(Boolean) : []
    const filterExcludeGenres = excludeGenresParam ? excludeGenresParam.split(',').filter(Boolean) : []
    const filterExcludeTags = excludeTagsParam ? excludeTagsParam.split(',').filter(Boolean) : []

    let filtered = [...NOVELS]

    // Text search
    if (query && query.trim().length >= 2) {
      const q = query.trim().toLowerCase()
      filtered = filtered.filter(
        (n) => n.title.toLowerCase().includes(q) || n.author.toLowerCase().includes(q),
      )
    }

    // Status filter
    if (statusParam && (statusParam === 'ongoing' || statusParam === 'completed' || statusParam === 'hiatus')) {
      filtered = filtered.filter((n) => n.status === statusParam)
    }

    // Genre AND filter (novel must have ALL selected genres)
    if (filterGenres.length > 0) {
      filtered = filtered.filter((n) =>
        filterGenres.every((g) => n.genre.includes(g)),
      )
    }

    // Exclude genres
    if (filterExcludeGenres.length > 0) {
      filtered = filtered.filter((n) =>
        !filterExcludeGenres.some((g) => n.genre.includes(g)),
      )
    }

    // Tag AND filter (novel must have ALL selected tags)
    if (filterTags.length > 0) {
      filtered = filtered.filter((n) => {
        const novelTagIds = NOVEL_EXTENDED[n.id]?.tagIds ?? []
        return filterTags.every((tagId) => novelTagIds.includes(tagId))
      })
    }

    // Exclude tags
    if (filterExcludeTags.length > 0) {
      filtered = filtered.filter((n) => {
        const novelTagIds = NOVEL_EXTENDED[n.id]?.tagIds ?? []
        return !filterExcludeTags.some((tagId) => novelTagIds.includes(tagId))
      })
    }

    // Min rating filter (use ratingsStore to compute average)
    if (minRatingParam) {
      const minRating = parseFloat(minRatingParam)
      if (!isNaN(minRating) && minRating > 0) {
        filtered = filtered.filter((n) => {
          const novelRatings: number[] = []
          ratingsStore.forEach((rating, key) => {
            if (key.startsWith(`${n.id}:`)) novelRatings.push(rating)
          })
          if (novelRatings.length === 0) return true // skip if no ratings
          const avg = novelRatings.reduce((sum, r) => sum + r, 0) / novelRatings.length
          return avg >= minRating
        })
      }
    }

    // Chapter count filters
    if (minChaptersParam) {
      const minChapters = parseInt(minChaptersParam, 10)
      if (!isNaN(minChapters) && minChapters > 0) {
        filtered = filtered.filter((n) => (NOVEL_CHAPTER_COUNTS[n.id] ?? 0) >= minChapters)
      }
    }
    if (maxChaptersParam) {
      const maxChapters = parseInt(maxChaptersParam, 10)
      if (!isNaN(maxChapters) && maxChapters > 0) {
        filtered = filtered.filter((n) => (NOVEL_CHAPTER_COUNTS[n.id] ?? 0) <= maxChapters)
      }
    }

    // updatedAfter / updatedBefore — use LATEST_UPDATES releasedAt as proxy
    const latestUpdateMap = new Map(LATEST_UPDATES.map((u) => [u.novelId, u.releasedAt]))
    if (updatedAfterParam) {
      const afterDate = new Date(updatedAfterParam).getTime()
      if (!isNaN(afterDate)) {
        filtered = filtered.filter((n) => {
          const releasedAt = latestUpdateMap.get(n.id)
          if (!releasedAt) return false
          return new Date(releasedAt).getTime() >= afterDate
        })
      }
    }
    if (updatedBeforeParam) {
      const beforeDate = new Date(updatedBeforeParam).getTime()
      if (!isNaN(beforeDate)) {
        filtered = filtered.filter((n) => {
          const releasedAt = latestUpdateMap.get(n.id)
          if (!releasedAt) return false
          return new Date(releasedAt).getTime() <= beforeDate
        })
      }
    }

    // Sorting
    if (sortByParam) {
      if (sortByParam === 'readers') {
        filtered.sort((a, b) => (NOVEL_STATS[b.id]?.readerCount ?? 0) - (NOVEL_STATS[a.id]?.readerCount ?? 0))
      } else if (sortByParam === 'chapters') {
        filtered.sort((a, b) => (NOVEL_CHAPTER_COUNTS[b.id] ?? 0) - (NOVEL_CHAPTER_COUNTS[a.id] ?? 0))
      } else if (sortByParam === 'rating') {
        const getAvgRating = (novelId: string) => {
          const ratings: number[] = []
          ratingsStore.forEach((r, key) => {
            if (key.startsWith(`${novelId}:`)) ratings.push(r)
          })
          return ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0
        }
        filtered.sort((a, b) => getAvgRating(b.id) - getAvgRating(a.id))
      } else if (sortByParam === 'updatedAt') {
        filtered.sort((a, b) => {
          const aTime = latestUpdateMap.get(a.id) ? new Date(latestUpdateMap.get(a.id)!).getTime() : 0
          const bTime = latestUpdateMap.get(b.id) ? new Date(latestUpdateMap.get(b.id)!).getTime() : 0
          return bTime - aTime
        })
      } else if (sortByParam === 'addedAt') {
        // Sort by addedAt descending (newest additions first)
        filtered.sort((a, b) => {
          const aTime = new Date(getNovelAddedAt(a.id)).getTime()
          const bTime = new Date(getNovelAddedAt(b.id)).getTime()
          return bTime - aTime
        })
      }
    }

    const total = filtered.length
    const start = (page - 1) * PER_PAGE
    const novels = filtered.slice(start, start + PER_PAGE)

    return HttpResponse.json({ novels, total, page, perPage: PER_PAGE })
  }),

  // GET /api/novels/:novelId/stats — must come before /api/novels/:novelId (Task 3.4)
  http.get('/api/novels/:novelId/stats', async ({ params }) => {
    await delay(SIMULATED_DELAY_MS)

    const { novelId } = params as { novelId: string }
    const stats = NOVEL_STATS[novelId]

    if (!stats) {
      return HttpResponse.json({ message: `Stats for novel "${novelId}" tidak ditemukan.` }, { status: 404 })
    }

    return HttpResponse.json(stats)
  }),

  // GET /api/novels/:novelId/rankings — must come before /api/novels/:novelId (Task 3.4)
  http.get('/api/novels/:novelId/rankings', async ({ params }) => {
    await delay(SIMULATED_DELAY_MS)

    const { novelId } = params as { novelId: string }
    const rankings = NOVEL_RANKINGS[novelId]

    if (!rankings) {
      return HttpResponse.json({ message: `Rankings for novel "${novelId}" tidak ditemukan.` }, { status: 404 })
    }

    return HttpResponse.json(rankings)
  }),

  // GET /api/novels/:novelId/patrons — must come before /api/novels/:novelId (Task 3.4)
  http.get('/api/novels/:novelId/patrons', async ({ params }) => {
    await delay(SIMULATED_DELAY_MS)

    const { novelId } = params as { novelId: string }
    const patrons = NOVEL_PATRONS[novelId] ?? []

    return HttpResponse.json(patrons)
  }),

  // GET /api/novels/:novelId/recommendations — must come before /api/novels/:novelId (Task 3.4)
  http.get('/api/novels/:novelId/recommendations', async ({ params }) => {
    await delay(SIMULATED_DELAY_MS)

    const { novelId } = params as { novelId: string }
    const novel = NOVELS.find((n) => n.id === novelId)

    if (!novel) {
      return HttpResponse.json([], { status: 200 })
    }

    // Find novels with overlapping genres, exclude the novel itself
    const recommendations = NOVELS
      .filter((n) => n.id !== novelId)
      .filter((n) => n.genre.some((g) => novel.genre.includes(g)))
      .sort((a, b) => {
        // Sort by number of overlapping genres (descending)
        const aOverlap = a.genre.filter((g) => novel.genre.includes(g)).length
        const bOverlap = b.genre.filter((g) => novel.genre.includes(g)).length
        return bOverlap - aOverlap
      })
      .slice(0, 10)

    return HttpResponse.json(recommendations)
  }),

  // GET /api/novels/:novelId/rating — must come before /api/novels/:novelId
  http.get('/api/novels/:novelId/rating', async ({ params }) => {
    await delay(SIMULATED_DELAY_MS)

    const { novelId } = params as { novelId: string }

    // Collect all ratings for this novel
    const novelRatings: number[] = []
    ratingsStore.forEach((rating, key) => {
      if (key.startsWith(`${novelId}:`)) {
        novelRatings.push(rating)
      }
    })

    const totalRatings = novelRatings.length
    const averageRating =
      totalRatings > 0
        ? novelRatings.reduce((sum, r) => sum + r, 0) / totalRatings
        : 0

    // Use a fixed userId for demo purposes (user-1)
    const userRating = ratingsStore.get(`${novelId}:user-1`) ?? null

    const ratingInfo: RatingInfo = {
      novelId,
      averageRating,
      totalRatings,
      userRating,
    }

    return HttpResponse.json(ratingInfo)
  }),

  // POST /api/novels/:novelId/rating
  http.post('/api/novels/:novelId/rating', async ({ params, request }) => {
    await delay(SIMULATED_DELAY_MS)

    const { novelId } = params as { novelId: string }
    const body = (await request.json()) as { rating: number }

    ratingsStore.set(`${novelId}:user-1`, body.rating)

    return HttpResponse.json({ success: true })
  }),

  // GET /api/novels/:novelId/chapters/:chapterNumber/comments
  http.get(
    '/api/novels/:novelId/chapters/:chapterNumber/comments',
    async ({ params }) => {
      await delay(SIMULATED_DELAY_MS)

      const { novelId, chapterNumber } = params as {
        novelId: string
        chapterNumber: string
      }
      const chNum = Number(chapterNumber)

      const comments = commentsStore.filter(
        (c) => c.novelId === novelId && c.chapterNumber === chNum,
      )

      return HttpResponse.json(comments)
    },
  ),

  // POST /api/novels/:novelId/chapters/:chapterNumber/comments
  http.post(
    '/api/novels/:novelId/chapters/:chapterNumber/comments',
    async ({ params, request }) => {
      await delay(SIMULATED_DELAY_MS)

      const { novelId, chapterNumber } = params as {
        novelId: string
        chapterNumber: string
      }
      const body = (await request.json()) as { text: string }

      const newComment: Comment = {
        id: `comment-${Date.now()}`,
        novelId,
        chapterNumber: Number(chapterNumber),
        userId: 'user-1',
        username: 'testuser',
        text: body.text,
        createdAt: new Date().toISOString(),
      }

      commentsStore.push(newComment)

      return HttpResponse.json(newComment, { status: 201 })
    },
  ),

  // DELETE /api/novels/:novelId/chapters/:chapterNumber/comments/:commentId
  http.delete(
    '/api/novels/:novelId/chapters/:chapterNumber/comments/:commentId',
    async ({ params }) => {
      await delay(SIMULATED_DELAY_MS)

      const { commentId } = params as { commentId: string }
      const idx = commentsStore.findIndex((c) => c.id === commentId)
      if (idx !== -1) {
        commentsStore.splice(idx, 1)
      }

      return new HttpResponse(null, { status: 204 })
    },
  ),

  // GET /api/novels/new-additions?limit=10 — must come BEFORE /api/novels/:novelId
  http.get('/api/novels/new-additions', async ({ request }) => {
    await delay(SIMULATED_DELAY_MS)

    const url = new URL(request.url)
    const limitParam = url.searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 10

    // NEW_ADDITIONS is already sorted by addedAt descending
    const results = NEW_ADDITIONS.slice(0, Math.max(1, limit))

    return HttpResponse.json(results)
  }),

  // GET /api/novels/:novelId
  http.get('/api/novels/:novelId', async ({ params }) => {
    await delay(SIMULATED_DELAY_MS)

    const { novelId } = params as { novelId: string }
    const novel = NOVELS.find((n) => n.id === novelId)

    if (!novel) {
      return HttpResponse.json(
        { message: `Novel "${novelId}" tidak ditemukan.` },
        { status: 404 },
      )
    }

    const totalChapters = NOVEL_CHAPTER_COUNTS[novelId] ?? 10
    const detail = buildNovelDetail(novel, totalChapters)
    return HttpResponse.json(detail)
  }),

  // GET /api/novels/:novelId/chapters/:chapterNumber
  http.get('/api/novels/:novelId/chapters/:chapterNumber', async ({ params }) => {
    await delay(SIMULATED_DELAY_MS)

    const { novelId, chapterNumber } = params as { novelId: string; chapterNumber: string }
    const novel = NOVELS.find((n) => n.id === novelId)

    if (!novel) {
      return HttpResponse.json(
        { message: `Novel "${novelId}" tidak ditemukan.` },
        { status: 404 },
      )
    }

    const chNum = Number(chapterNumber)
    const totalChapters = NOVEL_CHAPTER_COUNTS[novelId] ?? 10

    if (isNaN(chNum) || chNum < 1 || chNum > totalChapters) {
      return HttpResponse.json(
        { message: `Chapter ${chapterNumber} tidak ditemukan.` },
        { status: 404 },
      )
    }

    const content: import('@/types').ChapterContent = {
      novelId,
      chapterNumber: chNum,
      title: getChapterTitle(novelId, chNum),
      content: generateChapterContent(novelId, chNum),
      totalChapters,
    }

    return HttpResponse.json(content)
  }),

  // ── 4.1 Auth handlers ──────────────────────────────────────────────────────

  // POST /api/auth/register
  http.post('/api/auth/register', async ({ request }) => {
    await delay(SIMULATED_DELAY_MS)

    const body = (await request.json()) as {
      username: string
      email: string
      password: string
    }

    const existing = MOCK_USERS.find((u) => u.email === body.email)
    if (existing) {
      return HttpResponse.json(
        { message: 'Email sudah terdaftar.' },
        { status: 409 },
      )
    }

    return HttpResponse.json({ message: 'Registered successfully' }, { status: 201 })
  }),

  // POST /api/auth/login
  http.post('/api/auth/login', async ({ request }) => {
    await delay(SIMULATED_DELAY_MS)

    const body = (await request.json()) as { email: string; password: string }
    const user = MOCK_USERS.find(
      (u) => u.email === body.email && u.password === body.password,
    )

    if (!user) {
      return HttpResponse.json(
        { message: 'Email atau password salah.' },
        { status: 401 },
      )
    }

    const authResponse: import('@/types').AuthResponse = {
      accessToken: `mock-access-token-${Date.now()}`,
      refreshToken: `mock-refresh-token-${Date.now()}`,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    }

    return HttpResponse.json(authResponse)
  }),

  // POST /api/auth/refresh
  http.post('/api/auth/refresh', async ({ request }) => {
    await delay(SIMULATED_DELAY_MS)

    const body = (await request.json()) as { refreshToken: string }

    if (!body.refreshToken || !body.refreshToken.startsWith('mock-refresh-token-')) {
      return HttpResponse.json(
        { message: 'Refresh token tidak valid.' },
        { status: 401 },
      )
    }

    return HttpResponse.json({ accessToken: `mock-access-token-${Date.now()}` })
  }),

  // POST /api/auth/logout
  http.post('/api/auth/logout', async () => {
    await delay(SIMULATED_DELAY_MS)
    return new HttpResponse(null, { status: 204 })
  }),

  // ── 4.2 Bookmark handlers ──────────────────────────────────────────────────

  // GET /api/bookmarks/:novelId — must come BEFORE GET /api/bookmarks
  http.get('/api/bookmarks/:novelId', async ({ params }) => {
    await delay(SIMULATED_DELAY_MS)

    const { novelId } = params as { novelId: string }
    const isBookmarked = bookmarksStore.some((b) => b.novelId === novelId)

    return HttpResponse.json(isBookmarked)
  }),

  // POST /api/bookmarks/:novelId
  http.post('/api/bookmarks/:novelId', async ({ params }) => {
    await delay(SIMULATED_DELAY_MS)

    const { novelId } = params as { novelId: string }
    const alreadyExists = bookmarksStore.some((b) => b.novelId === novelId)

    if (!alreadyExists) {
      const novel = NOVELS.find((n) => n.id === novelId)
      const bookmark: NovelBookmark = {
        novelId,
        novelTitle: novel?.title ?? novelId,
        thumbnailUrl: novel?.thumbnailUrl ?? `https://picsum.photos/seed/${novelId}/300/400`,
        author: novel?.author ?? 'Unknown',
        bookmarkedAt: new Date().toISOString(),
      }
      bookmarksStore.push(bookmark)
    }

    return new HttpResponse(null, { status: 201 })
  }),

  // DELETE /api/bookmarks/:novelId
  http.delete('/api/bookmarks/:novelId', async ({ params }) => {
    await delay(SIMULATED_DELAY_MS)

    const { novelId } = params as { novelId: string }
    const idx = bookmarksStore.findIndex((b) => b.novelId === novelId)
    if (idx !== -1) {
      bookmarksStore.splice(idx, 1)
    }

    return new HttpResponse(null, { status: 204 })
  }),

  // GET /api/bookmarks
  http.get('/api/bookmarks', async () => {
    await delay(SIMULATED_DELAY_MS)
    return HttpResponse.json(bookmarksStore)
  }),

  // ── 4.4 Reading history handlers ───────────────────────────────────────────

  // GET /api/history
  http.get('/api/history', async () => {
    await delay(SIMULATED_DELAY_MS)

    const sorted = [...historyStore].sort(
      (a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime(),
    )

    return HttpResponse.json(sorted)
  }),

  // POST /api/history
  http.post('/api/history', async ({ request }) => {
    await delay(SIMULATED_DELAY_MS)

    const body = (await request.json()) as { novelId: string; chapterNumber: number }
    const novel = NOVELS.find((n) => n.id === body.novelId)

    const existing = historyStore.findIndex((h) => h.novelId === body.novelId)
    const entry: ReadingHistory = {
      novelId: body.novelId,
      novelTitle: novel?.title ?? body.novelId,
      thumbnailUrl: novel?.thumbnailUrl ?? `https://picsum.photos/seed/${body.novelId}/300/400`,
      lastChapter: body.chapterNumber,
      lastReadAt: new Date().toISOString(),
    }

    if (existing !== -1) {
      historyStore[existing] = entry
    } else {
      historyStore.push(entry)
    }

    return HttpResponse.json({ success: true })
  }),

  // DELETE /api/history/:novelId
  http.delete('/api/history/:novelId', async ({ params }) => {
    await delay(SIMULATED_DELAY_MS)

    const { novelId } = params as { novelId: string }
    const idx = historyStore.findIndex((h) => h.novelId === novelId)
    if (idx !== -1) {
      historyStore.splice(idx, 1)
    }

    return new HttpResponse(null, { status: 204 })
  }),

  // ── 4.5 Admin handlers ─────────────────────────────────────────────────────

  // GET /api/admin/novels/:novelId/tags — must come before other admin novel routes (Task 3.2)
  http.get('/api/admin/novels/:novelId/tags', async ({ params }) => {
    await delay(SIMULATED_DELAY_MS)

    const { novelId } = params as { novelId: string }
    const tagIds = NOVEL_EXTENDED[novelId]?.tagIds ?? []
    const novelTags = tagIds
      .map((tagId) => tagsStore.find((t) => t.id === tagId))
      .filter((t): t is Tag => t !== null && t !== undefined)

    return HttpResponse.json(novelTags)
  }),

  // PUT /api/admin/novels/:novelId/tags — update novel's tags (Task 3.2)
  http.put('/api/admin/novels/:novelId/tags', async ({ params, request }) => {
    await delay(SIMULATED_DELAY_MS)

    const { novelId } = params as { novelId: string }
    const body = (await request.json()) as { tagIds: string[] }

    // Update NOVEL_EXTENDED in-memory
    if (!NOVEL_EXTENDED[novelId]) {
      NOVEL_EXTENDED[novelId] = {}
    }
    NOVEL_EXTENDED[novelId].tagIds = body.tagIds

    return HttpResponse.json({ novelId, tagIds: body.tagIds })
  }),

  // POST /api/admin/novels/cover-upload — MUST come before POST /api/admin/novels/:novelId
  http.post('/api/admin/novels/cover-upload', async () => {
    await delay(SIMULATED_DELAY_MS)
    return HttpResponse.json({ url: 'https://picsum.photos/seed/uploaded/300/400' })
  }),

  // GET /api/admin/novels
  http.get('/api/admin/novels', async () => {
    await delay(SIMULATED_DELAY_MS)
    return HttpResponse.json(adminNovels)
  }),

  // POST /api/admin/novels
  http.post('/api/admin/novels', async ({ request }) => {
    await delay(SIMULATED_DELAY_MS)

    const body = (await request.json()) as import('@/types').NovelFormData
    const newNovel: NovelSummary = {
      id: `novel-${Date.now()}`,
      title: body.title,
      author: body.author,
      genre: body.genres,
      thumbnailUrl: body.thumbnailUrl || `https://picsum.photos/seed/novel-${Date.now()}/300/400`,
      status: body.status,
    }

    adminNovels.push(newNovel)

    return HttpResponse.json(newNovel, { status: 201 })
  }),

  // PUT /api/admin/novels/:novelId
  http.put('/api/admin/novels/:novelId', async ({ params, request }) => {
    await delay(SIMULATED_DELAY_MS)

    const { novelId } = params as { novelId: string }
    const body = (await request.json()) as import('@/types').NovelFormData

    const idx = adminNovels.findIndex((n) => n.id === novelId)
    if (idx === -1) {
      return HttpResponse.json({ message: 'Novel tidak ditemukan.' }, { status: 404 })
    }

    const updated: NovelSummary = {
      id: novelId,
      title: body.title,
      author: body.author,
      genre: body.genres,
      thumbnailUrl: body.thumbnailUrl,
      status: body.status,
    }

    adminNovels[idx] = updated

    return HttpResponse.json(updated)
  }),

  // DELETE /api/admin/novels/:novelId
  http.delete('/api/admin/novels/:novelId', async ({ params }) => {
    await delay(SIMULATED_DELAY_MS)

    const { novelId } = params as { novelId: string }
    const idx = adminNovels.findIndex((n) => n.id === novelId)
    if (idx !== -1) {
      adminNovels.splice(idx, 1)
    }

    return new HttpResponse(null, { status: 204 })
  }),

  // GET /api/admin/novels/:novelId/chapters
  http.get('/api/admin/novels/:novelId/chapters', async ({ params }) => {
    await delay(SIMULATED_DELAY_MS)

    const { novelId } = params as { novelId: string }
    const chapters = getAdminChapters(novelId)

    return HttpResponse.json(chapters)
  }),

  // POST /api/admin/novels/:novelId/chapters
  http.post('/api/admin/novels/:novelId/chapters', async ({ params, request }) => {
    await delay(SIMULATED_DELAY_MS)

    const { novelId } = params as { novelId: string }
    const body = (await request.json()) as import('@/types').ChapterFormData

    const chapters = getAdminChapters(novelId)
    const newChapter: AdminChapterSummary = {
      number: body.number,
      title: body.title,
      releaseStatus: body.scheduledAt ? 'scheduled' : 'published',
      scheduledAt: body.scheduledAt,
    }

    chapters.push(newChapter)
    adminChaptersStore.set(novelId, chapters)

    return HttpResponse.json(newChapter, { status: 201 })
  }),

  // PUT /api/admin/novels/:novelId/chapters/:chapterNumber
  http.put('/api/admin/novels/:novelId/chapters/:chapterNumber', async ({ params, request }) => {
    await delay(SIMULATED_DELAY_MS)

    const { novelId, chapterNumber } = params as {
      novelId: string
      chapterNumber: string
    }
    const body = (await request.json()) as import('@/types').ChapterFormData

    const chapters = getAdminChapters(novelId)
    const chNum = Number(chapterNumber)
    const idx = chapters.findIndex((c) => c.number === chNum)

    if (idx === -1) {
      return HttpResponse.json({ message: 'Chapter tidak ditemukan.' }, { status: 404 })
    }

    const updated: AdminChapterSummary = {
      number: body.number,
      title: body.title,
      releaseStatus: body.scheduledAt ? 'scheduled' : 'published',
      scheduledAt: body.scheduledAt,
    }

    chapters[idx] = updated
    adminChaptersStore.set(novelId, chapters)

    return HttpResponse.json(updated)
  }),

  // DELETE /api/admin/novels/:novelId/chapters/:chapterNumber
  http.delete('/api/admin/novels/:novelId/chapters/:chapterNumber', async ({ params }) => {
    await delay(SIMULATED_DELAY_MS)

    const { novelId, chapterNumber } = params as {
      novelId: string
      chapterNumber: string
    }

    const chapters = getAdminChapters(novelId)
    const chNum = Number(chapterNumber)
    const idx = chapters.findIndex((c) => c.number === chNum)
    if (idx !== -1) {
      chapters.splice(idx, 1)
      adminChaptersStore.set(novelId, chapters)
    }

    return new HttpResponse(null, { status: 204 })
  }),

  // GET /api/genres — public endpoint for FinderPage filter panel
  http.get('/api/genres', async () => {
    await delay(SIMULATED_DELAY_MS)
    return HttpResponse.json(genresStore)
  }),

  // GET /api/admin/genres
  http.get('/api/admin/genres', async () => {
    await delay(SIMULATED_DELAY_MS)
    return HttpResponse.json(genresStore)
  }),

  // POST /api/admin/genres
  http.post('/api/admin/genres', async ({ request }) => {
    await delay(SIMULATED_DELAY_MS)

    const body = (await request.json()) as { name: string }
    const newGenre: Genre = {
      id: `genre-${Date.now()}`,
      name: body.name,
      novelCount: 0,
    }

    genresStore.push(newGenre)

    return HttpResponse.json(newGenre, { status: 201 })
  }),

  // DELETE /api/admin/genres/:genreId
  http.delete('/api/admin/genres/:genreId', async ({ params }) => {
    await delay(SIMULATED_DELAY_MS)

    const { genreId } = params as { genreId: string }
    const idx = genresStore.findIndex((g) => g.id === genreId)
    if (idx !== -1) {
      genresStore.splice(idx, 1)
    }

    return new HttpResponse(null, { status: 204 })
  }),

  // ── 3.1 Discovery & Leaderboard handlers ──────────────────────────────────

  // GET /api/leaderboard?period={daily|weekly|all_time}
  http.get('/api/leaderboard', async ({ request }) => {
    await delay(SIMULATED_DELAY_MS)

    const url = new URL(request.url)
    const period = url.searchParams.get('period') ?? 'weekly'

    let entries
    if (period === 'daily') {
      entries = [...LEADERBOARD_DAILY]
    } else if (period === 'all_time') {
      entries = [...LEADERBOARD_ALL_TIME]
    } else {
      // Default to weekly for invalid or 'weekly'
      entries = [...LEADERBOARD_WEEKLY]
    }

    // Sort by popularityScore descending
    entries.sort((a, b) => b.popularityScore - a.popularityScore)

    return HttpResponse.json(entries)
  }),

  // GET /api/discovery/popular-by-genre?genre={genreName}
  http.get('/api/discovery/popular-by-genre', async ({ request }) => {
    await delay(SIMULATED_DELAY_MS)

    const url = new URL(request.url)
    const genre = url.searchParams.get('genre') ?? ''

    const matching = NOVELS
      .filter((n) => n.genre.includes(genre))
      .sort((a, b) => (NOVEL_STATS[b.id]?.readerCount ?? 0) - (NOVEL_STATS[a.id]?.readerCount ?? 0))
      .slice(0, 10)

    return HttpResponse.json(matching)
  }),

  // GET /api/discovery/random-pick
  http.get('/api/discovery/random-pick', async () => {
    await delay(SIMULATED_DELAY_MS)

    // Fisher-Yates shuffle and take 3
    const shuffled = [...NOVELS]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    return HttpResponse.json(shuffled.slice(0, 3))
  }),

  // GET /api/discovery/latest-updates
  http.get('/api/discovery/latest-updates', async () => {
    await delay(SIMULATED_DELAY_MS)

    const sorted = [...LATEST_UPDATES].sort(
      (a, b) => new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime(),
    )

    return HttpResponse.json(sorted)
  }),

  // GET /api/home
  http.get('/api/home', async () => {
    await delay(SIMULATED_DELAY_MS)
    return HttpResponse.json(HOME_DATA)
  }),

  // ── 3.2 Tag CRUD handlers ──────────────────────────────────────────────────

  // GET /api/tags
  http.get('/api/tags', async () => {
    await delay(SIMULATED_DELAY_MS)
    return HttpResponse.json(tagsStore)
  }),

  // GET /api/tag-categories
  http.get('/api/tag-categories', async () => {
    await delay(SIMULATED_DELAY_MS)
    return HttpResponse.json(TAG_CATEGORIES)
  }),

  // POST /api/tags
  http.post('/api/tags', async ({ request }) => {
    await delay(SIMULATED_DELAY_MS)

    const body = (await request.json()) as { name: string; categoryId: string }

    // Validate unique name per category
    const duplicate = tagsStore.find(
      (t) => t.name.toLowerCase() === body.name.toLowerCase() && t.categoryId === body.categoryId,
    )
    if (duplicate) {
      return HttpResponse.json(
        { message: `Tag "${body.name}" sudah ada dalam kategori ini.` },
        { status: 409 },
      )
    }

    const category = TAG_CATEGORIES.find((c) => c.id === body.categoryId)
    const newTag: Tag = {
      id: `tag-${Date.now()}`,
      name: body.name,
      categoryId: body.categoryId,
      categoryName: category?.name ?? body.categoryId,
      novelCount: 0,
    }

    tagsStore.push(newTag)

    return HttpResponse.json(newTag, { status: 201 })
  }),

  // PUT /api/tags/:tagId
  http.put('/api/tags/:tagId', async ({ params, request }) => {
    await delay(SIMULATED_DELAY_MS)

    const { tagId } = params as { tagId: string }
    const body = (await request.json()) as { name?: string; categoryId?: string }

    const idx = tagsStore.findIndex((t) => t.id === tagId)
    if (idx === -1) {
      return HttpResponse.json({ message: `Tag "${tagId}" tidak ditemukan.` }, { status: 404 })
    }

    const existing = tagsStore[idx]
    const updatedCategoryId = body.categoryId ?? existing.categoryId
    const category = TAG_CATEGORIES.find((c) => c.id === updatedCategoryId)

    const updated: Tag = {
      ...existing,
      name: body.name ?? existing.name,
      categoryId: updatedCategoryId,
      categoryName: category?.name ?? existing.categoryName,
    }

    tagsStore[idx] = updated

    return HttpResponse.json(updated)
  }),

  // DELETE /api/tags/:tagId
  http.delete('/api/tags/:tagId', async ({ params }) => {
    await delay(SIMULATED_DELAY_MS)

    const { tagId } = params as { tagId: string }
    const idx = tagsStore.findIndex((t) => t.id === tagId)
    if (idx !== -1) {
      tagsStore.splice(idx, 1)
    }

    return new HttpResponse(null, { status: 204 })
  }),

  // ── 3.4 Authors handler ────────────────────────────────────────────────────

  // GET /api/authors/:authorName/novels?excludeNovelId=
  http.get('/api/authors/:authorName/novels', async ({ params, request }) => {
    await delay(SIMULATED_DELAY_MS)

    const { authorName } = params as { authorName: string }
    const url = new URL(request.url)
    const excludeNovelId = url.searchParams.get('excludeNovelId') ?? ''

    const authorNovels = NOVELS.filter(
      (n) => n.author === decodeURIComponent(authorName) && n.id !== excludeNovelId,
    )

    return HttpResponse.json(authorNovels)
  }),

  // ── 3.5 Follow & Notification handlers ────────────────────────────────────

  // GET /api/follows
  http.get('/api/follows', async () => {
    await delay(SIMULATED_DELAY_MS)
    return HttpResponse.json(followsStore)
  }),

  // POST /api/follows/:novelId
  http.post('/api/follows/:novelId', async ({ params }) => {
    await delay(SIMULATED_DELAY_MS)

    const { novelId } = params as { novelId: string }
    const alreadyFollowing = followsStore.some((f) => f.novelId === novelId)

    if (!alreadyFollowing) {
      followsStore.push({
        novelId,
        followedAt: new Date().toISOString(),
      })
    }

    return new HttpResponse(null, { status: 201 })
  }),

  // DELETE /api/follows/:novelId
  http.delete('/api/follows/:novelId', async ({ params }) => {
    await delay(SIMULATED_DELAY_MS)

    const { novelId } = params as { novelId: string }
    const idx = followsStore.findIndex((f) => f.novelId === novelId)
    if (idx !== -1) {
      followsStore.splice(idx, 1)
    }

    return new HttpResponse(null, { status: 204 })
  }),

  // GET /api/notifications
  http.get('/api/notifications', async () => {
    await delay(SIMULATED_DELAY_MS)

    const sorted = [...notificationsStore].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

    return HttpResponse.json(sorted)
  }),

  // PUT /api/notifications/read-all
  http.put('/api/notifications/read-all', async () => {
    await delay(SIMULATED_DELAY_MS)

    notificationsStore.forEach((n) => {
      n.isRead = true
    })

    return HttpResponse.json({ success: true })
  }),

  // ── 3.6 User Profile handler ───────────────────────────────────────────────

  // GET /api/users/:username
  http.get('/api/users/:username', async ({ params }) => {
    await delay(SIMULATED_DELAY_MS)

    const { username } = params as { username: string }
    const profile = USER_PROFILES[username]

    if (!profile) {
      return HttpResponse.json(
        { message: `Pengguna "${username}" tidak ditemukan.` },
        { status: 404 },
      )
    }

    return HttpResponse.json(profile)
  }),

  // ── Reading List handlers (Task 28.2) ──────────────────────────────────────

  // GET /api/lists — return all lists for the current user
  http.get('/api/lists', async () => {
    await delay(SIMULATED_DELAY_MS)
    // Return lists without the internal novelIds array (only public fields)
    const lists = readingListsStore.map(({ id, name, novelCount, createdAt }) => ({
      id,
      name,
      novelCount,
      createdAt,
    }))
    return HttpResponse.json(lists)
  }),

  // POST /api/lists — create a new reading list
  http.post('/api/lists', async ({ request }) => {
    await delay(SIMULATED_DELAY_MS)

    const body = (await request.json()) as { name?: string }

    if (!body.name || body.name.trim().length === 0) {
      return HttpResponse.json(
        { message: 'Nama list tidak boleh kosong.' },
        { status: 400 },
      )
    }

    const newList = {
      id: `list-${Date.now()}`,
      name: body.name.trim(),
      novelCount: 0,
      createdAt: new Date().toISOString(),
      novelIds: [] as string[],
    }

    readingListsStore.push(newList)

    const { novelIds: _novelIds, ...publicList } = newList
    return HttpResponse.json(publicList, { status: 201 })
  }),

  // PUT /api/lists/:listId — rename a reading list
  http.put('/api/lists/:listId', async ({ params, request }) => {
    await delay(SIMULATED_DELAY_MS)

    const { listId } = params as { listId: string }
    const body = (await request.json()) as { name?: string }

    const idx = readingListsStore.findIndex((l) => l.id === listId)
    if (idx === -1) {
      return HttpResponse.json(
        { message: `List "${listId}" tidak ditemukan.` },
        { status: 404 },
      )
    }

    if (!body.name || body.name.trim().length === 0) {
      return HttpResponse.json(
        { message: 'Nama list tidak boleh kosong.' },
        { status: 400 },
      )
    }

    readingListsStore[idx].name = body.name.trim()

    const { novelIds: _novelIds, ...publicList } = readingListsStore[idx]
    return HttpResponse.json(publicList)
  }),

  // DELETE /api/lists/:listId — delete a reading list and all its novels
  http.delete('/api/lists/:listId', async ({ params }) => {
    await delay(SIMULATED_DELAY_MS)

    const { listId } = params as { listId: string }
    const idx = readingListsStore.findIndex((l) => l.id === listId)
    if (idx !== -1) {
      readingListsStore.splice(idx, 1)
    }

    return new HttpResponse(null, { status: 204 })
  }),

  // POST /api/lists/:listId/novels/:novelId — add a novel to a list
  http.post('/api/lists/:listId/novels/:novelId', async ({ params }) => {
    await delay(SIMULATED_DELAY_MS)

    const { listId, novelId } = params as { listId: string; novelId: string }
    const list = readingListsStore.find((l) => l.id === listId)

    if (!list) {
      return HttpResponse.json(
        { message: `List "${listId}" tidak ditemukan.` },
        { status: 404 },
      )
    }

    if (!list.novelIds.includes(novelId)) {
      list.novelIds.push(novelId)
      list.novelCount = list.novelIds.length
    }

    return new HttpResponse(null, { status: 201 })
  }),

  // DELETE /api/lists/:listId/novels/:novelId — remove a novel from a list
  http.delete('/api/lists/:listId/novels/:novelId', async ({ params }) => {
    await delay(SIMULATED_DELAY_MS)

    const { listId, novelId } = params as { listId: string; novelId: string }
    const list = readingListsStore.find((l) => l.id === listId)

    if (!list) {
      return HttpResponse.json(
        { message: `List "${listId}" tidak ditemukan.` },
        { status: 404 },
      )
    }

    const novelIdx = list.novelIds.indexOf(novelId)
    if (novelIdx !== -1) {
      list.novelIds.splice(novelIdx, 1)
      list.novelCount = list.novelIds.length
    }

    return new HttpResponse(null, { status: 204 })
  }),

  // ── Highlight handlers (Task 30.2) ─────────────────────────────────────────

  // GET /api/highlights?novelId=&chapterNumber= — return highlights for a chapter
  http.get('/api/highlights', async ({ request }) => {
    await delay(SIMULATED_DELAY_MS)

    const url = new URL(request.url)
    const novelId = url.searchParams.get('novelId') ?? ''
    const chapterNumberParam = url.searchParams.get('chapterNumber')
    const chapterNumber = chapterNumberParam !== null ? Number(chapterNumberParam) : null

    let results = [...highlightsStore]

    if (novelId) {
      results = results.filter((h) => h.novelId === novelId)
    }

    if (chapterNumber !== null && !isNaN(chapterNumber)) {
      results = results.filter((h) => h.chapterNumber === chapterNumber)
    }

    // Sort by startOffset ascending (order of appearance in the chapter)
    results.sort((a, b) => a.startOffset - b.startOffset)

    return HttpResponse.json(results)
  }),

  // POST /api/highlights — create a new highlight, return 201 with data
  http.post('/api/highlights', async ({ request }) => {
    await delay(SIMULATED_DELAY_MS)

    const body = (await request.json()) as {
      novelId: string
      chapterNumber: number
      startOffset: number
      endOffset: number
      color: 'yellow' | 'green' | 'blue' | 'pink'
      note: string
    }

    // Basic validation
    if (!body.novelId || body.chapterNumber === undefined) {
      return HttpResponse.json(
        { message: 'novelId dan chapterNumber wajib diisi.' },
        { status: 400 },
      )
    }

    if (body.startOffset >= body.endOffset) {
      return HttpResponse.json(
        { message: 'startOffset harus lebih kecil dari endOffset.' },
        { status: 400 },
      )
    }

    const newHighlight: import('@/types').Highlight = {
      id: `highlight-${Date.now()}`,
      novelId: body.novelId,
      chapterNumber: body.chapterNumber,
      startOffset: body.startOffset,
      endOffset: body.endOffset,
      color: body.color ?? 'yellow',
      note: body.note ?? '',
      createdAt: new Date().toISOString(),
    }

    highlightsStore.push(newHighlight)

    return HttpResponse.json(newHighlight, { status: 201 })
  }),

  // DELETE /api/highlights/:highlightId — delete a highlight, return 204
  http.delete('/api/highlights/:highlightId', async ({ params }) => {
    await delay(SIMULATED_DELAY_MS)

    const { highlightId } = params as { highlightId: string }
    const idx = highlightsStore.findIndex((h) => h.id === highlightId)

    if (idx !== -1) {
      highlightsStore.splice(idx, 1)
    }

    return new HttpResponse(null, { status: 204 })
  }),

  // ── Report handlers (Task 33.2) ────────────────────────────────────────────

  // POST /api/reports — submit a new chapter report, return 201
  http.post('/api/reports', async ({ request }) => {
    await delay(SIMULATED_DELAY_MS)

    const body = (await request.json()) as {
      novelId: string
      chapterNumber: number
      type: import('@/types').Report['type']
      description: string
    }

    if (!body.novelId || body.chapterNumber === undefined || !body.type) {
      return HttpResponse.json(
        { message: 'novelId, chapterNumber, dan type wajib diisi.' },
        { status: 400 },
      )
    }

    const newReport: import('@/types').Report = {
      id: `report-${Date.now()}`,
      novelId: body.novelId,
      chapterNumber: body.chapterNumber,
      type: body.type,
      description: body.description ?? '',
      status: 'new',
      createdAt: new Date().toISOString(),
    }

    reportsStore.push(newReport)

    return HttpResponse.json(newReport, { status: 201 })
  }),

  // GET /api/admin/reports?status= — return all reports, optionally filtered by status
  http.get('/api/admin/reports', async ({ request }) => {
    await delay(SIMULATED_DELAY_MS)

    const url = new URL(request.url)
    const statusParam = url.searchParams.get('status')

    let results = [...reportsStore]

    if (statusParam && (statusParam === 'new' || statusParam === 'reviewing' || statusParam === 'resolved')) {
      results = results.filter((r) => r.status === statusParam)
    }

    // Sort by createdAt descending (newest first)
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return HttpResponse.json(results)
  }),

  // PATCH /api/admin/reports/:reportId — update report status
  http.patch('/api/admin/reports/:reportId', async ({ params, request }) => {
    await delay(SIMULATED_DELAY_MS)

    const { reportId } = params as { reportId: string }
    const body = (await request.json()) as { status: import('@/types').Report['status'] }

    const idx = reportsStore.findIndex((r) => r.id === reportId)
    if (idx === -1) {
      return HttpResponse.json(
        { message: `Laporan "${reportId}" tidak ditemukan.` },
        { status: 404 },
      )
    }

    const validStatuses: Array<import('@/types').Report['status']> = ['new', 'reviewing', 'resolved']
    if (!validStatuses.includes(body.status)) {
      return HttpResponse.json(
        { message: `Status "${body.status}" tidak valid. Gunakan: new, reviewing, atau resolved.` },
        { status: 400 },
      )
    }

    reportsStore[idx] = { ...reportsStore[idx], status: body.status }

    return HttpResponse.json(reportsStore[idx])
  }),
]
