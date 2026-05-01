/**
 * @file jest.config.js
 * @description Jest test framework configuration for ElectionGuide AI.
 *
 * Key design decisions:
 * - testEnvironment: 'node' — We are testing a Node.js/Express backend, not a browser app.
 * - Coverage thresholds enforce minimum quality gates to prevent regressions.
 * - Server entry point (server.js) is excluded from coverage since it only starts the HTTP listener.
 * - Public frontend files are excluded since they run in the browser and are not testable via Jest.
 *
 * @see https://jestjs.io/docs/configuration
 */

/** @type {import('jest').Config} */
module.exports = {
  // Use Node.js environment (not jsdom) since we're testing backend code
  testEnvironment: 'node',

  // Test file discovery
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',     // Entry point — only starts listener, not unit-testable
    '!src/public/**',     // Frontend JS — runs in browser, not Node
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov'],

  // Minimum coverage thresholds — enforced in CI/CD
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 90,
      statements: 90,
    },
  },

  // Detailed test output
  verbose: true,

  // Timeout per test (10s — generous for async Google API mocks)
  testTimeout: 10000,
};
