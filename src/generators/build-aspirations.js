import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { loadAspirations } from '../lib/aspirations.js';
import { renderConceptMarkdown } from '../lib/markdown.js';
import { escapeAttribute, escapeHtml } from '../lib/escape.js';
import { renderResonancesSection } from '../lib/reflection-cards.js';
import { canonicalFor, jsonLdScript, OGP_IMAGE, personRef, SITE_URL } from '../lib/site.js';

const root = new URL('../../', import.meta.url);

// Aspiration詳細がまだ準備できていない間は、要約（Summary）のみ表示する。
// 詳細ページ・カードのリンクを生成しない。準備ができたら false に戻す。
const SUMMARY_ONLY = true;

export async function buildAspirations(reflectionsBySlug = new Map()) {
  const aspirations = await loadAspirations();
  const template = await readFile(new URL('src/templates/aspiration.html', root), 'utf8');

  await mkdir(new URL('aspirations/', root), { recursive: true });
  await clearGeneratedAspirationPages();

  const generatedPages = [];
  for (const [i, aspiration] of aspirations.entries()) {
    if (SUMMARY_ONLY || !aspiration.hasBody) continue;

    const label = `Aspiration ${String(i + 1).padStart(2, '0')}`;
    const resonances = reflectionsBySlug.get(aspiration.slug) ?? [];
    const relatedTitles = normalizeRelatedTitles(aspiration.related_titles);
    const description = aspiration.summary || aspiration.title;
    const canonicalUrl = canonicalFor('aspiration', aspiration.slug);
    const article = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      '@id': `${canonicalUrl}#article`,
      mainEntityOfPage: canonicalUrl,
      url: canonicalUrl,
      headline: aspiration.title,
      ...(relatedTitles.length > 0 ? {
        alternativeHeadline: relatedTitles.length === 1 ? relatedTitles[0] : relatedTitles,
      } : {}),
      description,
      inLanguage: 'ja',
      image: OGP_IMAGE,
      dateModified: aspiration.modifiedAt,
      author: personRef(),
      publisher: personRef(),
      isPartOf: { '@id': `${SITE_URL}#website` },
    };
    const html = template
      .replaceAll('{{title}}', () => escapeHtml(aspiration.title))
      .replaceAll('{{description}}', () => escapeAttribute(description))
      .replaceAll('{{canonicalUrl}}', () => escapeAttribute(canonicalUrl))
      .replaceAll('{{jsonLd}}', () => jsonLdScript(article))
      .replaceAll('{{label}}', () => escapeHtml(label))
      .replaceAll('{{summary}}', () => escapeHtml(aspiration.summary))
      .replaceAll('{{body}}', () => indent(renderConceptMarkdown(aspiration.source_markdown), 8))
      .replaceAll('{{resonances}}', () => renderResonancesSection(resonances));

    await writeFile(new URL(`aspirations/${aspiration.slug}.html`, root), html);
    generatedPages.push(aspiration);
  }

  await updateIndexAspirations(aspirations);
  console.log(`Built ${generatedPages.length} aspiration pages`);
  return generatedPages;
}

async function clearGeneratedAspirationPages() {
  const dir = new URL('aspirations/', root);
  const files = await readdir(dir);
  await Promise.all(files
    .filter((file) => file.endsWith('.html'))
    .map((file) => unlink(new URL(file, dir))));
}

async function updateIndexAspirations(aspirations) {
  const indexPath = new URL('index.html', root);
  const index = await readFile(indexPath, 'utf8');
  const startMarker = '<!-- aspirations:start -->';
  const endMarker = '<!-- aspirations:end -->';
  const start = index.indexOf(startMarker);
  const end = index.indexOf(endMarker);

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Aspiration markers not found in index.html');
  }

  const section = renderAspirationSection(aspirations);
  const next = `${index.slice(0, start + startMarker.length)}\n${section}\n    ${index.slice(end)}`;
  await writeFile(indexPath, next);
}

function renderAspirationSection(aspirations) {
  const cards = aspirations.map((aspiration, i) => {
    const kicker = String(i + 1).padStart(2, '0');
    const inner = `<span class="aspiration-kicker">${escapeHtml(kicker)}</span>
          <span class="aspiration-body">
            <span class="aspiration-title">${escapeHtml(aspiration.title)}</span>
            <span class="aspiration-note">${escapeHtml(aspiration.summary)}</span>
          </span>`;

    if (SUMMARY_ONLY || !aspiration.hasBody) {
      return `        <div class="aspiration-card aspiration-card-static">
          ${inner}
        </div>`;
    }

    return `        <a class="aspiration-card" href="aspirations/${escapeAttribute(aspiration.slug)}.html">
          ${inner}
        </a>`;
  }).join('\n\n');

  return `    <section id="aspiration">
      <p class="section-label">Aspiration</p>
      <div class="aspiration-list">
${cards}
      </div>
    </section>`;
}

function indent(value, spaces) {
  const padding = ' '.repeat(spaces);
  return String(value).split('\n').map((line) => `${padding}${line}`).join('\n');
}

function normalizeRelatedTitles(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  buildAspirations().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
