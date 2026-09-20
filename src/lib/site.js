export const SITE_URL = 'https://yasuakikameoka.github.io/';
export const SITE_NAME = '亀岡恭昂 / Yasuaki Kameoka';
export const PERSON_NAME = '亀岡恭昂';
export const PERSON_NAME_EN = 'Yasuaki Kameoka';
export const PERSON_ID = `${SITE_URL}#person`;
export const OGP_IMAGE = `${SITE_URL}images/OGP.png`;
export const PROFILE_IMAGE = `${SITE_URL}images/Profile.jpeg`;
export const SITE_DESCRIPTION = '亀岡恭昂（Yasuaki Kameoka）の公式プロフィール。HERO Impact Capital Vice President、東北大学 ZERO INSTITUTE Director、百代スタジオ 代表取締役、慶應義塾大学SFC研究所 上席所員。科学技術政策・研究とイノベーション・教育を領域に、Style / Concepts / Aspiration / Reflection を綴る。';
export const SAME_AS = [
  'https://www.linkedin.com/in/yasuakikameoka/',
  'https://researchmap.jp/yasuakikameoka',
  'https://www.facebook.com/yasuakikameoka/',
  'https://jglobal.jst.go.jp/detail?JGLOBAL_ID=202101017728853216',
];

export function absoluteUrl(path = '') {
  return `${SITE_URL}${String(path).replace(/^\/+/, '')}`;
}

export function canonicalFor(kind, slug) {
  const encodedSlug = slug === undefined ? '' : encodeURIComponent(String(slug));
  const paths = {
    home: '',
    'concept-map': 'concepts/',
    concept: `concepts/${encodedSlug}.html`,
    style: `style/${encodedSlug}.html`,
    'reflection-index': 'reflection/',
    reflection: `reflection/posts/${encodedSlug}.html`,
    aspiration: `aspirations/${encodedSlug}.html`,
  };

  if (!(kind in paths)) {
    throw new Error(`Unknown canonical kind: ${kind}`);
  }

  return absoluteUrl(paths[kind]);
}

export function jsonLdScript(obj) {
  const json = JSON.stringify(obj, null, 2).replaceAll('</', '<\\/');
  return `<script type="application/ld+json">\n${json}\n</script>`;
}

export function personRef() {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: PERSON_NAME,
    alternateName: PERSON_NAME_EN,
    url: SITE_URL,
  };
}

export function formatDate(date) {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return '';

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
