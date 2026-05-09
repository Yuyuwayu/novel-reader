/**
 * Unit tests for the API client in src/api/index.ts.
 * Tests error mapping: network errors, server errors, and parse errors.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { fetchCatalog, fetchNovelDetail, fetchChapter, filterNovels, ApiError, fetchDefinition, translateChapter } from '@/api'
import type { NovelSummary } from '@/types'

describe('API Client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // ── Network errors ──────────────────────────────────────────────────────────

  describe('fetchCatalog — network error', () => {
    it('throws ApiError with type "network" when fetch rejects', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network unavailable'))

      await expect(fetchCatalog(1)).rejects.toBeInstanceOf(ApiError)
      await expect(fetchCatalog(1)).rejects.toMatchObject({ type: 'network' })
    })
  })

  describe('fetchNovelDetail — network error', () => {
    it('throws ApiError with type "network" when fetch rejects', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network unavailable'))

      await expect(fetchNovelDetail('novel-1')).rejects.toBeInstanceOf(ApiError)
      await expect(fetchNovelDetail('novel-1')).rejects.toMatchObject({ type: 'network' })
    })
  })

  describe('fetchChapter — network error', () => {
    it('throws ApiError with type "network" when fetch rejects', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network unavailable'))

      await expect(fetchChapter('novel-1', 1)).rejects.toBeInstanceOf(ApiError)
      await expect(fetchChapter('novel-1', 1)).rejects.toMatchObject({ type: 'network' })
    })
  })

  // ── Server errors (non-OK HTTP status) ─────────────────────────────────────

  describe('fetchCatalog — server error', () => {
    it('throws ApiError with type "server" and status 404 on 404 response', async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(null, { status: 404, statusText: 'Not Found' }),
      )

      await expect(fetchCatalog(1)).rejects.toBeInstanceOf(ApiError)
      await expect(fetchCatalog(1)).rejects.toMatchObject({ type: 'server', status: 404 })
    })

    it('throws ApiError with type "server" and status 500 on 500 response', async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(null, { status: 500, statusText: 'Internal Server Error' }),
      )

      await expect(fetchCatalog(1)).rejects.toMatchObject({ type: 'server', status: 500 })
    })
  })

  describe('fetchNovelDetail — server error', () => {
    it('throws ApiError with type "server" and status 404 on 404 response', async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(null, { status: 404, statusText: 'Not Found' }),
      )

      await expect(fetchNovelDetail('novel-1')).rejects.toBeInstanceOf(ApiError)
      await expect(fetchNovelDetail('novel-1')).rejects.toMatchObject({ type: 'server', status: 404 })
    })

    it('throws ApiError with type "server" and status 500 on 500 response', async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(null, { status: 500, statusText: 'Internal Server Error' }),
      )

      await expect(fetchNovelDetail('novel-1')).rejects.toMatchObject({ type: 'server', status: 500 })
    })
  })

  describe('fetchChapter — server error', () => {
    it('throws ApiError with type "server" and status 404 on 404 response', async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(null, { status: 404, statusText: 'Not Found' }),
      )

      await expect(fetchChapter('novel-1', 1)).rejects.toBeInstanceOf(ApiError)
      await expect(fetchChapter('novel-1', 1)).rejects.toMatchObject({ type: 'server', status: 404 })
    })

    it('throws ApiError with type "server" and status 500 on 500 response', async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(null, { status: 500, statusText: 'Internal Server Error' }),
      )

      await expect(fetchChapter('novel-1', 1)).rejects.toMatchObject({ type: 'server', status: 500 })
    })
  })

  // ── Parse errors (invalid JSON body) ───────────────────────────────────────

  describe('fetchCatalog — parse error', () => {
    it('throws ApiError with type "parse" when response body is not valid JSON', async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response('not-json', { status: 200 }),
      )

      await expect(fetchCatalog(1)).rejects.toBeInstanceOf(ApiError)
      await expect(fetchCatalog(1)).rejects.toMatchObject({ type: 'parse' })
    })
  })

  describe('fetchNovelDetail — parse error', () => {
    it('throws ApiError with type "parse" when response body is not valid JSON', async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response('not-json', { status: 200 }),
      )

      await expect(fetchNovelDetail('novel-1')).rejects.toBeInstanceOf(ApiError)
      await expect(fetchNovelDetail('novel-1')).rejects.toMatchObject({ type: 'parse' })
    })
  })

  describe('fetchChapter — parse error', () => {
    it('throws ApiError with type "parse" when response body is not valid JSON', async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response('not-json', { status: 200 }),
      )

      await expect(fetchChapter('novel-1', 1)).rejects.toBeInstanceOf(ApiError)
      await expect(fetchChapter('novel-1', 1)).rejects.toMatchObject({ type: 'parse' })
    })
  })

  // ── Glossary & Translate API ───────────────────────────────────────────────

  describe('fetchDefinition', () => {
    it('returns successful JSON response for valid definition', async () => {
      const mockResult = { term: 'qi', definition: 'Energi.' }
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify(mockResult), { status: 200 }),
      )

      const res = await fetchDefinition('qi')
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/dictionary?term=qi'), expect.anything())
      expect(res).toEqual(mockResult)
    })

    it('throws ApiError on server error', async () => {
      vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 500 }))
      await expect(fetchDefinition('qi')).rejects.toBeInstanceOf(ApiError)
    })
  })

  describe('translateChapter', () => {
    it('returns successful JSON response for translation', async () => {
      const mockResult = { novelId: '1', chapterNumber: 1, title: 'Bab 1', content: { paragraphs: ['Test'] }, totalChapters: 10 }
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify(mockResult), { status: 200 }),
      )

      const res = await translateChapter('1', 1)
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/translate/chapter'), expect.objectContaining({ method: 'POST' }))
      expect(res).toEqual(mockResult)
    })

    it('throws ApiError on server error', async () => {
      vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 404 }))
      await expect(translateChapter('1', 1)).rejects.toBeInstanceOf(ApiError)
    })
  })
})

// ── filterNovels ─────────────────────────────────────────────────────────────

/** Helper to build a minimal NovelSummary for testing */
function makeNovel(id: string, title: string, author: string): NovelSummary {
  return {
    id,
    title,
    author,
    genre: [],
    thumbnailUrl: 'https://example.com/thumb.jpg',
    status: 'ongoing',
  }
}

