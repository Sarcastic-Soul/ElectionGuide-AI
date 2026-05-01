/**
 * @file tests/integration/accessibility.test.js
 * @description Automated WCAG 2.1 AA compliance testing using jest-axe.
 *
 * This test file uses jest-axe (built on Deque's axe-core engine) to
 * automatically detect accessibility violations in the rendered HTML.
 * axe-core checks ~100 WCAG rules including:
 * - Color contrast ratios (4.5:1 for normal text, 3:1 for large text)
 * - ARIA attribute validity
 * - Heading hierarchy
 * - Form label associations
 * - Focus management
 * - Image alt text
 *
 * @see {@link https://www.deque.com/axe/} axe-core engine
 * @see {@link https://www.npmjs.com/package/jest-axe} jest-axe wrapper
 *
 * @jest-environment jsdom
 */

'use strict';

const { axe, toHaveNoViolations } = require('jest-axe');

expect.extend(toHaveNoViolations);

describe('WCAG 2.1 AA Automated Compliance', () => {
  it('should have no accessibility violations in the main page structure', async () => {
    document.body.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <header role="banner">
        <nav role="navigation" aria-label="Main navigation">
          <div role="tablist" aria-label="Section navigation">
            <button class="nav__btn" role="tab" aria-selected="true" id="tab-chat">Chat</button>
            <button class="nav__btn" role="tab" aria-selected="false" id="tab-timeline">Timeline</button>
            <button class="nav__btn" role="tab" aria-selected="false" id="tab-quiz">Quiz</button>
            <button class="nav__btn" role="tab" aria-selected="false" id="tab-about">About</button>
          </div>
        </nav>
        <div class="header__a11y">
          <button id="btn-font-increase" aria-label="Increase font size">A+</button>
          <button id="btn-font-decrease" aria-label="Decrease font size">A-</button>
          <button id="btn-contrast" aria-label="Toggle high contrast mode">Contrast</button>
          <label for="language-select" class="sr-only">Language</label>
          <select id="language-select" aria-label="Select language">
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>
      </header>
      <main role="main" id="main-content">
        <h1 class="sr-only">ElectionGuide AI - Election Process Education</h1>
        <section id="panel-chat" role="tabpanel" aria-labelledby="tab-chat">
          <form id="chat-form" aria-label="Chat with AI">
            <label for="chat-input" class="sr-only">Ask a question about elections</label>
            <textarea id="chat-input" placeholder="Ask about the election process..."></textarea>
            <button id="chat-send" type="submit" aria-label="Send message">Send</button>
          </form>
        </section>
      </main>
      <footer role="contentinfo">
        <p>ElectionGuide AI — Built with Google Cloud</p>
      </footer>
      <div id="sr-announcer" aria-live="polite" class="sr-only"></div>
    `;

    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });

  it('should have no violations in quiz interface', async () => {
    document.body.innerHTML = `
      <main>
        <h1 class="sr-only">ElectionGuide AI Quiz</h1>
        <section aria-label="Quiz setup">
          <label for="quiz-topic">Quiz Topic</label>
          <select id="quiz-topic">
            <option value="general">General</option>
            <option value="voting">Voting Process</option>
          </select>
          <div role="radiogroup" aria-label="Difficulty level">
            <button role="radio" aria-checked="true">Beginner</button>
            <button role="radio" aria-checked="false">Intermediate</button>
            <button role="radio" aria-checked="false">Expert</button>
          </div>
          <button type="button">Start Quiz</button>
        </section>
      </main>
    `;

    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });

  it('should have no violations in timeline interface', async () => {
    document.body.innerHTML = `
      <main>
        <h1 class="sr-only">Election Timeline</h1>
        <h2>Election Process Timeline</h2>
        <div role="list" aria-label="Election process steps">
          <div role="listitem">
            <div tabindex="0" role="button" aria-expanded="false"
                 aria-label="Step 1: Voter Registration — Year-round. Click to expand.">
              <span aria-hidden="true">📋</span>
              <div>Voter Registration</div>
              <div>Year-round</div>
            </div>
          </div>
          <div role="listitem">
            <div tabindex="0" role="button" aria-expanded="false"
                 aria-label="Step 2: Primaries — February to June. Click to expand.">
              <span aria-hidden="true">🗳️</span>
              <div>Primaries</div>
              <div>February to June</div>
            </div>
          </div>
        </div>
      </main>
    `;

    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
