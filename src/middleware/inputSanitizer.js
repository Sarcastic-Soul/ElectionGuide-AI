'use strict';

/**
 * @file middleware/inputSanitizer.js
 * @module middleware/inputSanitizer
 * @description Server-side XSS prevention via sanitize-html.
 *
 * Previous implementation used jsdom + DOMPurify (~40MB runtime overhead).
 * This was replaced with sanitize-html — a purpose-built, lightweight library
 * that does the same zero-tag stripping without loading a full DOM engine.
 *
 * **Why sanitize-html over jsdom+DOMPurify?**
 * - ~95% smaller footprint (2MB vs 40MB+)
 * - Purpose-built for server-side HTML sanitization
 * - No DOM simulation overhead — faster per-request
 * - Same security guarantees (strips all tags/attributes)
 *
 * **What gets sanitized:**
 * - `req.body` — All POST/PUT/PATCH request bodies
 * - `req.query` — URL query parameters
 * - `req.params` — URL path parameters
 *
 * **Configuration**: `allowedTags: []` and `allowedAttributes: {}` strip ALL HTML.
 * This is intentional — our API accepts plain text only, never HTML.
 *
 * @see {@link https://www.npmjs.com/package/sanitize-html} sanitize-html
 */

const sanitizeHtml = require('sanitize-html');
const config = require('../config');

/**
 * Sanitize-html configuration — strip ALL tags and attributes.
 * @type {object}
 */
const sanitizeOptions = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
};

/**
 * Sanitizes a single string value by stripping all HTML/script tags.
 * @param {string} input - Raw input string
 * @returns {string} Sanitized string with all HTML removed
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  return sanitizeHtml(input, sanitizeOptions).trim();
};

/**
 * Recursively sanitizes all string values in an object or array.
 * Handles nested objects, arrays, and mixed types safely.
 * @param {*} obj - Value to sanitize (string, object, array, or primitive)
 * @returns {*} Sanitized value with same structure
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
 * Also enforces maximum input length on body string fields to prevent
 * abuse of downstream AI APIs (Gemini, TTS, Translation).
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next
 */
const inputSanitizer = (req, res, next) => {
  try {
    if (req.body) {
      req.body = sanitizeObject(req.body);

      // Enforce max length on common text fields to prevent API cost abuse
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
