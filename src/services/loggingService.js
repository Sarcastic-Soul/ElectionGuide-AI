'use strict';

/**
 * @file services/loggingService.js
 * @module services/loggingService
 * @description Google Cloud Logging integration for structured production observability.
 *
 * This service provides a unified logging interface that:
 * - In **production**: Writes structured log entries to Google Cloud Logging via the official SDK.
 *   Logs appear in the Google Cloud Console → Logging → Logs Explorer with full severity filtering.
 * - In **development**: Falls back to console.log/error with JSON formatting, maintaining the
 *   same structured format for consistency.
 *
 * **Severity Levels** (maps to Cloud Logging's severity enum):
 * - `info` → INFO: Normal operational events (request processed, quiz generated)
 * - `warn` → WARNING: Recoverable issues (Firestore unavailable, cache miss)
 * - `error` → ERROR: Failures requiring attention (API call failed, validation error)
 * - `critical` → CRITICAL: System-level failures (unhandled rejection, OOM)
 *
 * **Request Correlation**: Each log entry can include a `requestId` for tracing a single
 * request across multiple service calls (e.g., chat → Gemini → Firestore → response).
 *
 * **Fallback Safety**: If Cloud Logging itself fails (SDK error, network issue), the error
 * is caught and written to stderr via console.error. This ensures logging failures never
 * crash the application — a critical reliability pattern.
 *
 * @see {@link https://cloud.google.com/logging/docs} Cloud Logging documentation
 * @see {@link https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#LogSeverity} Severity levels
 */

const { Logging } = require('@google-cloud/logging');
const config = require('../config');

/** @type {Logging|null} Singleton Logging client */
let loggingClient = null;
let log = null;

/**
 * Initializes or returns the Cloud Logging client singleton.
 * @returns {object} Log writer instance
 */
const getLogger = () => {
  if (!loggingClient) {
    loggingClient = new Logging({ projectId: config.projectId });
    log = loggingClient.log('electionguide-ai');
  }
  return log;
};

/**
 * Resets the logging client singleton (used for testing).
 */
const resetLogger = () => {
  loggingClient = null;
  log = null;
};

/**
 * Writes a structured log entry to Cloud Logging.
 * @param {string} severity - Log severity (INFO, WARNING, ERROR, CRITICAL)
 * @param {string} message - Log message
 * @param {object} [metadata] - Additional structured metadata
 * @param {string} [requestId] - Request correlation ID
 */
const writeLog = async (severity, message, metadata = {}, requestId = null) => {
  try {
    // In development, just use console
    if (!config.isProduction) {
      const logFn = severity === 'ERROR' || severity === 'CRITICAL' ? console.error : console.log;
      logFn(JSON.stringify({ severity, message, ...metadata, requestId, timestamp: new Date().toISOString() }));
      return;
    }

    const logger = getLogger();
    const entry = logger.entry(
      {
        severity,
        labels: {
          application: 'electionguide-ai',
          environment: config.nodeEnv,
        },
      },
      {
        message,
        ...metadata,
        requestId,
        timestamp: new Date().toISOString(),
      }
    );

    await logger.write(entry);
  } catch (error) {
    // Fallback to console if Cloud Logging fails
    console.error(JSON.stringify({
      severity: 'ERROR',
      message: 'Failed to write to Cloud Logging',
      originalMessage: message,
      error: error.message,
    }));
  }
};

/**
 * Convenience methods for different severity levels.
 */
const info = (message, metadata, requestId) => writeLog('INFO', message, metadata, requestId);
const warn = (message, metadata, requestId) => writeLog('WARNING', message, metadata, requestId);
const error = (message, metadata, requestId) => writeLog('ERROR', message, metadata, requestId);
const critical = (message, metadata, requestId) => writeLog('CRITICAL', message, metadata, requestId);

module.exports = { getLogger, resetLogger, writeLog, info, warn, error, critical };
