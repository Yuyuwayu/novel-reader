import type {
  CatalogResponse,
  NovelDetail,
  ChapterContent,
  NovelSummary,
  AuthResponse,
  NovelBookmark,
  RatingInfo,
  Comment,
  ReadingHistory,
  Genre,
  NovelFormData,
  AdminChapterSummary,
  ChapterFormData,
  LeaderboardEntry,
  LatestUpdateEntry,
  HomeData,
  Tag,
  TagCategory,
  FilterState,
  NovelStats,
  NovelRankings,
  Patron,
  Follow,
  Notification,
  UserProfile,
  ReadingList,
  Highlight,
  Report,
} from '@/types'

const BASE_URL = '/api'

/**
 * Lazily resolves the auth store to avoid circular dependency at module load time.
 * The auth store imports from this module, so we cannot import it at the top level.
 * We defer the import until first use via a getter that is set after module initialization.
 */
let _getAuthStore: (() => ReturnType<typeof import('@/stores/auth').useAuthStore>) | null = null

function getAuthStore(): ReturnType<typeof import('@/stores/auth').useAuthStore> {
  if (!_getAuthStore) {
    // Inline import to break the circular dependency — safe because by the time
    // any authenticated request is made, all modules are already fully initialized.
    // Using a module-level variable set via _setAuthStoreGetter from main.ts.
    throw new Error(
      'Auth store getter not initialized. Call _setAuthStoreGetter() in main.ts before making authenticated requests.',
    )
  }
  return _getAuthStore()
}

/**
 * Allows tests to inject a mock auth store resolver, bypassing the lazy require.
 * @internal
 */
export function _setAuthStoreGetter(getter: () => ReturnType<typeof import('@/stores/auth').useAuthStore>): void {
  _getAuthStore = getter
}

export class ApiError extends Error {
  readonly type: 'network' | 'server' | 'parse'
  readonly status?: number

  constructor(
    type: 'network' | 'server' | 'parse',
    message: string,
    status?: number
  ) {
    super(message)
    this.name = 'ApiError'
    this.type = type
    this.status = status
  }
}

/**
 * Core fetch wrapper with optional authentication support.
 * - If `auth: true`, adds Authorization header from auth store (lazy import to avoid circular deps)
 * - If response is 401 and refresh token exists, retries once after refreshing
 * - If refresh fails, calls logout and redirects to /login
 * - Serializes body as JSON when provided
 */
async function apiFetch<T>(
  url: string,
  options?: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    body?: unknown
    auth?: boolean
  }
): Promise<T> {
  const method = options?.method ?? 'GET'
  const hasBody = options?.body !== undefined

  const buildHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {}
    if (hasBody) {
      headers['Content-Type'] = 'application/json'
    }
    if (options?.auth) {
      const auth = getAuthStore()
      if (auth.accessToken) {
        headers['Authorization'] = `Bearer ${auth.accessToken}`
      }
    }
    return headers
  }

  const buildInit = (): RequestInit => ({
    method,
    headers: buildHeaders(),
    ...(hasBody ? { body: JSON.stringify(options!.body) } : {}),
  })

  let response: Response

  try {
    response = await fetch(url, buildInit())
  } catch (err) {
    throw new ApiError('network', `Network error: ${err instanceof Error ? err.message : String(err)}`)
  }

  // Handle 401 with token refresh + retry (only for authenticated requests)
  if (response.status === 401 && options?.auth) {
    const auth = getAuthStore()

    const refreshed = await auth.tryRefreshToken()
    if (refreshed) {
      // Retry the original request once with the new token
      try {
        response = await fetch(url, buildInit())
      } catch (err) {
        throw new ApiError('network', `Network error on retry: ${err instanceof Error ? err.message : String(err)}`)
      }
    } else {
      // Refresh failed — logout and redirect to login
      await auth.logout()
      window.location.href = '/login'
      throw new ApiError('server', 'Session expired. Redirecting to login.', 401)
    }
  }

  if (!response.ok) {
    throw new ApiError('server', `Server error: ${response.status} ${response.statusText}`, response.status)
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T
  }

  try {
    return (await response.json()) as T
  } catch (err) {
    throw new ApiError('parse', `Failed to parse response: ${err instanceof Error ? err.message : String(err)}`)
  }
}

