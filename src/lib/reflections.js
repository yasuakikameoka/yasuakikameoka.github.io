import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function loadReflections() {
  const reflections = await loadFromMarkdown();
  return reflections
    .filter((r) => r.is_published !== false)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
}

export async function loadReflectionsBySlug() {
  const reflections = await loadReflections();
  const bySlug = new Map();
  for (const r of reflections) {
    for (const slug of r.references) {
      if (!bySlug.has(slug)) bySlug.set(slug, []);
      bySlug.get(slug).push(r);
    }
  }
  return bySlug;
}

async function loadFromMarkdown() {
  const sourceDir = reflectionSourceDirectory();
  let files;
  try {
    files = await readdir(sourceDir);
  } catch {
    return [];
  }

  const reflections = [];
  for (const file of files.filter((name) => name.endsWith('.md') && !name.startsWith('_')).sort()) {
    const raw = await readFile(new URL(file, sourceDir), 'utf8');
    const { data, body } = parseFrontmatter(raw);
    if (!data.title) continue;

    const slug = data.slug || slugify(data.title);
    const tags = parseList(data.tags);
    const styles = parseList(data.styles);
    const concepts = parseList(data.concepts);
    const aspirations = parseList(data.aspirations);
    reflections.push({
      slug,
      title: data.title,
      date: data.date || null,
      description: data.description || null,
      tags,
      styles,
      concepts,
      aspirations,
      references: [...new Set([...tags, ...styles, ...concepts, ...aspirations])],
      body_markdown: body.trim(),
      is_published: parseBoolean(data.is_published, true),
    });
  }
  return reflections;
}

function reflectionSourceDirectory() {
  if (process.env.REFLECTIONS_DIR) {
    return pathToFileURL(`${resolve(process.env.REFLECTIONS_DIR)}/`);
  }
  return new URL('../../content/reflections/', import.meta.url);
}

function parseFrontmatter(raw) {
  if (!raw.startsWith('---\n')) {
    return { data: {}, body: raw };
  }
  const end = raw.indexOf('\n---', 4);
  if (end === -1) throw new Error('Frontmatter closing --- not found');

  const frontmatter = raw.slice(4, end).trim();
  const body = raw.slice(end + 4).replace(/^\r?\n/, '');
  const data = {};

  for (const line of frontmatter.split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    data[key] = value === '' ? null : String(value).replace(/^["']|["']$/g, '');
  }
  return { data, body };
}

function parseList(value) {
  if (!value) return [];
  return String(value)
    .split(/(?<!\\),/)
    .map((item) => item.replaceAll('\\,', ',').trim())
    .filter(Boolean);
}

function parseBoolean(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
}

function slugify(title) {
  return String(title)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled';
}
