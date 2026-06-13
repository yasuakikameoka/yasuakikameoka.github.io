import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { loadConcepts } from '../lib/concepts.js';
import { escapeAttribute, escapeHtml } from '../lib/escape.js';
import { renderConceptMarkdown, summaryFromConcept } from '../lib/markdown.js';

const root = new URL('../../', import.meta.url);
const conceptMapDescription = 'コンセプトを、個々人の人生からシステムへ向かう一つの道筋として読むための地図。';
const conceptMapEpigraph = {
  quote: 'Reading maketh a full man, conference a ready man, and writing an exact man.',
  attribution: 'フランシス・ベーコン',
};
const conceptMapParagraphs = [
  'コンセプトは「眼鏡」のようなものだと思う。新しいコンセプトを手に入れることで、それまでと同じ世界に生きているのに、いままで見えなかったものが見えてくる。心惹かれるコンセプトを言葉として定着させ身体に馴染ませることで自然と納得のゆく人生を送ることができる。',
  'コンセプトは、人生・世界、そしてその「あわい」を描く。',
  '人生と世界を違う角度で捉える２つのコンセプトが基盤となる。『スタイルの存在論』は人生の捉え方を「目的」「使命」「義務」から解放し、「どのように」生きるかという問いを投げかける。『動静一如システム』は、この世界のことを「動」と「静」が一体となったシステムとして捉える視座を意味する。',
  'つぎに人生と世界の「あわい」を描く３つのコンセプトが続く。『代替不可能性』は、この私の固有性が「歴史性」と「関係性」によって支えられていることを示す。『歴史的制作的自己』は、代替不可能な自己が世界の素材を引き受けて制作し、制作物に触発されながら変容する運動を捉える。『栄光装置』は、この世界を「王国」と「オイコノミア」からなる統治機械として捉え、そのエンジンとして、「栄化」という人間の実践があることを明るみに出す。',
  'これまでみてきたコンセプトにはすべて「時間」が流れている。それを踏まえて歴史的世界の中で生きる一人の人間としての「時間」との関わりを考えるのが最後のコンセプト群である。『志との戯れ』は、歴史的制作的自己が、統治機械に内蔵される栄光装置から発せられる栄化・命令に捕獲されないための実践である。『ペイオフ駆動』は、不確実な世界で、未来に向けて、どのように賭けるかを考えるための一つの基準となる。',
  'いつの時代も世界は複雑で不確実である。だからこそ、世界は美しく、人生は味わい深くなる。いまここにしかない世界の美しさに見とれ、たった一回しか生きることのできないこの人生を心ゆくまで味わう。コンセプトは、ほかでもなく、そのためにある。',
];

export async function buildConcepts() {
  const concepts = await loadConcepts();
  const template = await readFile(new URL('src/templates/concept.html', root), 'utf8');

  await mkdir(new URL('concepts/', root), { recursive: true });
  await clearGeneratedConceptPages();

  for (const concept of concepts) {
    const summary = summaryFromConcept(concept);
    const relatedTitles = normalizeRelatedTitles(concept.related_titles);
    const relatedTitlesHtml = relatedTitles.length > 0
      ? `<p class="article-related-title">${relatedTitles.map(escapeHtml).join(' / ')}</p>`
      : '';
    const html = template
      .replaceAll('{{title}}', escapeHtml(concept.title))
      .replaceAll('{{description}}', escapeAttribute(summary))
      .replaceAll('{{slug}}', encodeURIComponent(concept.slug))
      .replaceAll('{{relatedTitles}}', relatedTitlesHtml)
      .replaceAll('{{body}}', indent(renderConceptMarkdown(concept.body_markdown), 8));

    await writeFile(new URL(`concepts/${concept.slug}.html`, root), html);
  }

  await writeFile(new URL('concepts/index.html', root), renderConceptIndexPage(concepts));
  await updateIndexConcepts(concepts);
  console.log(`Built ${concepts.length} concept pages`);
}

