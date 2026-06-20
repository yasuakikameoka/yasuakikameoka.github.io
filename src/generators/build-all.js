import { buildReflections } from './build-reflections.js';
import { buildConcepts } from './build-concepts.js';
import { buildAspirations } from './build-aspirations.js';
import { loadConcepts } from '../lib/concepts.js';
import { loadAspirations } from '../lib/aspirations.js';
import { loadReflections } from '../lib/reflections.js';

const reflectionsBySlug = await buildReflections();
await buildConcepts(reflectionsBySlug);
await buildAspirations(reflectionsBySlug);
await validateReferences();

async function validateReferences() {
  const [concepts, aspirations, reflections] = await Promise.all([
    loadConcepts(),
    loadAspirations(),
    loadReflections(),
  ]);

  const knownSlugs = new Set([
    ...concepts.map((c) => c.slug),
    ...aspirations.map((a) => a.slug),
  ]);

  let hasWarnings = false;
  for (const reflection of reflections) {
    for (const ref of reflection.references) {
      if (!knownSlugs.has(ref)) {
        console.warn(`[warn] reflection "${reflection.slug}": unknown reference "${ref}"`);
        hasWarnings = true;
      }
    }
  }

  if (!hasWarnings) {
    console.log('All reflection references validated ✓');
  }
}