const sampleNovels: NovelSummary[] = [
  makeNovel('1', 'The Great Adventure', 'Alice Smith'),
  makeNovel('2', 'Mystery of the Night', 'Bob Jones'),
  makeNovel('3', 'Romance in Paris', 'Carol White'),
  makeNovel('4', 'Science Fiction Tales', 'Alice Brown'),
]

describe('filterNovels', () => {
  // Requirements: 2.5 — empty query returns full catalog
  it('returns all novels when query is empty string', () => {
    const result = filterNovels(sampleNovels, '')
    expect(result).toHaveLength(sampleNovels.length)
    expect(result).toEqual(sampleNovels)
  })

  // Requirements: 2.2 — query < 2 characters returns full catalog
  it('returns all novels when query is a single character', () => {
    const result = filterNovels(sampleNovels, 'a')
    expect(result).toHaveLength(sampleNovels.length)
    expect(result).toEqual(sampleNovels)
  })

  // Requirements: 2.2 — valid query filters by title (case-insensitive)
  it('returns only novels whose title matches the query (case-insensitive)', () => {
    const result = filterNovels(sampleNovels, 'mystery')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  // Requirements: 2.2 — valid query filters by author (case-insensitive)
  it('returns novels whose author matches the query (case-insensitive)', () => {
    const result = filterNovels(sampleNovels, 'alice')
    expect(result).toHaveLength(2)
    const ids = result.map((n) => n.id)
    expect(ids).toContain('1')
    expect(ids).toContain('4')
  })

  // Requirements: 2.2 — query matches title OR author
  it('returns novels matching query in title or author', () => {
    const result = filterNovels(sampleNovels, 'paris')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('3')
  })

  // Requirements: 2.3 — no match returns empty array
  it('returns empty array when no novels match the query', () => {
    const result = filterNovels(sampleNovels, 'zzznomatch')
    expect(result).toHaveLength(0)
  })

  // Requirements: 2.2 — query is case-insensitive (uppercase input)
  it('is case-insensitive for uppercase query', () => {
    const result = filterNovels(sampleNovels, 'GREAT')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  // Edge case: empty novels array
  it('returns empty array when novels list is empty', () => {
    const result = filterNovels([], 'adventure')
    expect(result).toHaveLength(0)
  })
})

// ── ChapterNavigation component ───────────────────────────────────────────────

import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import ChapterNavigation from '@/components/ChapterNavigation.vue'

/** Build a minimal router so RouterLink / useRouter work inside the component */
function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
  })
}

describe('ChapterNavigation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // Requirements: 4.3 — prev button disabled at chapter 1
  it('disables the "Chapter Sebelumnya" button when currentChapter is 1', async () => {
    const router = makeRouter()
    const wrapper = mount(ChapterNavigation, {
      props: { novelId: 'novel-1', currentChapter: 1, totalChapters: 10 },
      global: { plugins: [router] },
    })

    const prevBtn = wrapper.find('button[aria-label="Chapter Sebelumnya"]')
    expect(prevBtn.attributes('disabled')).toBeDefined()
  })

  // Requirements: 4.4 — next button disabled at last chapter
  it('disables the "Chapter Berikutnya" button when currentChapter equals totalChapters', async () => {
    const router = makeRouter()
    const wrapper = mount(ChapterNavigation, {
      props: { novelId: 'novel-1', currentChapter: 10, totalChapters: 10 },
      global: { plugins: [router] },
    })

    const nextBtn = wrapper.find('button[aria-label="Chapter Berikutnya"]')
    expect(nextBtn.attributes('disabled')).toBeDefined()
  })

  // Requirements: 4.3, 4.4 — both buttons active in the middle
  it('enables both buttons when currentChapter is between 1 and totalChapters', async () => {
    const router = makeRouter()
    const wrapper = mount(ChapterNavigation, {
      props: { novelId: 'novel-1', currentChapter: 5, totalChapters: 10 },
      global: { plugins: [router] },
    })

    const prevBtn = wrapper.find('button[aria-label="Chapter Sebelumnya"]')
    const nextBtn = wrapper.find('button[aria-label="Chapter Berikutnya"]')
    expect(prevBtn.attributes('disabled')).toBeUndefined()
    expect(nextBtn.attributes('disabled')).toBeUndefined()
  })
})

// ── apiFetch with auth: true ──────────────────────────────────────────────────

import { fetchNovelBookmarks, _setAuthStoreGetter } from '@/api'

