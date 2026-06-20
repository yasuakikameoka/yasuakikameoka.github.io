import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { loadConcepts, loadConceptMap } from '../lib/concepts.js';
import { escapeAttribute, escapeHtml } from '../lib/escape.js';
import { firstParagraphText, renderConceptMarkdown, renderMarkdown, summaryFromConcept, extractChangelogEntries, stripTrailingChangelog, renderChangelog } from '../lib/markdown.js';
import { renderResonancesSection } from '../lib/reflection-cards.js';

const root = new URL('../../', import.meta.url);

export async function buildConcepts(reflectionsBySlug = new Map()) {
  const [concepts, conceptMap] = await Promise.all([loadConcepts(), loadConceptMap()]);
  const template = await readFile(new URL('src/templates/concept.html', root), 'utf8');

  await mkdir(new URL('concepts/', root), { recursive: true });
  await mkdir(new URL('style/', root), { recursive: true });
  await clearGeneratedConceptPages();

  for (const concept of concepts) {
    const outDir = concept.section === 'style' ? 'style/' : 'concepts/';
    const summary = summaryFromConcept(concept);
    const relatedTitles = normalizeRelatedTitles(concept.related_titles);
    const relatedTitlesHtml = relatedTitles.length > 0
      ? `<p class="article-related-title">${relatedTitles.map(escapeHtml).join(' / ')}</p>`
      : '';
    const resonances = reflectionsBySlug.get(concept.slug) ?? [];
    const html = template
      .replaceAll('{{title}}', escapeHtml(concept.title))
      .replaceAll('{{description}}', escapeAttribute(summary))
      .replaceAll('{{slug}}', encodeURIComponent(concept.slug))
      .replaceAll('{{relatedTitles}}', relatedTitlesHtml)
      .replaceAll('{{body}}', indent(renderConceptMarkdown(concept.body_markdown), 8))
      .replaceAll('{{resonances}}', renderResonancesSection(resonances));

    await writeFile(new URL(`${outDir}${concept.slug}.html`, root), html);
  }

  await writeFile(new URL('concepts/index.html', root), renderConceptIndexPage(concepts, conceptMap));
  await updateIndexConcepts(concepts, conceptMap);
  console.log(`Built ${concepts.length} concept pages`);
}

async function clearGeneratedConceptPages() {
  await clearHtmlDir(new URL('concepts/', root));
  await clearHtmlDir(new URL('style/', root));
}

async function clearHtmlDir(dirUrl) {
  const files = await readdir(dirUrl);
  await Promise.all(files
    .filter((file) => file.endsWith('.html'))
    .map((file) => unlink(new URL(file, dirUrl))));
}

async function updateIndexConcepts(concepts, conceptMap) {
  const indexPath = new URL('index.html', root);
  const index = await readFile(indexPath, 'utf8');
  const startMarker = '<!-- concepts:start -->';
  const endMarker = '<!-- concepts:end -->';
  const start = index.indexOf(startMarker);
  const end = index.indexOf(endMarker);

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Concept markers not found in index.html');
  }

  const section = renderConceptSection(concepts, conceptMap);
  const next = `${index.slice(0, start + startMarker.length)}\n${section}\n    ${index.slice(end)}`;
  await writeFile(indexPath, next);
}

function renderConceptSection(concepts, conceptMap) {
  const sortedConcepts = [...concepts].sort(compareConcepts);
  const styleItems = sortedConcepts.filter((concept) => concept.section === 'style');
  const styleOntology = styleItems[0];
  const styleConcepts = styleItems.slice(1);
  const lensConcepts = sortedConcepts.filter((concept) => concept.section === 'concept');
  const conceptIntro = firstParagraphText(conceptMap.body_markdown) || conceptMap.section_intro;

  if (!styleOntology) {
    throw new Error('Featured style concept not found');
  }

  return `    <section id="style" class="style-core">
      <p class="section-label">Style</p>
      ${renderFeaturedConcept(styleOntology)}
      <div class="concept-grid concept-grid-three">
${styleConcepts.map(renderConceptCard).join('\n\n')}
      </div>
    </section>

    <section id="concepts">
      <p class="section-label">Concepts</p>
      <p class="section-intro">${escapeHtml(conceptIntro)}</p>
      <div class="concept-grid concept-grid-four">
${lensConcepts.map(renderConceptCard).join('\n\n')}
      </div>
    </section>`;
}

