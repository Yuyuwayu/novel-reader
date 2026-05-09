/**
 * Property-based tests for offline analytics utility.
 * Tests universal properties that should hold across all valid inputs.
 * Requirements: 11.1, 11.2, 11.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import fc from 'fast-check'
import { trackOfflineRead, trackOnlineRead, resetOfflineAnalytics } from './offlineAnalytics'
import * as storage from './storage'

// Mock the storage module
vi.mock('./storage', () => ({
  isStorageAvailable: vi.fn(() => true),
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
}))

describe('Property Tests: Offline Analytics', () => {
  // Simulate localStorage state
  let mockStorage: Record<string, string> = {}

  beforeEach(() => {
    vi.clearAllMocks()
    mockStorage = {}
    
    // Mock storage functions to use mockStorage
    vi.mocked(storage.getItem).mockImplementation((key: string) => {
      return mockStorage[key] || null
    })
    
    vi.mocked(storage.setItem).mockImplementation((key: string, value: string) => {
      mockStorage[key] = value
    })
  })

  /**
   * Property 17: Offline Analytics Counter Increments
   * 
   * For any sequence of chapter reads (online or offline), the offlineReadsCount
   * SHALL increment by 1 for each offline read, and onlineReadsCount SHALL
   * increment by 1 for each online read.
   * 
   * Validates: Requirements 11.1, 11.2
   */
  it('Property 17: counters increment correctly for sequences of reads', () => {
    fc.assert(
      fc.property(
        // Generate a sequence of read operations (online or offline)
        fc.array(
          fc.record({
            isOffline: fc.boolean(),
            novelId: fc.string({ minLength: 1, maxLength: 20 }),
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (reads) => {
          // Reset analytics before test
          mockStorage = {}
          resetOfflineAnalytics()

          // Track all reads
          for (const read of reads) {
            if (read.isOffline) {
              trackOfflineRead(read.novelId)
            } else {
              trackOnlineRead()
            }
          }

          // Get the final saved state from mockStorage
          const savedData = JSON.parse(mockStorage['offline_stats'] || '{}')

          // Count expected offline and online reads
          const expectedOfflineReads = reads.filter(r => r.isOffline).length
          const expectedOnlineReads = reads.filter(r => !r.isOffline).length

          // Assert: Counters match expected values
          expect(savedData.offlineReadsCount).toBe(expectedOfflineReads)
          expect(savedData.onlineReadsCount).toBe(expectedOnlineReads)
        }
      ),
      { numRuns: 100 }
    )
  })
  // Feature: enhanced-reading-experience, Property 17: Offline Analytics Counter Increments

  /**
   * Property 18: Offline Analytics Novel ID List Uniqueness
   * 
   * For any sequence of offline chapter reads across different novels, the
   * offlineNovelIds list SHALL contain all unique novel IDs that have been
   * read offline, with no duplicates.
   * 
   * Validates: Requirements 11.4
   */
  it('Property 18: offlineNovelIds list contains unique novel IDs only', () => {
    fc.assert(
      fc.property(
        // Generate a sequence of offline reads with potentially duplicate novel IDs
        fc.array(
          fc.string({ minLength: 1, maxLength: 20 }),
          { minLength: 1, maxLength: 50 }
        ),
        (novelIds) => {
          // Reset analytics before test
          mockStorage = {}
          resetOfflineAnalytics()

          // Track all offline reads
          for (const novelId of novelIds) {
            trackOfflineRead(novelId)
          }

          // Get the final saved state from mockStorage
          const savedData = JSON.parse(mockStorage['offline_stats'] || '{}')

          // Calculate expected unique novel IDs
          const expectedUniqueIds = Array.from(new Set(novelIds))

          // Assert: offlineNovelIds contains all unique IDs
          expect(savedData.offlineNovelIds).toHaveLength(expectedUniqueIds.length)
          
          // Assert: All expected IDs are present
          for (const id of expectedUniqueIds) {
            expect(savedData.offlineNovelIds).toContain(id)
          }

          // Assert: No duplicates exist
          const uniqueCheck = new Set(savedData.offlineNovelIds)
          expect(uniqueCheck.size).toBe(savedData.offlineNovelIds.length)
        }
      ),
      { numRuns: 100 }
    )
  })
  // Feature: enhanced-reading-experience, Property 18: Offline Analytics Novel ID List Uniqueness

  /**
   * Additional Property: Counter Monotonicity
   * 
   * For any sequence of reads, counters should never decrease (monotonic increase).
   */
  it('Property: counters are monotonically increasing', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            isOffline: fc.boolean(),
            novelId: fc.string({ minLength: 1, maxLength: 20 }),
          }),
          { minLength: 2, maxLength: 30 }
        ),
        (reads) => {
          // Reset analytics before test
          mockStorage = {}
          resetOfflineAnalytics()

          let prevOfflineCount = 0
          let prevOnlineCount = 0

          // Track reads one by one and verify monotonicity
          for (const read of reads) {
            if (read.isOffline) {
              trackOfflineRead(read.novelId)
            } else {
              trackOnlineRead()
            }

            // Get current state from mockStorage
            const savedData = JSON.parse(mockStorage['offline_stats'] || '{}')

            // Assert: Counters never decrease
            expect(savedData.offlineReadsCount).toBeGreaterThanOrEqual(prevOfflineCount)
            expect(savedData.onlineReadsCount).toBeGreaterThanOrEqual(prevOnlineCount)

            prevOfflineCount = savedData.offlineReadsCount
            prevOnlineCount = savedData.onlineReadsCount
          }
        }
      ),
      { numRuns: 100 }
    )
  })
  // Feature: enhanced-reading-experience, Additional Property: Counter Monotonicity

  /**
   * Additional Property: Timestamp Update on Offline Read
   * 
   * For any offline read, lastOfflineReadAt timestamp should be updated to
   * a recent time (within 1 second of current time).
   */
  it('Property: lastOfflineReadAt updates on offline reads', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        (novelId) => {
          // Reset analytics before test
          resetOfflineAnalytics()
          vi.clearAllMocks()
          vi.mocked(storage.getItem).mockReturnValue(null)

          const beforeTime = Date.now()
          
          // Track offline read
          trackOfflineRead(novelId)
          
          const afterTime = Date.now()

          // Get saved state
          const lastCall = vi.mocked(storage.setItem).mock.calls[vi.mocked(storage.setItem).mock.calls.length - 1]
          const savedData = JSON.parse(lastCall[1] as string)

          // Assert: Timestamp exists and is recent
          expect(savedData.lastOfflineReadAt).toBeTruthy()
          const timestamp = new Date(savedData.lastOfflineReadAt).getTime()
          expect(timestamp).toBeGreaterThanOrEqual(beforeTime)
          expect(timestamp).toBeLessThanOrEqual(afterTime)
        }
      ),
      { numRuns: 100 }
    )
  })
  // Feature: enhanced-reading-experience, Additional Property: Timestamp Update

  /**
   * Additional Property: Online Reads Don't Affect Offline Stats
   * 
   * For any sequence of online reads, offlineReadsCount, lastOfflineReadAt,
   * and offlineNovelIds should remain unchanged.
   */
  it('Property: online reads do not modify offline-specific stats', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (numOnlineReads) => {
          // Reset analytics before test
          mockStorage = {}
          resetOfflineAnalytics()

          // Track multiple online reads
          for (let i = 0; i < numOnlineReads; i++) {
            trackOnlineRead()
          }

          // Get saved state from mockStorage
          const savedData = JSON.parse(mockStorage['offline_stats'])

          // Assert: Offline-specific stats remain at default values
          expect(savedData.offlineReadsCount).toBe(0)
          expect(savedData.lastOfflineReadAt).toBeNull()
          expect(savedData.offlineNovelIds).toEqual([])
          
          // Assert: Online count is correct
          expect(savedData.onlineReadsCount).toBe(numOnlineReads)
        }
      ),
      { numRuns: 100 }
    )
  })
  // Feature: enhanced-reading-experience, Additional Property: Online Reads Isolation

  /**
   * Additional Property: Novel ID List Order Preservation
   * 
   * For any sequence of offline reads with unique novel IDs, the order of
   * novel IDs in offlineNovelIds should match the order of first occurrence.
   */
  it('Property: offlineNovelIds preserves order of first occurrence', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1, maxLength: 20 }),
          { minLength: 1, maxLength: 20 }
        ),
        (novelIds) => {
          // Reset analytics before test
          mockStorage = {}
          resetOfflineAnalytics()

          // Track all offline reads
          for (const novelId of novelIds) {
            trackOfflineRead(novelId)
          }

          // Get saved state from mockStorage
          const savedData = JSON.parse(mockStorage['offline_stats'])

          // Calculate expected order (first occurrence of each unique ID)
          const expectedOrder: string[] = []
          for (const id of novelIds) {
            if (!expectedOrder.includes(id)) {
              expectedOrder.push(id)
            }
          }

          // Assert: Order matches expected
          expect(savedData.offlineNovelIds).toEqual(expectedOrder)
        }
      ),
      { numRuns: 100 }
    )
  })
  // Feature: enhanced-reading-experience, Additional Property: Order Preservation

  /**
   * Additional Property: Reset Completeness
   * 
   * After reset, all stats should return to default values regardless of
   * previous state.
   */
  it('Property: reset returns all stats to default values', () => {
    fc.assert(
      fc.property(
        fc.record({
          offlineReads: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
          onlineReads: fc.integer({ min: 1, max: 20 }),
        }),
        ({ offlineReads, onlineReads }) => {
          // Reset analytics before test
          resetOfflineAnalytics()
          vi.clearAllMocks()
          vi.mocked(storage.getItem).mockReturnValue(null)

          // Build up some state
          for (const novelId of offlineReads) {
            trackOfflineRead(novelId)
          }
          for (let i = 0; i < onlineReads; i++) {
            trackOnlineRead()
          }

          // Reset analytics
          resetOfflineAnalytics()

          // Get saved state after reset
          const lastCall = vi.mocked(storage.setItem).mock.calls[vi.mocked(storage.setItem).mock.calls.length - 1]
          const savedData = JSON.parse(lastCall[1] as string)

          // Assert: All stats are at default values
          expect(savedData.offlineReadsCount).toBe(0)
          expect(savedData.onlineReadsCount).toBe(0)
          expect(savedData.lastOfflineReadAt).toBeNull()
          expect(savedData.offlineNovelIds).toEqual([])
        }
      ),
      { numRuns: 100 }
    )
  })
  // Feature: enhanced-reading-experience, Additional Property: Reset Completeness
})