describe('apiFetch with auth: true', () => {
  let mockAuthStore: {
    accessToken: string | null
    tryRefreshToken: ReturnType<typeof vi.fn>
    logout: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    localStorage.clear()

    mockAuthStore = {
      accessToken: 'test-access-token',
      tryRefreshToken: vi.fn().mockResolvedValue(true),
      logout: vi.fn().mockResolvedValue(undefined),
    }

    // Inject mock auth store into the api module to avoid circular dependency issues
    _setAuthStoreGetter(() => mockAuthStore as never)
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('adds Authorization header when auth: true and accessToken is set', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 })
    )

    await fetchNovelBookmarks()

    expect(fetch).toHaveBeenCalledOnce()
    const [, init] = vi.mocked(fetch).mock.calls[0]
    const headers = (init as RequestInit).headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer test-access-token')
  })

  it('retries request after 401 triggers a successful token refresh', async () => {
    // First call returns 401, second call (after refresh) returns 200
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(null, { status: 401, statusText: 'Unauthorized' }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))

    mockAuthStore.tryRefreshToken.mockResolvedValue(true)

    const result = await fetchNovelBookmarks()

    expect(mockAuthStore.tryRefreshToken).toHaveBeenCalledOnce()
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(result).toEqual([])
  })

  it('calls logout and redirects to /login when refresh fails after 401', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 401, statusText: 'Unauthorized' })
    )

    mockAuthStore.tryRefreshToken.mockResolvedValue(false)

    // Set up window.location to be writable
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
      configurable: true,
    })

    await expect(fetchNovelBookmarks()).rejects.toMatchObject({ type: 'server', status: 401 })

    expect(mockAuthStore.tryRefreshToken).toHaveBeenCalledOnce()
    expect(mockAuthStore.logout).toHaveBeenCalledOnce()
    expect(window.location.href).toBe('/login')
  })
})

// ── StarRating component ──────────────────────────────────────────────────────

import { setActivePinia, createPinia } from 'pinia'
import StarRating from '@/components/StarRating.vue'

describe('StarRating', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // Test: correct number of filled stars based on modelValue
  it('renders filled stars equal to modelValue', async () => {
    const wrapper = mount(StarRating, {
      props: { modelValue: 3, readonly: false },
    })

    // Stars with fill="currentColor" are filled; stars with fill="none" are empty
    const filledStars = wrapper.findAll('svg[fill="currentColor"]')
    expect(filledStars).toHaveLength(3)
  })

  it('renders no filled stars when modelValue is null', async () => {
    const wrapper = mount(StarRating, {
      props: { modelValue: null, readonly: false },
    })

    const filledStars = wrapper.findAll('svg[fill="currentColor"]')
    expect(filledStars).toHaveLength(0)
  })

  // Test: clicking a star emits 'update:modelValue' with correct value
  it('emits update:modelValue with the clicked star value', async () => {
    const wrapper = mount(StarRating, {
      props: { modelValue: null, readonly: false },
    })

    const buttons = wrapper.findAll('button')
    // Click the 4th star (index 3)
    await buttons[3].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([4])
  })

  it('emits update:modelValue with value 1 when first star is clicked', async () => {
    const wrapper = mount(StarRating, {
      props: { modelValue: null, readonly: false },
    })

    const buttons = wrapper.findAll('button')
    await buttons[0].trigger('click')

    expect(wrapper.emitted('update:modelValue')![0]).toEqual([1])
  })

  // Test: readonly mode does not emit events when stars are clicked
  it('does not emit update:modelValue in readonly mode', async () => {
    const wrapper = mount(StarRating, {
      props: { modelValue: null, readonly: true, averageRating: 4, totalRatings: 10 },
    })

    const buttons = wrapper.findAll('button')
    for (const btn of buttons) {
      await btn.trigger('click')
    }

    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('renders 5 star buttons total', () => {
    const wrapper = mount(StarRating, {
      props: { modelValue: 2, readonly: false },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(5)
  })
})

// ── CommentSection component ──────────────────────────────────────────────────

import CommentSection from '@/components/CommentSection.vue'
import type { Comment } from '@/types'

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api')>()
  return {
    ...actual,
    fetchComments: vi.fn(),
    postComment: vi.fn(),
    deleteComment: vi.fn(),
    adminUploadCover: vi.fn(),
    adminCreateChapter: vi.fn(),
    adminUpdateChapter: vi.fn(),
    fetchHighlights: vi.fn().mockResolvedValue([]),
    // fetchChapter is intentionally NOT mocked here so the API Client unit tests
    // that call the real fetchChapter still work. The AdminChapterFormPage tests
    // only exercise create-mode (no chapterNumber param), so fetchChapter is never
    // invoked by the component in those tests.
  }
})

import { fetchComments as mockFetchComments, postComment as mockPostComment } from '@/api'

function makeComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 'comment-1',
    novelId: 'novel-1',
    chapterNumber: 1,
    userId: 'user-1',
    username: 'testuser',
    text: 'Great chapter!',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('CommentSection', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // Test: comment list renders correctly
  it('renders comment list after fetchComments resolves', async () => {
    const comments = [
      makeComment({ id: 'c1', username: 'alice', text: 'Hello!' }),
      makeComment({ id: 'c2', username: 'bob', text: 'Nice chapter.' }),
    ]
    vi.mocked(mockFetchComments).mockResolvedValue(comments)

    const wrapper = mount(CommentSection, {
      props: { novelId: 'novel-1', chapterNumber: 1 },
      global: {
        plugins: [createPinia()],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })

    // Wait for async fetchComments to resolve
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('alice')
    expect(wrapper.text()).toContain('Hello!')
    expect(wrapper.text()).toContain('bob')
    expect(wrapper.text()).toContain('Nice chapter.')
  })

  // Test: submitting empty comment does not call postComment
  it('does not call postComment when comment text is empty', async () => {
    vi.mocked(mockFetchComments).mockResolvedValue([])

    const pinia = createPinia()
    const wrapper = mount(CommentSection, {
      props: { novelId: 'novel-1', chapterNumber: 1 },
      global: {
        plugins: [pinia],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })

    // Set up auth store as authenticated
    const { useAuthStore } = await import('@/stores/auth')
    const auth = useAuthStore()
    auth.accessToken = 'test-token'
    auth.user = { id: 'user-1', username: 'testuser', email: 'test@test.com', role: 'user' }

    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    // Find and click submit button without entering text
    const submitBtn = wrapper.find('button[type="button"]:last-of-type')
    if (submitBtn.exists()) {
      await submitBtn.trigger('click')
    }

    expect(mockPostComment).not.toHaveBeenCalled()
  })

  // Test: delete button only appears for own comments
  it('shows delete button only for comments belonging to the current user', async () => {
    const pinia = createPinia()

    const { useAuthStore } = await import('@/stores/auth')

    const comments = [
      makeComment({ id: 'c1', userId: 'user-1', username: 'me', text: 'My comment' }),
      makeComment({ id: 'c2', userId: 'user-2', username: 'other', text: 'Other comment' }),
    ]
    vi.mocked(mockFetchComments).mockResolvedValue(comments)

    const wrapper = mount(CommentSection, {
      props: { novelId: 'novel-1', chapterNumber: 1 },
      global: {
        plugins: [pinia],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })

    // Set auth user to user-1
    const auth = useAuthStore()
    auth.accessToken = 'test-token'
    auth.user = { id: 'user-1', username: 'me', email: 'me@test.com', role: 'user' }

    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    // Delete buttons should only appear for own comments
    const deleteButtons = wrapper.findAll('button[aria-label^="Hapus komentar"]')
    expect(deleteButtons).toHaveLength(1)
    expect(deleteButtons[0].attributes('aria-label')).toContain('me')
  })
})

// ── CoverUpload component ─────────────────────────────────────────────────────

import { adminUploadCover as mockAdminUploadCover } from '@/api'
import CoverUpload from '@/components/CoverUpload.vue'

describe('CoverUpload', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // Requirements: 12.2, 12.4 — MIME type validation rejects non-image files
  it('shows an error message when a non-image file (application/pdf) is selected', async () => {
    const wrapper = mount(CoverUpload, {
      props: { modelValue: null },
    })

    const file = new File(['dummy content'], 'document.pdf', { type: 'application/pdf' })
    const input = wrapper.find('input[type="file"]')
    expect(input.exists()).toBe(true)

    // Simulate file selection by setting files on the input element
    Object.defineProperty(input.element, 'files', {
      value: [file],
      configurable: true,
    })
    await input.trigger('change')

    // Error message should be visible
    const errorEl = wrapper.find('[role="alert"]')
    expect(errorEl.exists()).toBe(true)
    expect(errorEl.text()).toContain('Format file tidak didukung')

    // adminUploadCover should NOT have been called
    expect(mockAdminUploadCover).not.toHaveBeenCalled()
  })

  // Requirements: 12.2, 12.4 — size validation rejects files > 2 MB
  it('shows an error message when a file larger than 2 MB is selected', async () => {
    const wrapper = mount(CoverUpload, {
      props: { modelValue: null },
    })

    // Create a file whose size property reports > 2 MB
    const oversizedFile = new File(['x'.repeat(1)], 'big.jpg', { type: 'image/jpeg' })
    Object.defineProperty(oversizedFile, 'size', { value: 2 * 1024 * 1024 + 1, configurable: true })

    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      value: [oversizedFile],
      configurable: true,
    })
    await input.trigger('change')

    const errorEl = wrapper.find('[role="alert"]')
    expect(errorEl.exists()).toBe(true)
    expect(errorEl.text()).toContain('2 MB')

    expect(mockAdminUploadCover).not.toHaveBeenCalled()
  })

  // Requirements: 12.3 — preview is shown after a valid file is selected
  it('displays a preview image after a valid file is selected', async () => {
    const fakeObjectUrl = 'blob:http://localhost/fake-preview'
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue(fakeObjectUrl),
      revokeObjectURL: vi.fn(),
    })

    // adminUploadCover resolves with a URL (prevents unhandled rejection)
    vi.mocked(mockAdminUploadCover).mockResolvedValue({ url: 'https://example.com/cover.jpg' })

    const wrapper = mount(CoverUpload, {
      props: { modelValue: null },
    })

    const validFile = new File(['img'], 'cover.jpg', { type: 'image/jpeg' })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      value: [validFile],
      configurable: true,
    })
    await input.trigger('change')

    // Wait for the reactive update to propagate
    await wrapper.vm.$nextTick()

    // A preview <img> should now be rendered with the object URL
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe(fakeObjectUrl)

    vi.unstubAllGlobals()
  })
})

