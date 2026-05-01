'use strict';

/**
 * @file services/monitoringService.js
 * @module services/monitoringService
 * @description Google Cloud Monitoring integration for custom metrics.
 *
 * Emits telemetry data (latency, cache hit rates, business events) to Cloud
 * Monitoring, allowing for the creation of production dashboards and alerts.
 */

const monitoring = require('@google-cloud/monitoring');
const config = require('../config');
const loggingService = require('./loggingService');

let metricClient = null;

const getClient = () => {
  if (!metricClient && config.isProduction) {
    metricClient = new monitoring.MetricServiceClient();
  }
  return metricClient;
};

/**
 * Helper to write a time series data point
 * @param {string} metricType - The custom metric type name
 * @param {number} value - The metric value
 * @param {string} valueType - 'DOUBLE' or 'INT64'
 * @param {object} labels - Optional dimension labels
 */
const writeMetric = async (metricType, value, valueType = 'DOUBLE', labels = {}) => {
  const client = getClient();
  if (!client) return; // Silent return if not in production or no client

  const dataPoint = {
    interval: {
      endTime: {
        seconds: Date.now() / 1000,
      },
    },
    value: {
      [valueType === 'DOUBLE' ? 'doubleValue' : 'int64Value']: value,
    },
  };

  const timeSeriesData = {
    metric: {
      type: `custom.googleapis.com/electionguide/${metricType}`,
      labels,
    },
    resource: {
      type: 'global',
      labels: {
        project_id: config.projectId,
      },
    },
    points: [dataPoint],
  };

  const request = {
    name: client.projectPath(config.projectId),
    timeSeries: [timeSeriesData],
  };

  try {
    await client.createTimeSeries(request);
  } catch (error) {
    loggingService.warn('Failed to write custom metric', {
      metricType,
      error: error.message,
    }).catch(() => {});
  }
};

const recordCacheHit = (serviceName, hit) => {
  writeMetric('cache_hit_rate', hit ? 1 : 0, 'INT64', { service: serviceName }).catch(() => {});
};

const recordGeminiLatency = (latencyMs) => {
  writeMetric('gemini_latency', latencyMs, 'DOUBLE').catch(() => {});
};

const recordQuizCompletion = () => {
  writeMetric('quiz_completions', 1, 'INT64').catch(() => {});
};

module.exports = {
  recordCacheHit,
  recordGeminiLatency,
  recordQuizCompletion,
};
