/**
 * Dummy data for MSW mock handlers.
 * Simulates a realistic novel catalog with chapters.
 */

import type {
  NovelSummary,
  NovelDetail,
  CatalogResponse,
  NovelBookmark,
  RatingInfo,
  Comment,
  ReadingHistory,
  Genre,
  AdminChapterSummary,
  TagCategory,
  Tag,
  LeaderboardEntry,
  LatestUpdateEntry,
  HomeData,
  Follow,
  Notification,
  UserProfile,
  NovelStats,
  NovelRankings,
  Patron,
  ReadingList,
  Highlight,
  Report,
} from '@/types'

// ── Novels ────────────────────────────────────────────────────────────────────

export const NOVELS: NovelSummary[] = [
  {
    id: 'solo-leveling',
    title: 'Solo Leveling',
    author: 'Chugong',
    genre: ['Action', 'Fantasy', 'Adventure'],
    thumbnailUrl: 'https://picsum.photos/seed/solo-leveling/300/400',
    status: 'completed',
  },
  {
    id: 'omniscient-reader',
    title: 'Omniscient Reader\'s Viewpoint',
    author: 'Sing Shong',
    genre: ['Action', 'Fantasy', 'Drama'],
    thumbnailUrl: 'https://picsum.photos/seed/omniscient/300/400',
    status: 'completed',
  },
  {
    id: 'the-beginning-after-the-end',
    title: 'The Beginning After the End',
    author: 'TurtleMe',
    genre: ['Fantasy', 'Isekai', 'Adventure'],
    thumbnailUrl: 'https://picsum.photos/seed/tbate/300/400',
    status: 'ongoing',
  },
  {
    id: 'shadow-slave',
    title: 'Shadow Slave',
    author: 'Guiltythree',
    genre: ['Action', 'Fantasy', 'Horror'],
    thumbnailUrl: 'https://picsum.photos/seed/shadow-slave/300/400',
    status: 'ongoing',
  },
  {
    id: 'reincarnator',
    title: 'Reincarnator',
    author: 'Ekdud',
    genre: ['Action', 'Fantasy', 'Sci-Fi'],
    thumbnailUrl: 'https://picsum.photos/seed/reincarnator/300/400',
    status: 'completed',
  },
  {
    id: 'dungeon-defense',
    title: 'Dungeon Defense',
    author: 'Yoo Heonhwa',
    genre: ['Fantasy', 'Strategy', 'Dark'],
    thumbnailUrl: 'https://picsum.photos/seed/dungeon-defense/300/400',
    status: 'completed',
  },
  {
    id: 'trash-of-counts-family',
    title: 'Trash of the Count\'s Family',
    author: 'Yoo Ryeo Han',
    genre: ['Fantasy', 'Isekai', 'Comedy'],
    thumbnailUrl: 'https://picsum.photos/seed/tcf/300/400',
    status: 'ongoing',
  },
  {
    id: 'regressor-instruction-manual',
    title: 'Regressor Instruction Manual',
    author: 'Wookwi',
    genre: ['Action', 'Fantasy', 'Strategy'],
    thumbnailUrl: 'https://picsum.photos/seed/rim/300/400',
    status: 'completed',
  },
  {
    id: 'second-coming-of-gluttony',
    title: 'Second Coming of Gluttony',
    author: 'Ro Yujin',
    genre: ['Action', 'Fantasy', 'Drama'],
    thumbnailUrl: 'https://picsum.photos/seed/scog/300/400',
    status: 'completed',
  },
  {
    id: 'lord-of-the-mysteries',
    title: 'Lord of the Mysteries',
    author: 'Cuttlefish That Loves Diving',
    genre: ['Fantasy', 'Mystery', 'Horror'],
    thumbnailUrl: 'https://picsum.photos/seed/lotm/300/400',
    status: 'completed',
  },
  {
    id: 'a-returners-magic-should-be-special',
    title: 'A Returner\'s Magic Should Be Special',
    author: 'Usonan',
    genre: ['Action', 'Fantasy', 'School'],
    thumbnailUrl: 'https://picsum.photos/seed/armsbs/300/400',
    status: 'completed',
  },
  {
    id: 'the-novel-extra',
    title: 'The Novel\'s Extra',
    author: 'Jee Gab Song',
    genre: ['Action', 'Fantasy', 'Romance'],
    thumbnailUrl: 'https://picsum.photos/seed/tne/300/400',
    status: 'completed',
  },
  {
    id: 'infinite-mage',
    title: 'Infinite Mage',
    author: 'Joo In-hwan',
    genre: ['Fantasy', 'Adventure', 'Magic'],
    thumbnailUrl: 'https://picsum.photos/seed/infinite-mage/300/400',
    status: 'ongoing',
  },
  {
    id: 'player-who-cant-level-up',
    title: 'Player Who Can\'t Level Up',
    author: 'Gam Gyeoul',
    genre: ['Action', 'Fantasy', 'Adventure'],
    thumbnailUrl: 'https://picsum.photos/seed/pwclu/300/400',
    status: 'completed',
  },
  {
    id: 'the-dark-magician-transmigrates-after-66666-years',
    title: 'The Dark Magician Transmigrates After 66666 Years',
    author: 'Milch',
    genre: ['Fantasy', 'Isekai', 'Action'],
    thumbnailUrl: 'https://picsum.photos/seed/dark-mage/300/400',
    status: 'ongoing',
  },
  {
    id: 'i-alone-level-up',
    title: 'I Alone Level-Up',
    author: 'Chugong',
    genre: ['Action', 'Fantasy'],
    thumbnailUrl: 'https://picsum.photos/seed/ialu/300/400',
    status: 'completed',
  },
  {
    id: 'the-legendary-mechanic',
    title: 'The Legendary Mechanic',
    author: 'Chocolion',
    genre: ['Sci-Fi', 'Action', 'Adventure'],
    thumbnailUrl: 'https://picsum.photos/seed/tlm/300/400',
    status: 'completed',
  },
  {
    id: 'reverend-insanity',
    title: 'Reverend Insanity',
    author: 'Gu Zhen Ren',
    genre: ['Fantasy', 'Dark', 'Strategy'],
    thumbnailUrl: 'https://picsum.photos/seed/reverend/300/400',
    status: 'completed',
  },
  {
    id: 'mother-of-learning',
    title: 'Mother of Learning',
    author: 'Domagoj Kurmaic',
    genre: ['Fantasy', 'Mystery', 'Time Loop'],
    thumbnailUrl: 'https://picsum.photos/seed/mol/300/400',
    status: 'completed',
  },
  {
    id: 'the-wandering-inn',
    title: 'The Wandering Inn',
    author: 'pirateaba',
    genre: ['Fantasy', 'Isekai', 'Slice of Life'],
    thumbnailUrl: 'https://picsum.photos/seed/twi/300/400',
    status: 'ongoing',
  },
  {
    id: 'cradle-series',
    title: 'Cradle Series',
    author: 'Will Wight',
    genre: ['Fantasy', 'Cultivation', 'Action'],
    thumbnailUrl: 'https://picsum.photos/seed/cradle/300/400',
    status: 'completed',
  },
  {
    id: 'dungeon-crawler-carl',
    title: 'Dungeon Crawler Carl',
    author: 'Matt Dinniman',
    genre: ['LitRPG', 'Comedy', 'Action'],
    thumbnailUrl: 'https://picsum.photos/seed/dcc/300/400',
    status: 'ongoing',
  },
]

