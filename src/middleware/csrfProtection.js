'use strict';

/**
 * @file middleware/csrfProtection.js
 * @module middleware/csrfProtection
 * @description CSRF protection using the double-submit cookie pattern.
 *
 * **How it works:**
 * 1. On every response, the server sets a cryptographically random `_csrf` cookie.
 * 2. The client reads the cookie and sends it back as an `X-CSRF-Token` header on POST requests.
 * 3. The server compares the cookie value with the header value.
 * 4. An attacker on a different origin cannot read the cookie (same-origin policy),
 *    so they cannot forge the header — preventing cross-site request forgery.
 *
 * **Why double-submit cookie instead of csurf?**
 * - `csurf` is deprecated (npm audit flags it)
 * - Double-submit cookie requires no server-side session store
 * - Works perfectly with Cloud Run's stateless containers
 * - No additional infrastructure (Redis, Memorystore) needed
 *
 * **Why not csrf-csrf or lusca?**
 * - Zero additional dependencies — just `crypto.randomBytes`
 * - Simpler code = smaller attack surface
 *
 * @see {@link https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html}
 */

const crypto = require('crypto');

/**
 * Generates a cryptographically secure random CSRF token.
 * @returns {string} 32-byte hex token (64 characters)
 */
const generateToken = () => crypto.randomBytes(32).toString('hex');

/**
 * CSRF protection middleware.
 *
 * - On all responses: Sets a `_csrf` cookie with a fresh token.
 * - On state-changing methods (POST, PUT, PATCH, DELETE): Validates that the
 *   `X-CSRF-Token` header matches the `_csrf` cookie value.
 * - Safe methods (GET, HEAD, OPTIONS) are exempt — they should not mutate state.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const csrfProtection = (req, res, next) => {
  // Generate and set CSRF cookie on every response
  const token = generateToken();
  res.cookie('_csrf', token, {
    httpOnly: false,     // Must be readable by client JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',  // Only sent with same-origin requests
    path: '/',
    maxAge: 3600000,     // 1 hour
  });

  // Also expose token in response header for initial page loads
  res.setHeader('X-CSRF-Token', token);

  // Skip validation for safe (non-mutating) HTTP methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Validate CSRF token on state-changing requests
  const cookieToken = req.cookies && req.cookies._csrf;
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_VALIDATION_FAILED',
        message: 'Invalid or missing CSRF token. Please refresh the page and try again.',
      },
    });
  }

  next();
};

module.exports = { csrfProtection, generateToken };
