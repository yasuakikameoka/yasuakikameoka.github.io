import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { extractSection, removeConceptMetadataSections } from './markdown.js';
import { formatDate } from './site.js';

export async function loadAspirations() {
  const aspirations = await loadFromMarkdown();
  return aspirations
    .filter((a) => a.is_published !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

async function loadFromMarkdown() {
  const sourceDir = aspirationSourceDirectory();
  let files;
  try {
    files = await readdir(sourceDir);
  } catch {
    return [];
  }

  const aspirations = [];
  for (const file of files.filter((name) => name.endsWith('.md') && !name.startsWith('_')).sort()) {
    const sourceUrl = new URL(file, sourceDir);
    const [raw, sourceStat] = await Promise.all([
      readFile(sourceUrl, 'utf8'),
      stat(sourceUrl),
    ]);
    const { data, body } = parseFrontmatter(raw);

    const title = data.title || firstSectionLine(body, 'Title');
    if (!title) continue;

    const slug = data.slug;
    if (!slug) continue;

    const sortOrder = data.sort_order
      ? Number(data.sort_order)
      : sortOrderFromFilename(file);
    const bodyMarkdown = removeConceptMetadataSections(body);

    aspirations.push({
      slug,
      title,
      related_titles: parseList(data.related_titles),
      summary: firstSectionLine(body, 'Summary') || data.summary || '',
      sort_order: sortOrder,
      body_markdown: bodyMarkdown,
      source_markdown: body.trim(),
      hasBody: bodyMarkdown.trim() !== '',
      is_published: parseBoolean(data.is_published, true),
      sourcePath: fileURLToPath(sourceUrl),
      modifiedAt: formatDate(sourceStat.mtime),
    });
  }

  return aspirations;
}

function firstSectionLine(markdown, heading) {
  return extractSection(markdown, heading).split(/\r?\n/)[0]?.trim() || '';
}

function aspirationSourceDirectory() {
  if (process.env.ASPIRATIONS_DIR) {
    return pathToFileURL(`${resolve(process.env.ASPIRATIONS_DIR)}/`);
  }
  return new URL('../../content/aspirations/', import.meta.url);
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

function parseBoolean(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
}

function parseList(value) {
  if (!value) return [];
  return String(value)
    .split(/(?<!\\),/)
    .map((item) => item.replaceAll('\\,', ',').trim())
    .filter(Boolean);
}

function sortOrderFromFilename(file) {
  const normalized = file.normalize('NFKC');
  const match = normalized.match(/^(\d+)/);
  if (!match) return 999;
  return Number(match[1]);
}