// ── Extended novel detail data (tags, originalTitle, sourceLanguage, translator, addedAt) ──

/**
 * Map of novelId → extended fields for NovelDetail.
 * Used by buildNovelDetail to enrich the detail response.
 */
export const NOVEL_EXTENDED: Record<string, {
  originalTitle?: string
  sourceLanguage?: string
  translator?: string
  addedAt?: string
  tagIds?: string[]
}> = {
  'solo-leveling': {
    originalTitle: '나 혼자만 레벨업',
    sourceLanguage: 'KR',
    translator: 'Chugong TL Team',
    addedAt: '2023-01-15T00:00:00.000Z',
    tagIds: ['tag-reincarnation', 'tag-overpowered-mc', 'tag-system', 'tag-modern-day'],
  },
  'omniscient-reader': {
    originalTitle: '전지적 독자 시점',
    sourceLanguage: 'KR',
    translator: 'Sing Shong TL',
    addedAt: '2023-02-10T00:00:00.000Z',
    tagIds: ['tag-reincarnation', 'tag-system', 'tag-revenge'],
  },
  'the-beginning-after-the-end': {
    sourceLanguage: 'EN',
    translator: 'TurtleMe (Author)',
    addedAt: '2023-03-05T00:00:00.000Z',
    tagIds: ['tag-reincarnation', 'tag-magic-system', 'tag-medieval'],
  },
  'shadow-slave': {
    sourceLanguage: 'EN',
    translator: 'Guiltythree (Author)',
    addedAt: '2023-04-20T00:00:00.000Z',
    tagIds: ['tag-overpowered-mc', 'tag-system', 'tag-modern-day'],
  },
  'lord-of-the-mysteries': {
    originalTitle: '诡秘之主',
    sourceLanguage: 'CN',
    translator: 'Atlas Studios',
    addedAt: '2023-01-28T00:00:00.000Z',
    tagIds: ['tag-magic-system', 'tag-medieval', 'tag-transmigration'],
  },
  'reverend-insanity': {
    originalTitle: '蛊真人',
    sourceLanguage: 'CN',
    translator: 'Skyfarrow',
    addedAt: '2023-05-12T00:00:00.000Z',
    tagIds: ['tag-cultivation', 'tag-overpowered-mc', 'tag-revenge'],
  },
  'cradle-series': {
    sourceLanguage: 'EN',
    translator: 'Will Wight (Author)',
    addedAt: '2023-06-01T00:00:00.000Z',
    tagIds: ['tag-cultivation', 'tag-magic-system', 'tag-overpowered-mc'],
  },
  'trash-of-counts-family': {
    originalTitle: '백작가의 망나니가 되었다',
    sourceLanguage: 'KR',
    translator: 'Yunsom',
    addedAt: '2023-02-25T00:00:00.000Z',
    tagIds: ['tag-transmigration', 'tag-medieval', 'tag-harem'],
  },
  'the-legendary-mechanic': {
    originalTitle: '超神机械师',
    sourceLanguage: 'CN',
    translator: 'Qidian International',
    addedAt: '2023-07-08T00:00:00.000Z',
    tagIds: ['tag-reincarnation', 'tag-system', 'tag-overpowered-mc'],
  },
  'dungeon-crawler-carl': {
    sourceLanguage: 'EN',
    translator: 'Matt Dinniman (Author)',
    addedAt: '2023-08-14T00:00:00.000Z',
    tagIds: ['tag-system', 'tag-modern-day', 'tag-overpowered-mc'],
  },
}

// ── Chapter content generator ─────────────────────────────────────────────────

