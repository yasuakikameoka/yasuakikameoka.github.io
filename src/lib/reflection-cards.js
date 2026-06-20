import { escapeAttribute, escapeHtml } from './escape.js';

export function renderResonancesSection(reflections, hrefPrefix = '../reflection/posts/') {
  if (reflections.length === 0) return '';

  const cards = reflections.map((reflection) => {
    const dateHtml = reflection.date
      ? `\n          <time class="reflection-date" datetime="${escapeAttribute(reflection.date)}">${escapeHtml(formatReflectionDate(reflection.date))}</time>`
      : '';
    const noteHtml = reflection.description
      ? `\n          <span class="reflection-note">${escapeHtml(reflection.description)}</span>`
      : '';

    return `        <a class="reflection-card" href="${escapeAttribute(hrefPrefix)}${escapeAttribute(reflection.slug)}.html">
          <span class="reflection-title">${escapeHtml(reflection.title)}</span>${dateHtml}${noteHtml}
        </a>`;
  }).join('\n\n');

  return `
      <section class="resonances">
        <p class="section-label">Resonances</p>
        <div class="resonances-grid">
${cards}
        </div>
      </section>
`;
}

function formatReflectionDate(dateStr) {
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return `${Number(match[1])}年${Number(match[2])}月${Number(match[3])}日`;
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}
