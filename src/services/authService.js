'use strict';

/**
 * @file services/authService.js
 * @module services/authService
 * @description Provides cryptographic functions to protect the leaderboard statelessly.
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');

/**
 * Creates a deterministic hash of the questions array.
 * @param {Array} questions - Array of question objects
 * @returns {string} SHA-256 hash
 */
const hashQuestions = (questions) => {
  // Extract just the core question text and correct index to prevent minor
  // formatting differences from breaking the hash
  const canonical = questions.map((q) => ({
    q: q.question,
    c: q.correctIndex,
  }));
  return crypto.createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
};

/**
 * Generates a signed token for a quiz.
 * @param {string} topic - Quiz topic
 * @param {Array} questions - Array of generated questions
 * @returns {string} JWT token
 */
const generateQuizToken = (topic, questions) => {
  const qHash = hashQuestions(questions);
  return jwt.sign({ topic, qHash }, config.jwtSecret, { expiresIn: '1h' });
};

/**
 * Verifies a quiz token and ensures the submitted questions match the hash.
 * @param {string} token - JWT token
 * @param {Array} questions - Array of submitted questions
 * @returns {object} Decoded token payload if valid
 * @throws {AppError} If invalid or tampered
 */
const verifyQuizToken = (token, questions) => {
  try {
    if (!token) {
      throw new AppError('Missing quiz token', 403, 'FORBIDDEN');
    }
    const decoded = jwt.verify(token, config.jwtSecret);
    const submittedHash = hashQuestions(questions);

    if (decoded.qHash !== submittedHash) {
      throw new AppError('Quiz content manipulation detected', 403, 'FORBIDDEN');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Quiz session expired', 403, 'FORBIDDEN');
    }
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Invalid quiz token', 403, 'FORBIDDEN');
  }
};

module.exports = {
  generateQuizToken,
  verifyQuizToken,
  hashQuestions,
};