const CHAPTER_PARAGRAPHS = [
  'Langit di atas kota itu berwarna abu-abu, seperti selalu. Awan tebal menggantung rendah, mengancam hujan yang tak kunjung turun. Di bawahnya, jalanan ramai dengan orang-orang yang bergegas menuju tujuan masing-masing, tak ada yang memperhatikan satu sama lain.',
  'Ia berdiri di sudut jalan, mengamati keramaian dengan mata yang sudah lama kehilangan rasa ingin tahu. Sudah terlalu lama ia hidup di kota ini. Sudah terlalu banyak yang ia lihat, yang ia alami, yang ia lupakan.',
  '"Kamu yakin ini ide yang bagus?" suara dari belakangnya membuat ia berbalik. Seorang perempuan dengan rambut pendek berdiri beberapa langkah darinya, tangan terlipat di dada.',
  '"Tidak," jawabnya jujur. "Tapi aku tidak punya pilihan lain."',
  'Perempuan itu menghela napas panjang. "Selalu begitu denganmu. Tidak pernah ada rencana cadangan."',
  '"Rencana cadangan itu untuk orang yang takut gagal." Ia tersenyum tipis. "Aku sudah terbiasa gagal."',
  'Mereka berjalan dalam diam setelah itu, menyusuri gang-gang sempit yang hanya dikenal oleh mereka yang sudah lama tinggal di sini. Bau makanan dari warung-warung kecil bercampur dengan aroma tanah basah yang entah dari mana asalnya.',
  'Di ujung gang, sebuah pintu besi berkarat menunggu. Tidak ada tanda, tidak ada nomor. Hanya pintu, dan di baliknya, sesuatu yang sudah lama ia hindari.',
  'Ia mengulurkan tangan, jari-jarinya menyentuh permukaan dingin logam itu. Sejenak ia ragu. Sejenak saja.',
  'Lalu ia mendorong pintu itu terbuka.',
  'Ruangan di baliknya lebih besar dari yang terlihat dari luar. Lampu-lampu kecil menggantung dari langit-langit, memberikan cahaya kekuningan yang hangat namun entah kenapa terasa mencekam. Di tengah ruangan, sebuah meja panjang dengan kursi-kursi yang sudah usang.',
  'Dan di ujung meja, seseorang yang sudah lama tidak ia temui.',
  '"Lama tidak bertemu," kata orang itu tanpa berbalik. "Aku sudah menunggumu."',
  '"Berapa lama?" tanyanya, melangkah masuk.',
  '"Cukup lama untuk tahu bahwa kamu akan datang." Orang itu akhirnya berbalik, dan wajah yang ia lihat membuat dadanya sesak. "Cukup lama untuk mempersiapkan segalanya."',
  'Ia tidak menjawab. Tidak ada yang perlu dijawab. Mereka berdua tahu mengapa ia ada di sini, dan mereka berdua tahu bahwa tidak ada jalan kembali setelah ini.',
  'Perempuan di belakangnya menutup pintu dengan pelan. Suara klik kunci terdengar seperti vonis.',
  '"Baiklah," katanya akhirnya, menarik kursi dan duduk. "Mari kita mulai."',
]

export function generateChapterContent(novelId: string, chapterNumber: number): string {
  // Deterministically pick paragraphs based on novelId + chapterNumber
  const seed = novelId.length + chapterNumber
  const count = 8 + (seed % 5) // 8–12 paragraphs
  const paragraphs: string[] = []
  for (let i = 0; i < count; i++) {
    paragraphs.push(CHAPTER_PARAGRAPHS[(seed + i) % CHAPTER_PARAGRAPHS.length])
  }
  return paragraphs.join('\n\n')
}

// ── Novel detail builder ──────────────────────────────────────────────────────

const SYNOPSES: Record<string, string> = {
  'solo-leveling': 'Di dunia di mana portal menghubungkan dunia manusia dengan dunia monster, Sung Jin-Woo adalah hunter paling lemah yang ada. Dijuluki "hunter terlemah di seluruh umat manusia", ia berjuang keras hanya untuk bertahan hidup. Namun setelah hampir mati dalam sebuah dungeon ganda yang misterius, ia mendapatkan kemampuan unik yang tidak dimiliki siapapun: sistem yang memungkinkannya untuk terus berkembang tanpa batas.',
  'omniscient-reader': 'Kim Dokja adalah satu-satunya pembaca novel web "Three Ways to Survive in a Ruined World" yang membacanya hingga tamat. Lalu suatu hari, dunia dalam novel itu menjadi kenyataan. Dengan pengetahuan penuh tentang alur cerita, Kim Dokja harus bertahan hidup di dunia yang kini dipenuhi monster dan sistem.',
  'the-beginning-after-the-end': 'Raja Arthur Leywin, seorang raja yang kuat dan bijaksana, meninggal dan terlahir kembali di dunia sihir dan pedang. Dengan ingatan dan pengalaman dari kehidupan sebelumnya, ia bertekad untuk menjalani kehidupan baru yang lebih bermakna, membangun hubungan yang ia lewatkan di kehidupan sebelumnya.',
}

const DEFAULT_SYNOPSIS = 'Sebuah kisah epik tentang petualangan, kekuatan, dan takdir. Ikuti perjalanan sang protagonis dalam menghadapi berbagai rintangan dan mengungkap misteri dunia yang penuh dengan bahaya dan keajaiban.'

export function buildNovelDetail(novel: NovelSummary, totalChapters: number): NovelDetail {
  const chapters = Array.from({ length: totalChapters }, (_, i) => ({
    number: i + 1,
    title: `Chapter ${i + 1}: ${getChapterTitle(novel.id, i + 1)}`,
  }))

  const extended = NOVEL_EXTENDED[novel.id]
  const novelTags = extended?.tagIds?.map((tagId) => {
    const tag = TAGS.find((t) => t.id === tagId)
    if (!tag) return null
    return {
      novelId: novel.id,
      tagId: tag.id,
      tagName: tag.name,
      categoryId: tag.categoryId,
      categoryName: tag.categoryName,
    }
  }).filter((t): t is NonNullable<typeof t> => t !== null)

  return {
    id: novel.id,
    title: novel.title,
    originalTitle: extended?.originalTitle,
    author: novel.author,
    genre: novel.genre,
    synopsis: SYNOPSES[novel.id] ?? DEFAULT_SYNOPSIS,
    thumbnailUrl: novel.thumbnailUrl,
    status: novel.status,
    chapters,
    tags: novelTags,
    sourceLanguage: extended?.sourceLanguage,
    translator: extended?.translator,
    addedAt: extended?.addedAt,
  }
}

const CHAPTER_TITLE_WORDS = [
  'Awal', 'Pertemuan', 'Rahasia', 'Kekuatan', 'Bayangan', 'Cahaya', 'Badai',
  'Pilihan', 'Pengorbanan', 'Kebangkitan', 'Kejatuhan', 'Harapan', 'Kegelapan',
  'Pertarungan', 'Misteri', 'Takdir', 'Perpisahan', 'Kembali', 'Akhir', 'Baru',
]

export function getChapterTitle(novelId: string, chapterNumber: number): string {
  const seed = novelId.length * chapterNumber
  return CHAPTER_TITLE_WORDS[seed % CHAPTER_TITLE_WORDS.length]
}

// ── Total chapters per novel ──────────────────────────────────────────────────