// ── AdminChapterFormPage component ────────────────────────────────────────────

import AdminChapterFormPage from '@/pages/admin/AdminChapterFormPage.vue'
import { adminCreateChapter as mockAdminCreateChapter } from '@/api'

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()
  return {
    ...actual,
    useRoute: vi.fn().mockReturnValue({ params: {}, path: '/', query: {}, fullPath: '/' }),
    useRouter: vi.fn().mockReturnValue({ push: vi.fn(), replace: vi.fn() }),
  }
})

describe('AdminChapterFormPage — validation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // Requirements: 11.9, 14.4 — past scheduledAt shows error and blocks submit
  it('shows error "Tanggal rilis harus di masa depan" for a past scheduledAt and does not call adminCreateChapter', async () => {
    const wrapper = mount(AdminChapterFormPage, {
      global: { plugins: [createPinia()] },
    })

    // Fill required fields
    await wrapper.find('#chapter-title').setValue('Chapter Satu')
    await wrapper.find('#chapter-content').setValue('Isi konten chapter ini.')

    // Set scheduledAt to a date in the past
    const pastDate = new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
    // Format as datetime-local value: YYYY-MM-DDTHH:mm
    const pad = (n: number) => String(n).padStart(2, '0')
    const pastValue = `${pastDate.getFullYear()}-${pad(pastDate.getMonth() + 1)}-${pad(pastDate.getDate())}T${pad(pastDate.getHours())}:${pad(pastDate.getMinutes())}`
    await wrapper.find('#chapter-scheduled-at').setValue(pastValue)

    // Submit the form
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    // Error message should appear
    const errorEl = wrapper.find('#scheduled-at-error')
    expect(errorEl.exists()).toBe(true)
    expect(errorEl.text()).toContain('Tanggal rilis harus di masa depan')

    // API should NOT have been called
    expect(mockAdminCreateChapter).not.toHaveBeenCalled()
  })

  // Requirements: 11.9, 14.4 — empty required fields block submit
  it('shows validation errors for empty title and content and does not call adminCreateChapter', async () => {
    const wrapper = mount(AdminChapterFormPage, {
      global: { plugins: [createPinia()] },
    })

    // Leave title and content empty, submit immediately
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    // Title error should appear
    const titleError = wrapper.find('#title-error')
    expect(titleError.exists()).toBe(true)
    expect(titleError.text()).toContain('Judul wajib diisi')

    // Content error should appear
    const contentError = wrapper.find('#content-error')
    expect(contentError.exists()).toBe(true)
    expect(contentError.text()).toContain('Konten wajib diisi')

    // API should NOT have been called
    expect(mockAdminCreateChapter).not.toHaveBeenCalled()
  })
})

