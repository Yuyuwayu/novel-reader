import { describe, it, expect, beforeEach, vi } from 'vitest'
import { trackOfflineRead, trackOnlineRead, getOfflineAnalytics, resetOfflineAnalytics } from './offlineAnalytics'
import * as storage from './storage'

// Mock the storage module
vi.mock('./storage', () => ({
  isStorageAvailable: vi.fn(() => true),
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
}))

describe('offlineAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset to default state
    vi.mocked(storage.getItem).mockReturnValue(null)
  })

  describe('trackOfflineRead', () => {
    it('should increment offlineReadsCount', () => {
      trackOfflineRead('novel-123')
      
      expect(storage.setItem).toHaveBeenCalledWith(
        'offline_stats',
        expect.stringContaining('"offlineReadsCount":1')
      )
    })

    it('should update lastOfflineReadAt timestamp', () => {
      trackOfflineRead('novel-123')
      
      const call = vi.mocked(storage.setItem).mock.calls[0]
      const savedData = JSON.parse(call[1] as string)
      
      expect(savedData.lastOfflineReadAt).toBeTruthy()
      expect(new Date(savedData.lastOfflineReadAt).getTime()).toBeGreaterThan(Date.now() - 1000)
    })

    it('should add novelId to offlineNovelIds list', () => {
      trackOfflineRead('novel-123')
      
      const call = vi.mocked(storage.setItem).mock.calls[0]
      const savedData = JSON.parse(call[1] as string)
      
      expect(savedData.offlineNovelIds).toContain('novel-123')
    })

    it('should not duplicate novelId in offlineNovelIds list', () => {
      // Mock existing stats with novel-123 already in the list
      vi.mocked(storage.getItem).mockReturnValue(
        JSON.stringify({
          offlineReadsCount: 1,
          onlineReadsCount: 0,
          lastOfflineReadAt: new Date().toISOString(),
          offlineNovelIds: ['novel-123'],
        })
      )
      
      trackOfflineRead('novel-123')
      
      const call = vi.mocked(storage.setItem).mock.calls[0]
      const savedData = JSON.parse(call[1] as string)
      
      // Should still have only one instance of novel-123
      expect(savedData.offlineNovelIds.filter((id: string) => id === 'novel-123')).toHaveLength(1)
    })
  })

  describe('trackOnlineRead', () => {
    it('should increment onlineReadsCount', () => {
      trackOnlineRead()
      
      expect(storage.setItem).toHaveBeenCalledWith(
        'offline_stats',
        expect.stringContaining('"onlineReadsCount":1')
      )
    })

    it('should not modify offlineReadsCount', () => {
      trackOnlineRead()
      
      const call = vi.mocked(storage.setItem).mock.calls[0]
      const savedData = JSON.parse(call[1] as string)
      
      expect(savedData.offlineReadsCount).toBe(0)
    })
  })

  describe('getOfflineAnalytics', () => {
    it('should return default stats when storage is empty', () => {
      const stats = getOfflineAnalytics()
      
      expect(stats).toEqual({
        offlineReadsCount: 0,
        onlineReadsCount: 0,
        lastOfflineReadAt: null,
        offlineNovelIds: [],
      })
    })

    it('should return stored stats when available', () => {
      const mockStats = {
        offlineReadsCount: 5,
        onlineReadsCount: 10,
        lastOfflineReadAt: '2024-01-01T00:00:00.000Z',
        offlineNovelIds: ['novel-1', 'novel-2'],
      }
      
      vi.mocked(storage.getItem).mockReturnValue(JSON.stringify(mockStats))
      
      const stats = getOfflineAnalytics()
      
      expect(stats).toEqual(mockStats)
    })

    it('should return default stats when storage is unavailable', () => {
      vi.mocked(storage.isStorageAvailable).mockReturnValue(false)
      
      const stats = getOfflineAnalytics()
      
      expect(stats).toEqual({
        offlineReadsCount: 0,
        onlineReadsCount: 0,
        lastOfflineReadAt: null,
        offlineNovelIds: [],
      })
    })
  })

  describe('resetOfflineAnalytics', () => {
    it('should reset all stats to default values', () => {
      // Ensure storage is available
      vi.mocked(storage.isStorageAvailable).mockReturnValue(true)
      
      resetOfflineAnalytics()
      
      expect(storage.setItem).toHaveBeenCalledWith(
        'offline_stats',
        JSON.stringify({
          offlineReadsCount: 0,
          onlineReadsCount: 0,
          lastOfflineReadAt: null,
          offlineNovelIds: [],
        })
      )
    })

    it('should not throw when storage is unavailable', () => {
      vi.mocked(storage.isStorageAvailable).mockReturnValue(false)
      
      expect(() => resetOfflineAnalytics()).not.toThrow()
      expect(storage.setItem).not.toHaveBeenCalled()
    })
  })
})
