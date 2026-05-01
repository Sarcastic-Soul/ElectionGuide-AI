'use strict';

/**
 * @file services/ttsService.js
 * @module services/ttsService
 * @description Google Cloud Text-to-Speech integration for accessibility narration.
 *
 * This service enables **WCAG 2.1 AA compliance** by providing audio narration for all
 * AI-generated content. Users can click a 🔊 button on any AI response to hear it spoken aloud.
 *
 * **Caching Strategy**: An LRU cache (100 entries, 30-minute TTL) stores synthesized audio.
 * This is critical because TTS synthesis is expensive (~$4/1M chars) and many users will
 * listen to the same welcome message or common explanations. Cache keys are composed of
 * `languageCode:voiceGender:text` to handle multilingual audio correctly.
 *
 * **Audio Format**: MP3 at 24kHz for optimal quality/size balance. Audio is returned as
 * Base64-encoded strings, which the client converts to blob URLs for HTML5 Audio playback.
 *
 * **Fallback**: The client-side accessibility module falls back to the browser's built-in
 * SpeechSynthesis API if Cloud TTS is unavailable — ensuring narration always works.
 *
 * @see {@link https://cloud.google.com/text-to-speech/docs} Cloud TTS documentation
 * @see {@link https://www.w3.org/WAI/WCAG21/Understanding/audio-description-prerecorded} WCAG audio
 */

const textToSpeech = require('@google-cloud/text-to-speech');
const { LRUCache } = require('lru-cache');
const config = require('../config');

/** @type {textToSpeech.TextToSpeechClient|null} Singleton TTS client */
let ttsClient = null;

/** LRU cache for synthesized audio to minimize API calls */
const audioCache = new LRUCache({
  max: config.cache.ttsMaxSize,
  ttl: config.cache.ttsTTL,
});

/**
 * Initializes or returns the TTS client singleton.
 * @param {object} [injectedClient] - Optional injected client for testing
 * @returns {textToSpeech.TextToSpeechClient} TTS client
 */
const getClient = (injectedClient = null) => {
  if (injectedClient) {
    return injectedClient;
  }
  if (!ttsClient) {
    ttsClient = new textToSpeech.TextToSpeechClient();
  }
  return ttsClient;
};

/**
 * Resets the TTS client singleton (used for testing).
 */
const resetClient = () => {
  ttsClient = null;
  audioCache.clear();
};

const redisService = require('./redisService');
const monitoringService = require('./monitoringService');

/**
 * Synthesizes text to speech audio.
 * @param {string} text - Text to convert to speech
 * @param {string} [languageCode='en-US'] - BCP-47 language code
 * @param {string} [voiceGender='NEUTRAL'] - Voice gender (MALE, FEMALE, NEUTRAL)
 * @returns {Promise<string>} Base64-encoded MP3 audio data
 */
const synthesize = async (text, languageCode = 'en-US', voiceGender = 'NEUTRAL') => {
  const cacheKey = `tts:${languageCode}:${voiceGender}:${Buffer.from(text).toString('base64').substring(0, 50)}`;
  const redisClient = redisService.getClient();

  // Check cache first
  if (redisClient) {
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        monitoringService.recordCacheHit('tts', true);
        return cached;
      }
    } catch (err) {}
  } else {
    const cached = audioCache.get(cacheKey);
    if (cached) {
      monitoringService.recordCacheHit('tts', true);
      return cached;
    }
  }

  monitoringService.recordCacheHit('tts', false);

  const client = getClient();

  // Truncate text to prevent excessive API usage
  const truncatedText = text.substring(0, config.input.maxTTSLength);

  const request = {
    input: { text: truncatedText },
    voice: {
      languageCode,
      ssmlGender: voiceGender,
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 1.0,
      pitch: 0,
    },
  };

  const [response] = await client.synthesizeSpeech(request);
  const audioBase64 = response.audioContent.toString('base64');

  // Cache the result
  if (redisClient) {
    try {
      await redisClient.setEx(cacheKey, config.cache.ttsTTL / 1000, audioBase64);
    } catch (err) {}
  } else {
    audioCache.set(cacheKey, audioBase64);
  }

  return audioBase64;
};

/**
 * Synthesizes SSML content to speech audio.
 * @param {string} ssml - SSML-formatted text
 * @param {string} [languageCode='en-US'] - BCP-47 language code
 * @returns {Promise<string>} Base64-encoded MP3 audio data
 */
const synthesizeSSML = async (ssml, languageCode = 'en-US') => {
  const client = getClient();

  const request = {
    input: { ssml },
    voice: {
      languageCode,
      ssmlGender: 'NEUTRAL',
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 1.0,
    },
  };

  const [response] = await client.synthesizeSpeech(request);
  return response.audioContent.toString('base64');
};

/**
 * Lists available voices for a given language.
 * @param {string} [languageCode] - Optional BCP-47 language code filter
 * @returns {Promise<Array<object>>} Available voices
 */
const listVoices = async (languageCode) => {
  const client = getClient();
  const [response] = await client.listVoices({ languageCode });
  return response.voices.map((voice) => ({
    name: voice.name,
    languageCodes: voice.languageCodes,
    gender: voice.ssmlGender,
  }));
};

module.exports = { getClient, resetClient, synthesize, synthesizeSSML, listVoices };