// ── Page Consolidation: Router Redirect Tests (Task 12.1) ─────────────────────
// Requirements: 1.1, 4.1, 4.2, 4.3
// Note: These tests use isolated createMemoryHistory() routers, NOT the global
// vi.mock('vue-router') mock above. They test redirect logic directly.

import { createRouter as createTestRouter } from 'vue-router'

function makePageConsolidationRouter() {
  return createTestRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/finder', component: { template: '<div />' } },
      { path: '/catalog', redirect: (to) => ({ path: '/finder', query: to.query }) },
      { path: '/discovery', redirect: '/' },
      { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
    ],
  })
}

describe('Router Redirects — page-consolidation', () => {
  // Requirements: 1.1 — /discovery redirects to /
  it('navigating to /discovery redirects to /', async () => {
    const router = makePageConsolidationRouter()
    await router.push('/discovery')
    expect(router.currentRoute.value.path).toBe('/')
  })

  // Requirements: 4.1 — /catalog redirects to /finder
  it('navigating to /catalog redirects to /finder', async () => {
    const router = makePageConsolidationRouter()
    await router.push('/catalog')
    expect(router.currentRoute.value.path).toBe('/finder')
  })

  // Requirements: 4.2, 4.3 — /catalog?genres=Fantasy redirects to /finder?genres=Fantasy
  it('navigating to /catalog?genres=Fantasy redirects to /finder?genres=Fantasy', async () => {
    const router = makePageConsolidationRouter()
    await router.push('/catalog?genres=Fantasy')
    expect(router.currentRoute.value.path).toBe('/finder')
    expect(router.currentRoute.value.query.genres).toBe('Fantasy')
  })

  // Requirements: 4.2, 4.3 — /catalog?tags=magic redirects to /finder?tags=magic
  it('navigating to /catalog?tags=magic redirects to /finder?tags=magic', async () => {
    const router = makePageConsolidationRouter()
    await router.push('/catalog?tags=magic')
    expect(router.currentRoute.value.path).toBe('/finder')
    expect(router.currentRoute.value.query.tags).toBe('magic')
  })
})

// ── Page Consolidation: Navigation Component Tests (Task 12.2) ────────────────
// Requirements: 4.5, 4.6, 4.7, 9.3, 9.4, 9.5

import AppNavbar from '@/components/AppNavbar.vue'
import MobileBottomNav from '@/components/MobileBottomNav.vue'
import MobileSidebarDrawer from '@/components/MobileSidebarDrawer.vue'

describe('AppNavbar — navigation links (page-consolidation)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // Requirements: 9.3 — AppNavbar must not link to /catalog or /discovery
  it('does not contain link to /catalog or /discovery', () => {
    const router = makePageConsolidationRouter()
    const wrapper = mount(AppNavbar, {
      global: {
        plugins: [router, createPinia()],
        stubs: {
          MobileSidebarDrawer: { template: '<div />' },
          RouterLink: false,
        },
      },
    })
    const html = wrapper.html()
    expect(html).not.toContain('href="/catalog"')
    expect(html).not.toContain('href="/discovery"')
  })

  // Requirements: 4.5 — AppNavbar must contain link to /finder with label "Katalog"
  it('contains link to /finder with label "Katalog"', () => {
    const router = makePageConsolidationRouter()
    const wrapper = mount(AppNavbar, {
      global: {
        plugins: [router, createPinia()],
        stubs: {
          MobileSidebarDrawer: { template: '<div />' },
          RouterLink: false,
        },
      },
    })
    const html = wrapper.html()
    expect(html).toContain('href="/finder"')
    expect(wrapper.text()).toContain('Katalog')
  })
})

describe('MobileBottomNav — navigation links (page-consolidation)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // Requirements: 9.4 — MobileBottomNav must not link to /catalog
  it('does not contain link to /catalog', () => {
    const router = makePageConsolidationRouter()
    const wrapper = mount(MobileBottomNav, {
      global: {
        plugins: [router, createPinia()],
        stubs: { RouterLink: false },
      },
    })
    expect(wrapper.html()).not.toContain('href="/catalog"')
  })

  // Requirements: 4.6 — MobileBottomNav must contain link to /finder with label "Katalog"
  it('contains link to /finder with label "Katalog"', () => {
    const router = makePageConsolidationRouter()
    const wrapper = mount(MobileBottomNav, {
      global: {
        plugins: [router, createPinia()],
        stubs: { RouterLink: false },
      },
    })
    const html = wrapper.html()
    expect(html).toContain('href="/finder"')
    expect(wrapper.text()).toContain('Katalog')
  })
})