function compareConcepts(a, b) {
  return (a.sort_order ?? 0) - (b.sort_order ?? 0);
}

function conceptUrl(concept) {
  const dir = concept.section === 'style' ? 'style' : 'concepts';
  return `${dir}/${escapeAttribute(concept.slug)}.html`;
}

function renderFeaturedConcept(concept) {
  const summary = summaryFromConcept(concept);
  const relatedTitles = normalizeRelatedTitles(concept.related_titles);
  const related = relatedTitles.length > 0
    ? `<span class="concept-title-related">${relatedTitles.map(escapeHtml).join(', ')}</span>`
    : '';

  return `<a class="style-ontology" href="${conceptUrl(concept)}">
        <span class="concept-title">
          <span class="concept-title-main">${escapeHtml(concept.title)}</span>${related}
        </span>
        <span class="concept-note">${escapeHtml(summary)}</span>
      </a>`;
}

function renderConceptCard(concept) {
  const summary = summaryFromConcept(concept);
  const relatedTitles = normalizeRelatedTitles(concept.related_titles);
  const related = relatedTitles.length > 0
    ? `<span class="concept-title-related">${relatedTitles.map(escapeHtml).join(', ')}</span>`
    : '';

  return `        <a class="concept-card" href="${conceptUrl(concept)}">
          <span class="concept-title">
            <span class="concept-title-main">${escapeHtml(concept.title)}</span>${related}
          </span>
          <span class="concept-note">${escapeHtml(summary)}</span>
        </a>`;
}

function renderConceptIndexPage(concepts, conceptMap) {
  const cards = concepts.map((concept) => {
    const summary = summaryFromConcept(concept);
    const relatedTitles = normalizeRelatedTitles(concept.related_titles);
    const related = relatedTitles.length > 0
      ? `<span class="concept-title-related">${relatedTitles.map(escapeHtml).join(', ')}</span>`
      : '';
    const href = concept.section === 'style'
      ? `../style/${escapeAttribute(concept.slug)}.html`
      : `${escapeAttribute(concept.slug)}.html`;
    return `          <a class="concept-card" href="${href}">
            <span class="concept-title">
              <span class="concept-title-main">${escapeHtml(concept.title)}</span>${related}
            </span>
            <span class="concept-note">${escapeHtml(summary)}</span>
          </a>`;
  }).join('\n\n');

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Concept Map — Yasuaki Kameoka</title>
  <meta name="description" content="${escapeAttribute(conceptMap.description)}">

  <meta property="og:title" content="Concept Map — 亀岡恭昂">
  <meta property="og:description" content="${escapeAttribute(conceptMap.description)}">
  <meta property="og:type" content="article">
  <meta property="og:image" content="../images/OGP.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="../images/OGP.png">

  <link rel="stylesheet" href="../style.css">
  <script>(function(){var t=localStorage.getItem('theme')||'light';document.documentElement.setAttribute('data-theme',t);})();</script>
</head>
<body>

  <header>
    <a class="site-name" href="../index.html">Yasuaki Kameoka</a>
    <nav>
      <a href="../index.html">Home</a>
      <a href="../index.html#style">Style</a>
      <a href="../index.html#concepts">Concepts</a>
      <a href="../index.html#aspiration">Aspiration</a>
      <button class="theme-toggle" aria-label="ダークモード切替">☾</button>
    </nav>
  </header>

  <main>

    <section class="profile-section">
      <div class="article-header">
        <h1>Concept Map</h1>
        <p class="article-related-title">コンセプトの体系</p>
      </div>

      <div class="article-body concept-map-body">
        <blockquote class="concept-map-epigraph">
          <p>&quot;${escapeHtml(conceptMap.epigraph)}&quot;</p>
          <cite>(${escapeHtml(conceptMap.epigraph_attribution)})</cite>
        </blockquote>

${indent(renderMarkdown(stripTrailingChangelog(conceptMap.body_markdown)), 8)}
${indent(renderChangelog(extractChangelogEntries(conceptMap.body_markdown)), 8)}
      </div>

      <div class="concept-map-grid">
${cards}
      </div>

      <a class="back-link" href="../index.html">Back to Home</a>
    </section>

  </main>

  <footer>
    &copy; Yasuaki Kameoka / 2026
  </footer>

  <script src="../script.js"></script>
</body>
</html>
`;
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
  buildConcepts().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
