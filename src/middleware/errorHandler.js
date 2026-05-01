'use strict';

/**
 * @file middleware/errorHandler.js
 * @module middleware/errorHandler
 * @description Centralized error handling for the entire Express application.
 *
 * This module provides four exports that work together to create a robust error boundary:
 *
 * 1. **AppError** — Custom error class with HTTP status codes and machine-readable codes.
 *    Allows routes to throw semantically meaningful errors (e.g., `throw new AppError('Not found', 404, 'NOT_FOUND')`)
 *    that are automatically formatted into consistent JSON responses.
 *
 * 2. **asyncHandler** — Wraps async route handlers to automatically catch promise rejections.
 *    Without this, unhandled rejections in async handlers would crash the process.
 *    This eliminates the need for try/catch blocks in every route handler.
 *
 * 3. **notFoundHandler** — Express middleware that catches requests that didn't match any route.
 *    Returns a structured 404 JSON response instead of Express's default HTML error page.
 *
 * 4. **globalErrorHandler** — Express error middleware (4 arguments) that formats all errors
 *    into consistent JSON. In production, 500-level errors have their messages replaced with
 *    a generic message to prevent information leakage (stack traces, internal paths, etc.).
 *
 * Security considerations:
 * - Stack traces are NEVER exposed in production responses
 * - Internal error details (DB connection strings, file paths) are suppressed in production
 * - All errors are logged in structured JSON format for Cloud Logging ingestion
 * - The `isOperational` flag distinguishes expected errors from unexpected crashes
 */

const config = require('../config');

/**
 * Custom application error class with HTTP status codes.
 */
class AppError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} [code] - Machine-readable error code
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async route handler wrapper that catches errors and forwards them.
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 404 Not Found handler.
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {Function} next - Express next function
 */
const notFoundHandler = (req, res, _next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
};

/**
 * Global error handling middleware.
 * @param {Error} err - Error object
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {Function} _next - Express next function
 */
const globalErrorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  // Log error details (full stack in development only)
  const logEntry = {
    severity: statusCode >= 500 ? 'ERROR' : 'WARNING',
    message: err.message,
    code,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    timestamp: new Date().toISOString(),
  };

  if (!config.isProduction) {
    logEntry.stack = err.stack;
  }

  console.error(JSON.stringify(logEntry));

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: config.isProduction && statusCode >= 500
        ? 'An internal error occurred. Please try again later.'
        : err.message,
    },
  });
};

module.exports = { AppError, asyncHandler, notFoundHandler, globalErrorHandler };
