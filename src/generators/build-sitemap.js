import { execFileSync } from 'node:child_process';
import { readdir, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { loadAspirations } from '../lib/aspirations.js';
import { loadConceptMap, loadConcepts } from '../lib/concepts.js';
import { loadReflections } from '../lib/reflections.js';
import { canonicalFor, formatDate } from '../lib/site.js';

const root = new URL('../../', import.meta.url);
const rootPath = fileURLToPath(root);
const RESERVED_OUTPUT_PATHS = new Set(['concepts/index.html']);

export async function buildSitemap() {
  const [concepts, conceptMap, reflections, aspirations] = await Promise.all([
    loadConcepts(),
    loadConceptMap(),
    loadReflections(),
    loadAspirations(),
  ]);
  const outputPaths = await existingHtmlPaths([
    ['', new URL('.', root)],
    ['concepts/', new URL('concepts/', root)],
    ['style/', new URL('style/', root)],
    ['reflection/', new URL('reflection/', root)],
    ['reflection/posts/', new URL('reflection/posts/', root)],
    ['aspirations/', new URL('aspirations/', root)],
  ]);

  const generatedConcepts = generatedPages(
    concepts,
    (concept) => `${concept.section === 'style' ? 'style' : 'concepts'}/${concept.slug}.html`,
    outputPaths,
  );
  const generatedReflections = generatedPages(
    reflections,
    (reflection) => `reflection/posts/${reflection.slug}.html`,
    outputPaths,
  );
  const generatedAspirations = generatedPages(
    aspirations,
    (aspiration) => `aspirations/${aspiration.slug}.html`,
    outputPaths,
  );

  const pages = [
    {
      loc: canonicalFor('home'),
      outputPath: 'index.html',
      sourceLastmod: null,
      fallbackToOutputMtime: true,
    },
    {
      loc: canonicalFor('concept-map'),
      outputPath: 'concepts/index.html',
      sourceLastmod: latestDate([conceptMap.modifiedAt, ...generatedConcepts.map(({ source }) => source.modifiedAt)]),
    },
    ...generatedConcepts
      .filter(({ source }) => source.section === 'concept')
      .map(({ source, outputPath }) => ({
        loc: canonicalFor('concept', source.slug),
        outputPath,
        sourceLastmod: source.modifiedAt,
      })),
    ...generatedConcepts
      .filter(({ source }) => source.section === 'style')
      .map(({ source, outputPath }) => ({
        loc: canonicalFor('style', source.slug),
        outputPath,
        sourceLastmod: source.modifiedAt,
      })),
    {
      loc: canonicalFor('reflection-index'),
      outputPath: 'reflection/index.html',
      sourceLastmod: latestDate(generatedReflections.map(({ source }) => source.modifiedAt)),
    },
    ...generatedReflections.map(({ source, outputPath }) => ({
      loc: canonicalFor('reflection', source.slug),
      outputPath,
      sourceLastmod: source.modifiedAt,
    })),
    ...generatedAspirations.map(({ source, outputPath }) => ({
      loc: canonicalFor('aspiration', source.slug),
      outputPath,
      sourceLastmod: source.modifiedAt,
    })),
  ].filter(({ outputPath }) => outputPaths.has(outputPath));

  const entries = [];
  for (const page of pages) {
    entries.push({
      loc: page.loc,
      lastmod: await pageLastModified(page),
    });
  }

  const xml = renderSitemap(entries);
  await writeFile(new URL('sitemap.xml', root), xml);
  console.log(`Built sitemap with ${entries.length} URLs`);
  return entries;
}

async function existingHtmlPaths(directories) {
  const paths = new Set();
  await Promise.all(directories.map(async ([prefix, directory]) => {
    try {
      const files = await readdir(directory);
      for (const file of files) {
        if (file.endsWith('.html')) paths.add(`${prefix}${file}`);
      }
    } catch {
      // A missing output directory simply contributes no generated pages.
    }
  }));
  return paths;
}

function generatedPages(items, outputPathFor, outputPaths) {
  const byOutputPath = new Map();
  for (const source of items) {
    const outputPath = outputPathFor(source);
    if (outputPaths.has(outputPath) && !RESERVED_OUTPUT_PATHS.has(outputPath)) {
      // Generators write in this same order, so the last colliding slug owns the file.
      byOutputPath.set(outputPath, { source, outputPath });
    }
  }
  return [...byOutputPath.values()];
}

function latestDate(values) {
  return values.filter(Boolean).sort().at(-1) ?? '';
}

function gitPageDate(outputPath) {
  try {
    const status = execFileSync('git', ['status', '--porcelain', '--', outputPath], {
      cwd: rootPath,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

    if (status) return todayInJst();

    const committedDate = execFileSync('git', ['log', '-1', '--format=%cs', '--', outputPath], {
      cwd: rootPath,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(committedDate)) return committedDate;
  } catch {
    // A missing or unavailable git history contributes no page date.
  }

  return null;
}

async function pageLastModified({ sourceLastmod, outputPath, fallbackToOutputMtime = false }) {
  const lastmod = latestDate([sourceLastmod, gitPageDate(outputPath)]);
  if (lastmod || !fallbackToOutputMtime) return lastmod;

  try {
    const outputStat = await stat(new URL(outputPath, root));
    return formatDate(outputStat.mtime);
  } catch {
    return todayInJst();
  }
}

function todayInJst(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function renderSitemap(entries) {
  const urls = entries.map(({ loc, lastmod }) => {
    const lastmodLine = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : '';
    return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmodLine}\n  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  buildSitemap().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
