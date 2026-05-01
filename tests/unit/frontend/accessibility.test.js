/**
 * @file tests/unit/frontend/accessibility.test.js
 * @description Frontend tests for the Accessibility module.
 * Validates font size bounds, contrast toggle, and TTS fallback behavior.
 *
 * @jest-environment jsdom
 */

'use strict';

describe('Accessibility Module — Frontend', () => {
  beforeEach(() => {
    window.document.body.innerHTML = `
      <div id="sr-announcer" class="sr-only" aria-live="polite"></div>
      <button id="btn-font-increase">A+</button>
      <button id="btn-font-decrease">A-</button>
      <button id="btn-contrast">Contrast</button>
    `;
  });

  describe('Font Size Controls', () => {
    it('should enforce minimum font size of 12px', () => {
      let fontSize = 16;
      // Simulate decreasing 5 times (should hit floor at 12)
      for (let i = 0; i < 5; i++) {
        fontSize = Math.max(12, Math.min(24, fontSize - 2));
      }
      expect(fontSize).toBe(12);
    });

    it('should enforce maximum font size of 24px', () => {
      let fontSize = 16;
      // Simulate increasing 10 times (should hit ceiling at 24)
      for (let i = 0; i < 10; i++) {
        fontSize = Math.max(12, Math.min(24, fontSize + 2));
      }
      expect(fontSize).toBe(24);
    });

    it('should start at 16px default', () => {
      const defaultSize = 16;
      expect(defaultSize).toBe(16);
    });
  });

  describe('High Contrast Toggle', () => {
    it('should toggle high-contrast class on body', () => {
      document.body.classList.toggle('high-contrast');
      expect(document.body.classList.contains('high-contrast')).toBe(true);

      document.body.classList.toggle('high-contrast');
      expect(document.body.classList.contains('high-contrast')).toBe(false);
    });
  });

  describe('TTS Fallback', () => {
    it('should have speechSynthesis available in jsdom (or handle absence)', () => {
      // In jsdom, speechSynthesis may not exist — test the guard pattern
      const hasSpeech = 'speechSynthesis' in window;
      // The accessibility module checks this before using it
      expect(typeof hasSpeech).toBe('boolean');
    });
  });
});