// ── Existing public API functions ─────────────────────────────────────────────

/**
 * Fetches the novel catalog with pagination and optional search query.
 */
export async function fetchCatalog(page: number, query?: string): Promise<CatalogResponse> {
  const params = new URLSearchParams({ page: String(page) })
  if (query && query.trim().length > 0) {
    params.set('q', query.trim())
  }
  return apiFetch<CatalogResponse>(`${BASE_URL}/catalog?${params.toString()}`)
}

/**
 * Fetches full novel detail by ID.
 */
export async function fetchNovelDetail(novelId: string): Promise<NovelDetail> {
  return apiFetch<NovelDetail>(`${BASE_URL}/novels/${encodeURIComponent(novelId)}`)
}

/**
 * Fetches chapter content by novel ID and chapter number.
 */
export async function fetchChapter(novelId: string, chapterNumber: number): Promise<ChapterContent> {
  return apiFetch<ChapterContent>(
    `${BASE_URL}/novels/${encodeURIComponent(novelId)}/chapters/${chapterNumber}`
  )
}

/**
 * Filters novels locally by query (case-insensitive, title or author).
 * Returns all novels if query is empty or less than 2 characters.
 * Requirements: 2.2, 2.3, 2.5
 */
export function filterNovels(novels: NovelSummary[], query: string): NovelSummary[] {
  if (query.length < 2) {
    return novels
  }
  const q = query.toLowerCase()
  return novels.filter(
    (novel) =>
      novel.title.toLowerCase().includes(q) || novel.author.toLowerCase().includes(q),
  )
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>(`${BASE_URL}/auth/login`, {
    method: 'POST',
    body: { email, password },
  })
}

export async function register(username: string, email: string, password: string): Promise<void> {
  return apiFetch<void>(`${BASE_URL}/auth/register`, {
    method: 'POST',
    body: { username, email, password },
  })
}

export async function refreshToken(token: string): Promise<{ accessToken: string }> {
  return apiFetch<{ accessToken: string }>(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    body: { refreshToken: token },
  })
}

export async function logout(): Promise<void> {
  return apiFetch<void>(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    auth: true,
  })
}

// ── Bookmarks (server-side, novel-level) ─────────────────────────────────────

export async function fetchNovelBookmarks(): Promise<NovelBookmark[]> {
  return apiFetch<NovelBookmark[]>(`${BASE_URL}/bookmarks`, { auth: true })
}

export async function addNovelBookmark(novelId: string): Promise<void> {
  return apiFetch<void>(`${BASE_URL}/bookmarks/${encodeURIComponent(novelId)}`, {
    method: 'POST',
    auth: true,
  })
}

export async function removeNovelBookmark(novelId: string): Promise<void> {
  return apiFetch<void>(`${BASE_URL}/bookmarks/${encodeURIComponent(novelId)}`, {
    method: 'DELETE',
    auth: true,
  })
}

export async function isNovelBookmarked(novelId: string): Promise<boolean> {
  return apiFetch<boolean>(`${BASE_URL}/bookmarks/${encodeURIComponent(novelId)}`, { auth: true })
}

// ── Ratings ───────────────────────────────────────────────────────────────────

export async function fetchNovelRating(novelId: string): Promise<RatingInfo> {
  return apiFetch<RatingInfo>(`${BASE_URL}/novels/${encodeURIComponent(novelId)}/rating`, { auth: true })
}

