import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { loadReflections } from '../lib/reflections.js';
import { renderMarkdown } from '../lib/markdown.js';
import { escapeAttribute, escapeHtml } from '../lib/escape.js';

const root = new URL('../../', import.meta.url);

export async function buildReflections() {
  const reflections = await loadReflections();
  const outputDir = new URL('reflection/posts/', root);

  await mkdir(outputDir, { recursive: true });
  await clearGeneratedReflectionPages(outputDir);

  if (reflections.length === 0) {
    console.log('No reflection posts found, skipping');
    return new Map();
  }

  const template = await readFile(new URL('src/templates/reflection.html', root), 'utf8');

  for (const reflection of reflections) {
    const dateHtml = reflection.date
      ? `<time class="article-date" datetime="${escapeAttribute(reflection.date)}">${escapeHtml(formatDate(reflection.date))}</time>`
      : '';

    const html = template
      .replaceAll('{{title}}', escapeHtml(reflection.title))
      .replaceAll('{{description}}', escapeAttribute(reflection.description ?? reflection.title))
      .replaceAll('{{date}}', dateHtml)
      .replaceAll('{{body}}', indent(renderMarkdown(reflection.body_markdown), 8));

    await writeFile(new URL(`reflection/posts/${reflection.slug}.html`, root), html);
  }

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
