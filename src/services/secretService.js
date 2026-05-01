'use strict';

/**
 * @file services/secretService.js
 * @module services/secretService
 * @description Google Cloud Secret Manager integration for secure credential management.
 *
 * **Why Secret Manager instead of environment variables?**
 * - Env vars are visible in Cloud Run revision metadata (console, gcloud describe)
 * - Secret Manager provides audit logging, access control, and automatic rotation
 * - Secret Manager references are first-class in Cloud Run (`--set-secrets`)
 * - Demonstrates proper GCP security practices for a production application
 *
 * **Fallback strategy:**
 * - In production: Fetches secret from Secret Manager
 * - In development: Falls back to process.env (no Secret Manager dependency locally)
 * - This ensures the app works in both environments without configuration changes
 *
 * @see {@link https://cloud.google.com/secret-manager/docs} Secret Manager documentation
 * @see {@link https://cloud.google.com/run/docs/configuring/secrets} Cloud Run secrets
 */

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const config = require('../config');

/** @type {SecretManagerServiceClient|null} Singleton Secret Manager client */
let smClient = null;

/** @type {Map<string, {value: string, expiry: number}>} In-memory secret cache (5-min TTL) */
const secretCache = new Map();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Returns the Secret Manager client singleton.
 * @returns {SecretManagerServiceClient}
 */
const getClient = () => {
  if (!smClient) {
    smClient = new SecretManagerServiceClient();
  }
  return smClient;
};

/**
 * Resets the Secret Manager client singleton (used for testing).
 */
const resetClient = () => {
  smClient = null;
  secretCache.clear();
};

/**
 * Retrieves a secret value from Google Cloud Secret Manager.
 * Falls back to the provided default (typically an env var) if Secret Manager
 * is unavailable or the secret doesn't exist.
 *
 * Results are cached in-memory for 5 minutes to avoid excessive API calls
 * on every request (Secret Manager has a 10K req/min quota).
 *
 * @param {string} secretName - Name of the secret in Secret Manager
 * @param {string} [fallbackValue] - Fallback value if Secret Manager fails
 * @returns {Promise<string>} The secret value
 */
const getSecret = async (secretName, fallbackValue = '') => {
  // Check in-memory cache first
  const cached = secretCache.get(secretName);
  if (cached && cached.expiry > Date.now()) {
    return cached.value;
  }

  // In development, skip Secret Manager entirely
  if (!config.isProduction) {
    return fallbackValue;
  }

  try {
    const client = getClient();
    const name = `projects/${config.projectId}/secrets/${secretName}/versions/latest`;
    const [version] = await client.accessSecretVersion({ name });
    const value = version.payload.data.toString('utf8');

    // Cache the result
    secretCache.set(secretName, { value, expiry: Date.now() + CACHE_TTL });
    return value;
  } catch (error) {
    // Log but don't crash — fall back to env var
    console.error(JSON.stringify({
      severity: 'WARNING',
      message: `Secret Manager lookup failed for "${secretName}", using fallback`,
      error: error.message,
      timestamp: new Date().toISOString(),
    }));
    return fallbackValue;
  }
};

module.exports = { getClient, resetClient, getSecret };
