/**
 * Pinia store for managing per-novel reading progress.
 * Progress is persisted to localStorage and retrieved on demand.
 */

import { defineStore } from 'pinia'
import type { ReadingProgress } from '@/types'
import { getReadingProgress, saveReadingProgress } from '@/utils/storage'

export const useProgressStore = defineStore('progress', () => {
  /**
   * Retrieves the reading progress for a specific novel from localStorage.
   * Returns null if no progress has been saved for that novel.
   * Requirements: 5.2, 5.3
   */
  function get(novelId: string): ReadingProgress | null {
    return getReadingProgress(novelId)
  }

  /**
   * Saves reading progress for a specific novel to localStorage.
   * Each novel's progress is stored independently under its own key.
   * Requirements: 5.1, 5.3
   */
  function save(progress: ReadingProgress): void {
    saveReadingProgress(progress)
  }

  return { get, save }
})
