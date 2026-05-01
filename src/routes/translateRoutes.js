'use strict';

/**
 * @module routes/translateRoutes
 * @description Translation API routes for multilingual support.
 */

const express = require('express');
const router = express.Router();
const { aiLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');
const { translateValidation } = require('../utils/validators');
const { getValidationErrors, successResponse } = require('../utils/helpers');
const translateService = require('../services/translateService');
const { SUPPORTED_LANGUAGES } = require('../utils/constants');
const loggingService = require('../services/loggingService');

/**
 * POST /api/translate
 * Translate text to a target language.
 */
router.post(
  '/',
  aiLimiter,
  translateValidation,
  asyncHandler(async (req, res) => {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json(errors);
    }

    const { text, targetLanguage } = req.body;

    const result = await translateService.translateText(text, targetLanguage);

    loggingService.info('Translation completed', {
      sourceLanguage: result.sourceLanguage,
      targetLanguage,
      fromCache: result.fromCache,
    }).catch(() => {});

    res.json(successResponse(result, 'Translation completed'));
  })
);

/**
 * GET /api/translate/languages
 * List supported languages.
 */
router.get(
  '/languages',
  asyncHandler(async (_req, res) => {
    res.json(successResponse(SUPPORTED_LANGUAGES, 'Supported languages retrieved'));
  })
);

module.exports = router;
