/**
 * Unit tests for the API client in src/api/index.ts.
 * Tests error mapping: network errors, server errors, and parse errors.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { fetchCatalog, fetchNovelDetail, fetchChapter, filterNovels, ApiError } from '@/api'
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
import { formatRelativeTime } from '@/utils/formatRelativeTime'
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
    // fetchChapter is intentionally NOT mocked here so the API Client unit tests
    // that call the real fetchChapter still work. The AdminChapterFormPage tests
    // only exercise create-mode (no chapterNumber param), so fetchChapter is never
    // invoked by the component in those tests.
  }
})

import { fetchComments as mockFetchComments, postComment as mockPostComment, deleteComment as mockDeleteComment } from '@/api'

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
    useRoute: vi.fn().mockReturnValue({ params: {} }),
    useRouter: vi.fn().mockReturnValue({ push: vi.fn() }),
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