export async function submitRating(novelId: string, rating: number): Promise<void> {
  return apiFetch<void>(`${BASE_URL}/novels/${encodeURIComponent(novelId)}/rating`, {
    method: 'POST',
    body: { rating },
    auth: true,
  })
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function fetchComments(novelId: string, chapterNumber: number): Promise<Comment[]> {
  return apiFetch<Comment[]>(
    `${BASE_URL}/novels/${encodeURIComponent(novelId)}/chapters/${chapterNumber}/comments`
  )
}

export async function postComment(novelId: string, chapterNumber: number, text: string): Promise<Comment> {
  return apiFetch<Comment>(
    `${BASE_URL}/novels/${encodeURIComponent(novelId)}/chapters/${chapterNumber}/comments`,
    {
      method: 'POST',
      body: { text },
      auth: true,
    }
  )
}

export async function deleteComment(novelId: string, chapterNumber: number, commentId: string): Promise<void> {
  return apiFetch<void>(
    `${BASE_URL}/novels/${encodeURIComponent(novelId)}/chapters/${chapterNumber}/comments/${encodeURIComponent(commentId)}`,
    {
      method: 'DELETE',
      auth: true,
    }
  )
}

// ── Reading History ───────────────────────────────────────────────────────────

export async function fetchHistory(): Promise<ReadingHistory[]> {
  return apiFetch<ReadingHistory[]>(`${BASE_URL}/history`, { auth: true })
}

export async function recordHistory(novelId: string, chapterNumber: number): Promise<void> {
  return apiFetch<void>(`${BASE_URL}/history`, {
    method: 'POST',
    body: { novelId, chapterNumber },
    auth: true,
  })
}

export async function deleteHistory(novelId: string): Promise<void> {
  return apiFetch<void>(`${BASE_URL}/history/${encodeURIComponent(novelId)}`, {
    method: 'DELETE',
    auth: true,
  })
}

// ── Admin — Novels ────────────────────────────────────────────────────────────

export async function adminFetchNovels(): Promise<NovelSummary[]> {
  return apiFetch<NovelSummary[]>(`${BASE_URL}/admin/novels`, { auth: true })
}

export async function adminCreateNovel(data: NovelFormData): Promise<NovelSummary> {
  return apiFetch<NovelSummary>(`${BASE_URL}/admin/novels`, {
    method: 'POST',
    body: data,
    auth: true,
  })
}

export async function adminUpdateNovel(novelId: string, data: NovelFormData): Promise<NovelSummary> {
  return apiFetch<NovelSummary>(`${BASE_URL}/admin/novels/${encodeURIComponent(novelId)}`, {
    method: 'PUT',
    body: data,
    auth: true,
  })
}

export async function adminDeleteNovel(novelId: string): Promise<void> {
  return apiFetch<void>(`${BASE_URL}/admin/novels/${encodeURIComponent(novelId)}`, {
    method: 'DELETE',
    auth: true,
  })
}

/**
 * Uploads a cover image file using multipart/form-data.
 * Does NOT use apiFetch since it requires FormData (not JSON body).
 */
export async function adminUploadCover(file: File): Promise<{ url: string }> {
  const auth = getAuthStore()

  const formData = new FormData()
  formData.append('file', file)

  const headers: Record<string, string> = {}
  if (auth.accessToken) {
    headers['Authorization'] = `Bearer ${auth.accessToken}`
  }

  let response: Response
  try {
    response = await fetch(`${BASE_URL}/admin/novels/cover-upload`, {
      method: 'POST',
      headers,
      body: formData,
    })
  } catch (err) {
    throw new ApiError('network', `Network error: ${err instanceof Error ? err.message : String(err)}`)
  }

  if (!response.ok) {
    throw new ApiError('server', `Server error: ${response.status} ${response.statusText}`, response.status)
  }

  try {
    return (await response.json()) as { url: string }
  } catch (err) {
    throw new ApiError('parse', `Failed to parse response: ${err instanceof Error ? err.message : String(err)}`)
  }
}

// ── Admin — Chapters ──────────────────────────────────────────────────────────

export async function adminFetchChapters(novelId: string): Promise<AdminChapterSummary[]> {
  return apiFetch<AdminChapterSummary[]>(
    `${BASE_URL}/admin/novels/${encodeURIComponent(novelId)}/chapters`,
    { auth: true }
  )
}

export async function adminCreateChapter(novelId: string, data: ChapterFormData): Promise<AdminChapterSummary> {
  return apiFetch<AdminChapterSummary>(
    `${BASE_URL}/admin/novels/${encodeURIComponent(novelId)}/chapters`,
    {
      method: 'POST',
      body: data,
      auth: true,
    }
  )
}

export async function adminUpdateChapter(
  novelId: string,
  chapterNumber: number,
  data: ChapterFormData
): Promise<AdminChapterSummary> {
  return apiFetch<AdminChapterSummary>(
    `${BASE_URL}/admin/novels/${encodeURIComponent(novelId)}/chapters/${chapterNumber}`,
    {
      method: 'PUT',
      body: data,
      auth: true,
    }
  )
}

export async function adminDeleteChapter(novelId: string, chapterNumber: number): Promise<void> {
  return apiFetch<void>(
    `${BASE_URL}/admin/novels/${encodeURIComponent(novelId)}/chapters/${chapterNumber}`,
    {
      method: 'DELETE',
      auth: true,
    }
  )
}

// ── Genres (public) ───────────────────────────────────────────────────────────

/**
 * Fetches all genres (public endpoint, no auth required).
 * Used by FinderPage and FilterPanel to populate genre filter options.
 */
export async function fetchGenres(): Promise<Genre[]> {
  return apiFetch<Genre[]>(`${BASE_URL}/genres`)
}

// ── Admin — Genres ────────────────────────────────────────────────────────────

export async function adminFetchGenres(): Promise<Genre[]> {
  return apiFetch<Genre[]>(`${BASE_URL}/admin/genres`, { auth: true })
}

export async function adminCreateGenre(name: string): Promise<Genre> {
  return apiFetch<Genre>(`${BASE_URL}/admin/genres`, {
    method: 'POST',
    body: { name },
    auth: true,
  })
}

export async function adminDeleteGenre(genreId: string): Promise<void> {
  return apiFetch<void>(`${BASE_URL}/admin/genres/${encodeURIComponent(genreId)}`, {
    method: 'DELETE',
    auth: true,
  })
}

// ── Discovery & Leaderboard ───────────────────────────────────────────────────

/**
 * Fetches the novel leaderboard for the given period.
 * Returns entries sorted by popularityScore descending.
 */
export async function fetchLeaderboard(period: 'daily' | 'weekly' | 'all_time'): Promise<LeaderboardEntry[]> {
  const params = new URLSearchParams({ period })
  return apiFetch<LeaderboardEntry[]>(`${BASE_URL}/leaderboard?${params.toString()}`)
}

/**
 * Fetches the most popular novels for a given genre (max 10).
 */
export async function fetchPopularByGenre(genre: string): Promise<NovelSummary[]> {
  const params = new URLSearchParams({ genre })
  return apiFetch<NovelSummary[]>(`${BASE_URL}/discovery/popular-by-genre?${params.toString()}`)
}

/**
 * Fetches a random selection of novels (3 novels).
 */
export async function fetchRandomPick(): Promise<NovelSummary[]> {
  return apiFetch<NovelSummary[]>(`${BASE_URL}/discovery/random-pick`)
}

/**
 * Fetches the latest chapter updates.
 */
export async function fetchLatestUpdates(): Promise<LatestUpdateEntry[]> {
  return apiFetch<LatestUpdateEntry[]>(`${BASE_URL}/discovery/latest-updates`)
}

/**
 * Fetches aggregated home page data in a single request.
 */
export async function fetchHomeData(): Promise<HomeData> {
  return apiFetch<HomeData>(`${BASE_URL}/home`)
}

/**
 * Fetches the most recently added novels.
 * @param limit Maximum number of novels to return (default: 10)
 */
export async function fetchNewAdditions(limit = 10): Promise<NovelSummary[]> {
  const params = new URLSearchParams({ limit: String(limit) })
  return apiFetch<NovelSummary[]>(`${BASE_URL}/novels/new-additions?${params.toString()}`)
}

// ── Tags ──────────────────────────────────────────────────────────────────────

/**
 * Fetches all tags with their categories.
 */
export async function fetchTags(): Promise<Tag[]> {
  return apiFetch<Tag[]>(`${BASE_URL}/tags`)
}

/**
 * Fetches all tag categories.
 */
export async function fetchTagCategories(): Promise<TagCategory[]> {
  return apiFetch<TagCategory[]>(`${BASE_URL}/tag-categories`)
}

/**
 * Creates a new tag (admin only).
 */
export async function adminCreateTag(data: { name: string; categoryId: string }): Promise<Tag> {
  return apiFetch<Tag>(`${BASE_URL}/tags`, {
    method: 'POST',
    body: data,
    auth: true,
  })
}

/**
 * Updates an existing tag (admin only).
 */
export async function adminUpdateTag(tagId: string, data: { name: string; categoryId: string }): Promise<Tag> {
  return apiFetch<Tag>(`${BASE_URL}/tags/${encodeURIComponent(tagId)}`, {
    method: 'PUT',
    body: data,
    auth: true,
  })
}

/**
 * Deletes a tag by ID (admin only).
 */
export async function adminDeleteTag(tagId: string): Promise<void> {
  return apiFetch<void>(`${BASE_URL}/tags/${encodeURIComponent(tagId)}`, {
    method: 'DELETE',
    auth: true,
  })
}

/**
 * Fetches all tags assigned to a novel (admin only).
 */
export async function adminFetchNovelTags(novelId: string): Promise<Tag[]> {
  return apiFetch<Tag[]>(`${BASE_URL}/admin/novels/${encodeURIComponent(novelId)}/tags`, { auth: true })
}

/**
 * Replaces the tag list for a novel (admin only).
 * Accepts an array of tag IDs.
 */
export async function adminUpdateNovelTags(novelId: string, tagIds: string[]): Promise<void> {
  return apiFetch<void>(`${BASE_URL}/admin/novels/${encodeURIComponent(novelId)}/tags`, {
    method: 'PUT',
    body: { tagIds },
    auth: true,
  })
}

// ── Advanced Catalog Filter ───────────────────────────────────────────────────

/**
 * Fetches a filtered catalog page using the full FilterState.
 * Arrays are serialized as comma-separated strings in query params.
 * Optionally accepts a search query string (`q`) to combine text search with filters.
 */
export async function fetchFilteredCatalog(filter: FilterState, page: number, query?: string): Promise<CatalogResponse> {
  const params = new URLSearchParams()

  params.set('page', String(page))

  if (filter.genres.length > 0) params.set('genres', filter.genres.join(','))
  if (filter.tags.length > 0) params.set('tags', filter.tags.join(','))
  if (filter.excludeGenres.length > 0) params.set('excludeGenres', filter.excludeGenres.join(','))
  if (filter.excludeTags.length > 0) params.set('excludeTags', filter.excludeTags.join(','))
  if (filter.status !== '') params.set('status', filter.status)
  if (filter.minRating > 0) params.set('minRating', String(filter.minRating))
  if (filter.minChapters > 0) params.set('minChapters', String(filter.minChapters))
  if (filter.maxChapters > 0) params.set('maxChapters', String(filter.maxChapters))
  if (filter.sortBy) params.set('sortBy', filter.sortBy)
  if (filter.updatedAfter !== '') params.set('updatedAfter', filter.updatedAfter)
  if (filter.updatedBefore !== '') params.set('updatedBefore', filter.updatedBefore)
  if (query && query.trim().length > 0) params.set('q', query.trim())

  return apiFetch<CatalogResponse>(`${BASE_URL}/catalog?${params.toString()}`)
}

// ── Novel Detail Extensions ───────────────────────────────────────────────────

/**
 * Fetches summary statistics for a novel (chapter count, reader count, etc.).
 */
export async function fetchNovelStats(novelId: string): Promise<NovelStats> {
  return apiFetch<NovelStats>(`${BASE_URL}/novels/${encodeURIComponent(novelId)}/stats`)
}

/**
 * Fetches popularity rankings for a novel across three periods.
 */
export async function fetchNovelRankings(novelId: string): Promise<NovelRankings> {
  return apiFetch<NovelRankings>(`${BASE_URL}/novels/${encodeURIComponent(novelId)}/rankings`)
}

/**
 * Fetches the list of patrons (supporters) for a novel.
 */
export async function fetchNovelPatrons(novelId: string): Promise<Patron[]> {
  return apiFetch<Patron[]>(`${BASE_URL}/novels/${encodeURIComponent(novelId)}/patrons`)
}

/**
 * Fetches up to 10 recommended novels similar to the given novel.
 */
export async function fetchNovelRecommendations(novelId: string): Promise<NovelSummary[]> {
  return apiFetch<NovelSummary[]>(`${BASE_URL}/novels/${encodeURIComponent(novelId)}/recommendations`)
}

/**
 * Fetches other novels by the same author, excluding the specified novel.
 */
export async function fetchAuthorNovels(authorName: string, excludeNovelId: string): Promise<NovelSummary[]> {
  const params = new URLSearchParams({ excludeNovelId })
  return apiFetch<NovelSummary[]>(
    `${BASE_URL}/authors/${encodeURIComponent(authorName)}/novels?${params.toString()}`
  )
}

// ── Follows & Notifications ───────────────────────────────────────────────────

/**
 * Fetches all novels followed by the current user.
 */
export async function fetchFollows(): Promise<Follow[]> {
  return apiFetch<Follow[]>(`${BASE_URL}/follows`, { auth: true })
}

/**
 * Follows a novel for the current user.
 */
export async function followNovel(novelId: string): Promise<void> {
  return apiFetch<void>(`${BASE_URL}/follows/${encodeURIComponent(novelId)}`, {
    method: 'POST',
    auth: true,
  })
}

/**
 * Unfollows a novel for the current user.
 */
export async function unfollowNovel(novelId: string): Promise<void> {
  return apiFetch<void>(`${BASE_URL}/follows/${encodeURIComponent(novelId)}`, {
    method: 'DELETE',
    auth: true,
  })
}

/**
 * Fetches all chapter update notifications for the current user, sorted newest first.
 */
export async function fetchNotifications(): Promise<Notification[]> {
  return apiFetch<Notification[]>(`${BASE_URL}/notifications`, { auth: true })
}

/**
 * Marks all notifications as read for the current user.
 */
export async function markAllNotificationsRead(): Promise<void> {
  return apiFetch<void>(`${BASE_URL}/notifications/read-all`, {
    method: 'PUT',
    auth: true,
  })
}

// ── User Profile ──────────────────────────────────────────────────────────────

/**
 * Fetches the public profile for a given username.
 */
export async function fetchUserProfile(username: string): Promise<UserProfile> {
  return apiFetch<UserProfile>(`${BASE_URL}/users/${encodeURIComponent(username)}`)
}

// ── Reading Lists ─────────────────────────────────────────────────────────────

/**
 * Fetches all reading lists for the current user.
 */
export async function fetchReadingLists(): Promise<ReadingList[]> {
  return apiFetch<ReadingList[]>(`${BASE_URL}/lists`, { auth: true })
}

/**
 * Creates a new reading list with the given name.
 */
export async function createReadingList(name: string): Promise<ReadingList> {
  return apiFetch<ReadingList>(`${BASE_URL}/lists`, {
    method: 'POST',
    body: { name },
    auth: true,
  })
}

/**
 * Renames an existing reading list.
 */
export async function updateReadingList(listId: string, name: string): Promise<ReadingList> {
  return apiFetch<ReadingList>(`${BASE_URL}/lists/${encodeURIComponent(listId)}`, {
    method: 'PUT',
    body: { name },
    auth: true,
  })
}

/**
 * Deletes a reading list and all novels within it.
 */
export async function deleteReadingList(listId: string): Promise<void> {
  return apiFetch<void>(`${BASE_URL}/lists/${encodeURIComponent(listId)}`, {
    method: 'DELETE',
    auth: true,
  })
}

/**
 * Adds a novel to a reading list.
 */
export async function addNovelToList(listId: string, novelId: string): Promise<void> {
  return apiFetch<void>(
    `${BASE_URL}/lists/${encodeURIComponent(listId)}/novels/${encodeURIComponent(novelId)}`,
    {
      method: 'POST',
      auth: true,
    },
  )
}

/**
 * Removes a novel from a reading list.
 */
export async function removeNovelFromList(listId: string, novelId: string): Promise<void> {
  return apiFetch<void>(
    `${BASE_URL}/lists/${encodeURIComponent(listId)}/novels/${encodeURIComponent(novelId)}`,
    {
      method: 'DELETE',
      auth: true,
    },
  )
}

// ── Highlights ────────────────────────────────────────────────────────────────

/**
 * Fetches all highlights for a specific chapter of a novel.
 * If chapterNumber is omitted, returns all highlights for the novel across all chapters.
 * Returns highlights sorted by startOffset ascending.
 */
export async function fetchHighlights(novelId: string, chapterNumber?: number): Promise<Highlight[]> {
  const params = new URLSearchParams({ novelId: encodeURIComponent(novelId) })
  if (chapterNumber !== undefined) {
    params.set('chapterNumber', String(chapterNumber))
  }
  return apiFetch<Highlight[]>(`${BASE_URL}/highlights?${params.toString()}`, { auth: true })
}

/**
 * Creates a new text highlight in a chapter.
 * Returns the created highlight with its server-assigned id and createdAt.
 */
export async function createHighlight(
  data: Omit<Highlight, 'id' | 'createdAt'>
): Promise<Highlight> {
  return apiFetch<Highlight>(`${BASE_URL}/highlights`, {
    method: 'POST',
    body: data,
    auth: true,
  })
}

/**
 * Deletes a highlight by its ID.
 */
export async function deleteHighlight(highlightId: string): Promise<void> {
  return apiFetch<void>(`${BASE_URL}/highlights/${encodeURIComponent(highlightId)}`, {
    method: 'DELETE',
    auth: true,
  })
}

// ── Reports ───────────────────────────────────────────────────────────────────

/**
 * Submits a chapter error report.
 * Requires authentication.
 */
export async function submitReport(
  data: Omit<Report, 'id' | 'status' | 'createdAt'>
): Promise<void> {
  return apiFetch<void>(`${BASE_URL}/reports`, {
    method: 'POST',
    body: data,
    auth: true,
  })
}

/**
 * Fetches all chapter reports for the admin panel.
 * Optionally filters by status ('new' | 'reviewing' | 'resolved').
 * Requires admin authentication.
 */
export async function adminFetchReports(status?: Report['status']): Promise<Report[]> {
  const params = new URLSearchParams()
  if (status) {
    params.set('status', status)
  }
  const query = params.toString()
  return apiFetch<Report[]>(`${BASE_URL}/admin/reports${query ? `?${query}` : ''}`, { auth: true })
}

/**
 * Updates the status of a report (new → reviewing → resolved).
 * Requires admin authentication.
 */
export async function adminUpdateReportStatus(
  reportId: string,
  status: Report['status']
): Promise<Report> {
  return apiFetch<Report>(`${BASE_URL}/admin/reports/${encodeURIComponent(reportId)}`, {
    method: 'PATCH',
    body: { status },
    auth: true,
  })
}
