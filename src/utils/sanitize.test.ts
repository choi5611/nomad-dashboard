import { describe, it, expect } from 'vitest'
import {
  sanitizeText,
  sanitizeSearchQuery,
  sanitizeHashtag,
  sanitizeUsername,
  isValidUrl,
  sanitizePostContent,
} from './sanitize'

describe('sanitize utilities', () => {
  describe('sanitizeText', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeText('<script>alert("xss")</script>Hello')).toBe('Hello')
      expect(sanitizeText('<b>Bold</b> text')).toBe('Bold text')
    })

    it('should handle empty string', () => {
      expect(sanitizeText('')).toBe('')
    })

    it('should decode HTML entities', () => {
      expect(sanitizeText('&lt;div&gt;')).toBe('<div>')
      expect(sanitizeText('&amp;')).toBe('&')
    })
  })

  describe('sanitizeSearchQuery', () => {
    it('should remove dangerous characters', () => {
      expect(sanitizeSearchQuery('<script>')).toBe('')
      expect(sanitizeSearchQuery('hello"world')).toBe('helloworld')
    })

    it('should remove script keywords', () => {
      expect(sanitizeSearchQuery('javascript:alert(1)')).toBe('alert(1)')
      expect(sanitizeSearchQuery('SCRIPT')).toBe('')
    })

    it('should limit length to 100 characters', () => {
      const longQuery = 'a'.repeat(150)
      expect(sanitizeSearchQuery(longQuery)).toHaveLength(100)
    })

    it('should remove event handlers', () => {
      expect(sanitizeSearchQuery('onClick=alert(1)')).toBe('alert(1)')
      expect(sanitizeSearchQuery('onLoad=badCode')).toBe('badCode')
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

  describe('sanitizeUsername', () => {
    it('should allow alphanumeric, korean, underscore, hyphen, and spaces', () => {
      expect(sanitizeUsername('사용자_이름-123')).toBe('사용자_이름-123')
      expect(sanitizeUsername('User Name')).toBe('User Name')
    })

    it('should limit length to 30 characters', () => {
      const longName = 'a'.repeat(50)
      expect(sanitizeUsername(longName)).toHaveLength(30)
    })

    it('should remove special characters', () => {
      expect(sanitizeUsername('user<>@name')).toBe('username')
    })
  })

  describe('isValidUrl', () => {
    it('should accept valid HTTP/HTTPS URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('http://example.com')).toBe(true)
    })

    it('should reject invalid protocols', () => {
      expect(isValidUrl('javascript:alert(1)')).toBe(false)
      expect(isValidUrl('ftp://example.com')).toBe(false)
      expect(isValidUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
    })

    it('should handle invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false)
      expect(isValidUrl('')).toBe(false)
    })
  })

  describe('sanitizePostContent', () => {
    it('should remove script tags', () => {
      expect(sanitizePostContent('Hello <script>alert(1)</script> World')).toBe('Hello  World')
    })

    it('should remove iframe tags', () => {
      expect(sanitizePostContent('Test <iframe src="bad"></iframe> content')).toBe('Test  content')
    })

    it('should remove javascript: protocol', () => {
      expect(sanitizePostContent('Click <a href="javascript:alert(1)">here</a>')).toBe('Click <a href="alert(1)">here</a>')
    })

    it('should remove event handlers', () => {
      expect(sanitizePostContent('<div onClick="alert(1)">Click</div>')).toBe('<div >Click</div>')
    })

    it('should limit length to 5000 characters', () => {
      const longContent = 'a'.repeat(6000)
      expect(sanitizePostContent(longContent)).toHaveLength(5000)
    })
  })
})
