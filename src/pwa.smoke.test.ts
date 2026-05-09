/**
 * Smoke tests for PWA configuration.
 * Verifies one-time configuration and setup for Progressive Web App features.
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 4.1, 4.2
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Smoke Tests: PWA Configuration', () => {
  /**
   * Test PWA manifest contains all required fields
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
   */
  describe('PWA Manifest', () => {
    let manifest: any

    beforeAll(() => {
      // Read manifest.json from public directory
      const manifestPath = resolve(__dirname, '../public/manifest.json')
      const manifestContent = readFileSync(manifestPath, 'utf-8')
      manifest = JSON.parse(manifestContent)
    })

    it('should have required name field', () => {
      expect(manifest.name).toBe('Novel Reader')
    })

    it('should have required short_name field', () => {
      expect(manifest.short_name).toBe('Novel Reader')
    })

    it('should have required start_url field', () => {
      expect(manifest.start_url).toBe('/')
    })

    it('should have required display field set to standalone', () => {
      expect(manifest.display).toBe('standalone')
    })

    it('should have required theme_color field', () => {
      expect(manifest.theme_color).toBe('#5E6AD2')
    })

    it('should have required background_color field', () => {
      expect(manifest.background_color).toBeDefined()
      expect(typeof manifest.background_color).toBe('string')
    })

    it('should have description field', () => {
      expect(manifest.description).toBeDefined()
      expect(typeof manifest.description).toBe('string')
      expect(manifest.description.length).toBeGreaterThan(0)
    })

    it('should have icons array with 192x192 and 512x512 sizes', () => {
      expect(manifest.icons).toBeDefined()
      expect(Array.isArray(manifest.icons)).toBe(true)
      expect(manifest.icons.length).toBeGreaterThanOrEqual(2)

      // Check for 192x192 icon
      const icon192 = manifest.icons.find((icon: any) => icon.sizes === '192x192')
      expect(icon192).toBeDefined()
      expect(icon192.src).toBe('/icon-192.png')
      expect(icon192.type).toBe('image/png')

      // Check for 512x512 icon
      const icon512 = manifest.icons.find((icon: any) => icon.sizes === '512x512')
      expect(icon512).toBeDefined()
      expect(icon512.src).toBe('/icon-512.png')
      expect(icon512.type).toBe('image/png')
    })

    it('should have all icons with proper purpose field', () => {
      manifest.icons.forEach((icon: any) => {
        expect(icon.purpose).toBeDefined()
        expect(typeof icon.purpose).toBe('string')
      })
    })
  })

  /**
   * Test Vite config includes vite-plugin-pwa
   * Requirements: 4.1, 4.2
   */
  describe('Vite Configuration', () => {
    let viteConfig: any

    beforeAll(async () => {
      // Dynamically import vite config
      const configPath = resolve(__dirname, '../vite.config.ts')
      // Read the config file as text to check for plugin
      const configContent = readFileSync(configPath, 'utf-8')
      viteConfig = { content: configContent }
    })

    it('should import VitePWA from vite-plugin-pwa', () => {
      expect(viteConfig.content).toContain("import { VitePWA } from 'vite-plugin-pwa'")
    })

    it('should include VitePWA in plugins array', () => {
      expect(viteConfig.content).toContain('VitePWA(')
    })

    it('should configure registerType as prompt', () => {
      expect(viteConfig.content).toContain("registerType: 'prompt'")
    })

    it('should include manifest configuration', () => {
      expect(viteConfig.content).toContain('manifest: {')
      expect(viteConfig.content).toContain("name: 'Novel Reader'")
    })

    it('should configure workbox runtime caching', () => {
      expect(viteConfig.content).toContain('workbox: {')
      expect(viteConfig.content).toContain('runtimeCaching:')
    })

    it('should configure chapter API caching with NetworkFirst strategy', () => {
      // Check for urlPattern with /api/chapters/ (the regex is a literal in TS, so check for escaped version)
      expect(viteConfig.content).toContain('urlPattern:')
      expect(viteConfig.content).toContain('\\/api\\/chapters\\/')
      expect(viteConfig.content).toContain("handler: 'NetworkFirst'")
      expect(viteConfig.content).toContain('chapter-cache-v1')
    })

    it('should configure static assets caching with CacheFirst strategy', () => {
      expect(viteConfig.content).toContain("handler: 'CacheFirst'")
      expect(viteConfig.content).toContain('static-assets-v1')
    })

    it('should set cache expiration for chapters to 7 days', () => {
      // Check for 7 days in seconds: 7 * 24 * 60 * 60
      expect(viteConfig.content).toContain('7 * 24 * 60 * 60')
    })

    it('should set maxEntries for chapter cache to 50', () => {
      // Look for maxEntries: 50 in the chapter cache configuration
      const hasMaxEntries = viteConfig.content.includes('maxEntries: 50')
      expect(hasMaxEntries).toBe(true)
    })
  })

  /**
   * Test Service Worker disabled in dev mode
   * Requirements: 4.2
   */
  describe('Service Worker Development Mode', () => {
    let viteConfig: any

    beforeAll(() => {
      const configPath = resolve(__dirname, '../vite.config.ts')
      const configContent = readFileSync(configPath, 'utf-8')
      viteConfig = { content: configContent }
    })

    it('should disable Service Worker in development mode', () => {
      expect(viteConfig.content).toContain('devOptions: {')
      expect(viteConfig.content).toContain('enabled: false')
    })

    it('should have comment explaining MSW conflict avoidance', () => {
      // Check for comment about MSW conflicts
      const hasComment = viteConfig.content.includes('MSW') || 
                        viteConfig.content.includes('Mock Service Worker') ||
                        viteConfig.content.includes('dev to avoid')
      expect(hasComment).toBe(true)
    })
  })

  /**
   * Test IndexedDB schema is correct
   * Requirements: 2.1, 2.2, 2.3
   */
  describe('IndexedDB Schema', () => {
    let cacheManagerContent: string

    beforeAll(() => {
      const cacheManagerPath = resolve(__dirname, './utils/cacheManager.ts')
      cacheManagerContent = readFileSync(cacheManagerPath, 'utf-8')
    })

    it('should define correct database name', () => {
      expect(cacheManagerContent).toContain("DB_NAME = 'novel-reader-cache'")
    })

    it('should define correct object store name', () => {
      expect(cacheManagerContent).toContain("STORE_NAME = 'chapters'")
    })

    it('should create object store with key path', () => {
      expect(cacheManagerContent).toContain("createObjectStore(this.STORE_NAME, { keyPath: 'key' })")
    })

    it('should create lastAccessedAt index for LRU queries', () => {
      expect(cacheManagerContent).toContain("createIndex('lastAccessedAt', 'lastAccessedAt'")
    })

    it('should create novelId index for per-novel queries', () => {
      expect(cacheManagerContent).toContain("createIndex('novelId', 'novelId'")
    })

    it('should define CachedChapter interface with all required fields', () => {
      expect(cacheManagerContent).toContain('interface CachedChapter')
      expect(cacheManagerContent).toContain('key: string')
      expect(cacheManagerContent).toContain('novelId: string')
      expect(cacheManagerContent).toContain('chapterNumber: number')
      expect(cacheManagerContent).toContain('content: string')
      expect(cacheManagerContent).toContain('title: string')
      expect(cacheManagerContent).toContain('cachedAt: string')
      expect(cacheManagerContent).toContain('lastAccessedAt: string')
      expect(cacheManagerContent).toContain('size: number')
    })

    it('should set MAX_CHAPTERS to 50', () => {
      expect(cacheManagerContent).toContain('MAX_CHAPTERS = 50')
    })

    it('should set MAX_MEMORY_CHAPTERS to 10 for fallback', () => {
      expect(cacheManagerContent).toContain('MAX_MEMORY_CHAPTERS = 10')
    })
  })

  /**
   * Test Service Worker registration in main.ts
   * Requirements: 4.4
   */
  describe('Service Worker Registration', () => {
    let mainContent: string

    beforeAll(() => {
      const mainPath = resolve(__dirname, './main.ts')
      mainContent = readFileSync(mainPath, 'utf-8')
    })

    it('should conditionally import registerSW from virtual:pwa-register', () => {
      expect(mainContent).toContain('virtual:pwa-register')
      expect(mainContent).toContain('registerSW')
    })

    it('should check for production environment before registering', () => {
      expect(mainContent).toContain('import.meta.env.PROD')
    })

    it('should check for serviceWorker support', () => {
      expect(mainContent).toContain("'serviceWorker' in navigator")
    })

    it('should configure onNeedRefresh callback', () => {
      expect(mainContent).toContain('onNeedRefresh')
    })

    it('should configure onOfflineReady callback', () => {
      expect(mainContent).toContain('onOfflineReady')
    })

    it('should configure onRegistered callback', () => {
      expect(mainContent).toContain('onRegistered')
    })

    it('should configure onRegisterError callback', () => {
      expect(mainContent).toContain('onRegisterError')
    })
  })

  /**
   * Test PWA icon files exist
   * Requirements: 3.8
   */
  describe('PWA Icon Files', () => {
    it('should have 192x192 icon file', () => {
      const iconPath = resolve(__dirname, '../public/icon-192.png')
      expect(() => readFileSync(iconPath)).not.toThrow()
    })

    it('should have 512x512 icon file', () => {
      const iconPath = resolve(__dirname, '../public/icon-512.png')
      expect(() => readFileSync(iconPath)).not.toThrow()
    })

    it('should have favicon.svg file', () => {
      const faviconPath = resolve(__dirname, '../public/favicon.svg')
      expect(() => readFileSync(faviconPath)).not.toThrow()
    })
  })

  /**
   * Test cache key format consistency
   * Requirements: 2.2
   */
  describe('Cache Key Format', () => {
    let cacheManagerContent: string

    beforeAll(() => {
      const cacheManagerPath = resolve(__dirname, './utils/cacheManager.ts')
      cacheManagerContent = readFileSync(cacheManagerPath, 'utf-8')
    })

    it('should generate cache keys in format novelId-chapterNumber', () => {
      // Check for the generateKey method implementation
      expect(cacheManagerContent).toContain('generateKey')
      expect(cacheManagerContent).toContain('${novelId}-${chapterNumber}')
    })

    it('should use consistent key format in getCachedChapter', () => {
      expect(cacheManagerContent).toContain('getCachedChapter')
      expect(cacheManagerContent).toContain('this.generateKey(novelId, chapterNumber)')
    })

    it('should use consistent key format in cacheChapter', () => {
      expect(cacheManagerContent).toContain('cacheChapter')
      expect(cacheManagerContent).toContain('this.generateKey(chapter.novelId, chapter.chapterNumber)')
    })
  })
})
