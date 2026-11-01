import { describe, it, expect } from 'vitest'
import { sanitizeSearchQuery, sanitizeHashtag } from './sanitize'

describe('sanitize utilities', () => {
  describe('sanitizeSearchQuery', () => {
    it('keeps words that contain "script" and quotes', () => {
      expect(sanitizeSearchQuery('TypeScript')).toBe('TypeScript')
      expect(sanitizeSearchQuery('description')).toBe('description')
      expect(sanitizeSearchQuery("don't")).toBe("don't")
    })

    it('trims whitespace', () => {
      expect(sanitizeSearchQuery('  cafe  ')).toBe('cafe')
    })

    it('should limit length to 100 characters', () => {
      const longQuery = 'a'.repeat(150)
      expect(sanitizeSearchQuery(longQuery)).toHaveLength(100)
    })
  })

  describe('sanitizeHashtag', () => {
    it('should only allow alphanumeric, korean, and underscore', () => {
      expect(sanitizeHashtag('노마드_여행123')).toBe('노마드_여행123')
      expect(sanitizeHashtag('hello<script>')).toBe('helloscript')
    })

    it('should limit length to 50 characters', () => {
      const longTag = 'a'.repeat(100)
      expect(sanitizeHashtag(longTag)).toHaveLength(50)
    })

    it('should remove special characters', () => {
      expect(sanitizeHashtag('hello!@#$world')).toBe('helloworld')
    })
  })
})
