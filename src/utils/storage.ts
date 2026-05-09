/**
 * localStorage helpers for persisting reading progress, bookmarks, and preferences.
 * Always call isStorageAvailable() before any read/write operation.
 */

import type { ReadingProgress, Bookmark, ReadingPreferences } from '@/types'
import { DEFAULT_PREFERENCES } from '@/types'

// Storage key prefixes
const PROGRESS_KEY_PREFIX = 'novel_reader:progress:'
const BOOKMARKS_KEY = 'novel_reader:bookmarks'
const PREFERENCES_KEY = 'novel_reader:preferences'

// ---------------------------------------------------------------------------
// Availability check
// ---------------------------------------------------------------------------

/**
 * Checks whether localStorage is available in the current browser environment.
 * Returns false if storage is blocked (e.g. private mode, security policy).
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__novel_reader_storage_test__'
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Generic localStorage helpers
// ---------------------------------------------------------------------------

/**
 * Generic helper to get an item from localStorage.
 * Returns null if the key doesn't exist or localStorage is unavailable.
 */
export function getItem(key: string): string | null {
  if (!isStorageAvailable()) return null
  
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

/**
 * Generic helper to set an item in localStorage.
 * Does nothing if localStorage is unavailable.
 */
export function setItem(key: string, value: string): void {
  if (!isStorageAvailable()) return
  
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage quota exceeded or other write error — fail silently
  }
}

// ---------------------------------------------------------------------------
// Reading Progress
// ---------------------------------------------------------------------------

/**
 * Retrieves the reading progress for a specific novel.
 * Returns null if no progress is stored or localStorage is unavailable.
 */
export function getReadingProgress(novelId: string): ReadingProgress | null {
  if (!isStorageAvailable()) return null

  try {
    const raw = localStorage.getItem(PROGRESS_KEY_PREFIX + novelId)
    if (raw === null) return null
    return JSON.parse(raw) as ReadingProgress
  } catch {
    return null
  }
}

/**
 * Saves reading progress for a specific novel.
 * Each novel is stored under a unique key derived from its novelId.
 * Does nothing if localStorage is unavailable.
 */
export function saveReadingProgress(progress: ReadingProgress): void {
  if (!isStorageAvailable()) return

  try {
    localStorage.setItem(PROGRESS_KEY_PREFIX + progress.novelId, JSON.stringify(progress))
  } catch {
    // Storage quota exceeded or other write error — fail silently
  }
}

// ---------------------------------------------------------------------------
// Bookmarks
// ---------------------------------------------------------------------------

/**
 * Retrieves all saved bookmarks.
 * Returns an empty array if none exist or localStorage is unavailable.
 */
export function getAllBookmarks(): Bookmark[] {
  if (!isStorageAvailable()) return []

  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY)
    if (raw === null) return []
    return JSON.parse(raw) as Bookmark[]
  } catch {
    return []
  }
}

/**
 * Adds a bookmark. If a bookmark for the same novel + chapter already exists,
 * it is replaced with the new value.
 * Does nothing if localStorage is unavailable.
 */
export function addBookmark(bookmark: Bookmark): void {
  if (!isStorageAvailable()) return

  try {
    const existing = getAllBookmarks().filter(
      (b) => !(b.novelId === bookmark.novelId && b.chapterNumber === bookmark.chapterNumber),
    )
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...existing, bookmark]))
  } catch {
    // Storage quota exceeded or other write error — fail silently
  }
}

/**
 * Removes the bookmark for the given novel + chapter combination.
 * Does nothing if no matching bookmark exists or localStorage is unavailable.
 */
export function removeBookmark(novelId: string, chapterNumber: number): void {
  if (!isStorageAvailable()) return

  try {
    const updated = getAllBookmarks().filter(
      (b) => !(b.novelId === novelId && b.chapterNumber === chapterNumber),
    )
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated))
  } catch {
    // Storage quota exceeded or other write error — fail silently
  }
}

/**
 * Returns true if a bookmark exists for the given novel + chapter combination.
 */
export function isBookmarked(novelId: string, chapterNumber: number): boolean {
  return getAllBookmarks().some(
    (b) => b.novelId === novelId && b.chapterNumber === chapterNumber,
  )
}

// ---------------------------------------------------------------------------
// Reading Preferences
// ---------------------------------------------------------------------------

/**
 * Retrieves the user's reading preferences.
 * Returns DEFAULT_PREFERENCES if nothing is stored or localStorage is unavailable.
 */
export function getReadingPreferences(): ReadingPreferences {
  if (!isStorageAvailable()) return { ...DEFAULT_PREFERENCES }

  try {
    const raw = localStorage.getItem(PREFERENCES_KEY)
    if (raw === null) return { ...DEFAULT_PREFERENCES }
    return JSON.parse(raw) as ReadingPreferences
  } catch {
    return { ...DEFAULT_PREFERENCES }
  }
}

/**
 * Saves the user's reading preferences to localStorage.
 * Does nothing if localStorage is unavailable.
 */
export function saveReadingPreferences(prefs: ReadingPreferences): void {
  if (!isStorageAvailable()) return

  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs))
  } catch {
    // Storage quota exceeded or other write error — fail silently
  }
}
