/**
 * Pinia store for managing reading preferences (theme, font size, font family,
 * line spacing, content width).
 * State is initialized from localStorage and persisted on every change.
 */

import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { ReadingPreferences, Theme, FontFamily, LineSpacing } from '@/types'
import { getReadingPreferences, saveReadingPreferences } from '@/utils/storage'

export const usePreferencesStore = defineStore('preferences', () => {
  // Initialize state from localStorage (falls back to DEFAULT_PREFERENCES)
  const preferences = ref<ReadingPreferences>(getReadingPreferences())

  /**
   * Sets the display theme and persists it to localStorage.
   * Requirements: 6.2, 6.3, 6.5
   */
  function setTheme(theme: Theme): void {
    preferences.value = { ...preferences.value, theme }
    saveReadingPreferences(preferences.value)
  }

  /**
   * Sets the font size (clamped to 12–24px) and persists it to localStorage.
   * Requirements: 6.4, 6.5
   */
  function setFontSize(px: number): void {
    const clamped = Math.min(24, Math.max(12, px))
    preferences.value = { ...preferences.value, fontSizePx: clamped }
    saveReadingPreferences(preferences.value)
  }

  /**
   * Sets the font family and persists it to localStorage.
   * Requirements: 25.1
   */
  function setFontFamily(fontFamily: FontFamily): void {
    preferences.value = { ...preferences.value, fontFamily }
    saveReadingPreferences(preferences.value)
  }

  /**
   * Sets the line spacing and persists it to localStorage.
   * Requirements: 25.2
   */
  function setLineSpacing(lineSpacing: LineSpacing): void {
    preferences.value = { ...preferences.value, lineSpacing }
    saveReadingPreferences(preferences.value)
  }

  /**
   * Sets the content width (clamped to 600–900px) and persists it to localStorage.
   * Requirements: 25.3
   */
  function setContentWidth(px: number): void {
    const clamped = Math.min(900, Math.max(600, px))
    preferences.value = { ...preferences.value, contentWidth: clamped }
    saveReadingPreferences(preferences.value)
  }

  /**
   * Sets the auto-scroll speed (clamped to 1-10) and persists it to localStorage.
   */
  function setAutoScrollSpeed(speed: number): void {
    const clamped = Math.min(10, Math.max(1, speed))
    preferences.value = { ...preferences.value, autoScrollSpeed: clamped }
    saveReadingPreferences(preferences.value)
  }

  return { preferences, setTheme, setFontSize, setFontFamily, setLineSpacing, setContentWidth, setAutoScrollSpeed }
})
