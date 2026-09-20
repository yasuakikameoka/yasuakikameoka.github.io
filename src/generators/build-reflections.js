import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { loadReflections } from '../lib/reflections.js';
import { renderReflectionMarkdown } from '../lib/markdown.js';
import { escapeAttribute, escapeHtml } from '../lib/escape.js';
import { canonicalFor, jsonLdScript, OGP_IMAGE, personRef, PERSON_NAME, SITE_NAME, SITE_URL } from '../lib/site.js';

const root = new URL('../../', import.meta.url);

export async function buildReflections() {
  const reflections = await loadReflections();
  const outputDir = new URL('reflection/posts/', root);

  await mkdir(outputDir, { recursive: true });
  await clearGeneratedReflectionPages(outputDir);

  if (reflections.length > 0) {
    const template = await readFile(new URL('src/templates/reflection.html', root), 'utf8');

    for (const reflection of reflections) {
      const description = reflection.description ?? reflection.title;
      const canonicalUrl = canonicalFor('reflection', reflection.slug);
      const dateModified = reflection.date && reflection.modifiedAt < reflection.date
        ? reflection.date
        : reflection.modifiedAt;
      const dateHtml = reflection.date
        ? `<time class="article-date" datetime="${escapeAttribute(reflection.date)}">${escapeHtml(formatDate(reflection.date))}</time>`
        : '';
      const article = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        '@id': `${canonicalUrl}#article`,
        mainEntityOfPage: canonicalUrl,
        url: canonicalUrl,
        headline: reflection.title,
        description,
        inLanguage: 'ja',
        image: OGP_IMAGE,
        ...(reflection.date ? { datePublished: reflection.date } : {}),
        dateModified,
        author: personRef(),
        publisher: personRef(),
        isPartOf: { '@id': `${SITE_URL}#website` },
      };

      const html = template
        .replaceAll('{{title}}', () => escapeHtml(reflection.title))
        .replaceAll('{{description}}', () => escapeAttribute(description))
        .replaceAll('{{canonicalUrl}}', () => escapeAttribute(canonicalUrl))
        .replaceAll('{{jsonLd}}', () => jsonLdScript(article))
        .replaceAll('{{date}}', () => dateHtml)
        .replaceAll('{{body}}', () => indent(renderReflectionMarkdown(reflection.body_markdown), 8));

      await writeFile(new URL(`reflection/posts/${reflection.slug}.html`, root), html);
    }
  }

  await writeFile(new URL('reflection/index.html', root), renderReflectionIndexPage(reflections));
  await updateIndexReflections(reflections);

  console.log(`Built ${reflections.length} reflection posts`);
  return reflectionsBySlug(reflections);
}

async function clearGeneratedReflectionPages(outputDir) {
  const files = await readdir(outputDir);
  await Promise.all(files
    .filter((file) => file.endsWith('.html'))
    .map((file) => unlink(new URL(file, outputDir))));
}

function reflectionsBySlug(reflections) {
  const map = new Map();
  for (const r of reflections) {
    for (const slug of r.references) {
      if (!map.has(slug)) map.set(slug, []);
      map.get(slug).push(r);
    }
  }
  return map;
}

async function updateIndexReflections(reflections) {
  const indexPath = new URL('index.html', root);
  const index = await readFile(indexPath, 'utf8');
  const startMarker = '<!-- reflections:start -->';
  const endMarker = '<!-- reflections:end -->';
  const start = index.indexOf(startMarker);
  const end = index.indexOf(endMarker);

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Reflection markers not found in index.html');
  }

  const section = renderHomeReflectionSection(reflections);
  const next = `${index.slice(0, start + startMarker.length)}\n${section}\n    ${index.slice(end)}`;
  await writeFile(indexPath, next);
}

function renderHomeReflectionSection(reflections) {
  const cards = renderReflectionCards(reflections.slice(0, 3), 'reflection/posts/', false);

  return `    <section id="reflection">
      <p class="section-label">Reflection</p>
      <div class="resonances-grid reflection-home-grid">
${cards || '        <p class="section-intro">公開中のReflectionはまだありません。</p>'}
      </div>
      <a class="pub-link reflection-index-link" href="reflection/index.html">View All</a>
    </section>`;
}

function renderReflectionIndexPage(reflections) {
  const canonicalUrl = canonicalFor('reflection-index');
  const title = `Reflection — ${SITE_NAME}`;
  const socialTitle = `Reflection — ${PERSON_NAME}`;
  const description = '亀岡恭昂のReflection一覧です。';
  const collectionPage = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    url: canonicalUrl,
    name: 'Reflection',
    description,
    inLanguage: 'ja',
    isPartOf: { '@id': `${SITE_URL}#website` },
    author: personRef(),
    publisher: personRef(),
  };
  const cards = renderReflectionCards(reflections, 'posts/', false);

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeAttribute(description)}">
  <link rel="canonical" href="${escapeAttribute(canonicalUrl)}">

  <meta property="og:site_name" content="${escapeAttribute(SITE_NAME)}">
  <meta property="og:locale" content="ja_JP">
  <meta property="og:title" content="${escapeAttribute(socialTitle)}">
  <meta property="og:description" content="${escapeAttribute(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeAttribute(canonicalUrl)}">
  <meta property="og:image" content="${escapeAttribute(OGP_IMAGE)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="629">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeAttribute(socialTitle)}">
  <meta name="twitter:description" content="${escapeAttribute(description)}">
  <meta name="twitter:image" content="${escapeAttribute(OGP_IMAGE)}">
  <link rel="icon" href="/favicon.png" type="image/png" sizes="192x192">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
${indent(jsonLdScript(collectionPage), 2)}

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
        <h1>Reflection</h1>
        <p class="article-related-title">経験と思考の記録</p>
      </div>

      <div class="resonances-grid reflection-home-grid reflection-index-grid">
${cards || '        <p class="section-intro">公開中のReflectionはまだありません。</p>'}
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

function renderReflectionCards(reflections, hrefPrefix, showNote = true) {
  return reflections.map((reflection) => {
    const dateHtml = reflection.date
      ? `\n          <time class="reflection-date" datetime="${escapeAttribute(reflection.date)}">${escapeHtml(formatDate(reflection.date))}</time>`
      : '';
    const noteHtml = showNote && reflection.description
      ? `\n          <span class="reflection-note">${escapeHtml(reflection.description)}</span>`
      : '';

    return `        <a class="reflection-card" href="${escapeAttribute(hrefPrefix)}${escapeAttribute(reflection.slug)}.html">
          <span class="reflection-title">${escapeHtml(reflection.title)}</span>${dateHtml}${noteHtml}
        </a>`;
  }).join('\n\n');
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function indent(value, spaces) {
  const padding = ' '.repeat(spaces);
  return String(value).split('\n').map((line) => `${padding}${line}`).join('\n');
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  buildReflections().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