export const NOVEL_CHAPTER_COUNTS: Record<string, number> = {
  'solo-leveling': 270,
  'omniscient-reader': 551,
  'the-beginning-after-the-end': 280,
  'shadow-slave': 1200,
  'reincarnator': 400,
  'dungeon-defense': 50,
  'trash-of-counts-family': 800,
  'regressor-instruction-manual': 200,
  'second-coming-of-gluttony': 600,
  'lord-of-the-mysteries': 1400,
  'a-returners-magic-should-be-special': 270,
  'the-novel-extra': 600,
  'infinite-mage': 500,
  'player-who-cant-level-up': 400,
  'the-dark-magician-transmigrates-after-66666-years': 300,
  'i-alone-level-up': 270,
  'the-legendary-mechanic': 1463,
  'reverend-insanity': 2334,
  'mother-of-learning': 107,
  'the-wandering-inn': 300,
  'cradle-series': 120,
  'dungeon-crawler-carl': 200,
}

export function getCatalogPage(page: number, perPage: number, query?: string): CatalogResponse {
  let filtered = NOVELS
  if (query && query.trim().length >= 2) {
    const q = query.trim().toLowerCase()
    filtered = NOVELS.filter(
      (n) => n.title.toLowerCase().includes(q) || n.author.toLowerCase().includes(q),
    )
  }

  const total = filtered.length
  const start = (page - 1) * perPage
  const novels = filtered.slice(start, start + perPage)

  return { novels, total, page, perPage }
}

// ── Mock Users ────────────────────────────────────────────────────────────────

export interface MockUser {
  id: string
  username: string
  email: string
  password: string
  role: 'user' | 'admin'
}

export const MOCK_USERS: MockUser[] = [
  { id: 'user-1', username: 'testuser', email: 'user@example.com', password: 'password123', role: 'user' },
  { id: 'admin-1', username: 'admin', email: 'admin@example.com', password: 'admin123', role: 'admin' },
]

// ── In-memory stores ──────────────────────────────────────────────────────────

/** Server-side novel bookmarks store */
export const bookmarksStore: NovelBookmark[] = []

/** Ratings store: key = `${novelId}:${userId}` */
export const ratingsStore: Map<string, number> = new Map()

/** Comments store */
export const commentsStore: Comment[] = [
  {
    id: 'comment-1',
    novelId: 'solo-leveling',
    chapterNumber: 1,
    userId: 'user-1',
    username: 'testuser',
    text: 'Chapter yang sangat seru! Tidak sabar untuk membaca selanjutnya.',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'comment-2',
    novelId: 'solo-leveling',
    chapterNumber: 1,
    userId: 'admin-1',
    username: 'admin',
    text: 'Awal yang menarik untuk sebuah petualangan epik.',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
]

/** Reading history store */
export const historyStore: ReadingHistory[] = []

/** Admin genres store */
export const genresStore: Genre[] = [
  { id: 'genre-1', name: 'Action', novelCount: 5 },
  { id: 'genre-2', name: 'Fantasy', novelCount: 8 },
  { id: 'genre-3', name: 'Romance', novelCount: 3 },
  { id: 'genre-4', name: 'Mystery', novelCount: 2 },
  { id: 'genre-5', name: 'Sci-Fi', novelCount: 4 },
]

/** Admin chapters store: key = novelId */
export const adminChaptersStore: Map<string, AdminChapterSummary[]> = new Map()

/** Get or initialize admin chapters for a novel */
export function getAdminChapters(novelId: string): AdminChapterSummary[] {
  if (!adminChaptersStore.has(novelId)) {
    const count = NOVEL_CHAPTER_COUNTS[novelId] ?? 5
    const chapters: AdminChapterSummary[] = Array.from({ length: Math.min(count, 5) }, (_, i) => ({
      number: i + 1,
      title: `Chapter ${i + 1}: ${getChapterTitle(novelId, i + 1)}`,
      releaseStatus: 'published' as const,
      scheduledAt: null,
    }))
    adminChaptersStore.set(novelId, chapters)
  }
  return adminChaptersStore.get(novelId)!
}

// ── Tag Categories ────────────────────────────────────────────────────────────

export const TAG_CATEGORIES: TagCategory[] = [
  { id: 'cat-protagonist', name: 'Protagonist Archetypes' },
  { id: 'cat-power', name: 'Power Systems' },
  { id: 'cat-world', name: 'World Building' },
  { id: 'cat-setting', name: 'Setting' },
]

// ── Tags ──────────────────────────────────────────────────────────────────────

export const TAGS: Tag[] = [
  // Protagonist Archetypes
  {
    id: 'tag-reincarnation',
    name: 'Reincarnation',
    categoryId: 'cat-protagonist',
    categoryName: 'Protagonist Archetypes',
    novelCount: 8,
  },
  {
    id: 'tag-overpowered-mc',
    name: 'Overpowered MC',
    categoryId: 'cat-protagonist',
    categoryName: 'Protagonist Archetypes',
    novelCount: 10,
  },
  {
    id: 'tag-transmigration',
    name: 'Transmigration',
    categoryId: 'cat-protagonist',
    categoryName: 'Protagonist Archetypes',
    novelCount: 5,
  },
  {
    id: 'tag-revenge',
    name: 'Revenge',
    categoryId: 'cat-protagonist',
    categoryName: 'Protagonist Archetypes',
    novelCount: 6,
  },
  {
    id: 'tag-harem',
    name: 'Harem',
    categoryId: 'cat-protagonist',
    categoryName: 'Protagonist Archetypes',
    novelCount: 4,
  },
  // Power Systems
  {
    id: 'tag-magic-system',
    name: 'Magic System',
    categoryId: 'cat-power',
    categoryName: 'Power Systems',
    novelCount: 9,
  },
  {
    id: 'tag-cultivation',
    name: 'Cultivation',
    categoryId: 'cat-power',
    categoryName: 'Power Systems',
    novelCount: 7,
  },
  {
    id: 'tag-system',
    name: 'System',
    categoryId: 'cat-power',
    categoryName: 'Power Systems',
    novelCount: 11,
  },
  // Setting
  {
    id: 'tag-medieval',
    name: 'Medieval',
    categoryId: 'cat-setting',
    categoryName: 'Setting',
    novelCount: 8,
  },
  {
    id: 'tag-modern-day',
    name: 'Modern Day',
    categoryId: 'cat-setting',
    categoryName: 'Setting',
    novelCount: 6,
  },
]

// ── Leaderboard Entries ───────────────────────────────────────────────────────

/** Helper to build a LeaderboardEntry from a NovelSummary */
function makeLeaderboardEntry(
  novel: NovelSummary,
  rank: number,
  popularityScore: number,
): LeaderboardEntry {
  return {
    novelId: novel.id,
    title: novel.title,
    author: novel.author,
    genre: novel.genre,
    thumbnailUrl: novel.thumbnailUrl,
    status: novel.status,
    popularityScore,
    rank,
  }
}

// Daily leaderboard — high scores, recent burst of readers
export const LEADERBOARD_DAILY: LeaderboardEntry[] = [
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'shadow-slave')!, 1, 4820),
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'solo-leveling')!, 2, 4310),
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'dungeon-crawler-carl')!, 3, 3950),
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'the-wandering-inn')!, 4, 3600),
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'omniscient-reader')!, 5, 3200),
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'the-beginning-after-the-end')!, 6, 2980),
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'infinite-mage')!, 7, 2750),
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'trash-of-counts-family')!, 8, 2500),
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'lord-of-the-mysteries')!, 9, 2300),
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'cradle-series')!, 10, 2100),
]

