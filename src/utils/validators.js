'use strict';

/**
 * @module utils/validators
 * @description Input validation schemas using express-validator.
 */

const { body, param, query } = require('express-validator');

/**
 * Validation rules for chat message endpoint.
 * @type {Array}
 */
const chatValidation = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 2000 })
    .withMessage('Message must be 2000 characters or fewer')
    .isString()
    .withMessage('Message must be a string'),
  body('history')
    .optional()
    .isArray({ max: 50 })
    .withMessage('History must be an array with 50 or fewer items'),
  body('history.*.role')
    .optional()
    .isIn(['user', 'model'])
    .withMessage('History role must be "user" or "model"'),
  body('history.*.text')
    .optional()
    .isString()
    .withMessage('History text must be a string'),
];

/**
 * Validation rules for quiz generation endpoint.
 * @type {Array}
 */
const quizGenerateValidation = [
  body('topic')
    .trim()
    .notEmpty()
    .withMessage('Topic is required')
    .isLength({ max: 200 })
    .withMessage('Topic must be 200 characters or fewer'),
  body('difficulty')
    .trim()
    .notEmpty()
    .withMessage('Difficulty is required')
    .isIn(['beginner', 'intermediate', 'expert'])
    .withMessage('Difficulty must be beginner, intermediate, or expert'),
  body('count')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Count must be between 1 and 10')
    .toInt(),
];

/**
 * Validation rules for quiz submission endpoint.
 * @type {Array}
 */
const quizSubmitValidation = [
  body('questions')
    .isArray({ min: 1, max: 10 })
    .withMessage('Questions array is required'),
  body('userAnswers')
    .isArray({ min: 1, max: 10 })
    .withMessage('User answers array is required'),
  body('userAnswers.*')
    .isInt({ min: 0, max: 3 })
    .withMessage('Each answer must be an index between 0 and 3'),
  body('sessionId')
    .optional()
    .isString()
    .withMessage('Session ID must be a string'),
  body('quizToken')
    .notEmpty()
    .withMessage('Quiz token is required for security validation')
    .isString(),
];

/**
 * Validation rules for text-to-speech endpoint.
 * @type {Array}
 */
const ttsValidation = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Text is required')
    .isLength({ max: 5000 })
    .withMessage('Text must be 5000 characters or fewer'),
  body('languageCode')
    .optional()
    .matches(/^[a-z]{2}(-[A-Z]{2})?$/)
    .withMessage('Language code must be in BCP-47 format (e.g., en-US)'),
  body('voiceGender')
    .optional()
    .isIn(['MALE', 'FEMALE', 'NEUTRAL'])
    .withMessage('Voice gender must be MALE, FEMALE, or NEUTRAL'),
];

/**
 * Validation rules for translation endpoint.
 * @type {Array}
 */
const translateValidation = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Text is required')
    .isLength({ max: 5000 })
    .withMessage('Text must be 5000 characters or fewer'),
  body('targetLanguage')
    .trim()
    .notEmpty()
    .withMessage('Target language is required')
    .matches(/^[a-z]{2}(-[A-Z]{2})?$/)
    .withMessage('Target language must be a valid language code (e.g., es, hi, fr)'),
];

/**
 * Validation rules for timeline step parameter.
 * @type {Array}
 */
const timelineStepValidation = [
  param('step')
    .isInt({ min: 1, max: 8 })
    .withMessage('Step must be between 1 and 8')
    .toInt(),
];

module.exports = {
  chatValidation,
  quizGenerateValidation,
  quizSubmitValidation,
  ttsValidation,
  translateValidation,
  timelineStepValidation,
};
