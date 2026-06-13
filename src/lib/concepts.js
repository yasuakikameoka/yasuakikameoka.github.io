import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function loadConcepts() {
  const concepts = await loadFromMarkdown();

  return concepts
    .filter((concept) => concept.is_published !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

async function loadFromMarkdown() {
  const sourceDir = conceptSourceDirectory();
  const files = await readdir(sourceDir);

  const concepts = [];
  for (const file of files.filter((name) => name.endsWith('.md') && !name.startsWith('_')).sort()) {
    const raw = await readFile(new URL(file, sourceDir), 'utf8');
    const { data, body } = parseFrontmatter(raw);
    const concept = conceptFromMarkdown(body);

    if (!data.title && !concept.title) continue;

    const title = data.title || concept.title;
    const slug = data.slug || slugForConcept(title, concept.relatedTitle, file);

    const sortOrder = data.sort_order
      ? Number(data.sort_order)
      : sortOrderFromFilename(file, concepts.length * 10 + 10);
    concepts.push({
      slug,
      title,
      related_titles: parseList(data.related_titles) || (concept.relatedTitle ? [concept.relatedTitle] : []),
      body_markdown: body.trim(),
      summary_override: data.summary_override || null,
      sort_order: sortOrder,
      is_published: parseBoolean(data.is_published, true),
    });
  }

  return concepts;
}

function conceptSourceDirectory() {
  if (process.env.CONCEPTS_DIR) {
    return pathToFileURL(`${resolve(process.env.CONCEPTS_DIR)}/`);
  }

  return new URL('../../content/concepts/', import.meta.url);
}

function parseFrontmatter(raw) {
  if (!raw.startsWith('---\n')) {
    return { data: {}, body: raw };
  }

  const end = raw.indexOf('\n---', 4);
  if (end === -1) {
    throw new Error('Frontmatter closing --- not found');
  }

  const frontmatter = raw.slice(4, end).trim();
  const body = raw.slice(end + 4).replace(/^\r?\n/, '');
  const data = {};

  for (const line of frontmatter.split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    data[key] = value === '' ? null : stripQuotes(value);
  }

  return { data, body };
}

function stripQuotes(value) {
  return String(value).replace(/^["']|["']$/g, '');
}

function parseBoolean(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
}

function parseList(value) {
  if (!value) return null;
  return String(value)
    .split(/(?<!\\),/)
    .map((item) => item.replaceAll('\\,', ',').trim())
    .filter(Boolean);
}

function conceptFromMarkdown(markdown) {
  const lines = String(markdown ?? '').split(/\r?\n/);
  const start = lines.findIndex((line) => /^#{1,6}\s+(?:Title|Concept)\s*$/i.test(line.trim()));
  if (start === -1) return {};

  const values = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (/^#{1,6}\s+/.test(line)) break;
    if (line) values.push(line);
  }

  return {
    title: values[0] || '',
    relatedTitle: values[1] || '',
  };
}

function sortOrderFromFilename(file, fallback) {
  const normalized = file.normalize('NFKC');
  const match = normalized.match(/^(\d+)/);
  if (!match) return fallback;
  return Number(match[1]) * 10;
}

function slugForConcept(title, relatedTitle, file) {
  const known = new Map([
    ['スタイルの存在論', 'style-ontology'],
    ['動静一如システム', 'movement-stillness-nonduality-system'],
    ['代替不可能性', 'irreplaceability'],
    ['歴史的制作的自己', 'historical-poietic-self'],
    ['栄光装置', 'apparatus-of-glory'],
    ['志との戯れ', 'aspiration-play'],
    ['ペイオフ駆動', 'payoff-driven'],
  ]);

  if (known.has(title)) return known.get(title);

  const base = relatedTitle || title || file.replace(/\.md$/, '');
  return String(base)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || file.replace(/\.md$/, '');
}
