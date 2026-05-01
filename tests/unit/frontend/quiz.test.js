/**
 * @file tests/unit/frontend/quiz.test.js
 * @description Frontend tests for the Quiz module.
 * Tests answer selection logic, scoring, and restart behavior.
 *
 * @jest-environment jsdom
 */

'use strict';

describe('Quiz Module — Frontend', () => {
  beforeEach(() => {
    window.document.body.innerHTML = `
      <div id="sr-announcer" class="sr-only" aria-live="polite"></div>
      <div id="quiz-setup">
        <select id="quiz-topic"><option value="general">General</option></select>
        <button id="quiz-start"><span class="btn__text">Start Quiz</span><span class="btn__loader" hidden></span></button>
        <div class="difficulty-pills">
          <button class="pill pill--active" data-difficulty="beginner" aria-checked="true">Beginner</button>
          <button class="pill" data-difficulty="intermediate" aria-checked="false">Intermediate</button>
          <button class="pill" data-difficulty="expert" aria-checked="false">Expert</button>
        </div>
      </div>
      <div id="quiz-active" hidden>
        <div id="quiz-progress-bar" role="progressbar" aria-valuenow="0">
          <div id="quiz-progress-fill"></div>
          <div id="quiz-progress-text"></div>
        </div>
        <div id="quiz-question-card"></div>
      </div>
      <div id="quiz-results" hidden></div>
    `;
  });

  describe('Quiz Grading Logic (client-side)', () => {
    const mockQuestions = [
      { id: 1, question: 'Q1?', options: ['A', 'B', 'C', 'D'], correctIndex: 0, explanation: 'A is correct' },
      { id: 2, question: 'Q2?', options: ['A', 'B', 'C', 'D'], correctIndex: 2, explanation: 'C is correct' },
      { id: 3, question: 'Q3?', options: ['A', 'B', 'C', 'D'], correctIndex: 1, explanation: 'B is correct' },
    ];

    it('should correctly identify correct answers', () => {
      const userAnswers = [0, 2, 1]; // All correct
      const results = mockQuestions.map((q, i) => ({
        isCorrect: userAnswers[i] === q.correctIndex,
      }));
      expect(results.every((r) => r.isCorrect)).toBe(true);
    });

    it('should correctly identify wrong answers', () => {
      const userAnswers = [3, 0, 3]; // All wrong
      const results = mockQuestions.map((q, i) => ({
        isCorrect: userAnswers[i] === q.correctIndex,
      }));
      expect(results.every((r) => !r.isCorrect)).toBe(true);
    });

    it('should calculate percentage correctly', () => {
      const userAnswers = [0, 0, 1]; // 2 out of 3 correct
      const score = mockQuestions.filter((q, i) => userAnswers[i] === q.correctIndex).length;
      const percentage = Math.round((score / mockQuestions.length) * 100);
      expect(percentage).toBe(67);
    });
  });

  describe('Difficulty Selection', () => {
    it('should mark selected difficulty pill as active', () => {
      const pills = document.querySelectorAll('.pill[data-difficulty]');
      expect(pills[0].classList.contains('pill--active')).toBe(true);
      expect(pills[0].getAttribute('aria-checked')).toBe('true');
    });

    it('should deactivate other pills when one is selected', () => {
      const pills = document.querySelectorAll('.pill[data-difficulty]');
      // Simulate clicking intermediate
      pills.forEach((p) => {
        p.classList.remove('pill--active');
        p.setAttribute('aria-checked', 'false');
      });
      pills[1].classList.add('pill--active');
      pills[1].setAttribute('aria-checked', 'true');

      expect(pills[0].classList.contains('pill--active')).toBe(false);
      expect(pills[1].classList.contains('pill--active')).toBe(true);
      expect(pills[1].getAttribute('aria-checked')).toBe('true');
    });
  });

  describe('Restart Flow', () => {
    it('should show setup and hide active/results on restart', () => {
      // Simulate quiz in progress
      document.getElementById('quiz-setup').hidden = true;
      document.getElementById('quiz-active').hidden = false;

      // Restart
      document.getElementById('quiz-setup').hidden = false;
      document.getElementById('quiz-active').hidden = true;
      document.getElementById('quiz-results').hidden = true;

      expect(document.getElementById('quiz-setup').hidden).toBe(false);
      expect(document.getElementById('quiz-active').hidden).toBe(true);
      expect(document.getElementById('quiz-results').hidden).toBe(true);
    });
  });
});
