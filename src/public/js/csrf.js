/**
 * @module csrf
 * @description CSRF token utility — reads the double-submit cookie for fetch headers.
 *
 * The server sets a `_csrf` cookie on every response. For POST requests,
 * the client must send this value back in the `X-CSRF-Token` header.
 * The server compares the two — if they match, the request is legitimate.
 *
 * This module provides a helper to extract the cookie value and build
 * fetch headers with the CSRF token included.
 */
'use strict';

const CSRF = (() => {
  /**
   * Reads the _csrf cookie value.
   * @returns {string} CSRF token value, or empty string if not found
   */
  const getToken = () => {
    const match = document.cookie.match(/(?:^|;\s*)_csrf=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : '';
  };

  /**
   * Returns standard headers for JSON POST requests with CSRF token.
   * @returns {object} Headers object for fetch()
   */
  const headers = () => ({
    'Content-Type': 'application/json',
    'X-CSRF-Token': getToken(),
  });

  return { getToken, headers };
})();
