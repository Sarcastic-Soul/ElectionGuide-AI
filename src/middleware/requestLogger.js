'use strict';

/**
 * @file middleware/requestLogger.js
 * @module middleware/requestLogger
 * @description Structured HTTP request logging compatible with Google Cloud Logging.
 *
 * Every HTTP request is logged as a JSON object with fields that Cloud Logging
 * automatically parses for filtering and alerting:
 *
 * - **severity** — Mapped from HTTP status code (2xx→INFO, 4xx→WARNING, 5xx→ERROR)
 * - **httpRequest** — Standard Cloud Logging `httpRequest` object with method, URL,
 *   status, latency, user agent, and remote IP
 * - **requestId** — UUID correlation ID (from `X-Request-Id` header or auto-generated)
 *   enabling end-to-end request tracing across service calls
 *
 * **Why JSON over text?** Cloud Logging can automatically parse structured JSON fields,
 * enabling powerful log queries like:
 * ```
 * httpRequest.status >= 500 AND httpRequest.latency > "1s"
 * ```
 *
 * **Performance**: Logging is done on the `res.finish` event (after response is sent),
 * so it never blocks the response pipeline.
 *
 * @see {@link https://cloud.google.com/logging/docs/structured-logging} Structured logging
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Request logging middleware.
 * Attaches a correlation ID to each request and logs on response finish.
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {Function} next - Express next
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || uuidv4();

  // Attach request ID for downstream use
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  // Log on response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logEntry = {
      severity: res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARNING' : 'INFO',
      message: `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`,
      httpRequest: {
        requestMethod: req.method,
        requestUrl: req.originalUrl,
        status: res.statusCode,
        latency: `${duration / 1000}s`,
        userAgent: req.get('user-agent') || 'unknown',
        remoteIp: req.ip,
      },
      requestId,
      timestamp: new Date().toISOString(),
    };

    // Use structured logging compatible with Cloud Logging
    if (res.statusCode >= 500) {
      console.error(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  });

  next();
};

module.exports = { requestLogger };
