'use strict';

const { sanitizeString, sanitizeObject } = require('../../../src/middleware/inputSanitizer');

describe('Input Sanitizer', () => {
  describe('sanitizeString', () => {
    it('should strip script tags', () => {
      expect(sanitizeString('<script>alert("xss")</script>Hello')).toBe('Hello');
    });

    it('should strip HTML tags', () => {
      expect(sanitizeString('<div><b>bold</b></div>')).toBe('bold');
    });

    it('should handle plain text unchanged', () => {
      expect(sanitizeString('Hello world')).toBe('Hello world');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('should handle non-string input', () => {
      expect(sanitizeString(123)).toBe(123);
      expect(sanitizeString(null)).toBe(null);
      expect(sanitizeString(undefined)).toBe(undefined);
    });

    it('should strip event handler attributes', () => {
      expect(sanitizeString('<img onerror="alert(1)" src="x">')).toBe('');
    });

    it('should handle empty string', () => {
      expect(sanitizeString('')).toBe('');
    });

    it('should preserve unicode and emojis', () => {
      expect(sanitizeString('Hello 🗳️ World')).toBe('Hello 🗳️ World');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize nested objects', () => {
      const result = sanitizeObject({
        name: '<script>x</script>John',
        nested: { value: '<b>bold</b>' },
      });
      expect(result.name).toBe('John');
      expect(result.nested.value).toBe('bold');
    });

    it('should sanitize arrays', () => {
      const result = sanitizeObject(['<script>x</script>safe', '<b>bold</b>']);
      expect(result).toEqual(['safe', 'bold']);
    });

    it('should handle non-object values', () => {
      expect(sanitizeObject(42)).toBe(42);
      expect(sanitizeObject(true)).toBe(true);
    });
  });
});
