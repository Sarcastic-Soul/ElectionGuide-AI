'use strict';

/**
 * @module routes/ttsRoutes
 * @description Text-to-Speech API routes for accessibility narration.
 */

const express = require('express');
const router = express.Router();
const { aiLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');
const { ttsValidation } = require('../utils/validators');
const { getValidationErrors, successResponse } = require('../utils/helpers');
const ttsService = require('../services/ttsService');
const loggingService = require('../services/loggingService');

/**
 * POST /api/tts
 * Convert text to speech audio (returns base64 MP3).
 */
router.post(
  '/',
  aiLimiter,
  ttsValidation,
  asyncHandler(async (req, res) => {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json(errors);
    }

    const { text, languageCode = 'en-US', voiceGender = 'NEUTRAL' } = req.body;

    const audioBase64 = await ttsService.synthesize(text, languageCode, voiceGender);

    loggingService.info('TTS synthesis completed', {
      textLength: text.length,
      languageCode,
    }).catch(() => {});

    res.json(
      successResponse(
        { audioContent: audioBase64, format: 'mp3', languageCode },
        'Audio synthesized successfully'
      )
    );
  })
);

module.exports = router;
