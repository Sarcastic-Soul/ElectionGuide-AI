'use strict';

/**
 * @module routes/chatRoutes
 * @description Chat API routes for AI-powered election education conversations.
 */

const express = require('express');
const router = express.Router();
const { aiLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');
const { chatValidation } = require('../utils/validators');
const { getValidationErrors, successResponse } = require('../utils/helpers');
const geminiService = require('../services/geminiService');
const loggingService = require('../services/loggingService');

/**
 * POST /api/chat
 * Send a message and receive a streaming AI response about elections.
 */
router.post(
  '/',
  aiLimiter,
  chatValidation,
  asyncHandler(async (req, res) => {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json(errors);
    }

    const { message, history = [] } = req.body;

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      const stream = await geminiService.streamChat(message, history);
      let fullResponse = '';

      for await (const chunk of stream) {
        const text = chunk.text || '';
        if (text) {
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`);
        }
      }

      // Send completion event
      res.write(`data: ${JSON.stringify({ type: 'done', fullText: fullResponse })}\n\n`);
      res.end();

      // Log analytics asynchronously (don't await)
      loggingService.info('Chat message processed', {
        messageLength: message.length,
        responseLength: fullResponse.length,
      }).catch(() => {});
    } catch (error) {
      // If streaming already started, send error as SSE event
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to generate response. Please try again.' })}\n\n`);
      res.end();

      loggingService.error('Chat streaming error', { error: error.message }).catch(() => {});
    }
  })
);

/**
 * POST /api/chat/explain
 * Get a non-streaming explanation of a specific election topic.
 */
router.post(
  '/explain',
  aiLimiter,
  chatValidation,
  asyncHandler(async (req, res) => {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json(errors);
    }

    const { message, history = [] } = req.body;
    const explanation = await geminiService.chat(
      `Please provide a clear, step-by-step explanation about: ${message}`,
      history
    );

    res.json(successResponse({ explanation }));
  })
);

module.exports = router;