// Weekly leaderboard — accumulated over 7 days
export const LEADERBOARD_WEEKLY: LeaderboardEntry[] = [
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'solo-leveling')!, 1, 28500),
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'shadow-slave')!, 2, 25300),
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'lord-of-the-mysteries')!, 3, 22100),
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'omniscient-reader')!, 4, 19800),
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'the-beginning-after-the-end')!, 5, 17600),
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'trash-of-counts-family')!, 6, 15400),
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'dungeon-crawler-carl')!, 7, 13200),
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'cradle-series')!, 8, 11000),
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'reverend-insanity')!, 9, 9800),
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'second-coming-of-gluttony')!, 10, 8600),
]

// All-time leaderboard — total cumulative readers
export const LEADERBOARD_ALL_TIME: LeaderboardEntry[] = [
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'solo-leveling')!, 1, 1250000),
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'lord-of-the-mysteries')!, 2, 980000),
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'omniscient-reader')!, 3, 870000),
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'the-beginning-after-the-end')!, 4, 760000),
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'reverend-insanity')!, 5, 650000),
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'trash-of-counts-family')!, 6, 540000),
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'shadow-slave')!, 7, 480000),
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'second-coming-of-gluttony')!, 8, 420000),
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'cradle-series')!, 9, 380000),
  makeLeaderboardEntry(NOVELS.find((n) => n.id === 'the-legendary-mechanic')!, 10, 340000),
]

// ── Latest Updates ────────────────────────────────────────────────────────────

export const LATEST_UPDATES: LatestUpdateEntry[] = [
  {
    novelId: 'shadow-slave',
    novelTitle: 'Shadow Slave',
    thumbnailUrl: 'https://picsum.photos/seed/shadow-slave/300/400',
    chapterNumber: 1200,
    chapterTitle: `Chapter 1200: ${getChapterTitle('shadow-slave', 1200)}`,
    releasedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    novelId: 'the-wandering-inn',
    novelTitle: 'The Wandering Inn',
    thumbnailUrl: 'https://picsum.photos/seed/twi/300/400',
    chapterNumber: 300,
    chapterTitle: `Chapter 300: ${getChapterTitle('the-wandering-inn', 300)}`,
    releasedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    novelId: 'dungeon-crawler-carl',
    novelTitle: 'Dungeon Crawler Carl',
    thumbnailUrl: 'https://picsum.photos/seed/dcc/300/400',
    chapterNumber: 200,
    chapterTitle: `Chapter 200: ${getChapterTitle('dungeon-crawler-carl', 200)}`,
    releasedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    novelId: 'trash-of-counts-family',
    novelTitle: "Trash of the Count's Family",
    thumbnailUrl: 'https://picsum.photos/seed/tcf/300/400',
    chapterNumber: 800,
    chapterTitle: `Chapter 800: ${getChapterTitle('trash-of-counts-family', 800)}`,
    releasedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    novelId: 'infinite-mage',
    novelTitle: 'Infinite Mage',
    thumbnailUrl: 'https://picsum.photos/seed/infinite-mage/300/400',
    chapterNumber: 500,
    chapterTitle: `Chapter 500: ${getChapterTitle('infinite-mage', 500)}`,
    releasedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
  },
  {
    novelId: 'the-dark-magician-transmigrates-after-66666-years',
    novelTitle: 'The Dark Magician Transmigrates After 66666 Years',
    thumbnailUrl: 'https://picsum.photos/seed/dark-mage/300/400',
    chapterNumber: 300,
    chapterTitle: `Chapter 300: ${getChapterTitle('the-dark-magician-transmigrates-after-66666-years', 300)}`,
    releasedAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
  },
  {
    novelId: 'the-beginning-after-the-end',
    novelTitle: 'The Beginning After the End',
    thumbnailUrl: 'https://picsum.photos/seed/tbate/300/400',
    chapterNumber: 280,
    chapterTitle: `Chapter 280: ${getChapterTitle('the-beginning-after-the-end', 280)}`,
    releasedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    novelId: 'solo-leveling',
    novelTitle: 'Solo Leveling',
    thumbnailUrl: 'https://picsum.photos/seed/solo-leveling/300/400',
    chapterNumber: 270,
    chapterTitle: `Chapter 270: ${getChapterTitle('solo-leveling', 270)}`,
    releasedAt: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
  },
  {
    novelId: 'omniscient-reader',
    novelTitle: "Omniscient Reader's Viewpoint",
    thumbnailUrl: 'https://picsum.photos/seed/omniscient/300/400',
    chapterNumber: 551,
    chapterTitle: `Chapter 551: ${getChapterTitle('omniscient-reader', 551)}`,
    releasedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
  },
  {
    novelId: 'lord-of-the-mysteries',
    novelTitle: 'Lord of the Mysteries',
    thumbnailUrl: 'https://picsum.photos/seed/lotm/300/400',
    chapterNumber: 1400,
    chapterTitle: `Chapter 1400: ${getChapterTitle('lord-of-the-mysteries', 1400)}`,
    releasedAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
  },
]

