import { describe, it, expect } from 'vitest'
import { cn, formatDate, truncateText, getRandomNumber } from './utils'

describe('utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white')
    })

    it('handles conditional classes', () => {
      expect(cn('base', { active: true, disabled: false })).toBe('base active')
    })

    it('overrides conflicting Tailwind classes', () => {
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
      expect(cn('p-2', 'p-4')).toBe('p-4')
    })

    it('handles arrays of class names', () => {
      expect(cn(['bg-red-500', 'text-white'])).toBe('bg-red-500 text-white')
    })

    it('filters out undefined and null values', () => {
      expect(cn('base', undefined, null, 'end')).toBe('base end')
    })
  })

  describe('formatDate', () => {
    it('formats date in Philippine locale', () => {
      const date = new Date('2025-01-15')
      const formatted = formatDate(date)
      expect(formatted).toBe('January 15, 2025')
    })

    it('handles different months correctly', () => {
      const date = new Date('2025-12-25')
      const formatted = formatDate(date)
      expect(formatted).toBe('December 25, 2025')
    })
  })

  describe('truncateText', () => {
    it('returns original text if within max length', () => {
      const text = 'Short text'
      expect(truncateText(text, 20)).toBe('Short text')
    })

    it('truncates text longer than max length', () => {
      const text = 'This is a very long text that needs truncation'
      expect(truncateText(text, 10)).toBe('This is a ...')
    })

    it('handles exact length match', () => {
      const text = 'Exact'
      expect(truncateText(text, 5)).toBe('Exact')
    })

    it('handles empty string', () => {
      expect(truncateText('', 10)).toBe('')
    })
  })

  describe('getRandomNumber', () => {
    it('returns number within range', () => {
      for (let i = 0; i < 100; i++) {
        const result = getRandomNumber(1, 10)
        expect(result).toBeGreaterThanOrEqual(1)
        expect(result).toBeLessThanOrEqual(10)
      }
    })

    it('handles single value range', () => {
      const result = getRandomNumber(5, 5)
      expect(result).toBe(5)
    })

    it('handles negative numbers', () => {
      for (let i = 0; i < 50; i++) {
        const result = getRandomNumber(-10, -1)
        expect(result).toBeGreaterThanOrEqual(-10)
        expect(result).toBeLessThanOrEqual(-1)
      }
    })

    it('returns integer values', () => {
      for (let i = 0; i < 50; i++) {
        const result = getRandomNumber(0, 100)
        expect(Number.isInteger(result)).toBe(true)
      }
    })
  })
})