async function clearGeneratedConceptPages() {
  const outputDir = new URL('concepts/', root);
  const files = await readdir(outputDir);

  await Promise.all(files
    .filter((file) => file.endsWith('.html'))
    .map((file) => unlink(new URL(file, outputDir))));
}

async function updateIndexConcepts(concepts) {
  const indexPath = new URL('index.html', root);
  const index = await readFile(indexPath, 'utf8');
  const startMarker = '<!-- concepts:start -->';
  const endMarker = '<!-- concepts:end -->';
  const start = index.indexOf(startMarker);
  const end = index.indexOf(endMarker);

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Concept markers not found in index.html');
  }

  const section = renderConceptSection(concepts);
  const next = `${index.slice(0, start + startMarker.length)}\n${section}\n    ${index.slice(end)}`;
  await writeFile(indexPath, next);
}

function renderConceptSection(concepts) {
  const byTitle = new Map(concepts.map((concept) => [concept.title, concept]));
  const styleOntology = requireConcept(byTitle, 'スタイルの存在論');
  const styleConcepts = ['歴史的制作的自己', '志との戯れ', 'ペイオフ駆動']
    .map((title) => requireConcept(byTitle, title));
  const lensConcepts = ['動静一如システム', '栄光装置', '代替不可能性']
    .map((title) => requireConcept(byTitle, title));

  return `    <section id="style" class="style-core">
      <p class="section-label">Style</p>
      ${renderFeaturedConcept(styleOntology)}
      <div class="concept-grid concept-grid-three">
${styleConcepts.map(renderConceptCard).join('\n\n')}
      </div>
    </section>

    <section id="concepts">
      <p class="section-label">Concepts</p>
      <p class="section-intro">人生と世界を見るための、三つの視座。</p>
      <div class="concept-grid concept-grid-three">
${lensConcepts.map(renderConceptCard).join('\n\n')}
      </div>
    </section>`;
}

function renderFeaturedConcept(concept) {
  const summary = summaryFromConcept(concept);
  const relatedTitles = normalizeRelatedTitles(concept.related_titles);
  const related = relatedTitles.length > 0
    ? `<span class="concept-title-related">${relatedTitles.map(escapeHtml).join(', ')}</span>`
    : '';

  return `<a class="style-ontology" href="concepts/${escapeAttribute(concept.slug)}.html">
        <span class="style-ontology-kicker">An ontology of style</span>
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

  return `        <a class="concept-card" href="concepts/${escapeAttribute(concept.slug)}.html">
          <span class="concept-title">
            <span class="concept-title-main">${escapeHtml(concept.title)}</span>${related}
          </span>
          <span class="concept-note">${escapeHtml(summary)}</span>
        </a>`;
}

function requireConcept(byTitle, title) {
  const concept = byTitle.get(title);
  if (!concept) throw new Error(`Required concept not found: ${title}`);
  return concept;
}

function renderConceptIndexPage(concepts) {
  const cards = concepts.map((concept) => {
    const summary = summaryFromConcept(concept);
    const relatedTitles = normalizeRelatedTitles(concept.related_titles);
    const related = relatedTitles.length > 0
      ? `<span class="concept-title-related">${relatedTitles.map(escapeHtml).join(', ')}</span>`
      : '';
    return `          <a class="concept-card" href="${escapeAttribute(concept.slug)}.html">
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
  <meta name="description" content="${escapeAttribute(conceptMapDescription)}">

  <meta property="og:title" content="Concept Map — 亀岡恭昂">
  <meta property="og:description" content="${escapeAttribute(conceptMapDescription)}">
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
          <p>&quot;${escapeHtml(conceptMapEpigraph.quote)}&quot;</p>
          <cite>(${escapeHtml(conceptMapEpigraph.attribution)})</cite>
        </blockquote>

${conceptMapParagraphs.map((paragraph) => `        <p>${escapeHtml(paragraph)}</p>`).join('\n\n')}
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