// ── Novel Stats ───────────────────────────────────────────────────────────────

export const NOVEL_STATS: Record<string, NovelStats> = {
  'solo-leveling': { chapterCount: 270, readerCount: 1250000, reviewCount: 8420, wordCount: 1350000 },
  'omniscient-reader': { chapterCount: 551, readerCount: 870000, reviewCount: 6100, wordCount: 2750000 },
  'the-beginning-after-the-end': { chapterCount: 280, readerCount: 760000, reviewCount: 5200, wordCount: 1400000 },
  'shadow-slave': { chapterCount: 1200, readerCount: 480000, reviewCount: 3800, wordCount: 6000000 },
  'reincarnator': { chapterCount: 400, readerCount: 210000, reviewCount: 1500, wordCount: 2000000 },
  'dungeon-defense': { chapterCount: 50, readerCount: 95000, reviewCount: 820, wordCount: 250000 },
  'trash-of-counts-family': { chapterCount: 800, readerCount: 540000, reviewCount: 4200, wordCount: 4000000 },
  'regressor-instruction-manual': { chapterCount: 200, readerCount: 180000, reviewCount: 1200, wordCount: 1000000 },
  'second-coming-of-gluttony': { chapterCount: 600, readerCount: 420000, reviewCount: 3100, wordCount: 3000000 },
  'lord-of-the-mysteries': { chapterCount: 1400, readerCount: 980000, reviewCount: 7800, wordCount: 7000000 },
  'a-returners-magic-should-be-special': { chapterCount: 270, readerCount: 160000, reviewCount: 1100, wordCount: 1350000 },
  'the-novel-extra': { chapterCount: 600, readerCount: 200000, reviewCount: 1600, wordCount: 3000000 },
  'infinite-mage': { chapterCount: 500, readerCount: 230000, reviewCount: 1800, wordCount: 2500000 },
  'player-who-cant-level-up': { chapterCount: 400, readerCount: 140000, reviewCount: 950, wordCount: 2000000 },
  'the-dark-magician-transmigrates-after-66666-years': { chapterCount: 300, readerCount: 120000, reviewCount: 800, wordCount: 1500000 },
  'i-alone-level-up': { chapterCount: 270, readerCount: 300000, reviewCount: 2200, wordCount: 1350000 },
  'the-legendary-mechanic': { chapterCount: 1463, readerCount: 340000, reviewCount: 2600, wordCount: 7300000 },
  'reverend-insanity': { chapterCount: 2334, readerCount: 650000, reviewCount: 5500, wordCount: 11670000 },
  'mother-of-learning': { chapterCount: 107, readerCount: 85000, reviewCount: 720, wordCount: 535000 },
  'the-wandering-inn': { chapterCount: 300, readerCount: 190000, reviewCount: 1400, wordCount: 1500000 },
  'cradle-series': { chapterCount: 120, readerCount: 380000, reviewCount: 3000, wordCount: 600000 },
  'dungeon-crawler-carl': { chapterCount: 200, readerCount: 260000, reviewCount: 2000, wordCount: 1000000 },
}

// ── Novel Rankings ────────────────────────────────────────────────────────────

export const NOVEL_RANKINGS: Record<string, NovelRankings> = {
  'solo-leveling': { weekly: 1, monthly: 1, allTime: 1 },
  'omniscient-reader': { weekly: 4, monthly: 3, allTime: 3 },
  'the-beginning-after-the-end': { weekly: 5, monthly: 4, allTime: 4 },
  'shadow-slave': { weekly: 2, monthly: 2, allTime: 7 },
  'reincarnator': { weekly: 15, monthly: 14, allTime: 18 },
  'dungeon-defense': { weekly: null, monthly: null, allTime: 22 },
  'trash-of-counts-family': { weekly: 8, monthly: 6, allTime: 6 },
  'regressor-instruction-manual': { weekly: 18, monthly: 17, allTime: 20 },
  'second-coming-of-gluttony': { weekly: 10, monthly: 8, allTime: 8 },
  'lord-of-the-mysteries': { weekly: 9, monthly: 5, allTime: 2 },
  'a-returners-magic-should-be-special': { weekly: 20, monthly: 19, allTime: 21 },
  'the-novel-extra': { weekly: 17, monthly: 16, allTime: 19 },
  'infinite-mage': { weekly: 7, monthly: 9, allTime: 13 },
  'player-who-cant-level-up': { weekly: 22, monthly: 21, allTime: 22 },
  'the-dark-magician-transmigrates-after-66666-years': { weekly: 14, monthly: 13, allTime: null },
  'i-alone-level-up': { weekly: 12, monthly: 11, allTime: 12 },
  'the-legendary-mechanic': { weekly: 11, monthly: 10, allTime: 10 },
  'reverend-insanity': { weekly: 6, monthly: 7, allTime: 5 },
  'mother-of-learning': { weekly: null, monthly: null, allTime: 15 },
  'the-wandering-inn': { weekly: 4, monthly: 12, allTime: 14 },
  'cradle-series': { weekly: 8, monthly: 8, allTime: 9 },
  'dungeon-crawler-carl': { weekly: 3, monthly: 7, allTime: 11 },
}

// ── Novel Patrons ─────────────────────────────────────────────────────────────

