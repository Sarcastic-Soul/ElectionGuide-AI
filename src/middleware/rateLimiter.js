'use strict';

/**
 * @file middleware/rateLimiter.js
 * @module middleware/rateLimiter
 * @description Dual-tier rate limiting middleware — protects against API abuse and cost overrun.
 *
 * Two separate rate limiters are exported:
 *
 * 1. **globalLimiter** (100 req/15min) — Applied to ALL routes via app.use().
 *    Prevents basic DoS and scraping attacks.
 *
 * 2. **aiLimiter** (20 req/15min) — Applied only to AI endpoints (/api/chat, /api/quiz/generate,
 *    /api/tts, /api/translate). These endpoints call paid Google Cloud APIs (Gemini, TTS,
 *    Translation), so stricter limits prevent cost escalation from abuse.
 *
 * **Why two tiers?** Static endpoints (timeline, health) are cheap to serve. AI endpoints
 * invoke external APIs that have per-character pricing. Separate limits allow normal browsing
 * while protecting expensive operations.
 *
 * **⚠️ KNOWN LIMITATION**: This uses express-rate-limit's default in-memory store,
 * which is **per-process**. In Cloud Run with auto-scaling, each container instance
 * maintains its own counter. A user hitting N instances can make N × limit requests.
 *
 * **Mitigation strategies (not implemented here due to free-tier constraints):**
 * - Use `rate-limit-redis` with Cloud Memorystore for a shared counter
 * - Deploy Google Cloud Armor WAF rules for IP-based rate limiting at the edge
 * - Set Cloud Run `--max-instances=1` to force single-instance (sacrifices availability)
 *
 * For this application, single-container rate limiting is acceptable because:
 * - Cloud Run defaults to 1 instance for low-traffic apps
 * - The AI rate limiter (20 req/15min) still provides cost protection per-instance
 * - Google Cloud APIs have their own built-in quota limits as a secondary defense
 *
 * **Key configuration**:
 * - `standardHeaders: true` — Returns RFC-compliant `RateLimit-*` headers
 * - `legacyHeaders: false` — Disables deprecated `X-RateLimit-*` headers
 * - Custom `keyGenerator` — Uses `req.ip` (trust proxy must be enabled for Cloud Run)
 *
 * @see {@link https://www.npmjs.com/package/express-rate-limit} express-rate-limit
 * @see {@link https://cloud.google.com/armor/docs/rate-limiting-overview} Cloud Armor rate limiting
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').RedisStore;
const config = require('../config');
const redisService = require('../services/redisService');

// Function to generate the store dynamically based on Redis availability
const getStore = (prefix) => {
  const client = redisService.getClient();
  if (client) {
    return new RedisStore({
      sendCommand: (...args) => client.sendCommand(args),
      prefix: prefix,
    });
  }
  // Fallback to memory store
  return undefined; // express-rate-limit uses MemoryStore by default when store is undefined
};

/**
 * Global rate limiter — applies to all routes.
 * 100 requests per 15-minute window per IP.
 */
const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxGlobal,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore('rl:global:'),
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
    },
  },
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || 'unknown';
  },
});

/**
 * AI endpoint rate limiter — stricter limits for Gemini/TTS/Translate calls.
 * 20 requests per 15-minute window per IP.
 */
const aiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxAI,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore('rl:ai:'),
  message: {
    success: false,
    error: {
      code: 'AI_RATE_LIMIT_EXCEEDED',
      message: 'Too many AI requests. Please wait before trying again.',
    },
  },
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || 'unknown';
  },
});

module.exports = { globalLimiter, aiLimiter };
