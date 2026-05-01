'use strict';

/**
 * @file app.js
 * @module app
 * @description Express application factory — the core of the server architecture.
 *
 * This module exports a `createApp()` factory function instead of a singleton app instance.
 * This is a deliberate design decision for **testability**:
 *
 * ```js
 * // In tests — each test gets a fresh, isolated app instance:
 * const app = createApp();
 * const res = await request(app).get('/health');
 * ```
 *
 * **Middleware Pipeline** (order matters):
 * 1. **Trust Proxy** — Cloud Run's load balancer terminates TLS; we trust X-Forwarded-For
 * 2. **Helmet** — Sets 12+ security headers including strict CSP
 * 3. **Compression** — Gzip/Brotli for response bodies (reduces bandwidth ~70%)
 * 4. **Request Logger** — Structured JSON logs with correlation IDs for Cloud Logging
 * 5. **Body Parser** — JSON and URL-encoded with 1MB limit (prevents payload abuse)
 * 6. **Rate Limiter** — 100 req/15min global limit per IP
 * 7. **Input Sanitizer** — DOMPurify strips all HTML/XSS from inputs
 * 8. **Static Files** — Serves frontend with 1-day cache headers
 * 9. **API Routes** — Mounted at /api with sub-routers
 * 10. **SPA Fallback** — Non-API routes serve index.html (client-side routing)
 * 11. **Error Handlers** — 404 + global error boundary (no stack leaks in production)
 *
 * @see {@link https://expressjs.com/en/guide/using-middleware.html}
 */

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');

const { helmetConfig } = require('./config/security');
const { globalLimiter } = require('./middleware/rateLimiter');
const { inputSanitizer } = require('./middleware/inputSanitizer');
const { csrfProtection } = require('./middleware/csrfProtection');
const { requestLogger } = require('./middleware/requestLogger');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');

/**
 * Creates and configures a new Express application instance.
 *
 * Each call returns a completely fresh app — no shared state between calls.
 * This is critical for test isolation (each test suite gets its own middleware stack).
 *
 * @returns {import('express').Application} Fully configured Express application
 */
const createApp = () => {
  const app = express();

  // ─── Trust proxy (Cloud Run places services behind Google's HTTPS load balancer) ───
  // Without this, req.ip would always be the load balancer's IP, not the client's.
  app.set('trust proxy', true);

  // ─── Security Headers (Layer 1 of defense-in-depth) ───
  app.use(helmet(helmetConfig));

  // ─── Response Compression (gzip/brotli — ~70% bandwidth reduction) ───
  app.use(compression());

  // ─── Structured Request Logging (Cloud Logging compatible) ───
  app.use(requestLogger);

  // ─── Body Parsing (1MB limit prevents large payload attacks) ───
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  // ─── Cookie Parser (required for CSRF double-submit cookie pattern) ───
  app.use(cookieParser());

  // ─── Global Rate Limiting (Layer 2 — 100 requests per 15 minutes per IP) ───
  app.use(globalLimiter);

  // ─── Input Sanitization (Layer 3 — sanitize-html strips all HTML/XSS payloads) ───
  app.use(inputSanitizer);

  // ─── CSRF Protection (Layer 4 — double-submit cookie pattern) ───
  app.use(csrfProtection);

  // ─── Health Check (before API routes — used by Cloud Run for readiness probes) ───
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
    });
  });

  // ─── Static Files (frontend assets with 1-day browser caching) ───
  app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    etag: true,
    lastModified: true,
  }));

  // ─── API Routes (all mounted under /api prefix) ───
  app.use('/api', routes);

  // ─── SPA Fallback (non-API routes serve index.html for client-side routing) ───
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  // ─── Error Handling (Layer 5 — catches all unhandled errors) ───
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
};

module.exports = { createApp };
