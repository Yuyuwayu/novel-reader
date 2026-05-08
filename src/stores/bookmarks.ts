/**
 * Pinia store for managing bookmarked chapters.
 * State is initialized from localStorage and kept in sync on every mutation.
 */

import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Bookmark } from '@/types'
import {
  getAllBookmarks,
  addBookmark as storageAddBookmark,
  removeBookmark as storageRemoveBookmark,
  isBookmarked as storageIsBookmarked,
} from '@/utils/storage'

export const useBookmarksStore = defineStore('bookmarks', () => {
  // Initialize state from localStorage
  const bookmarks = ref<Bookmark[]>(getAllBookmarks())

  /**
   * Adds a bookmark and persists it to localStorage.
   * If a bookmark for the same novel + chapter already exists it is replaced.
   * Requirements: 7.2
   */
  function add(bookmark: Bookmark): void {
    storageAddBookmark(bookmark)
    // Re-read from storage to stay in sync with the persisted state
    bookmarks.value = getAllBookmarks()
  }

  /**
   * Removes the bookmark for the given novel + chapter and persists the change.
   * Requirements: 7.3
   */
  function remove(novelId: string, chapterNumber: number): void {
    storageRemoveBookmark(novelId, chapterNumber)
    bookmarks.value = getAllBookmarks()
  }

  /**
   * Returns true if a bookmark exists for the given novel + chapter.
   * Requirements: 7.1, 7.4
   */
  function isBookmarked(novelId: string, chapterNumber: number): boolean {
    return storageIsBookmarked(novelId, chapterNumber)
  }

  return { bookmarks, add, remove, isBookmarked }
})
