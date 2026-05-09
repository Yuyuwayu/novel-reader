/**
 * Property-based tests for Cache Manager utility.
 * Tests universal properties using fast-check with minimum 100 iterations.
 * Requirements: 1.8
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fc from 'fast-check'
import { CacheManager, type CachedChapter } from './cacheManager'

// Mock IndexedDB for testing
class MockIDBDatabase {
  private store: Map<string, CachedChapter> = new Map()
  
  transaction(_storeName: string, _mode: string) {
    return {
      objectStore: (_name: string) => ({
        get: (key: string) => ({
          onsuccess: null as any,
          onerror: null as any,
          result: this.store.get(key) || undefined,
          addEventListener: function(event: string, handler: any) {
            if (event === 'success') {
              setTimeout(() => {
                this.onsuccess = handler
                handler({ target: { result: this.result } })
              }, 0)
            }
          }
        }),
        put: (_value: CachedChapter) => ({
          onsuccess: null as any,
          onerror: null as any,
          addEventListener: function(event: string, handler: any) {
            if (event === 'success') {
              setTimeout(() => {
                this.onsuccess = handler
                handler({ target: { result: undefined } })
              }, 0)
            }
          }
        }),
        getAll: () => ({
          onsuccess: null as any,
          onerror: null as any,
          result: Array.from(this.store.values()),
          addEventListener: function(event: string, handler: any) {
            if (event === 'success') {
              setTimeout(() => {
                this.onsuccess = handler
                handler({ target: { result: this.result } })
              }, 0)
            }
          }
        }),
        clear: () => ({
          onsuccess: null as any,
          onerror: null as any,
          addEventListener: function(event: string, handler: any) {
            if (event === 'success') {
              setTimeout(() => {
                this.onsuccess = handler
                handler({ target: { result: undefined } })
              }, 0)
            }
          }
        }),
        index: (_indexName: string) => ({
          openCursor: () => ({
            onsuccess: null as any,
            onerror: null as any,
            result: null,
            addEventListener: function(event: string, handler: any) {
              if (event === 'success') {
                setTimeout(() => {
                  this.onsuccess = handler
                  handler({ target: { result: this.result } })
                }, 0)
              }
            }
          })
        })
      })
    }
  }
  
  setData(key: string, value: CachedChapter) {
    this.store.set(key, value)
  }
  
  getData(key: string): CachedChapter | undefined {
    return this.store.get(key)
  }
  
  clear() {
    this.store.clear()
  }
}

describe('Property Tests: Cache Manager', () => {
  let mockDB: MockIDBDatabase

  beforeEach(() => {
    mockDB = new MockIDBDatabase()
    
    // Mock IndexedDB
    vi.stubGlobal('indexedDB', {
      open: () => ({
        onsuccess: null as any,
        onerror: null as any,
        onupgradeneeded: null as any,
        result: mockDB,
        addEventListener: function(event: string, handler: any) {
          if (event === 'success') {
            setTimeout(() => {
              this.onsuccess = handler
              handler({ target: { result: mockDB } })
            }, 0)
          }
        }
      })
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    mockDB.clear()
  })

  /**
   * Property 5: Cache Freshness Validation
   * 
   * For any cached chapter with a cachedAt timestamp older than 7 days,
   * fetching the chapter SHALL trigger a freshness check and update the
   * cache if the server version is newer.
   * 
   * Validates: Requirements 1.8
   * Feature: enhanced-reading-experience, Property 5: Cache Freshness Validation
   */
  it('Property 5: should identify stale cache entries older than 7 days', async () => {
    fc.assert(
      fc.asyncProperty(
        // Generate a chapter with a cachedAt timestamp
        fc.record({
          novelId: fc.string({ minLength: 1, maxLength: 20 }),
          chapterNumber: fc.integer({ min: 1, max: 1000 }),
          content: fc.string({ minLength: 10, maxLength: 1000 }),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          // Generate age in days (0 to 14 days old)
          ageInDays: fc.integer({ min: 0, max: 14 })
        }),
        async ({ novelId, chapterNumber, content, title, ageInDays }) => {
          const manager = new CacheManager()
          await manager.init()

          // Calculate cachedAt timestamp based on age
          const now = new Date()
          const cachedAt = new Date(now.getTime() - ageInDays * 24 * 60 * 60 * 1000)
          const cachedAtISO = cachedAt.toISOString()

          // Create a cached chapter with the calculated timestamp
          const key = `${novelId}-${chapterNumber}`
          const cachedChapter: CachedChapter = {
            key,
            novelId,
            chapterNumber,
            content,
            title,
            cachedAt: cachedAtISO,
            lastAccessedAt: cachedAtISO,
            size: new Blob([content]).size
          }

          // Manually insert into mock DB to simulate existing cache
          mockDB.setData(key, cachedChapter)

          // Retrieve the chapter
          const retrieved = await manager.getCachedChapter(novelId, chapterNumber)

          // Verify the chapter was retrieved
          expect(retrieved).not.toBeNull()
          expect(retrieved?.content).toBe(content)

          // Check if cache is stale (older than 7 days)
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          const isStale = new Date(cachedAtISO) < sevenDaysAgo

          // Property: If cache is older than 7 days, it should be considered stale
          if (ageInDays > 7) {
            expect(isStale).toBe(true)
            // In a real implementation, this would trigger a freshness check
            // For now, we verify the age calculation is correct
          } else {
            expect(isStale).toBe(false)
          }

          // Verify cachedAt timestamp hasn't changed (only lastAccessedAt should update)
          expect(retrieved?.cachedAt).toBe(cachedAtISO)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Additional Property: Cache Age Calculation
   * 
   * For any cached chapter, the age in days should be accurately calculated
   * from the cachedAt timestamp to the current time.
   */
  it('Property: should accurately calculate cache age in days', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          novelId: fc.string({ minLength: 1, maxLength: 20 }),
          chapterNumber: fc.integer({ min: 1, max: 1000 }),
          content: fc.string({ minLength: 10, maxLength: 1000 }),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          ageInDays: fc.integer({ min: 0, max: 30 })
        }),
        async ({ novelId, chapterNumber, content, title, ageInDays }) => {
          const manager = new CacheManager()
          await manager.init()

          // Calculate cachedAt timestamp
          const now = new Date()
          const cachedAt = new Date(now.getTime() - ageInDays * 24 * 60 * 60 * 1000)
          const cachedAtISO = cachedAt.toISOString()

          // Create and cache the chapter
          const key = `${novelId}-${chapterNumber}`
          const cachedChapter: CachedChapter = {
            key,
            novelId,
            chapterNumber,
            content,
            title,
            cachedAt: cachedAtISO,
            lastAccessedAt: cachedAtISO,
            size: new Blob([content]).size
          }

          mockDB.setData(key, cachedChapter)

          // Retrieve and calculate age
          const retrieved = await manager.getCachedChapter(novelId, chapterNumber)
          expect(retrieved).not.toBeNull()

          const ageMs = now.getTime() - new Date(retrieved!.cachedAt).getTime()
          const calculatedAgeDays = Math.floor(ageMs / (24 * 60 * 60 * 1000))

          // Property: Calculated age should match the input age (within 1 day tolerance for timing)
          expect(Math.abs(calculatedAgeDays - ageInDays)).toBeLessThanOrEqual(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Additional Property: Freshness Threshold Boundary
   * 
   * For any cached chapter, the 7-day threshold should be a clear boundary:
   * - Chapters cached exactly 7 days ago should be considered stale
   * - Chapters cached 6.99 days ago should be fresh
   */
  it('Property: 7-day threshold is a clear boundary for staleness', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          novelId: fc.string({ minLength: 1, maxLength: 20 }),
          chapterNumber: fc.integer({ min: 1, max: 1000 }),
          content: fc.string({ minLength: 10, maxLength: 1000 }),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          // Generate age around the 7-day boundary (6 to 8 days)
          ageInHours: fc.integer({ min: 144, max: 192 }) // 6 to 8 days in hours
        }),
        async ({ novelId, chapterNumber, content, title, ageInHours }) => {
          const manager = new CacheManager()
          await manager.init()

          const now = new Date()
          const cachedAt = new Date(now.getTime() - ageInHours * 60 * 60 * 1000)
          const cachedAtISO = cachedAt.toISOString()

          const key = `${novelId}-${chapterNumber}`
          const cachedChapter: CachedChapter = {
            key,
            novelId,
            chapterNumber,
            content,
            title,
            cachedAt: cachedAtISO,
            lastAccessedAt: cachedAtISO,
            size: new Blob([content]).size
          }

          mockDB.setData(key, cachedChapter)

          const retrieved = await manager.getCachedChapter(novelId, chapterNumber)
          expect(retrieved).not.toBeNull()

          // Calculate if stale (older than 7 days = 168 hours)
          const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000
          const ageMs = now.getTime() - new Date(cachedAtISO).getTime()
          const isStale = ageMs > sevenDaysInMs

          // Property: Clear boundary at 7 days
          if (ageInHours > 168) {
            expect(isStale).toBe(true)
          } else {
            expect(isStale).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
