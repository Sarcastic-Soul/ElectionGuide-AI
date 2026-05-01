'use strict';

/**
 * @file tests/unit/utils/constants.test.js
 * @description Tests for the constants module — verifies timeline data integrity,
 * system prompt quality, and supported languages.
 */

const {
  ELECTION_SYSTEM_PROMPT,
  QUIZ_SYSTEM_PROMPT,
  ELECTION_TIMELINE,
  SUPPORTED_LANGUAGES,
} = require('../../../src/utils/constants');

describe('Constants', () => {
  describe('ELECTION_SYSTEM_PROMPT', () => {
    it('should be a non-empty string', () => {
      expect(typeof ELECTION_SYSTEM_PROMPT).toBe('string');
      expect(ELECTION_SYSTEM_PROMPT.length).toBeGreaterThan(100);
    });

    it('should mention non-partisan or unbiased approach', () => {
      const lower = ELECTION_SYSTEM_PROMPT.toLowerCase();
      const hasNonPartisan = lower.includes('non-partisan') || lower.includes('nonpartisan') || lower.includes('unbiased') || lower.includes('neutral');
      expect(hasNonPartisan).toBe(true);
    });
  });

  describe('QUIZ_SYSTEM_PROMPT', () => {
    it('should be a non-empty string', () => {
      expect(typeof QUIZ_SYSTEM_PROMPT).toBe('string');
      expect(QUIZ_SYSTEM_PROMPT.length).toBeGreaterThan(50);
    });

    it('should reference JSON format', () => {
      expect(QUIZ_SYSTEM_PROMPT.toLowerCase()).toContain('json');
    });
  });

  describe('ELECTION_TIMELINE', () => {
    it('should have exactly 8 steps', () => {
      expect(ELECTION_TIMELINE).toHaveLength(8);
    });

    it('should have sequential IDs from 1 to 8', () => {
      const ids = ELECTION_TIMELINE.map((s) => s.id);
      expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it('should have required properties on every step', () => {
      ELECTION_TIMELINE.forEach((step) => {
        expect(step).toHaveProperty('id');
        expect(step).toHaveProperty('step');
        expect(step).toHaveProperty('icon');
        expect(step).toHaveProperty('timeframe');
        expect(step).toHaveProperty('summary');
        expect(step).toHaveProperty('details');
        expect(step).toHaveProperty('keyFacts');
      });
    });

    it('should have keyFacts as arrays with at least 2 items', () => {
      ELECTION_TIMELINE.forEach((step) => {
        expect(Array.isArray(step.keyFacts)).toBe(true);
        expect(step.keyFacts.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should start with Voter Registration and end with Inauguration', () => {
      expect(ELECTION_TIMELINE[0].step).toBe('Voter Registration');
      expect(ELECTION_TIMELINE[7].step).toBe('Inauguration');
    });
  });

  describe('SUPPORTED_LANGUAGES', () => {
    it('should be an array with 12+ languages', () => {
      expect(Array.isArray(SUPPORTED_LANGUAGES)).toBe(true);
      expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(12);
    });

    it('should include English', () => {
      const english = SUPPORTED_LANGUAGES.find((l) => l.code === 'en');
      expect(english).toBeDefined();
      expect(english.name).toBe('English');
    });

    it('should have code and name on every language', () => {
      SUPPORTED_LANGUAGES.forEach((lang) => {
        expect(lang).toHaveProperty('code');
        expect(lang).toHaveProperty('name');
        expect(typeof lang.code).toBe('string');
        expect(typeof lang.name).toBe('string');
      });
    });
  });
});
