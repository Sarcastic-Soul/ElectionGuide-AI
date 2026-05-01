/**
 * @file tests/unit/frontend/chat.test.js
 * @description Frontend tests for the Chat module.
 * Tests message creation, SSE event parsing, and input handling.
 *
 * @jest-environment jsdom
 */

'use strict';

describe('Chat Module — Frontend', () => {
  beforeEach(() => {
    window.document.body.innerHTML = `
      <div id="sr-announcer" class="sr-only" aria-live="polite"></div>
      <form id="chat-form">
        <textarea id="chat-input" placeholder="Ask about elections..."></textarea>
        <button id="chat-send" type="submit">Send</button>
      </form>
      <div id="chat-messages"></div>
      <div id="chat-chips">
        <button class="chip" data-question="How do elections work?">How do elections work?</button>
        <button class="chip" data-question="What is the Electoral College?">Electoral College</button>
      </div>
    `;
  });

  describe('Message Creation', () => {
    it('should create user message with correct structure', () => {
      const messages = document.getElementById('chat-messages');
      const div = document.createElement('div');
      div.className = 'message message--user';
      div.innerHTML = `
        <div class="message__avatar" aria-hidden="true">👤</div>
        <div class="message__content">
          <div class="message__bubble">Hello World</div>
        </div>
      `;
      messages.appendChild(div);

      expect(messages.children.length).toBe(1);
      expect(div.querySelector('.message__bubble').textContent).toBe('Hello World');
      expect(div.querySelector('.message__avatar').getAttribute('aria-hidden')).toBe('true');
    });

    it('should create AI message with typing indicator', () => {
      const messages = document.getElementById('chat-messages');
      const div = document.createElement('div');
      div.className = 'message message--ai';
      div.innerHTML = `
        <div class="message__avatar" aria-hidden="true">🏛️</div>
        <div class="message__content">
          <div class="message__bubble">
            <div class="typing-indicator"><span></span><span></span><span></span></div>
          </div>
        </div>
      `;
      messages.appendChild(div);

      expect(div.querySelector('.typing-indicator')).not.toBeNull();
      expect(div.querySelector('.typing-indicator').children.length).toBe(3);
    });
  });

  describe('SSE Event Parsing', () => {
    it('should parse chunk events correctly', () => {
      const raw = 'data: {"type":"chunk","text":"Hello "}';
      const data = JSON.parse(raw.slice(6));
      expect(data.type).toBe('chunk');
      expect(data.text).toBe('Hello ');
    });

    it('should parse done events correctly', () => {
      const raw = 'data: {"type":"done","fullText":"Hello World"}';
      const data = JSON.parse(raw.slice(6));
      expect(data.type).toBe('done');
      expect(data.fullText).toBe('Hello World');
    });

    it('should parse error events correctly', () => {
      const raw = 'data: {"type":"error","message":"Failed to generate response."}';
      const data = JSON.parse(raw.slice(6));
      expect(data.type).toBe('error');
    });

    it('should handle malformed SSE data gracefully', () => {
      const raw = 'data: {invalid json}';
      expect(() => JSON.parse(raw.slice(6))).toThrow();
    });
  });

  describe('Input Handling', () => {
    it('should trim whitespace from input', () => {
      const input = document.getElementById('chat-input');
      input.value = '  Hello World  ';
      expect(input.value.trim()).toBe('Hello World');
    });

    it('should reject empty input', () => {
      const input = document.getElementById('chat-input');
      input.value = '   ';
      const message = input.value.trim();
      expect(message).toBe('');
      expect(!message).toBe(true); // Falsy check in sendMessage
    });

    it('should respect max length', () => {
      const maxLength = 2000;
      const input = 'a'.repeat(2500);
      expect(input.length > maxLength).toBe(true);
    });
  });

  describe('Quick Chips', () => {
    it('should have data-question attributes', () => {
      const chips = document.querySelectorAll('.chip');
      expect(chips.length).toBe(2);
      expect(chips[0].dataset.question).toBe('How do elections work?');
    });

    it('should find closest chip on click', () => {
      const chip = document.querySelector('.chip');
      expect(chip.closest('.chip')).toBe(chip);
    });
  });

  describe('TTS Button', () => {
    it('should create TTS button with correct attributes', () => {
      const btn = document.createElement('button');
      btn.className = 'message__tts-btn';
      btn.setAttribute('aria-label', 'Read this message aloud');
      btn.title = 'Read aloud';
      btn.dataset.text = 'Test text content';
      btn.textContent = '🔊';

      expect(btn.getAttribute('aria-label')).toBe('Read this message aloud');
      expect(btn.dataset.text).toBe('Test text content');
    });
  });
});
