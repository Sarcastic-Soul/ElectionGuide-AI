'use strict';

/**
 * @module utils/helpers
 * @description Shared utility functions used across the application.
 */

const { validationResult } = require('express-validator');

/**
 * Processes express-validator results and returns formatted errors.
 * @param {object} req - Express request object
 * @returns {object|null} Error response object or null if valid
 */
const getValidationErrors = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: errors.array().map((err) => ({
          field: err.path,
          message: err.msg,
        })),
      },
    };
  }
  return null;
};

/**
 * Formats a successful API response.
 * @param {*} data - Response data
 * @param {string} [message] - Optional success message
 * @returns {object} Formatted response
 */
const successResponse = (data, message = 'Success') => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString(),
});

/**
 * Creates a delay (used for retry logic).
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retries an async function with exponential backoff.
 * @param {Function} fn - Async function to retry
 * @param {number} [maxRetries=3] - Maximum number of retries
 * @param {number} [baseDelay=1000] - Base delay in milliseconds
 * @returns {Promise<*>} Result of the function
 */
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const waitTime = baseDelay * Math.pow(2, attempt);
        await delay(waitTime);
      }
    }
  }
  throw lastError;
};

/**
 * Truncates text to a maximum length with ellipsis.
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
};

module.exports = {
  getValidationErrors,
  successResponse,
  delay,
  retryWithBackoff,
  truncateText,
};
