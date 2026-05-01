'use strict';

/**
 * @file tests/unit/config/config.test.js
 * @description Tests for the centralized configuration module.
 * Verifies environment variable parsing, defaults, and immutability.
 */

describe('Config Module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Clear module cache to re-evaluate config with new env vars
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should export a frozen object (immutable)', () => {
    const config = require('../../../src/config');
    expect(Object.isFrozen(config)).toBe(true);
  });

  it('should provide sensible defaults when no env vars are set', () => {
    delete process.env.PORT;
    delete process.env.NODE_ENV;
    delete process.env.GEMINI_API_KEY;
    const config = require('../../../src/config');

    expect(config.port).toBe(8080);
    expect(config.nodeEnv).toBe('development');
    expect(config.isProduction).toBe(false);
    expect(config.geminiModel).toBe('gemini-2.5-flash');
  });

  it('should parse PORT as integer', () => {
    process.env.PORT = '3000';
    const config = require('../../../src/config');
    expect(config.port).toBe(3000);
    expect(typeof config.port).toBe('number');
  });

  it('should detect production mode', () => {
    process.env.NODE_ENV = 'production';
    const config = require('../../../src/config');
    expect(config.isProduction).toBe(true);
  });

  it('should have rate limit configuration', () => {
    const config = require('../../../src/config');
    expect(config.rateLimit.windowMs).toBe(900000); // 15 minutes
    expect(config.rateLimit.maxGlobal).toBe(100);
    expect(config.rateLimit.maxAI).toBe(20);
  });

  it('should have input validation limits', () => {
    const config = require('../../../src/config');
    expect(config.input.maxChatLength).toBe(2000);
    expect(config.input.maxTTSLength).toBe(5000);
    expect(config.input.maxTranslateLength).toBe(5000);
  });

  it('should have cache configuration', () => {
    const config = require('../../../src/config');
    expect(config.cache.translationMaxSize).toBe(1000);
    expect(config.cache.ttsMaxSize).toBe(100);
    expect(config.cache.translationTTL).toBeGreaterThan(0);
    expect(config.cache.ttsTTL).toBeGreaterThan(0);
  });

  it('should prevent mutation of config properties', () => {
    const config = require('../../../src/config');
    expect(() => { config.port = 9999; }).toThrow();
  });
});