export const NOVEL_PATRONS: Record<string, Patron[]> = {
  'solo-leveling': [
    { userId: 'patron-1', username: 'LevelUpFan', amount: 50 },
    { userId: 'patron-2', username: 'HunterKing', amount: 30 },
    { userId: 'patron-3', username: 'ShadowArmy', amount: 20 },
  ],
  'lord-of-the-mysteries': [
    { userId: 'patron-4', username: 'MysteryLover', amount: 100 },
    { userId: 'patron-5', username: 'KleinMoretti', amount: 75 },
    { userId: 'patron-6', username: 'FoolPath', amount: 50 },
    { userId: 'patron-7', username: 'SeekingTruth', amount: 25 },
  ],
  'omniscient-reader': [
    { userId: 'patron-8', username: 'KimDokja', amount: 60 },
    { userId: 'patron-9', username: 'YooJoonghyuk', amount: 40 },
  ],
  'shadow-slave': [
    { userId: 'patron-10', username: 'NightmareRealm', amount: 45 },
    { userId: 'patron-11', username: 'SunnyFan', amount: 30 },
  ],
  'reverend-insanity': [
    { userId: 'patron-12', username: 'FangYuan', amount: 200 },
    { userId: 'patron-13', username: 'GuInsect', amount: 80 },
  ],
  'the-beginning-after-the-end': [
    { userId: 'patron-14', username: 'ArthurLeywin', amount: 55 },
    { userId: 'patron-15', username: 'TurtleMeFan', amount: 35 },
  ],
}

// ── Follows ───────────────────────────────────────────────────────────────────

