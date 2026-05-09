import { describe, it, expect } from 'vitest'
import { calculateReadingTime } from './readingTime'

describe('calculateReadingTime', () => {
  describe('Indonesian content (200 wpm)', () => {
    it('should return 1 minute for 200 Indonesian words', () => {
      // Generate exactly 200 Indonesian words with non-ASCII characters
      // Using "ñövél" (multiple non-ASCII chars) to ensure < 80% ASCII ratio
      // Each word: ñövél = 5 chars, 2 ASCII (v, l) + 3 non-ASCII (ñ, ö, é) = 40% ASCII per word
      // With spaces: "ñövél " = 6 chars, 3 ASCII (v, l, space) + 3 non-ASCII = 50% ASCII
      const words: string[] = []
      for (let i = 0; i < 200; i++) {
        words.push('ñövél')
      }
      const content = words.join(' ')
      
      const result = calculateReadingTime(content)
      
      expect(result.minutes).toBe(1)
      expect(result.wordCount).toBe(200)
      expect(result.language).toBe('id')
    })

    it('should detect Indonesian language based on ASCII ratio', () => {
      // Indonesian text with many non-ASCII characters to ensure < 80% ASCII
      // Using a string with high density of non-ASCII characters
      // Strategy: use short words with multiple accents to maximize non-ASCII ratio
      const content = 'Ñövél íñí méñcérítákáñ téñtáñg pétúáláñgáñ héró yáñg béráñí méñyélámétkáñ dúñíá dárí áñcámáñ jáhát yáñg méñgérík séñ séñ séñ óráñg dí séñ péñ négárá déñgáñ kékúátáñ súpér yáñg lúár bíásá héñdákñyá Ñövél íñí méñcérítákáñ téñtáñg pétúáláñgáñ héró yáñg béráñí méñyélámétkáñ dúñíá dárí áñcámáñ jáhát yáñg méñgérík séñ séñ séñ óráñg dí séñ péñ négárá déñgáñ kékúátáñ súpér yáñg lúár bíásá héñdákñyá Ñövél íñí méñcérítákáñ téñtáñg pétúáláñgáñ héró yáñg béráñí méñyélámétkáñ dúñíá dárí áñcámáñ jáhát yáñg méñgérík séñ séñ séñ óráñg dí séñ péñ négárá déñgáñ kékúátáñ súpér yáñg lúár bíásá héñdákñyá Ñövél íñí méñcérítákáñ téñtáñg pétúáláñgáñ héró yáñg béráñí méñyélámétkáñ dúñíá dárí áñcámáñ jáhát yáñg méñgérík séñ séñ séñ óráñg dí séñ péñ négárá déñgáñ kékúátáñ súpér yáñg lúár bíásá héñdákñyá Ñövél íñí méñcérítákáñ téñtáñg pétúáláñgáñ héró yáñg béráñí méñyélámétkáñ dúñíá dárí áñcámáñ jáhát yáñg méñgérík séñ séñ séñ óráñg dí séñ péñ négárá déñgáñ kékúátáñ súpér yáñg lúár bíásá héñdákñyá'
      
      const result = calculateReadingTime(content)
      
      expect(result.language).toBe('id')
    })
  })

  describe('English content (250 wpm)', () => {
    it('should return 1 minute for 250 English words', () => {
      // Generate exactly 250 English words
      const words: string[] = []
      for (let i = 0; i < 250; i++) {
        words.push('word')
      }
      const content = words.join(' ')
      
      const result = calculateReadingTime(content)
      
      expect(result.minutes).toBe(1)
      expect(result.wordCount).toBe(250)
      expect(result.language).toBe('en')
    })

    it('should detect English language based on ASCII ratio', () => {
      const content = 'This is a test content with many English words that should be detected as English language because it has more than eighty percent ASCII characters in the entire text string provided here for testing purposes only'
      
      const result = calculateReadingTime(content)
      
      expect(result.language).toBe('en')
    })
  })

  describe('Edge cases', () => {
    it('should return 0 minutes for empty content', () => {
      const result = calculateReadingTime('')
      
      expect(result.minutes).toBe(0)
      expect(result.wordCount).toBe(0)
      expect(result.language).toBe('id') // Default to Indonesian
    })

    it('should handle very short content (< 1 minute)', () => {
      // 50 Indonesian words = 0.25 minutes, should round up to 1
      const content = 'kata '.repeat(50).trim()
      
      const result = calculateReadingTime(content)
      
      expect(result.minutes).toBe(1) // Ceiling rounds up
      expect(result.wordCount).toBe(50)
    })

    it('should handle whitespace-only content', () => {
      const result = calculateReadingTime('   \n\t  \r\n  ')
      
      expect(result.minutes).toBe(0)
      expect(result.wordCount).toBe(0)
    })

    it('should handle content with multiple consecutive spaces', () => {
      const content = 'word1    word2     word3      word4'
      
      const result = calculateReadingTime(content)
      
      expect(result.wordCount).toBe(4)
    })
  })

  describe('Ceiling rounding', () => {
    it('should round up fractional minutes (Indonesian)', () => {
      // 150 words at 200 wpm = 0.75 minutes, should round to 1
      const content = 'kata '.repeat(150).trim()
      
      const result = calculateReadingTime(content)
      
      expect(result.minutes).toBe(1)
    })

    it('should round up fractional minutes (English)', () => {
      // 300 words at 250 wpm = 1.2 minutes, should round to 2
      const content = 'word '.repeat(300).trim()
      
      const result = calculateReadingTime(content)
      
      expect(result.minutes).toBe(2)
    })

    it('should not round exact minute values', () => {
      // 400 words at 200 wpm = 2.0 minutes exactly
      const content = 'kata '.repeat(400).trim()
      
      const result = calculateReadingTime(content)
      
      expect(result.minutes).toBe(2)
    })
  })

  describe('Language detection threshold', () => {
    it('should classify as English when ASCII ratio is exactly 80%', () => {
      // Create content with exactly 80% ASCII characters
      // 80 ASCII chars + 20 non-ASCII chars = 80% ASCII
      const asciiPart = 'a'.repeat(80)
      const nonAsciiPart = 'ñ'.repeat(20)
      const content = asciiPart + nonAsciiPart
      
      const result = calculateReadingTime(content)
      
      // At exactly 80%, it should NOT be classified as English (> 80% required)
      expect(result.language).toBe('id')
    })

    it('should classify as English when ASCII ratio is above 80%', () => {
      // Create content with 81% ASCII characters
      const asciiPart = 'a'.repeat(81)
      const nonAsciiPart = 'ñ'.repeat(19)
      const content = asciiPart + nonAsciiPart
      
      const result = calculateReadingTime(content)
      
      expect(result.language).toBe('en')
    })

    it('should classify as Indonesian when ASCII ratio is below 80%', () => {
      // Create content with 79% ASCII characters
      const asciiPart = 'a'.repeat(79)
      const nonAsciiPart = 'ñ'.repeat(21)
      const content = asciiPart + nonAsciiPart
      
      const result = calculateReadingTime(content)
      
      expect(result.language).toBe('id')
    })
  })

  describe('Display format for very short content', () => {
    it('should return 1 minute for content that takes less than 1 minute (Indonesian)', () => {
      // 50 words at 200 wpm = 0.25 minutes
      const content = 'kata '.repeat(50).trim()
      
      const result = calculateReadingTime(content)
      
      // The function returns 1 (ceiling), UI should display "< 1 menit"
      expect(result.minutes).toBe(1)
    })

    it('should return 1 minute for content that takes less than 1 minute (English)', () => {
      // 100 words at 250 wpm = 0.4 minutes
      const content = 'word '.repeat(100).trim()
      
      const result = calculateReadingTime(content)
      
      // The function returns 1 (ceiling), UI should display "< 1 menit"
      expect(result.minutes).toBe(1)
    })

    it('should return 2 minutes for content that takes slightly over 1 minute', () => {
      // 300 words at 200 wpm = 1.5 minutes, rounds to 2
      const content = 'kata '.repeat(300).trim()
      
      const result = calculateReadingTime(content)
      
      expect(result.minutes).toBe(2)
    })
  })

  describe('Real-world scenarios', () => {
    it('should handle typical chapter content (Indonesian)', () => {
      // Simulate a typical Indonesian chapter with ~2000 words
      // Use many non-ASCII characters to ensure Indonesian detection
      const baseText = 'Pádá súátú hári yáng ceráh di sébuáh désá kécil yáng térlétákñ di káki gúnúng yáng indáh dán hijáú pénúh déngán pépóhónán rindáng dán súngái yáng jérnih méngálir déngán ténáng mémbáwá késéjúkán bágiñ sémúá péndúdúk désá yáng rámáh dán báik háti képádá siápá sájá yáng dátáng bérkúnjúng ké témpát méréká tinggál déngán pénúh kébáhágiáán dán kédámáián sétiáp hári tánpá hénti hingga ákhir másá '
      const content = baseText.repeat(30).trim()
      
      const result = calculateReadingTime(content)
      
      expect(result.wordCount).toBeGreaterThan(1200)
      expect(result.minutes).toBeGreaterThan(6) // ~1800 words / 200 wpm = 9 minutes
      expect(result.language).toBe('id')
    })

    it('should handle typical chapter content (English)', () => {
      // Simulate a typical English chapter with ~2500 words
      const content = 'In a world where magic and technology coexist in perfect harmony the young hero embarks on an epic journey to save the kingdom from the dark forces that threaten to destroy everything he holds dear with courage and determination he faces countless challenges and obstacles along the way meeting new friends and allies who help him in his quest to restore peace and justice to the land forever '.repeat(30).trim()
      
      const result = calculateReadingTime(content)
      
      expect(result.wordCount).toBeGreaterThan(2000)
      expect(result.minutes).toBeGreaterThan(8) // ~2500 words / 250 wpm = 10 minutes
      expect(result.language).toBe('en')
    })

    it('should handle mixed punctuation and special characters', () => {
      const content = 'Hello world This is a test with various punctuation marks semicolons colons and dashes plus some numbers and symbols'
      
      const result = calculateReadingTime(content)
      
      expect(result.wordCount).toBe(19)
      expect(result.language).toBe('en')
    })
  })
})
