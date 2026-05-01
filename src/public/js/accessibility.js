/**
 * @module accessibility
 * @description Accessibility utilities — TTS, font size, high contrast, focus management.
 */
'use strict';

const Accessibility = (() => {
  let fontSize = 16;

  const init = () => {
    document.getElementById('btn-font-increase').addEventListener('click', () => changeFontSize(2));
    document.getElementById('btn-font-decrease').addEventListener('click', () => changeFontSize(-2));
    document.getElementById('btn-contrast').addEventListener('click', toggleContrast);
  };

  const changeFontSize = (delta) => {
    fontSize = Math.max(12, Math.min(24, fontSize + delta));
    document.documentElement.style.setProperty('--font-size-base', fontSize + 'px');
    App.announce(`Font size ${delta > 0 ? 'increased' : 'decreased'} to ${fontSize} pixels`);
  };

  const toggleContrast = () => {
    document.body.classList.toggle('high-contrast');
    const isHigh = document.body.classList.contains('high-contrast');
    App.announce(`High contrast mode ${isHigh ? 'enabled' : 'disabled'}`);
  };

  /** Speak text using Cloud TTS API with browser Audio fallback */
  const speak = async (text) => {
    if (!text) return;
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: CSRF.headers(),
        body: JSON.stringify({ text: text.substring(0, 500) }),
      });
      const json = await res.json();
      if (json.success && json.data.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${json.data.audioContent}`);
        audio.play();
        App.announce('Playing audio');
        return;
      }
    } catch { /* fall through to browser TTS */ }

    // Fallback: browser SpeechSynthesis
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text.substring(0, 300));
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  document.addEventListener('DOMContentLoaded', init);
  return { speak, changeFontSize, toggleContrast };
})();
