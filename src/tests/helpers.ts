/**
 * Arbitrary generators and test utilities for property-based tests.
 * Used across test files in src/tests/.
 */

import * as fc from 'fast-check'
import type { ReadingProgress, Bookmark, ReadingPreferences, NovelSummary, NovelStatus, Theme } from '@/types'

/** Arbitrary for NovelStatus */
export const novelStatusArb: fc.Arbitrary<NovelStatus> = fc.constantFrom(
  'ongoing' as const,
  'completed' as const,
  'hiatus' as const,
)

/** Arbitrary for Theme */
export const themeArb: fc.Arbitrary<Theme> = fc.constantFrom('light' as const, 'dark' as const)

/** Arbitrary for a valid novel ID (lowercase alphanumeric, 1–20 chars) */
export const novelIdArb: fc.Arbitrary<string> = fc.stringMatching(/^[a-z0-9]{1,20}$/)

/** Arbitrary for an ISO 8601 timestamp (fixed value for determinism) */
export const isoTimestampArb: fc.Arbitrary<string> = fc.constant('2024-01-01T00:00:00Z')

/** Arbitrary for ReadingProgress */
export const readingProgressArb: fc.Arbitrary<ReadingProgress> = fc.record({
  novelId: novelIdArb,
  lastChapter: fc.integer({ min: 1, max: 1000 }),
  updatedAt: isoTimestampArb,
})

/** Arbitrary for Bookmark */
export const bookmarkArb: fc.Arbitrary<Bookmark> = fc.record({
  novelId: novelIdArb,
  novelTitle: fc.string({ minLength: 1, maxLength: 100 }),
  chapterNumber: fc.integer({ min: 1, max: 1000 }),
  chapterTitle: fc.string({ minLength: 1, maxLength: 100 }),
  createdAt: isoTimestampArb,
})

/** Arbitrary for ReadingPreferences (fontSizePx constrained to valid range 12–24) */
export const readingPreferencesArb: fc.Arbitrary<ReadingPreferences> = fc.record({
  theme: themeArb,
  fontSizePx: fc.integer({ min: 12, max: 24 }),
  fontFamily: fc.constantFrom('font-sans', 'font-serif', 'font-mono'),
  lineSpacing: fc.constantFrom('leading-snug', 'leading-relaxed', 'leading-loose'),
  contentWidth: fc.integer({ min: 600, max: 900 }),
})

/** Arbitrary for NovelSummary */
export const novelSummaryArb: fc.Arbitrary<NovelSummary> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  author: fc.string({ minLength: 1, maxLength: 100 }),
  genre: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 5 }),
  thumbnailUrl: fc.constant('https://example.com/thumb.jpg'),
  status: novelStatusArb,
})

/** Arbitrary for UserRole */
export const userRoleArb: fc.Arbitrary<import('@/types').UserRole> = fc.constantFrom(
  'user' as const,
  'admin' as const,
)

/** Arbitrary for AuthUser */
export const authUserArb: fc.Arbitrary<import('@/types').AuthUser> = fc.record({
  id: fc.uuid(),
  username: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  role: userRoleArb,
})

/** Arbitrary for Comment */
export const commentArb: fc.Arbitrary<import('@/types').Comment> = fc.record({
  id: fc.uuid(),
  novelId: fc.uuid(),
  chapterNumber: fc.integer({ min: 1, max: 1000 }),
  userId: fc.uuid(),
  username: fc.string({ minLength: 1, maxLength: 50 }),
  text: fc.string({ minLength: 1, maxLength: 500 }),
  createdAt: isoTimestampArb,
})

/** Arbitrary for ReadingHistory */
export const readingHistoryArb: fc.Arbitrary<import('@/types').ReadingHistory> = fc.record({
  novelId: fc.uuid(),
  novelTitle: fc.string({ minLength: 1, maxLength: 100 }),
  thumbnailUrl: fc.constant('https://example.com/thumb.jpg'),
  lastChapter: fc.integer({ min: 1, max: 1000 }),
  lastReadAt: isoTimestampArb,
})

/** Arbitrary for RatingInfo */
export const ratingInfoArb: fc.Arbitrary<import('@/types').RatingInfo> = fc.record({
  novelId: fc.uuid(),
  averageRating: fc.float({ min: 0, max: 5, noNaN: true }),
  totalRatings: fc.integer({ min: 0 }),
  userRating: fc.option(fc.integer({ min: 1, max: 5 }), { nil: null }),
})