export const FOLLOWS: Follow[] = [
  { novelId: 'shadow-slave', followedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
  { novelId: 'the-wandering-inn', followedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
  { novelId: 'dungeon-crawler-carl', followedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
  { novelId: 'trash-of-counts-family', followedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  { novelId: 'infinite-mage', followedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
]

// ── Notifications ─────────────────────────────────────────────────────────────

export const NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    novelId: 'shadow-slave',
    novelTitle: 'Shadow Slave',
    chapterNumber: 1200,
    chapterTitle: `Chapter 1200: ${getChapterTitle('shadow-slave', 1200)}`,
    isRead: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-2',
    novelId: 'the-wandering-inn',
    novelTitle: 'The Wandering Inn',
    chapterNumber: 300,
    chapterTitle: `Chapter 300: ${getChapterTitle('the-wandering-inn', 300)}`,
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-3',
    novelId: 'dungeon-crawler-carl',
    novelTitle: 'Dungeon Crawler Carl',
    chapterNumber: 200,
    chapterTitle: `Chapter 200: ${getChapterTitle('dungeon-crawler-carl', 200)}`,
    isRead: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-4',
    novelId: 'trash-of-counts-family',
    novelTitle: "Trash of the Count's Family",
    chapterNumber: 800,
    chapterTitle: `Chapter 800: ${getChapterTitle('trash-of-counts-family', 800)}`,
    isRead: true,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-5',
    novelId: 'infinite-mage',
    novelTitle: 'Infinite Mage',
    chapterNumber: 500,
    chapterTitle: `Chapter 500: ${getChapterTitle('infinite-mage', 500)}`,
    isRead: true,
    createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
  },
]

// ── User Profiles ─────────────────────────────────────────────────────────────

export const USER_PROFILES: Record<string, UserProfile> = {
  testuser: {
    username: 'testuser',
    joinedAt: '2023-01-01T00:00:00.000Z',
    novelsRead: 15,
    commentsCount: 42,
    followsCount: 5,
    currentlyReading: [
      NOVELS.find((n) => n.id === 'shadow-slave')!,
      NOVELS.find((n) => n.id === 'the-wandering-inn')!,
    ],
  },
  admin: {
    username: 'admin',
    joinedAt: '2022-06-15T00:00:00.000Z',
    novelsRead: 50,
    commentsCount: 120,
    followsCount: 12,
    currentlyReading: [
      NOVELS.find((n) => n.id === 'lord-of-the-mysteries')!,
    ],
  },
  LevelUpFan: {
    username: 'LevelUpFan',
    joinedAt: '2023-03-20T00:00:00.000Z',
    novelsRead: 8,
    commentsCount: 17,
    followsCount: 3,
  },
  MysteryLover: {
    username: 'MysteryLover',
    joinedAt: '2022-11-05T00:00:00.000Z',
    novelsRead: 22,
    commentsCount: 65,
    followsCount: 8,
    currentlyReading: [
      NOVELS.find((n) => n.id === 'reverend-insanity')!,
    ],
  },
}

// ── New Additions ─────────────────────────────────────────────────────────────

/**
 * Generate a random addedAt timestamp within the last 30 days for novels
 * that don't have one in NOVEL_EXTENDED.
 * Called once at module init so the timestamps are stable during a session.
 */
function generateAddedAt(novelId: string): string {
  // Use a deterministic offset based on novelId length so it's stable across calls
  const seed = novelId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const daysAgo = seed % 30 // 0–29 days ago
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
}

/**
 * Returns the addedAt timestamp for a novel.
 * Uses NOVEL_EXTENDED if available, otherwise generates a deterministic timestamp.
 */
export function getNovelAddedAt(novelId: string): string {
  return NOVEL_EXTENDED[novelId]?.addedAt ?? generateAddedAt(novelId)
}

/**
 * Novels sorted by addedAt descending (newest first).
 * Used by GET /api/novels/new-additions.
 */
export const NEW_ADDITIONS: NovelSummary[] = [...NOVELS].sort((a, b) => {
  const aTime = new Date(getNovelAddedAt(a.id)).getTime()
  const bTime = new Date(getNovelAddedAt(b.id)).getTime()
  return bTime - aTime
})

// ── Home Data ─────────────────────────────────────────────────────────────────

export const HOME_DATA: HomeData = {
  featured: [
    NOVELS.find((n) => n.id === 'solo-leveling')!,
    NOVELS.find((n) => n.id === 'lord-of-the-mysteries')!,
    NOVELS.find((n) => n.id === 'omniscient-reader')!,
    NOVELS.find((n) => n.id === 'shadow-slave')!,
    NOVELS.find((n) => n.id === 'the-beginning-after-the-end')!,
  ],
  trending: [
    NOVELS.find((n) => n.id === 'shadow-slave')!,
    NOVELS.find((n) => n.id === 'dungeon-crawler-carl')!,
    NOVELS.find((n) => n.id === 'the-wandering-inn')!,
    NOVELS.find((n) => n.id === 'infinite-mage')!,
    NOVELS.find((n) => n.id === 'trash-of-counts-family')!,
    NOVELS.find((n) => n.id === 'reverend-insanity')!,
  ],
  latestUpdates: LATEST_UPDATES.slice(0, 10),
  popularByGenre: {
    Action: [
      NOVELS.find((n) => n.id === 'solo-leveling')!,
      NOVELS.find((n) => n.id === 'omniscient-reader')!,
      NOVELS.find((n) => n.id === 'shadow-slave')!,
      NOVELS.find((n) => n.id === 'second-coming-of-gluttony')!,
    ],
    Fantasy: [
      NOVELS.find((n) => n.id === 'lord-of-the-mysteries')!,
      NOVELS.find((n) => n.id === 'the-beginning-after-the-end')!,
      NOVELS.find((n) => n.id === 'trash-of-counts-family')!,
      NOVELS.find((n) => n.id === 'reverend-insanity')!,
    ],
    Isekai: [
      NOVELS.find((n) => n.id === 'the-beginning-after-the-end')!,
      NOVELS.find((n) => n.id === 'trash-of-counts-family')!,
      NOVELS.find((n) => n.id === 'the-wandering-inn')!,
      NOVELS.find((n) => n.id === 'the-dark-magician-transmigrates-after-66666-years')!,
    ],
    'Sci-Fi': [
      NOVELS.find((n) => n.id === 'the-legendary-mechanic')!,
      NOVELS.find((n) => n.id === 'reincarnator')!,
    ],
  },
  leaderboardPreview: {
    daily: LEADERBOARD_DAILY.slice(0, 5),
    weekly: LEADERBOARD_WEEKLY.slice(0, 5),
    allTime: LEADERBOARD_ALL_TIME.slice(0, 5),
  },
  randomPick: [
    NOVELS.find((n) => n.id === 'mother-of-learning')!,
    NOVELS.find((n) => n.id === 'dungeon-defense')!,
    NOVELS.find((n) => n.id === 'regressor-instruction-manual')!,
  ],
  newAdditions: NEW_ADDITIONS.slice(0, 10),
}

// ── Reading Lists ─────────────────────────────────────────────────────────────

/**
 * In-memory reading list store.
 * Each entry has an `id`, `name`, `novelCount`, `createdAt`, and `novelIds` array.
 * Exported as a mutable array so MSW handlers can mutate it directly.
 */
export interface ReadingListEntry extends ReadingList {
  novelIds: string[]
}

export const readingListsStore: ReadingListEntry[] = [
  {
    id: 'list-1',
    name: 'Favorit Saya',
    novelCount: 3,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    novelIds: ['solo-leveling', 'lord-of-the-mysteries', 'omniscient-reader'],
  },
  {
    id: 'list-2',
    name: 'Mau Dibaca',
    novelCount: 2,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    novelIds: ['shadow-slave', 'reverend-insanity'],
  },
  {
    id: 'list-3',
    name: 'Sudah Selesai',
    novelCount: 2,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    novelIds: ['dungeon-defense', 'mother-of-learning'],
  },
]

// ── Highlights ────────────────────────────────────────────────────────────────

/**
 * In-memory highlights store.
 * Exported as a mutable array so MSW handlers can mutate it directly.
 * Each highlight represents a text selection in a chapter with an optional note.
 */
export const highlightsStore: Highlight[] = [
  {
    id: 'highlight-1',
    novelId: 'solo-leveling',
    chapterNumber: 1,
    startOffset: 42,
    endOffset: 120,
    color: 'yellow',
    note: 'Momen penting di awal cerita',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'highlight-2',
    novelId: 'solo-leveling',
    chapterNumber: 1,
    startOffset: 250,
    endOffset: 310,
    color: 'blue',
    note: '',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'highlight-3',
    novelId: 'solo-leveling',
    chapterNumber: 2,
    startOffset: 80,
    endOffset: 160,
    color: 'green',
    note: 'Dialog yang bagus',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'highlight-4',
    novelId: 'lord-of-the-mysteries',
    chapterNumber: 1,
    startOffset: 100,
    endOffset: 200,
    color: 'pink',
    note: 'Pengenalan dunia yang menarik',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'highlight-5',
    novelId: 'lord-of-the-mysteries',
    chapterNumber: 1,
    startOffset: 350,
    endOffset: 420,
    color: 'yellow',
    note: '',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'highlight-6',
    novelId: 'omniscient-reader',
    chapterNumber: 3,
    startOffset: 60,
    endOffset: 140,
    color: 'green',
    note: 'Kutipan favorit',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'highlight-7',
    novelId: 'omniscient-reader',
    chapterNumber: 3,
    startOffset: 200,
    endOffset: 280,
    color: 'blue',
    note: 'Perlu diingat untuk diskusi',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

// ── Reports ───────────────────────────────────────────────────────────────────

/**
 * In-memory reports store.
 * Exported as a mutable array so MSW handlers can mutate it directly.
 * Contains sample reports with various statuses for testing the admin panel.
 */
export const reportsStore: Report[] = [
  {
    id: 'report-1',
    novelId: 'solo-leveling',
    chapterNumber: 42,
    type: 'wrong_translation',
    description: 'Nama karakter diterjemahkan tidak konsisten. Di chapter sebelumnya "Sung Jin-Woo" tapi di sini jadi "Sung Jin-Wu".',
    status: 'new',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'report-2',
    novelId: 'lord-of-the-mysteries',
    chapterNumber: 150,
    type: 'missing_content',
    description: 'Sepertinya ada beberapa paragraf yang hilang di tengah chapter. Cerita langsung melompat tanpa transisi.',
    status: 'reviewing',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'report-3',
    novelId: 'omniscient-reader',
    chapterNumber: 88,
    type: 'duplicate',
    description: 'Chapter ini sama persis dengan chapter 87. Sepertinya terjadi kesalahan upload.',
    status: 'resolved',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'report-4',
    novelId: 'shadow-slave',
    chapterNumber: 500,
    type: 'inappropriate',
    description: 'Konten di chapter ini mengandung materi yang tidak sesuai dengan rating novel.',
    status: 'new',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'report-5',
    novelId: 'reverend-insanity',
    chapterNumber: 1000,
    type: 'other',
    description: 'Judul chapter tidak sesuai dengan isi. Judul tertulis "Pertempuran Besar" tapi isinya tentang negosiasi.',
    status: 'reviewing',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
]
