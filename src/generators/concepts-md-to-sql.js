import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';

const root = new URL('../../', import.meta.url);
const sourceDir = new URL('content/concepts/', root);
const outputPath = new URL('supabase/concepts-from-md.sql', root);

const files = (await readdir(sourceDir))
  .filter((file) => file.endsWith('.md') && !file.startsWith('_'))
  .sort();

const rows = [];

for (const file of files) {
  const raw = await readFile(new URL(file, sourceDir), 'utf8');
  const { data, body } = parseFrontmatter(raw);
  const concept = conceptFromMarkdown(body);
  const title = data.title || concept.title;

  if (!title) continue;

  const slug = data.slug || slugForConcept(title, concept.relatedTitle, file);
  const sortOrder = data.sort_order
    ? Number(data.sort_order)
    : sortOrderFromFilename(file, rows.length * 10 + 10);

  rows.push({
    slug,
    title,
    related_titles: parseList(data.related_titles) || (concept.relatedTitle ? [concept.relatedTitle] : []),
    body_markdown: body.trim(),
    summary_override: data.summary_override || null,
    sort_order: sortOrder,
    is_published: parseBoolean(data.is_published, true),
  });
}

const values = rows.map((row) => `  (
    ${sql(row.slug)},
    ${sql(row.title)},
    ${sqlTextArray(row.related_titles)},
    ${sql(row.body_markdown)},
    ${sql(row.summary_override)},
    ${row.sort_order},
    ${row.is_published ? 'true' : 'false'},
    ${row.is_published ? 'coalesce((select published_at from concepts where slug = ' + sql(row.slug) + '), now())' : 'null'}
  )`).join(',\n');

const sqlOutput = rows.length === 0
  ? '-- No concept Markdown files found in content/concepts/.\n'
  : `insert into concepts (slug, title, related_titles, body_markdown, summary_override, sort_order, is_published, published_at)
values
${values}
on conflict (slug) do update set
  title = excluded.title,
  related_titles = excluded.related_titles,
  body_markdown = excluded.body_markdown,
  summary_override = excluded.summary_override,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published,
  published_at = case
    when excluded.is_published then coalesce(concepts.published_at, excluded.published_at, now())
    else null
  end,
  updated_at = now();
`;

await mkdir(new URL('supabase/', root), { recursive: true });
await writeFile(outputPath, sqlOutput);
console.log(`Wrote ${rows.length} concepts to supabase/concepts-from-md.sql`);

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

function sql(value) {
  if (value === null || value === undefined || value === '') return 'null';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlTextArray(values) {
  const items = Array.isArray(values) ? values : [];
  if (items.length === 0) return "'{}'";
  return `array[${items.map(sql).join(', ')}]`;
}

function conceptFromMarkdown(markdown) {
  const lines = String(markdown ?? '').split(/\r?\n/);
  const start = lines.findIndex((line) => /^#{1,6}\s+Concept\s*$/i.test(line.trim()));
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
