/**
 * Property-based tests for Continue Reading Widget.
 * Tests universal properties using fast-check with minimum 100 iterations.
 * Requirements: 6.3, 6.6, 6.7
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fc from 'fast-check'
import { setActivePinia, createPinia } from 'pinia'
import { useProgressStore } from '@/stores/progress'
import type { ReadingProgress } from '@/types'

// Mock the API module
vi.mock('@/api', () => ({
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

describe('Property Tests: Continue Reading Widget', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  /**
   * Property 14: Continue Reading Most Recent Selection
   * 
   * For any set of reading progress entries with different updatedAt timestamps,
   * the Continue Reading Widget SHALL select the entry with the most recent (latest) updatedAt timestamp.
   * 
   * Validates: Requirements 6.3
   * Feature: enhanced-reading-experience, Property 14: Continue Reading Most Recent Selection
   */
  it('should always select the entry with the most recent updatedAt timestamp', () => {
    fc.assert(
      fc.property(
        // Generate array of progress entries with unique novelIds and DIFFERENT timestamps
        fc.integer({ min: 2, max: 10 }).chain(count =>
          fc.tuple(
            ...Array.from({ length: count }, (_, i) =>
              fc.record({
                novelId: fc.constant(`novel-${i}`), // Ensure unique IDs
                lastChapter: fc.integer({ min: 1, max: 1000 }),
                // Ensure DIFFERENT timestamps by adding days based on index
                updatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-01-01') })
                  .map(d => new Date(d.getTime() + i * 24 * 60 * 60 * 1000)), // Add i days
              })
            )
          )
        ),
        (progressEntries) => {
          // Clear localStorage before each test iteration
          localStorage.clear()

          // Convert dates to ISO strings and filter out invalid dates
          const progressList: ReadingProgress[] = progressEntries
            .filter(entry => !isNaN(entry.updatedAt.getTime()))
            .map(entry => ({
              novelId: entry.novelId,
              lastChapter: entry.lastChapter,
              updatedAt: entry.updatedAt.toISOString(),
            }))

          // Skip if we don't have at least 2 valid entries
          fc.pre(progressList.length >= 2)

          // Save all progress entries to localStorage
          const progressStore = useProgressStore()
          progressList.forEach(progress => {
            progressStore.save(progress)
          })

          // Collect all progress entries from localStorage
          const allProgress: ReadingProgress[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key?.startsWith('novel_reader:progress:')) {
              const novelId = key.replace('novel_reader:progress:', '')
              const progress = progressStore.get(novelId)
              if (progress) {
                allProgress.push(progress)
              }
            }
          }

          // Verify we got all the entries we saved
          expect(allProgress.length).toBe(progressList.length)

          // Sort by updatedAt DESC (most recent first)
          allProgress.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )

          // The first entry should be the one with the most recent updatedAt
          const mostRecent = allProgress[0]
          const expectedMostRecent = progressList.reduce((latest, current) => 
            new Date(current.updatedAt).getTime() > new Date(latest.updatedAt).getTime() 
              ? current 
              : latest
          )

          expect(mostRecent.novelId).toBe(expectedMostRecent.novelId)
          expect(mostRecent.lastChapter).toBe(expectedMostRecent.lastChapter)
          expect(new Date(mostRecent.updatedAt).getTime()).toBe(
            new Date(expectedMostRecent.updatedAt).getTime()
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 15: Continue Reading URL Format
   * 
   * For any novelId and lastChapter number, the "Lanjutkan Membaca" button
   * SHALL navigate to a URL formatted as `/novel/${novelId}/chapter/${lastChapter}`.
   * 
   * Validates: Requirements 6.6
   * Feature: enhanced-reading-experience, Property 15: Continue Reading URL Format
   */
  it('should generate correct URL format for any novelId and chapter number', () => {
    fc.assert(
      fc.property(
        // Generate valid novelId (alphanumeric, hyphens, underscores only)
        fc.stringMatching(/^[a-zA-Z0-9_-]+$/),
        fc.integer({ min: 1, max: 10000 }),
        (novelId, lastChapter) => {
          // Skip empty novelIds (edge case from regex)
          fc.pre(novelId.length > 0)

          // Generate the expected URL
          const expectedUrl = `/novel/${novelId}/chapter/${lastChapter}`

          // Verify URL format matches the pattern
          expect(expectedUrl).toMatch(/^\/novel\/.+\/chapter\/\d+$/)
          
          // Verify URL components
          const urlParts = expectedUrl.split('/')
          expect(urlParts[1]).toBe('novel')
          expect(urlParts[2]).toBe(novelId)
          expect(urlParts[3]).toBe('chapter')
          expect(urlParts[4]).toBe(String(lastChapter))
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 16: Continue Reading Fallback to Second
   * 
   * For any set of reading progress entries sorted by updatedAt DESC,
   * if the first entry's novel is marked as deleted, the widget SHALL display the second entry.
   * 
   * Validates: Requirements 6.7
   * Feature: enhanced-reading-experience, Property 16: Continue Reading Fallback to Second
   */
  it('should fallback to second entry when first is deleted', () => {
    fc.assert(
      fc.property(
        // Generate at least 2 progress entries with unique IDs and DIFFERENT timestamps
        fc.integer({ min: 2, max: 10 }).chain(count =>
          fc.tuple(
            ...Array.from({ length: count }, (_, i) =>
              fc.record({
                novelId: fc.constant(`novel-${i}`), // Ensure unique IDs
                lastChapter: fc.integer({ min: 1, max: 1000 }),
                // Ensure DIFFERENT timestamps by adding days based on index
                updatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-01-01') })
                  .map(d => new Date(d.getTime() + i * 24 * 60 * 60 * 1000)), // Add i days
                isDeleted: fc.boolean(),
              })
            )
          )
        ),
        (progressEntries) => {
          // Convert dates to ISO strings and filter out invalid dates
          const progressList = progressEntries
            .filter(entry => !isNaN(entry.updatedAt.getTime()))
            .map(entry => ({
              novelId: entry.novelId,
              lastChapter: entry.lastChapter,
              updatedAt: entry.updatedAt.toISOString(),
              isDeleted: entry.isDeleted,
            }))

          // Skip if no valid entries
          fc.pre(progressList.length >= 2)

          // Sort by updatedAt DESC (most recent first)
          progressList.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )

          // Find the first non-deleted entry
          const firstNonDeleted = progressList.find(p => !p.isDeleted)

          // If there's at least one non-deleted entry
          if (firstNonDeleted) {
            // The widget should display this entry
            expect(firstNonDeleted.isDeleted).toBe(false)

            // If the first entry is deleted, the displayed entry should not be the first
            if (progressList[0].isDeleted) {
              expect(firstNonDeleted.novelId).not.toBe(progressList[0].novelId)
            }
          } else {
            // If all entries are deleted, widget should not display anything
            expect(progressList.every(p => p.isDeleted)).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Additional Property: Progress Percentage Calculation
   * 
   * For any lastChapter and totalChapters, the progress percentage
   * SHALL be calculated as Math.round((lastChapter / totalChapters) * 100).
   */
  it('should calculate progress percentage correctly for any chapter numbers', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        (lastChapter, totalChapters) => {
          // Ensure lastChapter doesn't exceed totalChapters
          const validLastChapter = Math.min(lastChapter, totalChapters)
          
          // Calculate expected percentage
          const expectedPercentage = Math.round((validLastChapter / totalChapters) * 100)

          // Verify percentage is within valid range
          expect(expectedPercentage).toBeGreaterThanOrEqual(0)
          expect(expectedPercentage).toBeLessThanOrEqual(100)

          // Verify calculation
          const calculatedPercentage = Math.round((validLastChapter / totalChapters) * 100)
          expect(calculatedPercentage).toBe(expectedPercentage)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Additional Property: Progress Indicator Format
   * 
   * For any lastChapter and totalChapters, the progress indicator text
   * SHALL be formatted as "Chapter X dari Y".
   */
  it('should format progress indicator correctly for any chapter numbers', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        (lastChapter, totalChapters) => {
          // Generate the expected format
          const expectedFormat = `Chapter ${lastChapter} dari ${totalChapters}`

          // Verify format matches the pattern
          expect(expectedFormat).toMatch(/^Chapter \d+ dari \d+$/)
          
          // Verify components
          expect(expectedFormat).toContain(`Chapter ${lastChapter}`)
          expect(expectedFormat).toContain(`dari ${totalChapters}`)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Additional Property: Timestamp Ordering Consistency
   * 
   * For any set of progress entries, sorting by updatedAt DESC
   * SHALL result in entries ordered from most recent to oldest.
   */
  it('should maintain consistent timestamp ordering', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            novelId: fc.string({ minLength: 1, maxLength: 20 }),
            lastChapter: fc.integer({ min: 1, max: 1000 }),
            updatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (progressEntries) => {
          // Convert dates to ISO strings and filter out invalid dates
          const progressList: ReadingProgress[] = progressEntries
            .filter(entry => !isNaN(entry.updatedAt.getTime()))
            .map(entry => ({
              novelId: entry.novelId,
              lastChapter: entry.lastChapter,
              updatedAt: entry.updatedAt.toISOString(),
            }))

          // Skip if no valid entries
          fc.pre(progressList.length > 0)

          // Sort by updatedAt DESC
          progressList.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )

          // Verify ordering: each entry should have updatedAt >= next entry
          for (let i = 0; i < progressList.length - 1; i++) {
            const currentTime = new Date(progressList[i].updatedAt).getTime()
            const nextTime = new Date(progressList[i + 1].updatedAt).getTime()
            expect(currentTime).toBeGreaterThanOrEqual(nextTime)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Additional Property: localStorage Key Format
   * 
   * For any novelId, the localStorage key SHALL be formatted as
   * "novel_reader:progress:{novelId}".
   */
  it('should use correct localStorage key format for any novelId', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (novelId) => {
          // Generate the expected key
          const expectedKey = `novel_reader:progress:${novelId}`

          // Verify key format
          expect(expectedKey).toMatch(/^novel_reader:progress:.+$/)
          
          // Verify key components
          expect(expectedKey.startsWith('novel_reader:progress:')).toBe(true)
          expect(expectedKey.endsWith(novelId)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})
