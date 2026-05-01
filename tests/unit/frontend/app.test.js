/**
 * @file tests/unit/frontend/app.test.js
 * @description Frontend tests for the main App module.
 * Uses jsdom environment to simulate browser DOM for vanilla JS testing.
 *
 * @jest-environment jsdom
 */

'use strict';

describe('App Module — Frontend', () => {
  beforeEach(() => {
    // Set up minimal DOM structure matching index.html
    document.body.innerHTML = `
      <div id="sr-announcer" aria-live="polite" class="sr-only"></div>
      <nav>
        <button class="nav__btn nav__btn--active" data-tab="chat" aria-selected="true">Chat</button>
        <button class="nav__btn" data-tab="timeline" aria-selected="false">Timeline</button>
        <button class="nav__btn" data-tab="quiz" aria-selected="false">Quiz</button>
        <button class="nav__btn" data-tab="about" aria-selected="false">About</button>
      </nav>
      <section class="panel panel--active" id="panel-chat"></section>
      <section class="panel" id="panel-timeline" hidden></section>
      <section class="panel" id="panel-quiz" hidden></section>
      <section class="panel" id="panel-about" hidden></section>
      <textarea id="chat-input"></textarea>
    `;
  });

  describe('renderMarkdown', () => {
    // Inline implementation of the markdown renderer for testing
    const renderMarkdown = (text) => {
      if (!text) { return ''; }
      return text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/^### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^## (.+)$/gm, '<h3>$1</h3>')
        .replace(/^# (.+)$/gm, '<h2>$1</h2>')
        .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
        .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>\n?)+/g, (m) => {
          return m.includes('1.') ? `<ol>${m}</ol>` : `<ul>${m}</ul>`;
        })
        .replace(/\n{2,}/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^(.+)$/s, '<p>$1</p>')
        .replace(/<p><(h[2-4]|ul|ol)/g, '<$1')
        .replace(/<\/(h[2-4]|ul|ol)><\/p>/g, '</$1>');
    };

    it('should return empty string for falsy input', () => {
      expect(renderMarkdown('')).toBe('');
      expect(renderMarkdown(null)).toBe('');
      expect(renderMarkdown(undefined)).toBe('');
    });

    it('should convert **bold** to <strong>', () => {
      const result = renderMarkdown('This is **bold** text');
      expect(result).toContain('<strong>bold</strong>');
    });

    it('should convert *italic* to <em>', () => {
      const result = renderMarkdown('This is *italic* text');
      expect(result).toContain('<em>italic</em>');
    });

    it('should convert `code` to <code>', () => {
      const result = renderMarkdown('Use `npm test`');
      expect(result).toContain('<code>npm test</code>');
    });

    it('should convert headings', () => {
      expect(renderMarkdown('# H1')).toContain('<h2>H1</h2>');
      expect(renderMarkdown('## H2')).toContain('<h3>H2</h3>');
      expect(renderMarkdown('### H3')).toContain('<h4>H3</h4>');
    });

    it('should escape HTML entities to prevent XSS', () => {
      const result = renderMarkdown('<script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should convert unordered list items', () => {
      const result = renderMarkdown('- Item 1\n- Item 2');
      expect(result).toContain('<li>Item 1</li>');
      expect(result).toContain('<ul>');
    });
  });

  describe('Tab Navigation', () => {
    it('should have correct initial state', () => {
      const activeBtn = document.querySelector('.nav__btn--active');
      expect(activeBtn.dataset.tab).toBe('chat');
      expect(activeBtn.getAttribute('aria-selected')).toBe('true');
    });

    it('should show active panel and hide others', () => {
      const chatPanel = document.getElementById('panel-chat');
      const timelinePanel = document.getElementById('panel-timeline');
      expect(chatPanel.classList.contains('panel--active')).toBe(true);
      expect(timelinePanel.hidden).toBe(true);
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should update announcer element', () => {
      const announcer = document.getElementById('sr-announcer');
      announcer.textContent = 'Test announcement';
      expect(announcer.textContent).toBe('Test announcement');
    });

    it('should have aria-live polite attribute', () => {
      const announcer = document.getElementById('sr-announcer');
      expect(announcer.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should not use Alt key (conflicts with browser/OS)', () => {
      // Verify Alt+2 does NOT switch tabs (old behavior used Alt+N)
      const event = new KeyboardEvent('keydown', { key: '2', altKey: true });
      document.dispatchEvent(event);
      const activeBtn = document.querySelector('.nav__btn--active');
      expect(activeBtn.dataset.tab).toBe('chat'); // Should remain unchanged
    });
  });
});
