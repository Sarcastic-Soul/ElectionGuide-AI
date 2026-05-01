'use strict';

/**
 * @file services/geminiService.js
 * @module services/geminiService
 * @description Google Gemini 2.5 Flash integration for AI-powered election education.
 *
 * This service is the core AI engine of ElectionGuide AI. It provides three capabilities:
 *
 * 1. **Streaming Chat** (`streamChat`) — Real-time conversational responses using Server-Sent Events.
 *    Uses `generateContentStream` for chunk-by-chunk delivery, creating a "typing" effect.
 *
 * 2. **Non-Streaming Chat** (`chat`) — Complete responses for simpler use cases (e.g., topic explanation).
 *    Uses `generateContent` for single-shot responses.
 *
 * 3. **Quiz Generation** (`generateQuiz`) — Structured JSON output for interactive quizzes.
 *    Uses prompt engineering to generate valid JSON with questions, options, and explanations.
 *
 * 4. **Quiz Grading** (`gradeQuiz`) — Server-side answer validation with feedback generation.
 *    No AI call needed — pure logic comparing user answers against correct indices.
 *
 * **SDK Choice**: Uses `@google/genai` (the latest official SDK), NOT the deprecated
 * `@google/generative-ai`. The new SDK provides a cleaner API with native streaming support.
 *
 * **Safety**: All requests include safety settings at `BLOCK_MEDIUM_AND_ABOVE` for all
 * four harm categories (harassment, hate speech, sexual content, dangerous content).
 *
 * **System Prompts**: The AI is grounded with expert system prompts that enforce:
 * - Non-partisan, factual election education
 * - No opinion, endorsement, or political bias
 * - Structured, educational response format
 * - Source attribution when discussing specific laws or amendments
 *
 * **Cost Optimization**: Gemini 2.5 Flash is chosen over Pro for its 10x lower cost
 * per token while maintaining high quality for educational content generation.
 *
 * @see {@link https://ai.google.dev/gemini-api/docs} Gemini API documentation
 * @see {@link https://www.npmjs.com/package/@google/genai} @google/genai SDK
 */

const { GoogleGenAI } = require('@google/genai');
const config = require('../config');
const secretService = require('./secretService');
const monitoringService = require('./monitoringService');
const { ELECTION_SYSTEM_PROMPT, QUIZ_SYSTEM_PROMPT } = require('../utils/constants');

/** @type {GoogleGenAI|null} Singleton AI client */
let aiClient = null;

/**
 * Initializes or returns the Gemini AI client singleton.
 * Attempts to load API key from:
 * 1. Injected options (for testing)
 * 2. Google Cloud Secret Manager (production)
 * 3. Environment variable GEMINI_API_KEY (local development)
 * 4. Frozen config fallback
 *
 * @param {object} [options] - Optional override options for testing
 * @param {string} [options.apiKey] - Override API key
 * @returns {Promise<GoogleGenAI>} AI client instance
 */
const getClient = async (options = {}) => {
  if (!aiClient) {
    // Priority: injected > Secret Manager > env var > config
    let apiKey = options.apiKey;
    if (!apiKey) {
      apiKey = await secretService.getSecret(
        'GEMINI_API_KEY',
        process.env.GEMINI_API_KEY || config.geminiApiKey
      );
    }
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found in Secret Manager, environment, or config');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
};

/**
 * Resets the AI client singleton (used for testing).
 */
const resetClient = () => {
  aiClient = null;
};

/**
 * Safety settings to block harmful content.
 * @type {Array<object>}
 */
const safetySettings = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
];

/**
 * Sends a chat message to Gemini and returns a streaming response.
 * @param {string} message - User's message
 * @param {Array<object>} [history] - Previous conversation history
 * @returns {AsyncIterable} Streaming response chunks
 */
const streamChat = async (message, history = []) => {
  const client = await getClient();
  const startTime = Date.now();

  const contents = [
    ...history.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    })),
    {
      role: 'user',
      parts: [{ text: message }],
    },
  ];

  const response = await client.models.generateContentStream({
    model: config.geminiModel,
    contents,
    config: {
      systemInstruction: ELECTION_SYSTEM_PROMPT,
      safetySettings,
      maxOutputTokens: 1024,
      temperature: 0.7,
      topP: 0.9,
    },
  });

  monitoringService.recordGeminiLatency(Date.now() - startTime);

  return response;
};

/**
 * Sends a chat message and returns the complete response (non-streaming).
 * @param {string} message - User's message
 * @param {Array<object>} [history] - Previous conversation history
 * @returns {Promise<string>} Complete AI response text
 */
const chat = async (message, history = []) => {
  const client = await getClient();
  const startTime = Date.now();

  const contents = [
    ...history.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    })),
    {
      role: 'user',
      parts: [{ text: message }],
    },
  ];

  const response = await client.models.generateContent({
    model: config.geminiModel,
    contents,
    config: {
      systemInstruction: ELECTION_SYSTEM_PROMPT,
      safetySettings,
      maxOutputTokens: 1024,
      temperature: 0.7,
      topP: 0.9,
    },
  });

  monitoringService.recordGeminiLatency(Date.now() - startTime);

  return response.text || '';
};

/**
 * Generates an interactive quiz on election topics.
 * @param {string} topic - Quiz topic
 * @param {string} difficulty - Difficulty level (beginner, intermediate, expert)
 * @param {number} [count=5] - Number of questions
 * @returns {Promise<object>} Parsed quiz object with questions and answers
 */
const generateQuiz = async (topic, difficulty, count = 5) => {
  const client = await getClient();
  const startTime = Date.now();

  const prompt = `Generate a quiz about "${topic}" at ${difficulty} difficulty level with exactly ${count} multiple-choice questions.

Return ONLY valid JSON in this exact format:
{
  "title": "Quiz Title",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Brief explanation of why this is correct."
    }
  ]
}`;

  const response = await client.models.generateContent({
    model: config.geminiModel,
    contents: prompt,
    config: {
      systemInstruction: QUIZ_SYSTEM_PROMPT,
      safetySettings,
      maxOutputTokens: 2048,
      temperature: 0.8,
    },
  });

  monitoringService.recordGeminiLatency(Date.now() - startTime);

  const text = response.text || '';

  // Extract JSON from potential markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  const jsonStr = jsonMatch[1].trim();

  try {
    return JSON.parse(jsonStr);
  } catch {
    throw new Error('Failed to parse quiz response from AI. Please try again.');
  }
};

/**
 * Grades quiz answers and provides explanations.
 * @param {Array<object>} questions - Original quiz questions
 * @param {Array<number>} userAnswers - User's selected answer indices
 * @returns {Promise<object>} Grading results with score and feedback
 */
const gradeQuiz = async (questions, userAnswers) => {
  const results = questions.map((q, i) => ({
    questionId: q.id,
    question: q.question,
    userAnswer: q.options[userAnswers[i]] || 'No answer',
    correctAnswer: q.options[q.correctIndex],
    isCorrect: userAnswers[i] === q.correctIndex,
    explanation: q.explanation,
  }));

  const score = results.filter((r) => r.isCorrect).length;
  const total = questions.length;
  const percentage = Math.round((score / total) * 100);

  return {
    score,
    total,
    percentage,
    results,
    feedback:
      percentage >= 80
        ? 'Excellent! You have a strong understanding of the election process!'
        : percentage >= 60
          ? 'Good effort! Review the explanations to strengthen your knowledge.'
          : 'Keep learning! The explanations below will help you improve.',
  };
};

module.exports = { getClient, resetClient, streamChat, chat, generateQuiz, gradeQuiz };
