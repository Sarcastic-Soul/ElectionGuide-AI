'use strict';

/**
 * @module routes/timelineRoutes
 * @description Election process timeline API routes.
 */

const express = require('express');
const router = express.Router();
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { timelineStepValidation } = require('../utils/validators');
const { getValidationErrors, successResponse } = require('../utils/helpers');
const { ELECTION_TIMELINE } = require('../utils/constants');

/**
 * GET /api/timeline
 * Returns the complete election process timeline.
 */
router.get('/', (req, res) => {
  // Return summarized timeline (without full details for performance)
  const summary = ELECTION_TIMELINE.map(({ id, step, icon, timeframe, summary: stepSummary }) => ({
    id,
    step,
    icon,
    timeframe,
    summary: stepSummary,
  }));

  // Timeline data is static — cache aggressively (1 hour, with ETag for revalidation)
  res.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.json(successResponse(summary, 'Election timeline retrieved'));
});

/**
 * GET /api/timeline/:step
 * Returns detailed information about a specific timeline step.
 */
router.get(
  '/:step',
  timelineStepValidation,
  asyncHandler(async (req, res) => {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json(errors);
    }

    const stepId = parseInt(req.params.step, 10);
    const stepData = ELECTION_TIMELINE.find((s) => s.id === stepId);

    if (!stepData) {
      throw new AppError(`Timeline step ${stepId} not found`, 404, 'NOT_FOUND');
    }

    res.json(successResponse(stepData, `Step ${stepId} details retrieved`));
  })
);

module.exports = router;
