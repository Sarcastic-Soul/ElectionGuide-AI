/**
 * @file jest.config.js
 * @description Jest test framework configuration for ElectionGuide AI.
 *
 * Key design decisions:
 * - Default testEnvironment: 'node' — backend tests run in Node.js
 * - Frontend tests use `@jest-environment jsdom` docblock overrides to run in jsdom
 * - Coverage thresholds enforce minimum quality gates to prevent regressions
 * - Server entry point (server.js) excluded from coverage (only starts HTTP listener)
 * - `projects` config separates backend (node) and frontend (jsdom) test environments
 *
 * @see https://jestjs.io/docs/configuration
 */

/** @type {import('jest').Config} */
module.exports = {
  // Default environment — backend tests
  testEnvironment: 'node',

  // Test file discovery
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],

  // Coverage configuration — includes both backend and frontend
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',     // Entry point — only starts listener, not unit-testable
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov'],

  // Minimum coverage thresholds — enforced in CI/CD
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },

  // Detailed test output
  verbose: true,

  // Timeout per test (10s — generous for async Google API mocks)
  testTimeout: 10000,

  // Global setup files
  setupFiles: ['<rootDir>/tests/setup.js'],
};
