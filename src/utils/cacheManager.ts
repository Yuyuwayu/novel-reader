export interface CachedChapter {
  key: string // `${novelId}-${chapterNumber}`
  novelId: string
  chapterNumber: number
  content: string
  title: string
  cachedAt: string // ISO 8601
  lastAccessedAt: string // ISO 8601
  size: number // bytes
}

export class CacheManager {
  private db: IDBDatabase | null = null
  private memoryCache: Map<string, CachedChapter> = new Map()
  private readonly MAX_CHAPTERS = 50
  private readonly MAX_MEMORY_CHAPTERS = 10
  private readonly DB_NAME = 'novel-reader-cache'
  private readonly DB_VERSION = 1
  private readonly STORE_NAME = 'chapters'

  /**
   * Initialize the Cache Manager by opening IndexedDB connection
   * Falls back to memory-only cache if IndexedDB is unavailable
   */
  async init(): Promise<void> {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not available, using memory cache')
      return
    }

    try {
      this.db = await this.openDatabase()
    } catch (error) {
      console.warn('Failed to open IndexedDB, using memory cache:', error)
      this.db = null
    }
  }

  /**
   * Open IndexedDB database and create object store if needed
   */
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'key' })
          
          // Create indexes for efficient queries
          store.createIndex('lastAccessedAt', 'lastAccessedAt', { unique: false })
          store.createIndex('novelId', 'novelId', { unique: false })
        }
      }
    })
  }

  /**
   * Get a cached chapter by novelId and chapterNumber
   * Updates lastAccessedAt timestamp on access
   */
  async getCachedChapter(novelId: string, chapterNumber: number): Promise<CachedChapter | null> {
    const key = this.generateKey(novelId, chapterNumber)

    // Try IndexedDB first
    if (this.db) {
      try {
        const chapter = await this.getFromIndexedDB(key)
        if (chapter) {
          // Update lastAccessedAt
          chapter.lastAccessedAt = new Date().toISOString()
          await this.updateInIndexedDB(chapter)
          return chapter
        }
      } catch (error) {
        console.error('Failed to get chapter from IndexedDB:', error)
      }
    }

    // Fallback to memory cache
    const chapter = this.memoryCache.get(key)
    if (chapter) {
      chapter.lastAccessedAt = new Date().toISOString()
      return chapter
    }

    return null
  }

  /**
   * Cache a chapter with metadata
   * Triggers LRU eviction if cache is full
   */
  async cacheChapter(chapter: Omit<CachedChapter, 'key' | 'cachedAt' | 'lastAccessedAt' | 'size'>): Promise<void> {
    const now = new Date().toISOString()
    const key = this.generateKey(chapter.novelId, chapter.chapterNumber)
    const size = this.calculateSize(chapter.content)

    const cachedChapter: CachedChapter = {
      ...chapter,
      key,
      cachedAt: now,
      lastAccessedAt: now,
      size
    }

    // Try IndexedDB first
    if (this.db) {
      try {
        // Check if we need to evict
        const stats = await this.getCacheStats()
        if (stats.count >= this.MAX_CHAPTERS) {
          await this.evictLRU()
        }

        await this.putInIndexedDB(cachedChapter)
        return
      } catch (error) {
        console.error('Failed to cache chapter in IndexedDB:', error)
        
        // If quota exceeded, try aggressive eviction
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          try {
            // Evict 10 oldest chapters
            for (let i = 0; i < 10; i++) {
              await this.evictLRU()
            }
            await this.putInIndexedDB(cachedChapter)
            return
          } catch (retryError) {
            console.error('Failed to cache after eviction:', retryError)
          }
        }
      }
    }

    // Fallback to memory cache
    if (this.memoryCache.size >= this.MAX_MEMORY_CHAPTERS) {
      // Evict oldest from memory cache
      const oldest = Array.from(this.memoryCache.values())
        .sort((a, b) => new Date(a.lastAccessedAt).getTime() - new Date(b.lastAccessedAt).getTime())[0]
      if (oldest) {
        this.memoryCache.delete(oldest.key)
      }
    }
    this.memoryCache.set(key, cachedChapter)
  }

  /**
   * Clear all cached chapters
   */
  async clearCache(): Promise<void> {
    // Clear IndexedDB
    if (this.db) {
      try {
        const tx = this.db.transaction(this.STORE_NAME, 'readwrite')
        const store = tx.objectStore(this.STORE_NAME)
        await this.promisifyRequest(store.clear())
      } catch (error) {
        console.error('Failed to clear IndexedDB cache:', error)
      }
    }

    // Clear memory cache
    this.memoryCache.clear()
  }

  /**
   * Get cache statistics (count and total size)
   */
  async getCacheStats(): Promise<{ count: number; totalSize: number }> {
    // Try IndexedDB first
    if (this.db) {
      try {
        const tx = this.db.transaction(this.STORE_NAME, 'readonly')
        const store = tx.objectStore(this.STORE_NAME)
        const allChapters = await this.promisifyRequest<CachedChapter[]>(store.getAll())
        
        const count = allChapters.length
        const totalSize = allChapters.reduce((sum, ch) => sum + ch.size, 0)
        
        return { count, totalSize }
      } catch (error) {
        console.error('Failed to get cache stats from IndexedDB:', error)
      }
    }

    // Fallback to memory cache
    const count = this.memoryCache.size
    const totalSize = Array.from(this.memoryCache.values())
      .reduce((sum, ch) => sum + ch.size, 0)
    
    return { count, totalSize }
  }

  /**
   * Evict the least recently used chapter
   */
  async evictLRU(): Promise<void> {
    if (this.db) {
      try {
        const tx = this.db.transaction(this.STORE_NAME, 'readwrite')
        const store = tx.objectStore(this.STORE_NAME)
        const index = store.index('lastAccessedAt')
        
        // Get oldest chapter
        const cursor = await this.promisifyRequest<IDBCursorWithValue | null>(index.openCursor())
        if (cursor) {
          await this.promisifyRequest(cursor.delete())
        }
      } catch (error) {
        console.error('Failed to evict LRU from IndexedDB:', error)
      }
    } else {
      // Evict from memory cache
      const oldest = Array.from(this.memoryCache.values())
        .sort((a, b) => new Date(a.lastAccessedAt).getTime() - new Date(b.lastAccessedAt).getTime())[0]
      if (oldest) {
        this.memoryCache.delete(oldest.key)
      }
    }
  }

  /**
   * Generate cache key from novelId and chapterNumber
   */
  private generateKey(novelId: string, chapterNumber: number): string {
    return `${novelId}-${chapterNumber}`
  }

  /**
   * Calculate size of content in bytes
   */
  private calculateSize(content: string): number {
    return new Blob([content]).size
  }

  /**
   * Get chapter from IndexedDB
   */
  private getFromIndexedDB(key: string): Promise<CachedChapter | null> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.STORE_NAME, 'readonly')
      const store = tx.objectStore(this.STORE_NAME)
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Put chapter into IndexedDB
   */
  private putInIndexedDB(chapter: CachedChapter): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.STORE_NAME, 'readwrite')
      const store = tx.objectStore(this.STORE_NAME)
      const request = store.put(chapter)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Update chapter in IndexedDB
   */
  private updateInIndexedDB(chapter: CachedChapter): Promise<void> {
    return this.putInIndexedDB(chapter)
  }

  /**
   * Convert IDBRequest to Promise
   */
  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Check if using memory cache (IndexedDB unavailable)
   */
  isUsingMemoryCache(): boolean {
    return this.db === null
  }
}

// Export singleton instance
export const cacheManager = new CacheManager()
