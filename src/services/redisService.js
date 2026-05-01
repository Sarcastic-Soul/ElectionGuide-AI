'use strict';

/**
 * @file services/redisService.js
 * @module services/redisService
 * @description Redis connection management for distributed rate limiting and caching.
 *
 * Provides a graceful fallback if REDIS_URL is not provided (e.g., local development).
 */

const { createClient } = require('redis');
const loggingService = require('./loggingService');
const config = require('../config');

let redisClient = null;

const initRedis = async () => {
  if (!config.redisUrl) {
    loggingService.info('No REDIS_URL provided. Redis features will fall back to memory.');
    return null;
  }

  try {
    const client = createClient({ url: config.redisUrl });
    
    client.on('error', (err) => {
      loggingService.error('Redis Client Error', { error: err.message });
    });

    client.on('connect', () => {
      loggingService.info('Connected to Redis');
    });

    await client.connect();
    redisClient = client;
    return client;
  } catch (error) {
    loggingService.warn('Failed to connect to Redis. Falling back to memory.', { error: error.message });
    return null;
  }
};

const getClient = () => redisClient;

const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};

module.exports = {
  initRedis,
  getClient,
  closeRedis,
};
