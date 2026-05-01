'use strict';

/**
 * @file middleware/inputSanitizer.js
 * @module middleware/inputSanitizer
 * @description Server-side XSS prevention via DOMPurify + jsdom.
 *
 * This middleware is the **third layer** of our defense-in-depth security model.
 * It runs DOMPurify (the industry-standard XSS sanitization library) on the server side
 * using jsdom as the DOM implementation.
 *
 * **Why server-side DOMPurify?**
 * - Client-side sanitization can be bypassed by directly calling the API
 * - Server-side sanitization is the only reliable XSS prevention layer
 * - DOMPurify is more robust than regex-based sanitization (handles edge cases like
 *   nested tags, encoded characters, SVG-based XSS, etc.)
 *
 * **What gets sanitized:**
 * - `req.body` — All POST/PUT/PATCH request bodies
 * - `req.query` — URL query parameters
 * - `req.params` — URL path parameters
 *
 * **Configuration**: `ALLOWED_TAGS: []` and `ALLOWED_ATTR: []` strip ALL HTML.
 * This is intentional — our API accepts plain text only, never HTML. The AI model
 * generates markdown, which the client renders safely.
 *
 * @see {@link https://github.com/cure53/DOMPurify} DOMPurify documentation
 */

const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const config = require('../config');

// Initialize DOMPurify with jsdom window
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Sanitizes a single string value by stripping all HTML/script tags.
 * @param {string} input - Raw input string
 * @returns {string} Sanitized string
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim();
};

/**
 * Recursively sanitizes all string values in an object.
 * @param {object} obj - Object to sanitize
 * @returns {object} Sanitized object
 */
const sanitizeObject = (obj) => {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  return obj;
};

/**
 * Express middleware that sanitizes req.body, req.query, and req.params.
 * Also enforces maximum input length on body string fields.
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {Function} next - Express next
 */
const inputSanitizer = (req, res, next) => {
  try {
    if (req.body) {
      req.body = sanitizeObject(req.body);

      // Enforce max length on common text fields
      const textFields = ['message', 'text', 'query', 'content'];
      for (const field of textFields) {
        if (typeof req.body[field] === 'string' && req.body[field].length > config.input.maxChatLength) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INPUT_TOO_LONG',
              message: `Field "${field}" exceeds maximum length of ${config.input.maxChatLength} characters.`,
            },
          });
        }
      }
    }

    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    if (req.params) {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { inputSanitizer, sanitizeString, sanitizeObject };
