import { describe, it, expect } from 'vitest';
import { formatDate, truncateText, cn } from '../utils';

describe('utils.ts', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('p-4', 'bg-blue-500')).toBe('p-4 bg-blue-500');
      expect(cn('p-4', { 'bg-red-500': true, 'bg-blue-500': false })).toBe(
        'p-4 bg-red-500'
      );
    });
  });

  describe('formatDate', () => {
    it('should format dates for en-PH locale', () => {
      const date = new Date('2026-04-16');
      // Intl might format slightly differently depending on environment,
      // but we expect something like "April 16, 2026"
      const formatted = formatDate(date);
      expect(formatted).toContain('April');
      expect(formatted).toContain('16');
      expect(formatted).toContain('2026');
    });
  });

  describe('truncateText', () => {
    it('should truncate text longer than maxLength', () => {
      expect(truncateText('Hello World', 5)).toBe('Hello...');
    });

    it('should not truncate text shorter than or equal to maxLength', () => {
      expect(truncateText('Hello', 5)).toBe('Hello');
      expect(truncateText('Hello', 10)).toBe('Hello');
    });
  });
});