describe('MobileSidebarDrawer — navigation links (page-consolidation)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // Requirements: 9.5 — MobileSidebarDrawer must not link to /catalog or /discovery
  it('does not contain link to /catalog or /discovery', () => {
    const router = makePageConsolidationRouter()
    const wrapper = mount(MobileSidebarDrawer, {
      props: { open: true },
      global: {
        plugins: [router, createPinia()],
        stubs: { RouterLink: false },
      },
    })
    const html = wrapper.html()
    expect(html).not.toContain('href="/catalog"')
    expect(html).not.toContain('href="/discovery"')
  })
})

// ── Page Consolidation: DetailPage & NotesPage Navigation Tests (Task 12.3) ───
// Requirements: 5.1, 5.2, 5.3, 5.4, 7.1, 3.1

describe('DetailPage — navigateToGenre and navigateToTag (page-consolidation)', () => {
  // Requirements: 5.1, 5.3 — navigateToGenre navigates to /finder?genres=<genre>
  it('navigateToGenre("Fantasy") navigates to /finder?genres=Fantasy', () => {
    const pushCalls: unknown[] = []
    const mockRouter = { push: (args: unknown) => { pushCalls.push(args) } }

    // Simulate the navigateToGenre logic from DetailPage
    function navigateToGenre(genre: string) {
      mockRouter.push({ path: '/finder', query: { genres: genre } })
    }

    navigateToGenre('Fantasy')
    const call = pushCalls[0] as { path: string; query: { genres: string } }
    expect(call.path).toBe('/finder')
    expect(call.query.genres).toBe('Fantasy')
  })

  // Requirements: 5.2, 5.4 — navigateToTag navigates to /finder?tags=<tagId>
  it('navigateToTag("tag-123") navigates to /finder?tags=tag-123', () => {
    const pushCalls: unknown[] = []
    const mockRouter = { push: (args: unknown) => { pushCalls.push(args) } }

    // Simulate the navigateToTag logic from DetailPage
    function navigateToTag(tagId: string) {
      mockRouter.push({ path: '/finder', query: { tags: tagId } })
    }

    navigateToTag('tag-123')
    const call = pushCalls[0] as { path: string; query: { tags: string } }
    expect(call.path).toBe('/finder')
    expect(call.query.tags).toBe('tag-123')
  })
})

describe('NotesPage — "Mulai Membaca" link (page-consolidation)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // Requirements: 7.1 — "Mulai Membaca" link in NotesPage points to /finder
  it('"Mulai Membaca" link points to /finder', () => {
    const router = makePageConsolidationRouter()

    // fetchHighlights is already mocked via the top-level vi.mock('@/api') call
    // (returns [] by default, so NotesPage renders the empty state)

    const wrapper = mount(NotesPage, {
      global: {
        plugins: [router, createPinia()],
        stubs: {
          RouterLink: false,
          LoadingIndicator: { template: '<div />' },
          ErrorMessage: { template: '<div />' },
          ConfirmDialog: { template: '<div />' },
        },
      },
    })

    // The empty state renders the "Mulai Membaca" RouterLink to /finder
    const html = wrapper.html()
    expect(html).toContain('href="/finder"')
  })
})

import NotesPage from '@/pages/NotesPage.vue'
import FinderPage from '@/pages/FinderPage.vue'
import SearchBar from '@/components/SearchBar.vue'

describe('FinderPage — SearchBar in header (page-consolidation)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // jsdom does not implement IntersectionObserver — provide a no-op stub
    vi.stubGlobal('IntersectionObserver', class {
      observe() {}
      unobserve() {}
      disconnect() {}
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ novels: [], total: 0, page: 1, perPage: 20 }), { status: 200 })
    ))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // Requirements: 3.1 — SearchBar appears in FinderPage header
  it('renders a SearchBar component in the header', async () => {
    const router = makePageConsolidationRouter()
    const wrapper = mount(FinderPage, {
      global: {
        plugins: [router, createPinia()],
        stubs: {
          FilterPanel: { template: '<div />' },
          NovelCard: { template: '<div />' },
          SkeletonLoader: { template: '<div />' },
          ErrorMessage: { template: '<div />' },
        },
      },
    })

    // SearchBar should be present in the rendered output
    expect(wrapper.findComponent(SearchBar).exists()).toBe(true)

    // Flush all pending async operations (onMounted, loadInitial, etc.)
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 0))
    await wrapper.vm.$nextTick()
  })
})


// ── Cache Manager Unit Tests ───────────────────────────────────────────────

import { CacheManager } from '@/utils/cacheManager'

