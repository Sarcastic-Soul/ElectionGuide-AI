'use strict';

/**
 * @module routes
 * @description Route aggregator — mounts all API sub-routers.
 */

const express = require('express');
const router = express.Router();

const chatRoutes = require('./chatRoutes');
const quizRoutes = require('./quizRoutes');
const timelineRoutes = require('./timelineRoutes');
const ttsRoutes = require('./ttsRoutes');
const translateRoutes = require('./translateRoutes');

// Mount sub-routers
router.use('/chat', chatRoutes);
router.use('/quiz', quizRoutes);
router.use('/timeline', timelineRoutes);
router.use('/tts', ttsRoutes);
router.use('/translate', translateRoutes);

module.exports = router;
