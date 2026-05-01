/**
 * @module chat
 * @description Chat UI module — handles sending messages, streaming responses, quick chips.
 */
'use strict';

const Chat = (() => {
  const elements = {};
  let isStreaming = false;

  const init = () => {
    elements.form = document.getElementById('chat-form');
    elements.input = document.getElementById('chat-input');
    elements.messages = document.getElementById('chat-messages');
    elements.sendBtn = document.getElementById('chat-send');
    elements.chips = document.getElementById('chat-chips');

    elements.form.addEventListener('submit', handleSubmit);
    elements.input.addEventListener('keydown', handleKeydown);
    elements.input.addEventListener('input', autoResize);
    elements.chips.addEventListener('click', handleChipClick);
    elements.messages.addEventListener('click', handleTTSClick);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const message = elements.input.value.trim();
    if (!message || isStreaming) return;
    sendMessage(message);
  };

  const handleKeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      elements.form.dispatchEvent(new Event('submit'));
    }
  };

  const autoResize = () => {
    elements.input.style.height = 'auto';
    elements.input.style.height = Math.min(elements.input.scrollHeight, 120) + 'px';
  };

  const handleChipClick = (e) => {
    const chip = e.target.closest('.chip');
    if (chip && !isStreaming) sendMessage(chip.dataset.question);
  };

  const handleTTSClick = (e) => {
    const btn = e.target.closest('.message__tts-btn');
    if (btn && typeof Accessibility !== 'undefined') {
      Accessibility.speak(btn.dataset.text);
    }
  };

  const sendMessage = async (message) => {
    isStreaming = true;
    elements.sendBtn.disabled = true;
    elements.input.value = '';
    elements.input.style.height = 'auto';

    addMessage('user', message);
    const aiMsgEl = addMessage('ai', '', true);
    const bubbleEl = aiMsgEl.querySelector('.message__bubble');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: CSRF.headers(),
        body: JSON.stringify({ message }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'chunk' && data.text) {
              fullText += data.text;
              bubbleEl.innerHTML = App.renderMarkdown(fullText);
              scrollToBottom();
            }
          } catch { /* ignore parse errors in stream */ }
        }
      }

      // Remove typing indicator, set final content
      const typingEl = aiMsgEl.querySelector('.typing-indicator');
      if (typingEl) typingEl.remove();
      if (fullText) {
        bubbleEl.innerHTML = App.renderMarkdown(fullText);
      } else {
        bubbleEl.innerHTML = '<p>I apologize, I could not generate a response. Please try again.</p>';
      }

      // Add TTS button
      const ttsBtn = document.createElement('button');
      ttsBtn.className = 'message__tts-btn';
      ttsBtn.setAttribute('aria-label', 'Read this message aloud');
      ttsBtn.title = 'Read aloud';
      ttsBtn.dataset.text = fullText.replace(/<[^>]*>/g, '').substring(0, 500);
      ttsBtn.textContent = '🔊';
      aiMsgEl.querySelector('.message__content').appendChild(ttsBtn);

      App.announce('AI response received');
    } catch (error) {
      bubbleEl.innerHTML = '<p>Sorry, something went wrong. Please try again.</p>';
      App.announce('Error receiving response');
    }

    isStreaming = false;
    elements.sendBtn.disabled = false;
    elements.input.focus();
  };

  const addMessage = (role, text, isLoading = false) => {
    const div = document.createElement('div');
    div.className = `message message--${role === 'user' ? 'user' : 'ai'}`;

    const avatar = role === 'user' ? '👤' : '🏛️';
    const bubbleContent = isLoading
      ? '<div class="typing-indicator"><span></span><span></span><span></span></div>'
      : App.renderMarkdown(text);

    div.innerHTML = `
      <div class="message__avatar" aria-hidden="true">${avatar}</div>
      <div class="message__content">
        <div class="message__bubble">${bubbleContent}</div>
      </div>
    `;

    elements.messages.appendChild(div);
    scrollToBottom();
    return div;
  };

  const scrollToBottom = () => {
    elements.messages.scrollTop = elements.messages.scrollHeight;
  };

  document.addEventListener('DOMContentLoaded', init);
  return { sendMessage };
})();
