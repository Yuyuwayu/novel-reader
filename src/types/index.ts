/** Ringkasan novel untuk tampilan katalog */
export interface NovelSummary {
  id: string
  title: string
  author: string
  genre: string[]
  thumbnailUrl: string
  status: NovelStatus
}

/** Status penerbitan novel */
export type NovelStatus = 'ongoing' | 'completed' | 'hiatus'

/** Detail lengkap novel termasuk daftar chapter */
export interface NovelDetail {
  id: string
  title: string
  originalTitle?: string  // judul asli dalam bahasa sumber
  author: string
  genre: string[]
  synopsis: string
  thumbnailUrl: string
  status: NovelStatus
  chapters: ChapterSummary[]
  tags?: NovelTag[]         // tag tematik
  sourceLanguage?: string   // bahasa sumber (ID, CN, KR, EN)
  translator?: string       // penerjemah/releaser
  addedAt?: string          // tanggal penambahan ke platform (ISO 8601)
}

/** Ringkasan chapter untuk daftar di halaman detail */
export interface ChapterSummary {
  number: number
  title: string
}

/** Konten penuh sebuah chapter */
export interface ChapterContent {
  novelId: string
  chapterNumber: number
  title: string
  content: string
  totalChapters: number
}

/** Progress membaca per novel (disimpan di localStorage) */
export interface ReadingProgress {
  novelId: string
  lastChapter: number
  updatedAt: string // ISO 8601 timestamp
}

/** Bookmark sebuah chapter (disimpan di localStorage) */
export interface Bookmark {
  novelId: string
  novelTitle: string
  chapterNumber: number
  chapterTitle: string
  createdAt: string // ISO 8601 timestamp
}

/** Font family pilihan untuk reading view */
export type FontFamily = 'font-sans' | 'font-serif' | 'font-mono'

/** Line spacing pilihan untuk reading view */
export type LineSpacing = 'leading-snug' | 'leading-relaxed' | 'leading-loose'

/** Preferensi tampilan membaca (disimpan di localStorage) */
export interface ReadingPreferences {
  theme: Theme
  fontSizePx: number    // rentang 12–24
  fontFamily: FontFamily  // font family untuk konten chapter
  lineSpacing: LineSpacing // jarak antar baris konten chapter
  contentWidth: number  // lebar konten dalam px (600–900)
  autoScrollSpeed: number // kecepatan auto-scroll (rentang 1-10)
}

/** Tema tampilan */
export type Theme = 'light' | 'dark'

/** Nilai default ReadingPreferences */
export const DEFAULT_PREFERENCES: ReadingPreferences = {
  theme: 'light',
  fontSizePx: 16,
  fontFamily: 'font-sans',
  lineSpacing: 'leading-relaxed',
  contentWidth: 750,
  autoScrollSpeed: 3,
}

/** Response paginasi katalog dari API */
export interface CatalogResponse {
  novels: NovelSummary[]
  total: number
  page: number
  perPage: number
}

/** Error dari API client */
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

// ── Auth ──────────────────────────────────────────────────────────────────────

/** Role pengguna yang dikodekan di dalam JWT */
export type UserRole = 'user' | 'admin'

/** Data pengguna yang tersimpan di auth store */
export interface AuthUser {
  id: string
  username: string
  email: string
  role: UserRole
}

/** Response dari endpoint login */
export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

// ── Bookmarks (server-side, novel-level) ─────────────────────────────────────

/** Bookmark novel-level yang disimpan di server */
export interface NovelBookmark {
  novelId: string
  novelTitle: string
  thumbnailUrl: string
  author: string
  bookmarkedAt: string // ISO 8601
}

// ── Ratings ───────────────────────────────────────────────────────────────────

/** Informasi rating sebuah novel */
export interface RatingInfo {
  novelId: string
  averageRating: number   // rata-rata semua pengguna (0 jika belum ada)
  totalRatings: number    // jumlah penilai
  userRating: number | null  // rating pengguna saat ini, null jika belum dinilai
}

// ── Comments ──────────────────────────────────────────────────────────────────

/** Komentar pada sebuah chapter */
export interface Comment {
  id: string
  novelId: string
  chapterNumber: number
  userId: string
  username: string
  text: string
  createdAt: string // ISO 8601
}

// ── Reading History ───────────────────────────────────────────────────────────

/** Entri riwayat baca (server-side) */
export interface ReadingHistory {
  novelId: string
  novelTitle: string
  thumbnailUrl: string
  lastChapter: number
  lastReadAt: string // ISO 8601
}

// ── Admin ─────────────────────────────────────────────────────────────────────

/** Genre novel */
export interface Genre {
  id: string
  name: string
  novelCount: number // jumlah novel yang menggunakan genre ini
}

/** Data form untuk membuat/mengedit novel */
export interface NovelFormData {
  title: string
  author: string
  synopsis: string
  genres: string[]       // array genre ID
  status: NovelStatus
  thumbnailUrl: string   // URL dari hasil upload cover
}

/** Ringkasan chapter untuk tampilan admin */
export interface AdminChapterSummary {
  number: number
  title: string
  releaseStatus: 'published' | 'scheduled' | 'draft'
  scheduledAt: string | null // ISO 8601, null jika tidak terjadwal
}

/** Data form untuk membuat/mengedit chapter */
export interface ChapterFormData {
  number: number
  title: string
  content: string
  scheduledAt: string | null // ISO 8601, null untuk rilis langsung
}

