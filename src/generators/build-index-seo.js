import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { escapeAttribute, escapeHtml } from '../lib/escape.js';
import {
  jsonLdScript,
  OGP_IMAGE,
  PERSON_ID,
  PERSON_NAME,
  PROFILE_IMAGE,
  SAME_AS,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from '../lib/site.js';

const root = new URL('../../', import.meta.url);

export async function buildIndexSeo() {
  const indexPath = new URL('index.html', root);
  const index = await readFile(indexPath, 'utf8');
  const startMarker = '<!-- seo:start -->';
  const endMarker = '<!-- seo:end -->';
  const start = index.indexOf(startMarker);
  const end = index.indexOf(endMarker);

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('SEO markers not found in index.html');
  }

  const section = renderIndexSeo();
  const next = `${index.slice(0, start + startMarker.length)}\n${section}\n  ${index.slice(end)}`;
  await writeFile(indexPath, next);
}

function renderIndexSeo() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}#website`,
        url: SITE_URL,
        name: SITE_NAME,
        alternateName: ['Yasuaki Kameoka', '亀岡恭昂'],
        inLanguage: 'ja',
        publisher: { '@id': PERSON_ID },
      },
      {
        '@type': 'ProfilePage',
        '@id': `${SITE_URL}#profile`,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: 'ja',
        isPartOf: { '@id': `${SITE_URL}#website` },
        mainEntity: { '@id': PERSON_ID },
      },
      {
        '@type': 'Person',
        '@id': PERSON_ID,
        name: PERSON_NAME,
        alternateName: ['Yasuaki Kameoka', '亀岡 恭昂'],
        givenName: '恭昂',
        familyName: '亀岡',
        url: SITE_URL,
        image: PROFILE_IMAGE,
        description: SITE_DESCRIPTION,
        jobTitle: [
          'Vice President, HERO Impact Capital',
          'Director, 東北大学 ZERO INSTITUTE',
          '百代スタジオ 代表取締役',
          '一般社団法人Fora 理事',
          '慶應義塾大学SFC研究所 上席所員',
        ],
        worksFor: [
          { '@type': 'Organization', name: 'HERO Impact Capital' },
          { '@type': 'Organization', name: '東北大学 ZERO INSTITUTE' },
          { '@type': 'Organization', name: '百代スタジオ' },
        ],
        affiliation: [
          { '@type': 'Organization', name: '一般社団法人Fora' },
          { '@type': 'Organization', name: '慶應義塾大学SFC研究所' },
        ],
        alumniOf: [
          { '@type': 'CollegeOrUniversity', name: '東京大学' },
        ],
        knowsAbout: ['科学技術政策', '研究・イノベーション', '教育', 'ディープテック・スタートアップ', '研究マネジメント'],
        sameAs: SAME_AS,
      },
    ],
  };

  return `  <title>${escapeHtml(SITE_NAME)}</title>
  <meta name="description" content="${escapeAttribute(SITE_DESCRIPTION)}">
  <link rel="canonical" href="${escapeAttribute(SITE_URL)}">

  <meta property="og:site_name" content="${escapeAttribute(SITE_NAME)}">
  <meta property="og:locale" content="ja_JP">
  <meta property="og:title" content="${escapeAttribute(SITE_NAME)}">
  <meta property="og:description" content="${escapeAttribute(SITE_DESCRIPTION)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeAttribute(SITE_URL)}">
  <meta property="og:image" content="${escapeAttribute(OGP_IMAGE)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="629">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeAttribute(SITE_NAME)}">
  <meta name="twitter:description" content="${escapeAttribute(SITE_DESCRIPTION)}">
  <meta name="twitter:image" content="${escapeAttribute(OGP_IMAGE)}">
  <link rel="icon" href="/favicon.png" type="image/png" sizes="192x192">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">

${indent(jsonLdScript(structuredData), 2)}`;
}

function indent(value, spaces) {
  const padding = ' '.repeat(spaces);
  return String(value).split('\n').map((line) => `${padding}${line}`).join('\n');
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  buildIndexSeo().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
