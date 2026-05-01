'use strict';

/**
 * @file server.js
 * @module server
 * @description Application entry point — starts the HTTP server and handles lifecycle.
 *
 * This file is deliberately minimal. All Express configuration lives in app.js
 * (via the createApp factory). This separation enables:
 * - **Testability**: Tests import createApp() directly, without starting a real server.
 * - **Single Responsibility**: This file only handles server lifecycle (start/stop).
 *
 * **Cloud Run Integration**:
 * Cloud Run sends SIGTERM when it needs to stop a container instance (during scale-down,
 * redeployment, or resource reclamation). We handle this signal to:
 * 1. Stop accepting new connections
 * 2. Wait for in-flight requests to complete
 * 3. Exit cleanly (exit code 0)
 *
 * If graceful shutdown exceeds 10 seconds, we force-exit to avoid Cloud Run's
 * hard kill timeout (default: 10s after SIGTERM).
 *
 * @see {@link https://cloud.google.com/run/docs/container-contract#lifecycle}
 */

// IMPORTANT: trace-agent must be required and started before any other modules
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
  require('@google-cloud/trace-agent').start();
}

const { createApp } = require('./app');
const config = require('./config');
const redisService = require('./services/redisService');
const firestoreService = require('./services/firestoreService');

let server;

const startServer = async () => {
  await redisService.initRedis();
  const app = createApp();

  server = app.listen(config.port, () => {
    console.log(
      JSON.stringify({
        severity: 'INFO',
        message: `ElectionGuide AI server started on port ${config.port}`,
        environment: config.nodeEnv,
        timestamp: new Date().toISOString(),
      })
    );

    // Pre-warm Firestore connection pool to eliminate cold-start penalty
    // for the first user hitting the leaderboard or submitting a quiz.
    firestoreService.getLeaderboard(1).catch(() => {});
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// ─── Graceful Shutdown Handler ───
// Cloud Run sends SIGTERM before stopping a container instance.
// We close the server gracefully, allowing in-flight requests to complete.
const shutdown = async (signal) => {
  console.log(
    JSON.stringify({
      severity: 'INFO',
      message: `Received ${signal}. Starting graceful shutdown...`,
      timestamp: new Date().toISOString(),
    })
  );

  await redisService.closeRedis();

  if (server) {
    server.close(() => {
      console.log(
        JSON.stringify({
          severity: 'INFO',
          message: 'Server closed. Exiting process.',
          timestamp: new Date().toISOString(),
        })
      );
      process.exit(0);
    });
  } else {
    process.exit(0);
  }

  // Force exit after 10s if graceful shutdown fails
  // (Cloud Run's default termination grace period is 10s)
  setTimeout(() => {
    console.error(
      JSON.stringify({
        severity: 'ERROR',
        message: 'Forced shutdown after timeout.',
        timestamp: new Date().toISOString(),
      })
    );
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ─── Unhandled Rejection Safety Net ───
// Prevents the entire process from crashing on an unhandled promise rejection.
// The error is logged for Cloud Logging to capture and alert on.
process.on('unhandledRejection', (reason) => {
  console.error(
    JSON.stringify({
      severity: 'ERROR',
      message: 'Unhandled promise rejection',
      error: reason instanceof Error ? reason.message : String(reason),
      timestamp: new Date().toISOString(),
    })
  );
});

module.exports = server;
