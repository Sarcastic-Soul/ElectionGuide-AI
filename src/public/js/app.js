/**
 * @module app
 * @description Main application controller — tab navigation, keyboard shortcuts, theme.
 */
'use strict';

const App = (() => {
  const state = { activeTab: 'chat' };

  /** Initialize the application */
  const init = () => {
    setupNavigation();
    setupKeyboardShortcuts();
    announce('ElectionGuide AI loaded. Use the navigation tabs to explore.');
  };

  /** Set up tab navigation */
  const setupNavigation = () => {
    document.querySelectorAll('.nav__btn').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
  };

  /** Switch between panels */
  const switchTab = (tab) => {
    if (state.activeTab === tab) return;
    state.activeTab = tab;

    // Update nav buttons
    document.querySelectorAll('.nav__btn').forEach((b) => {
      const isActive = b.dataset.tab === tab;
      b.classList.toggle('nav__btn--active', isActive);
      b.setAttribute('aria-selected', isActive);
    });

    // Update panels
    document.querySelectorAll('.panel').forEach((p) => {
      const isActive = p.id === `panel-${tab}`;
      p.classList.toggle('panel--active', isActive);
      p.hidden = !isActive;
    });

    announce(`Switched to ${tab} tab`);

    // Lazy-load timeline data
    if (tab === 'timeline' && typeof Timeline !== 'undefined') {
      Timeline.loadIfNeeded();
    }
  };

  /** Keyboard shortcuts — uses Ctrl+Shift to avoid conflicts with browser/OS Alt shortcuts */
  const setupKeyboardShortcuts = () => {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+1-4 for tab switching (avoids Alt+N browser/OS conflicts)
      if (e.ctrlKey && e.shiftKey) {
        const shortcuts = { '1': 'chat', '2': 'timeline', '3': 'quiz', '4': 'about' };
        if (shortcuts[e.key]) {
          e.preventDefault();
          switchTab(shortcuts[e.key]);
        }
      }
      // Focus chat input with /
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        const input = document.getElementById('chat-input');
        if (input) { input.focus(); }
      }
    });
  };

  /** Screen reader announcement */
  const announce = (message) => {
    const el = document.getElementById('sr-announcer');
    if (el) {
      el.textContent = '';
      setTimeout(() => { el.textContent = message; }, 100);
    }
  };

  /** Simple markdown to HTML converter */
  const renderMarkdown = (text) => {
    if (!text) return '';
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

  document.addEventListener('DOMContentLoaded', init);

  return { switchTab, announce, renderMarkdown, state };
})();
