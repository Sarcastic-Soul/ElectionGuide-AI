'use strict';

/**
 * @file config/index.js
 * @module config
 * @description Centralized application configuration — the single source of truth for all
 * runtime settings. Every configurable value is read from environment variables with
 * sensible defaults, ensuring the app works both locally and on Google Cloud Run.
 *
 * Design decisions:
 * - **Object.freeze()**: The exported config is deeply immutable. This prevents accidental
 *   runtime mutation of settings (e.g., a middleware accidentally changing the port).
 * - **Environment-first**: Cloud Run injects PORT and GOOGLE_CLOUD_PROJECT automatically.
 *   Developers only need to set GEMINI_API_KEY locally (see .env.example).
 * - **parseInt with fallback**: Ensures type safety — env vars are always strings,
 *   but our code needs numbers. The `|| default` pattern handles NaN from invalid values.
 *
 * Security notes:
 * - GEMINI_API_KEY is the only secret. It should NEVER be committed to version control.
 * - On Cloud Run, use `--set-env-vars` or Google Secret Manager for injection.
 *
 * @see {@link https://cloud.google.com/run/docs/configuring/environment-variables}
 */

const config = {
  /** @type {number} Server port — Cloud Run injects PORT env var automatically */
  port: parseInt(process.env.PORT, 10) || 8080,

  /** @type {string} Node environment — controls logging verbosity and error detail */
  nodeEnv: process.env.NODE_ENV || 'development',

  /** @type {boolean} Whether running in production — used to suppress stack traces */
  isProduction: process.env.NODE_ENV === 'production',

  /** @type {string} Gemini API key from Google AI Studio (https://aistudio.google.com) */
  geminiApiKey: process.env.GEMINI_API_KEY || '',

  /** @type {string} Gemini model — using 2.5 Flash for optimal speed/quality/cost ratio */
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',

  /** @type {string} Google Cloud project ID — Cloud Run also sets GOOGLE_CLOUD_PROJECT */
  projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.PROJECT_ID || 'promptwars-493516',

  /**
   * @type {object} Rate limiting configuration
   * @property {number} windowMs - Time window in milliseconds (15 minutes)
   * @property {number} maxGlobal - Max requests per window for all endpoints
   * @property {number} maxAI - Max requests per window for AI endpoints (Gemini, TTS, Translate)
   */
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxGlobal: parseInt(process.env.RATE_LIMIT_GLOBAL, 10) || 100,
    maxAI: parseInt(process.env.RATE_LIMIT_AI, 10) || 20,
  },

  /**
   * @type {object} Input validation limits — prevents abuse and controls API costs
   * @property {number} maxChatLength - Max characters for chat messages (2KB)
   * @property {number} maxTTSLength - Max characters for TTS synthesis (5KB)
   * @property {number} maxTranslateLength - Max characters for translation (5KB)
   */
  input: {
    maxChatLength: 2000,
    maxTTSLength: 5000,
    maxTranslateLength: 5000,
  },

  /**
   * @type {object} LRU cache configuration — reduces Google API calls and costs
   * @property {number} translationMaxSize - Max cached translations (1,000 entries)
   * @property {number} translationTTL - Translation cache TTL (1 hour)
   * @property {number} ttsMaxSize - Max cached TTS audio (100 entries)
   * @property {number} ttsTTL - TTS cache TTL (30 minutes)
   */
  cache: {
    translationMaxSize: 1000,
    translationTTL: 1000 * 60 * 60, // 1 hour
    ttsMaxSize: 100,
    ttsTTL: 1000 * 60 * 30, // 30 minutes
  },
};

// Freeze the config to prevent any runtime mutations — a security best practice
module.exports = Object.freeze(config);
