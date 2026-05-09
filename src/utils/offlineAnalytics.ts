import { isStorageAvailable, getItem, setItem } from './storage'

/**
 * Offline analytics data structure stored in localStorage.
 * Tracks offline reading behavior for product analytics.
 */
interface OfflineStats {
  offlineReadsCount: number
  onlineReadsCount: number
  lastOfflineReadAt: string | null // ISO 8601
  offlineNovelIds: string[] // Unique novel IDs read offline
}

const STORAGE_KEY = 'offline_stats'

/**
 * Get current offline stats from localStorage.
 * Returns default stats if not found or storage unavailable.
 */
function getOfflineStats(): OfflineStats {
  if (!isStorageAvailable()) {
    return {
      offlineReadsCount: 0,
      onlineReadsCount: 0,
      lastOfflineReadAt: null,
      offlineNovelIds: [],
    }
  }

  const stored = getItem(STORAGE_KEY)
  if (!stored) {
    return {
      offlineReadsCount: 0,
      onlineReadsCount: 0,
      lastOfflineReadAt: null,
      offlineNovelIds: [],
    }
  }

  try {
    return JSON.parse(stored) as OfflineStats
  } catch {
    return {
      offlineReadsCount: 0,
      onlineReadsCount: 0,
      lastOfflineReadAt: null,
      offlineNovelIds: [],
    }
  }
}

/**
 * Save offline stats to localStorage.
 */
function saveOfflineStats(stats: OfflineStats): void {
  if (!isStorageAvailable()) return
  setItem(STORAGE_KEY, JSON.stringify(stats))
}

/**
 * Track an offline chapter read.
 * Increments offlineReadsCount, updates lastOfflineReadAt timestamp,
 * and adds novelId to offlineNovelIds list (unique).
 * 
 * @param novelId - The novel ID being read offline
 * 
 * @example
 * ```typescript
 * trackOfflineRead('novel-123')
 * ```
 */
export function trackOfflineRead(novelId: string): void {
  const stats = getOfflineStats()
  
  stats.offlineReadsCount += 1
  stats.lastOfflineReadAt = new Date().toISOString()
  
  // Add novelId to list if not already present (unique)
  if (!stats.offlineNovelIds.includes(novelId)) {
    stats.offlineNovelIds.push(novelId)
  }
  
  saveOfflineStats(stats)
}

/**
 * Track an online chapter read.
 * Increments onlineReadsCount.
 * 
 * @example
 * ```typescript
 * trackOnlineRead()
 * ```
 */
export function trackOnlineRead(): void {
  const stats = getOfflineStats()
  stats.onlineReadsCount += 1
  saveOfflineStats(stats)
}

/**
 * Get current offline analytics statistics.
 * Useful for displaying stats in SettingsPanel.
 * 
 * @returns Current offline stats
 * 
 * @example
 * ```typescript
 * const stats = getOfflineAnalytics()
 * console.log(`Offline reads: ${stats.offlineReadsCount}`)
 * ```
 */
export function getOfflineAnalytics(): OfflineStats {
  return getOfflineStats()
}

/**
 * Reset all offline analytics statistics.
 * Typically called when cache is cleared.
 * 
 * @example
 * ```typescript
 * resetOfflineAnalytics()
 * ```
 */
export function resetOfflineAnalytics(): void {
  if (!isStorageAvailable()) return
  
  const emptyStats: OfflineStats = {
    offlineReadsCount: 0,
    onlineReadsCount: 0,
    lastOfflineReadAt: null,
    offlineNovelIds: [],
  }
  
  saveOfflineStats(emptyStats)
}