// ── Tags ──────────────────────────────────────────────────────────────────────

/** Kategori tag (contoh: "Protagonist Archetypes", "Power Systems") */
export interface TagCategory {
  id: string
  name: string
}

/** Tag tematik novel */
export interface Tag {
  id: string
  name: string
  categoryId: string
  categoryName: string
  novelCount: number
}

/** Relasi novel-tag (digunakan di NovelDetail yang diperluas) */
export interface NovelTag {
  novelId: string
  tagId: string
  tagName: string
  categoryId: string
  categoryName: string
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

/** Entri dalam daftar leaderboard */
export interface LeaderboardEntry {
  novelId: string
  title: string
  author: string
  genre: string[]
  thumbnailUrl: string
  status: NovelStatus
  popularityScore: number // jumlah pembaca unik dalam periode
  rank: number
}

// ── Latest Updates ────────────────────────────────────────────────────────────

/** Entri chapter terbaru untuk seksi Latest Updates */
export interface LatestUpdateEntry {
  novelId: string
  novelTitle: string
  thumbnailUrl: string
  chapterNumber: number
  chapterTitle: string
  releasedAt: string // ISO 8601
}

// ── Novel Stats & Rankings ────────────────────────────────────────────────────

/** Statistik ringkas sebuah novel */
export interface NovelStats {
  chapterCount: number
  readerCount: number
  reviewCount: number
  wordCount: number
}

/** Peringkat novel dalam tiga periode */
export interface NovelRankings {
  weekly: number | null
  monthly: number | null
  allTime: number | null
}

/** Patron (pendukung) sebuah novel */
export interface Patron {
  userId: string
  username: string
  amount: number
}

// ── Filter State ──────────────────────────────────────────────────────────────

/** Kumpulan nilai filter Advanced Novel Finder */
export interface FilterState {
  genres: string[]        // genre IDs yang dipilih (AND logic)
  tags: string[]          // tag IDs yang dipilih (AND logic)
  excludeGenres: string[] // genre IDs yang di-blacklist
  excludeTags: string[]   // tag IDs yang di-blacklist
  status: NovelStatus | '' // '' = semua status
  minRating: number       // 0 = tidak ada filter
  minChapters: number     // 0 = tidak ada filter
  maxChapters: number     // 0 = tidak ada filter
  sortBy: 'updatedAt' | 'rating' | 'readers' | 'chapters' | 'addedAt'
  updatedAfter: string    // ISO date string, '' = tidak ada filter
  updatedBefore: string   // ISO date string, '' = tidak ada filter
}

/** Default FilterState (tidak ada filter aktif) */
export const DEFAULT_FILTER_STATE: FilterState = {
  genres: [],
  tags: [],
  excludeGenres: [],
  excludeTags: [],
  status: '',
  minRating: 0,
  minChapters: 0,
  maxChapters: 0,
  sortBy: 'updatedAt',
  updatedAfter: '',
  updatedBefore: '',
}

// ── Follows & Notifications ───────────────────────────────────────────────────

/** Relasi follow pengguna-novel */
export interface Follow {
  novelId: string
  followedAt: string // ISO 8601
}

/** Notifikasi update chapter */
export interface Notification {
  id: string
  novelId: string
  novelTitle: string
  chapterNumber: number
  chapterTitle: string
  isRead: boolean
  createdAt: string // ISO 8601
}

// ── User Profile ──────────────────────────────────────────────────────────────

/** Profil publik pengguna */
export interface UserProfile {
  username: string
  joinedAt: string // ISO 8601
  novelsRead: number
  commentsCount: number
  followsCount: number
  currentlyReading?: NovelSummary[] // opsional, jika visibilitas publik diizinkan
}

// ── Home Data ─────────────────────────────────────────────────────────────────

/** Response agregat dari GET /api/home */
export interface HomeData {
  featured: NovelSummary[]
  trending: NovelSummary[]
  latestUpdates: LatestUpdateEntry[]
  popularByGenre: Record<string, NovelSummary[]> // key = genre name
  leaderboardPreview: {
    daily: LeaderboardEntry[]
    weekly: LeaderboardEntry[]
    allTime: LeaderboardEntry[]
  }
  randomPick: NovelSummary[]
  newAdditions: NovelSummary[]
}

// ── Reading Lists (Opsional) ──────────────────────────────────────────────────

/** Reading list / koleksi personal pengguna */
export interface ReadingList {
  id: string
  name: string
  novelCount: number
  createdAt: string // ISO 8601
}

// ── Highlights (Opsional) ─────────────────────────────────────────────────────

/** Highlight teks pada chapter */
export interface Highlight {
  id: string
  novelId: string
  chapterNumber: number
  startOffset: number
  endOffset: number
  color: 'yellow' | 'green' | 'blue' | 'pink'
  note: string
  createdAt: string // ISO 8601
}

// ── Reports (Opsional) ────────────────────────────────────────────────────────

/** Laporan masalah pada chapter */
export interface Report {
  id: string
  novelId: string
  chapterNumber: number
  type: 'wrong_translation' | 'missing_content' | 'duplicate' | 'inappropriate' | 'other'
  description: string
  status: 'new' | 'reviewing' | 'resolved'
  createdAt: string // ISO 8601
}

// ── Reading Time ──────────────────────────────────────────────────────────────

/** Hasil perhitungan estimasi waktu baca */
export interface ReadingTimeResult {
  minutes: number
  wordCount: number
  language: 'id' | 'en'
}
