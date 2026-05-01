/**
 * @module quiz
 * @description Interactive quiz module with AI-generated questions.
 */
'use strict';

const Quiz = (() => {
  let currentQuiz = null;
  let currentQuestion = 0;
  let userAnswers = [];
  let selectedDifficulty = 'beginner';

  const init = () => {
    document.getElementById('quiz-start').addEventListener('click', startQuiz);
    document.querySelectorAll('.pill[data-difficulty]').forEach((pill) => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.pill[data-difficulty]').forEach((p) => {
          p.classList.remove('pill--active');
          p.setAttribute('aria-checked', 'false');
        });
        pill.classList.add('pill--active');
        pill.setAttribute('aria-checked', 'true');
        selectedDifficulty = pill.dataset.difficulty;
      });
    });
  };

  const startQuiz = async () => {
    const topic = document.getElementById('quiz-topic').value;
    const startBtn = document.getElementById('quiz-start');
    const loader = startBtn.querySelector('.btn__loader');
    const btnText = startBtn.querySelector('.btn__text');

    startBtn.disabled = true;
    btnText.textContent = 'Generating...';
    if (loader) loader.hidden = false;

    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: CSRF.headers(),
        body: JSON.stringify({ topic, difficulty: selectedDifficulty, count: 5 }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Failed');

      currentQuiz = json.data;
      currentQuestion = 0;
      userAnswers = [];

      document.getElementById('quiz-setup').hidden = true;
      document.getElementById('quiz-active').hidden = false;
      document.getElementById('quiz-results').hidden = true;

      renderQuestion();
      App.announce('Quiz started. Question 1.');
    } catch (error) {
      App.announce('Failed to generate quiz. Please try again.');
      alert('Failed to generate quiz. Please try again.');
    } finally {
      startBtn.disabled = false;
      btnText.textContent = 'Start Quiz';
      if (loader) loader.hidden = true;
    }
  };

  const renderQuestion = () => {
    const q = currentQuiz.questions[currentQuestion];
    const total = currentQuiz.questions.length;
    const progress = ((currentQuestion) / total) * 100;

    document.getElementById('quiz-progress-fill').style.width = `${progress}%`;
    document.getElementById('quiz-progress-text').textContent = `Question ${currentQuestion + 1} of ${total}`;
    document.getElementById('quiz-progress-bar').setAttribute('aria-valuenow', progress);

    const card = document.getElementById('quiz-question-card');
    card.innerHTML = `
      <h3>${q.question}</h3>
      <div class="quiz-options" role="radiogroup" aria-label="Answer options">
        ${q.options.map((opt, i) => `
          <button class="quiz-option" data-index="${i}" role="radio" aria-checked="false">
            <strong>${String.fromCharCode(65 + i)}.</strong> ${opt}
          </button>
        `).join('')}
      </div>
    `;

    card.querySelectorAll('.quiz-option').forEach((btn) => {
      btn.addEventListener('click', () => selectAnswer(parseInt(btn.dataset.index)));
    });
  };

  const selectAnswer = (index) => {
    userAnswers.push(index);
    const q = currentQuiz.questions[currentQuestion];

    // Show correct/wrong feedback
    document.querySelectorAll('.quiz-option').forEach((btn) => {
      btn.disabled = true;
      const i = parseInt(btn.dataset.index);
      if (i === q.correctIndex) btn.classList.add('quiz-option--correct');
      else if (i === index && i !== q.correctIndex) btn.classList.add('quiz-option--wrong');
    });

    // Move to next question after delay
    setTimeout(() => {
      currentQuestion++;
      if (currentQuestion < currentQuiz.questions.length) {
        renderQuestion();
        App.announce(`Question ${currentQuestion + 1}`);
      } else {
        showResults();
      }
    }, 1200);
  };

  const showResults = async () => {
    document.getElementById('quiz-active').hidden = true;
    const resultsEl = document.getElementById('quiz-results');
    resultsEl.hidden = false;

    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: CSRF.headers(),
        body: JSON.stringify({ questions: currentQuiz.questions, userAnswers }),
      });
      const json = await res.json();
      const r = json.data;

      resultsEl.innerHTML = `
        <div class="quiz-results__card">
          <div class="quiz-results__score">${r.percentage}%</div>
          <div class="quiz-results__label">${r.score} out of ${r.total} correct</div>
          <p class="quiz-results__feedback">${r.feedback}</p>
          <button class="btn btn--primary" onclick="Quiz.restart()">Try Another Quiz</button>
          <div class="quiz-results__breakdown">
            <h4 style="margin: 16px 0 12px; font-size: 1rem;">Question Breakdown</h4>
            ${r.results.map((item) => `
              <div class="quiz-results__item quiz-results__item--${item.isCorrect ? 'correct' : 'wrong'}">
                <p><strong>${item.question}</strong></p>
                <p>Your answer: ${item.userAnswer}</p>
                <p>Correct answer: ${item.correctAnswer}</p>
                <p style="color: var(--color-text-muted); font-size: 0.88rem;">${item.explanation}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      App.announce(`Quiz complete. Score: ${r.percentage} percent.`);
    } catch {
      resultsEl.innerHTML = '<p style="text-align:center">Failed to load results.</p>';
    }
  };

  const restart = () => {
    document.getElementById('quiz-setup').hidden = false;
    document.getElementById('quiz-active').hidden = true;
    document.getElementById('quiz-results').hidden = true;
    currentQuiz = null;
    currentQuestion = 0;
    userAnswers = [];
  };

  document.addEventListener('DOMContentLoaded', init);
  return { restart };
})();
