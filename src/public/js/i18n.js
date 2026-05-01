import { announce } from './app.js';
import { headers } from './csrf.js';
/**
 * @module i18n
 * @description Internationalization module using Google Cloud Translation API.
 */
'use strict';


let currentLang = 'en';
const cache = new Map();

const init = () => {
  const select = document.getElementById('language-select');
    if (select) {
      select.addEventListener('change', (e) => setLanguage(e.target.value));
    }
  };

const setLanguage = async (lang) => {
    if (lang === currentLang) {return;}
    currentLang = lang;
    document.documentElement.lang = lang;

    if (lang === 'en') {
      location.reload(); // Reset to English
      return;
    }

    // Translate static UI strings
  const elements = document.querySelectorAll('.section-title, .section-subtitle, .about-card__title, .about-card__text, .footer__text');
    for (const el of elements) {
    const original = el.dataset.original || el.textContent;
      el.dataset.original = original;

    const translated = await translate(original, lang);
      if (translated) {el.textContent = translated;}
    }

    // Set RTL for Arabic
    document.documentElement.dir = ['ar', 'he'].includes(lang) ? 'rtl' : 'ltr';
    announce(`Language changed to ${select.options[select.selectedIndex].text}`);
  };

const translate = async (text, targetLang) => {
  const key = `${targetLang}:${text}`;
    if (cache.has(key)) {return cache.get(key);}

    try {
    const res = await fetch('/api/translate', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ text, targetLanguage: targetLang }),
      });
    const json = await res.json();
      if (json.success) {
        cache.set(key, json.data.translatedText);
        return json.data.translatedText;
      }
    } catch { /* ignore */ }
    return null;
  };

  document.addEventListener('DOMContentLoaded', init);

