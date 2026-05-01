/**
 * @module timeline
 * @description Interactive election process timeline with expandable steps.
 */
'use strict';

const Timeline = (() => {
  let loaded = false;

  const loadIfNeeded = async () => {
    if (loaded) return;
    loaded = true;

    try {
      const res = await fetch('/api/timeline');
      const json = await res.json();
      if (!json.success) throw new Error('Failed to load timeline');
      renderTimeline(json.data);
    } catch {
      document.getElementById('timeline').innerHTML =
        '<p style="text-align:center;color:var(--color-text-secondary)">Failed to load timeline. Please refresh.</p>';
    }
  };

  const renderTimeline = (steps) => {
    const container = document.getElementById('timeline');
    container.innerHTML = steps.map((s) => `
      <div class="timeline-item" role="listitem" data-step="${s.id}">
        <div class="timeline-item__dot"></div>
        <div class="timeline-item__card" tabindex="0" role="button"
             aria-expanded="false" aria-label="Step ${s.id}: ${s.step} — ${s.timeframe}. Click to expand.">
          <div class="timeline-item__header">
            <span class="timeline-item__icon" aria-hidden="true">${s.icon}</span>
            <div>
              <div class="timeline-item__step">${s.step}</div>
              <div class="timeline-item__time">${s.timeframe}</div>
            </div>
          </div>
          <p class="timeline-item__summary">${s.summary}</p>
          <div class="timeline-item__details" id="details-${s.id}"></div>
        </div>
      </div>
    `).join('');

    container.addEventListener('click', handleClick);
    container.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick(e);
      }
    });
  };

  const handleClick = async (e) => {
    const card = e.target.closest('.timeline-item__card');
    if (!card) return;

    const item = card.closest('.timeline-item');
    const stepId = item.dataset.step;
    const detailsEl = document.getElementById(`details-${stepId}`);
    const isOpen = detailsEl.classList.contains('open');

    if (isOpen) {
      detailsEl.classList.remove('open');
      card.setAttribute('aria-expanded', 'false');
      return;
    }

    // Close others
    document.querySelectorAll('.timeline-item__details.open').forEach((d) => {
      d.classList.remove('open');
      d.closest('.timeline-item__card').setAttribute('aria-expanded', 'false');
    });

    // Load details if needed
    if (!detailsEl.dataset.loaded) {
      try {
        const res = await fetch(`/api/timeline/${stepId}`);
        const json = await res.json();
        if (!json.success) throw new Error();
        const d = json.data;

        const factsHtml = d.keyFacts ? `
          <div class="timeline-item__facts">
            <div class="timeline-item__facts-title">📌 Key Facts</div>
            <ul>${d.keyFacts.map((f) => `<li>${f}</li>`).join('')}</ul>
          </div>
        ` : '';

        const detailsHtml = (d.details || '')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
          .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
          .split('\n\n').map((p) => p.startsWith('<') ? p : `<p>${p}</p>`).join('');

        detailsEl.innerHTML = `<div class="timeline-item__details-content">${detailsHtml}</div>${factsHtml}`;
        detailsEl.dataset.loaded = 'true';
      } catch {
        detailsEl.innerHTML = '<p>Failed to load details.</p>';
      }
    }

    detailsEl.classList.add('open');
    card.setAttribute('aria-expanded', 'true');
    App.announce(`Expanded step ${stepId}`);
  };

  return { loadIfNeeded };
})();
