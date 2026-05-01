'use strict';

/**
 * @file services/firestoreService.js
 * @module services/firestoreService
 * @description Google Cloud Firestore integration for persistent data storage.
 *
 * Firestore serves two purposes in ElectionGuide AI:
 *
 * 1. **Quiz Results** (collection: `quiz_results`) — Persists quiz scores for the leaderboard.
 *    Documents contain: sessionId, topic, score, total, percentage, createdAt (server timestamp).
 *
 * 2. **Analytics** (collection: `analytics`) — Tracks usage events (chat, quiz, tts, translate)
 *    for observability. Documents contain: eventType, metadata, createdAt.
 *
 * **Authentication**: Uses Application Default Credentials (ADC), which are automatically
 * available on Cloud Run without any configuration. Locally, ADC uses gcloud CLI credentials.
 * This means zero hardcoded keys — a security best practice.
 *
 * **Serverless Pattern**: This service uses optimistic read patterns (no real-time listeners).
 * In a Cloud Run environment, real-time listeners would cause connection leaks since containers
 * are ephemeral and scale to zero. Instead, we use simple get/add operations.
 *
 * **Graceful Degradation**: If Firestore is unavailable (e.g., API not enabled, quota exceeded),
 * the routes catch errors and return fallback responses — the core chat/timeline features
 * continue working without Firestore.
 *
 * @see {@link https://cloud.google.com/firestore/docs} Firestore documentation
 * @see {@link https://cloud.google.com/docs/authentication/application-default-credentials} ADC
 */

const { Firestore } = require('@google-cloud/firestore');
const config = require('../config');

/** @type {Firestore|null} Singleton Firestore client */
let dbClient = null;

/**
 * Initializes or returns the Firestore client singleton.
 * @param {Firestore} [injectedClient] - Optional injected client for testing
 * @returns {Firestore} Firestore client
 */
const getDb = (injectedClient = null) => {
  if (injectedClient) {
    return injectedClient;
  }
  if (!dbClient) {
    dbClient = new Firestore({
      projectId: config.projectId,
    });
  }
  return dbClient;
};

/**
 * Resets the Firestore client singleton (used for testing).
 */
const resetDb = () => {
  dbClient = null;
};

/**
 * Saves a quiz result to Firestore.
 * @param {object} quizResult - Quiz result object
 * @param {string} quizResult.sessionId - User session identifier
 * @param {string} quizResult.topic - Quiz topic
 * @param {number} quizResult.score - Score achieved
 * @param {number} quizResult.total - Total questions
 * @param {number} quizResult.percentage - Score percentage
 * @returns {Promise<string>} Document ID of saved result
 */
const saveQuizResult = async (quizResult) => {
  const db = getDb();
  const docRef = await db.collection('quiz_results').add({
    ...quizResult,
    createdAt: Firestore.FieldValue.serverTimestamp(),
  });
  return docRef.id;
};

/**
 * Retrieves the top quiz scores (leaderboard).
 * @param {number} [limit=10] - Number of top scores to retrieve
 * @returns {Promise<Array<object>>} Array of top quiz results
 */
const getLeaderboard = async (limit = 10) => {
  const db = getDb();
  const snapshot = await db
    .collection('quiz_results')
    .orderBy('percentage', 'desc')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
  }));
};

/**
 * Logs an analytics event to Firestore.
 * @param {string} eventType - Type of event (e.g., 'chat', 'quiz', 'tts', 'translate')
 * @param {object} [metadata] - Additional event metadata
 * @returns {Promise<string>} Document ID
 */
const logAnalyticsEvent = async (eventType, metadata = {}) => {
  const db = getDb();
  const docRef = await db.collection('analytics').add({
    eventType,
    metadata,
    createdAt: Firestore.FieldValue.serverTimestamp(),
  });
  return docRef.id;
};

/**
 * Retrieves analytics summary (event counts by type).
 * @returns {Promise<object>} Event counts by type
 */
const getAnalyticsSummary = async () => {
  const db = getDb();
  const snapshot = await db.collection('analytics').get();

  const summary = {};
  snapshot.docs.forEach((doc) => {
    const { eventType } = doc.data();
    summary[eventType] = (summary[eventType] || 0) + 1;
  });

  return summary;
};

module.exports = {
  getDb,
  resetDb,
  saveQuizResult,
  getLeaderboard,
  logAnalyticsEvent,
  getAnalyticsSummary,
};