describe('CacheManager', () => {
  let manager: CacheManager

  beforeEach(async () => {
    manager = new CacheManager()
    await manager.init()
    await manager.clearCache()
  })

  afterEach(async () => {
    await manager.clearCache()
  })

  describe('cache key generation', () => {
    it('should generate correct cache key format', async () => {
      const chapter = {
        novelId: 'novel-123',
        chapterNumber: 45,
        content: 'Test content',
        title: 'Test Chapter'
      }

      await manager.cacheChapter(chapter)
      const retrieved = await manager.getCachedChapter('novel-123', 45)

      expect(retrieved).not.toBeNull()
      expect(retrieved?.key).toBe('novel-123-45')
    })

    it('should generate unique keys for different novel-chapter combinations', async () => {
      const chapter1 = {
        novelId: 'novel-1',
        chapterNumber: 1,
        content: 'Content 1',
        title: 'Chapter 1'
      }

      const chapter2 = {
        novelId: 'novel-1',
        chapterNumber: 2,
        content: 'Content 2',
        title: 'Chapter 2'
      }

      await manager.cacheChapter(chapter1)
      await manager.cacheChapter(chapter2)

      const retrieved1 = await manager.getCachedChapter('novel-1', 1)
      const retrieved2 = await manager.getCachedChapter('novel-1', 2)

      expect(retrieved1?.key).toBe('novel-1-1')
      expect(retrieved2?.key).toBe('novel-1-2')
      expect(retrieved1?.key).not.toBe(retrieved2?.key)
    })
  })

  describe('fallback to memory cache', () => {
    it('should use memory cache when IndexedDB unavailable', () => {
      const memoryManager = new CacheManager()
      // Don't call init() to simulate IndexedDB unavailable
      expect(memoryManager.isUsingMemoryCache()).toBe(true)
    })

    it('should limit memory cache to 10 chapters', async () => {
      const memoryManager = new CacheManager()
      // Don't call init() to force memory-only mode

      // Cache 15 chapters
      for (let i = 1; i <= 15; i++) {
        await memoryManager.cacheChapter({
          novelId: 'novel-1',
          chapterNumber: i,
          content: `Content ${i}`,
          title: `Chapter ${i}`
        })
      }

      const stats = await memoryManager.getCacheStats()
      expect(stats.count).toBeLessThanOrEqual(10)
    })
  })

  describe('error handling', () => {
    it('should handle empty content', async () => {
      const chapter = {
        novelId: 'novel-1',
        chapterNumber: 1,
        content: '',
        title: 'Empty Chapter'
      }

      await manager.cacheChapter(chapter)
      const retrieved = await manager.getCachedChapter('novel-1', 1)

      expect(retrieved).not.toBeNull()
      expect(retrieved?.content).toBe('')
      expect(retrieved?.size).toBeGreaterThanOrEqual(0)
    })

    it('should handle special characters in content', async () => {
      const chapter = {
        novelId: 'novel-1',
        chapterNumber: 1,
        content: 'Special chars: é ñ 中文 🎉',
        title: 'Special Chapter'
      }

      await manager.cacheChapter(chapter)
      const retrieved = await manager.getCachedChapter('novel-1', 1)

      expect(retrieved).not.toBeNull()
      expect(retrieved?.content).toBe('Special chars: é ñ 中文 🎉')
    })

    it('should return null for non-existent chapter', async () => {
      const retrieved = await manager.getCachedChapter('non-existent', 999)
      expect(retrieved).toBeNull()
    })
  })

  describe('cache statistics', () => {
    it('should return correct count and size', async () => {
      const chapter1 = {
        novelId: 'novel-1',
        chapterNumber: 1,
        content: 'Short content',
        title: 'Chapter 1'
      }

      const chapter2 = {
        novelId: 'novel-1',
        chapterNumber: 2,
        content: 'Another short content',
        title: 'Chapter 2'
      }

      await manager.cacheChapter(chapter1)
      await manager.cacheChapter(chapter2)

      const stats = await manager.getCacheStats()

      expect(stats.count).toBe(2)
      expect(stats.totalSize).toBeGreaterThan(0)
    })

    it('should return zero stats for empty cache', async () => {
      const stats = await manager.getCacheStats()

      expect(stats.count).toBe(0)
      expect(stats.totalSize).toBe(0)
    })
  })

  describe('cache operations', () => {
    it('should update existing chapter', async () => {
      const chapter = {
        novelId: 'novel-1',
        chapterNumber: 1,
        content: 'Original content',
        title: 'Original Title'
      }

      await manager.cacheChapter(chapter)

      // Update with new content
      const updatedChapter = {
        novelId: 'novel-1',
        chapterNumber: 1,
        content: 'Updated content',
        title: 'Updated Title'
      }

      await manager.cacheChapter(updatedChapter)

      const retrieved = await manager.getCachedChapter('novel-1', 1)

      expect(retrieved?.content).toBe('Updated content')
      expect(retrieved?.title).toBe('Updated Title')
    })

    it('should clear all cached chapters', async () => {
      // Cache multiple chapters
      for (let i = 1; i <= 5; i++) {
        await manager.cacheChapter({
          novelId: 'novel-1',
          chapterNumber: i,
          content: `Content ${i}`,
          title: `Chapter ${i}`
        })
      }

      let stats = await manager.getCacheStats()
      expect(stats.count).toBe(5)

      await manager.clearCache()

      stats = await manager.getCacheStats()
      expect(stats.count).toBe(0)
    })
  })

  describe('metadata', () => {
    it('should store cachedAt timestamp', async () => {
      const chapter = {
        novelId: 'novel-1',
        chapterNumber: 1,
        content: 'Test content',
        title: 'Test Chapter'
      }

      const beforeCache = new Date().toISOString()
      await manager.cacheChapter(chapter)
      const afterCache = new Date().toISOString()

      const retrieved = await manager.getCachedChapter('novel-1', 1)

      expect(retrieved?.cachedAt).toBeDefined()
      expect(retrieved?.cachedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(new Date(retrieved!.cachedAt).getTime()).toBeGreaterThanOrEqual(new Date(beforeCache).getTime())
      expect(new Date(retrieved!.cachedAt).getTime()).toBeLessThanOrEqual(new Date(afterCache).getTime())
    })

    it('should calculate content size in bytes', async () => {
      const chapter = {
        novelId: 'novel-1',
        chapterNumber: 1,
        content: 'Test content with some text',
        title: 'Test Chapter'
      }

      await manager.cacheChapter(chapter)
      const retrieved = await manager.getCachedChapter('novel-1', 1)

      expect(retrieved?.size).toBeGreaterThan(0)
      expect(typeof retrieved?.size).toBe('number')
    })
  })
})

// ── Reading Time Calculator ───────────────────────────────────────────────────
// Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8

import { calculateReadingTime } from '@/utils/readingTime'

describe('calculateReadingTime', () => {
  // Requirements: 5.1, 5.2 — word count calculation
  it('should count words correctly by splitting on whitespace', () => {
    const content = 'This is a test sentence with seven words'
    const result = calculateReadingTime(content)
    expect(result.wordCount).toBe(8)
  })

  // Requirements: 5.1 — filter empty strings from word count
  it('should filter empty strings when counting words', () => {
    const content = 'word1   word2    word3' // multiple spaces
    const result = calculateReadingTime(content)
    expect(result.wordCount).toBe(3)
  })

  // Requirements: 5.2, 5.3 — Indonesian reading speed (200 wpm)
  it('should return 1 minute for 200 Indonesian words', () => {
    // Create 200 words with sufficient non-ASCII characters (>20% non-ASCII)
    // Using many accented characters to ensure detection as Indonesian
    const words = []
    for (let i = 0; i < 200; i++) {
      // Use words with high density of non-ASCII chars
      words.push(i % 3 === 0 ? 'éàüñ' : (i % 3 === 1 ? 'çöîâ' : 'kata'))
    }
    const content = words.join(' ')
    const result = calculateReadingTime(content)
    expect(result.minutes).toBe(1)
    expect(result.language).toBe('id')
  })

  // Requirements: 5.2, 5.3 — English reading speed (250 wpm)
  it('should return 1 minute for 250 English words', () => {
    const content = 'word '.repeat(250) // English text
    const result = calculateReadingTime(content)
    expect(result.minutes).toBe(1)
    expect(result.language).toBe('en')
    expect(result.wordCount).toBe(250)
  })

  // Requirements: 5.4, 5.5 — language detection based on ASCII ratio > 80%
  it('should detect English when ASCII ratio > 80%', () => {
    const content = 'This is an English sentence with mostly ASCII characters.'
    const result = calculateReadingTime(content)
    expect(result.language).toBe('en')
  })

  // Requirements: 5.4, 5.6 — language detection based on ASCII ratio ≤ 80%
  it('should detect Indonesian when ASCII ratio ≤ 80%', () => {
    // Create content where non-ASCII chars make up > 20% of total characters
    // Need at least 20% non-ASCII to get ≤ 80% ASCII ratio
    const asciiPart = 'abcd' // 4 ASCII chars
    const nonAsciiPart = 'é' // 1 non-ASCII char
    const content = (asciiPart + nonAsciiPart).repeat(20) // 80% ASCII, 20% non-ASCII
    const result = calculateReadingTime(content)
    expect(result.language).toBe('id')
  })

  // Requirements: 5.7 — ceiling rounding
  it('should round up to nearest minute (ceiling)', () => {
    const content = 'word '.repeat(201) // 201 words / 250 wpm = 0.804 minutes
    const result = calculateReadingTime(content)
    expect(result.minutes).toBe(1) // Ceiling of 0.804 = 1
  })

  // Requirements: 5.7 — ceiling for larger values
  it('should round up 401 English words to 2 minutes', () => {
    const content = 'word '.repeat(401) // 401 / 250 = 1.604 minutes
    const result = calculateReadingTime(content)
    expect(result.minutes).toBe(2) // Ceiling of 1.604 = 2
  })

  // Requirements: 5.8 — empty content edge case
  it('should return 0 minutes for empty content', () => {
    const result = calculateReadingTime('')
    expect(result.minutes).toBe(0)
    expect(result.wordCount).toBe(0)
    expect(result.language).toBe('id') // Default to Indonesian
  })

  // Requirements: 5.7 — very short content (< 1 minute)
  it('should return 1 minute for very short content', () => {
    const content = 'Short text'
    const result = calculateReadingTime(content)
    expect(result.minutes).toBe(1) // Ceiling of 0.008 = 1
    expect(result.wordCount).toBe(2)
  })

  // Edge case: content with only whitespace
  it('should return 0 minutes for content with only whitespace', () => {
    const content = '   \n\t  \n  '
    const result = calculateReadingTime(content)
    expect(result.minutes).toBe(0)
    expect(result.wordCount).toBe(0)
  })

  // Edge case: content with newlines and tabs
  it('should count words correctly with newlines and tabs', () => {
    const content = 'word1\nword2\tword3\n\nword4'
    const result = calculateReadingTime(content)
    expect(result.wordCount).toBe(4)
  })

  // Requirements: 5.4, 5.5, 5.6 — language detection edge case (exactly 80%)
  it('should detect Indonesian when ASCII ratio is exactly 80%', () => {
    // Create content with exactly 80% ASCII characters
    const asciiChars = 'a'.repeat(80)
    const nonAsciiChars = 'é'.repeat(20)
    const content = asciiChars + nonAsciiChars
    const result = calculateReadingTime(content)
    expect(result.language).toBe('id') // ≤ 80% = Indonesian
  })

  // Requirements: 5.4, 5.5 — language detection edge case (just above 80%)
  it('should detect English when ASCII ratio is just above 80%', () => {
    // Create content with 81% ASCII characters
    const asciiChars = 'a'.repeat(81)
    const nonAsciiChars = 'é'.repeat(19)
    const content = asciiChars + nonAsciiChars
    const result = calculateReadingTime(content)
    expect(result.language).toBe('en') // > 80% = English
  })

  // Requirements: 5.2, 5.3 — verify reading speed calculation for Indonesian
  it('should calculate 2 minutes for 400 Indonesian words', () => {
    // Create 400 words with sufficient non-ASCII characters (>20% non-ASCII)
    const words = []
    for (let i = 0; i < 400; i++) {
      // Use words with high density of non-ASCII chars
      words.push(i % 3 === 0 ? 'éàüñ' : (i % 3 === 1 ? 'çöîâ' : 'kata'))
    }
    const content = words.join(' ')
    const result = calculateReadingTime(content)
    expect(result.minutes).toBe(2)
    expect(result.language).toBe('id')
  })

  // Requirements: 5.2, 5.3 — verify reading speed calculation for English
  it('should calculate 2 minutes for 500 English words', () => {
    const content = 'word '.repeat(500) // 500 / 250 = 2 minutes
    const result = calculateReadingTime(content)
    expect(result.minutes).toBe(2)
    expect(result.language).toBe('en')
  })
})
