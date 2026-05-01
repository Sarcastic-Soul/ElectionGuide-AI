'use strict';

/**
 * @module routes/quizRoutes
 * @description Quiz API routes for interactive election knowledge assessment.
 */

const express = require('express');
const router = express.Router();
const { aiLimiter } = require('../middleware/rateLimiter');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { quizGenerateValidation, quizSubmitValidation } = require('../utils/validators');
const { getValidationErrors, successResponse } = require('../utils/helpers');
const geminiService = require('../services/geminiService');
const firestoreService = require('../services/firestoreService');
const loggingService = require('../services/loggingService');

/**
 * POST /api/quiz/generate
 * Generate an AI-powered quiz on election topics.
 */
router.post(
  '/generate',
  aiLimiter,
  quizGenerateValidation,
  asyncHandler(async (req, res) => {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json(errors);
    }

    const { topic, difficulty, count = 5 } = req.body;

    const quiz = await geminiService.generateQuiz(topic, difficulty, count);

    loggingService.info('Quiz generated', { topic, difficulty, count }).catch(() => {});

    res.json(successResponse(quiz, 'Quiz generated successfully'));
  })
);

/**
 * POST /api/quiz/submit
 * Submit quiz answers for grading and save results.
 */
router.post(
  '/submit',
  quizSubmitValidation,
  asyncHandler(async (req, res) => {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json(errors);
    }

    const { questions, userAnswers, sessionId } = req.body;

    if (questions.length !== userAnswers.length) {
      throw new AppError('Questions and answers arrays must have the same length', 400, 'VALIDATION_ERROR');
    }

    const gradeResult = await geminiService.gradeQuiz(questions, userAnswers);

    // Save to Firestore asynchronously
    try {
      await firestoreService.saveQuizResult({
        sessionId: sessionId || 'anonymous',
        topic: questions[0]?.question?.substring(0, 50) || 'General',
        score: gradeResult.score,
        total: gradeResult.total,
        percentage: gradeResult.percentage,
      });
    } catch (error) {
      // Log but don't fail the request if Firestore save fails
      loggingService.warn('Failed to save quiz result to Firestore', {
        error: error.message,
      }).catch(() => {});
    }

    res.json(successResponse(gradeResult, 'Quiz graded successfully'));
  })
);

/**
 * GET /api/quiz/leaderboard
 * Retrieve top quiz scores.
 */
router.get(
  '/leaderboard',
  asyncHandler(async (_req, res) => {
    try {
      const leaderboard = await firestoreService.getLeaderboard(10);
      res.json(successResponse(leaderboard, 'Leaderboard retrieved'));
    } catch (error) {
      // Return empty leaderboard if Firestore is unavailable
      loggingService.warn('Firestore leaderboard fetch failed', {
        error: error.message,
      }).catch(() => {});
      res.json(successResponse([], 'Leaderboard temporarily unavailable'));
    }
  })
);

module.exports = router;
