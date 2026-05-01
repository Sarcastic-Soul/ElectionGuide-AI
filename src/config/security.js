'use strict';

/**
 * @file config/security.js
 * @module config/security
 * @description Security policy configuration for HTTP response headers.
 *
 * This module defines the Content Security Policy (CSP) and other HTTP security headers
 * applied via Helmet.js middleware. The CSP follows a strict allowlist approach:
 *
 * **Principle**: Default-deny. Only explicitly trusted sources are allowed.
 *
 * Security layers provided:
 * 1. **CSP** — Prevents XSS, data injection, and unauthorized resource loading
 * 2. **HSTS** — Forces HTTPS with 1-year max-age and preload
 * 3. **Frame protection** — Prevents clickjacking via X-Frame-Options: DENY
 * 4. **MIME sniffing** — Prevented via X-Content-Type-Options: nosniff
 * 5. **Referrer control** — Strict origin-when-cross-origin policy
 * 6. **DNS prefetch** — Disabled to prevent DNS-based tracking
 *
 * @see {@link https://helmetjs.github.io/} Helmet.js documentation
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP} MDN CSP reference
 */

/**
 * Content Security Policy directives.
 *
 * Each directive explicitly lists allowed sources. The `connect-src` directive
 * includes Google Cloud API endpoints used by the application:
 * - generativelanguage.googleapis.com (Gemini AI)
 * - firestore.googleapis.com (Cloud Firestore)
 * - texttospeech.googleapis.com (Cloud TTS)
 * - translation.googleapis.com (Cloud Translation)
 *
 * @type {object}
 */
const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  fontSrc: ["'self'", 'https://fonts.gstatic.com'],
  imgSrc: ["'self'", 'data:', 'https:'],
  connectSrc: [
    "'self'",
    'https://generativelanguage.googleapis.com',
    'https://firestore.googleapis.com',
    'https://texttospeech.googleapis.com',
    'https://translation.googleapis.com',
  ],
  mediaSrc: ["'self'", 'blob:'],         // blob: needed for TTS audio playback
  objectSrc: ["'none'"],                  // Block Flash/Java plugins entirely
  frameAncestors: ["'none'"],             // Prevent embedding in iframes
  baseUri: ["'self'"],                    // Prevent base tag injection
  formAction: ["'self'"],                 // Forms can only submit to same origin
  upgradeInsecureRequests: [],            // Auto-upgrade HTTP to HTTPS
};

/**
 * Complete Helmet configuration applied to all responses.
 *
 * Each header serves a specific security purpose:
 * - crossOriginEmbedderPolicy: false — required for loading Google Fonts cross-origin
 * - crossOriginOpenerPolicy: same-origin — prevents cross-window attacks
 * - dnsPrefetchControl: disabled — prevents DNS-based user tracking
 * - hsts: 1 year with preload — enforces HTTPS permanently
 *
 * @type {object}
 */
const helmetConfig = {
  contentSecurityPolicy: {
    directives: cspDirectives,
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-site' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hsts: {
    maxAge: 31536000,       // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
};

module.exports = { helmetConfig, cspDirectives };
