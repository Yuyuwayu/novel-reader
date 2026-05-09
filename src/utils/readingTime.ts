import type { ReadingTimeResult } from '@/types'

/**
 * Calculate estimated reading time for chapter content.
 * 
 * Algorithm:
 * 1. Count words by splitting on whitespace and filtering empty strings
 * 2. Detect language based on ASCII character ratio:
 *    - > 80% ASCII = English (250 wpm)
 *    - ≤ 80% ASCII = Indonesian (200 wpm)
 * 3. Calculate reading time and round up to nearest minute
 * 
 * Edge cases:
 * - Empty content returns 0 minutes
 * - Very short content (< 1 minute) returns 1 minute (ceiling)
 * 
 * @param content - Chapter content text
 * @returns Reading time result with minutes, word count, and detected language
 * 
 * @example
 * ```typescript
 * const result = calculateReadingTime('kata '.repeat(200))
 * // { minutes: 1, wordCount: 200, language: 'id' }
 * ```
 */
export function calculateReadingTime(content: string): ReadingTimeResult {
  // Handle empty content edge case
  if (content.length === 0) {
    return {
      minutes: 0,
      wordCount: 0,
      language: 'id', // Default to Indonesian for empty content
    }
  }

  // Count words by splitting on whitespace and filtering empty strings
  const words = content.split(/\s+/).filter(Boolean)
  const wordCount = words.length

  // Language detection: ASCII ratio > 80% = English
  const asciiCount = content.split('').filter(c => c.charCodeAt(0) < 128).length
  const asciiRatio = asciiCount / content.length
  const language: 'id' | 'en' = asciiRatio > 0.8 ? 'en' : 'id'

  // Reading speed: 200 wpm (Indonesian), 250 wpm (English)
  const wpm = language === 'en' ? 250 : 200

  // Calculate reading time and round up (ceiling)
  const minutes = Math.ceil(wordCount / wpm)

  return { minutes, wordCount, language }
}
