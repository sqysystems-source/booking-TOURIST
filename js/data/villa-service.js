/**
 * Villa data-access layer. Pages and UI modules talk ONLY to this file;
 * they never know whether data came from Firestore or the demo set.
 *
 *   getDataMode()            -> { mode: 'demo' | 'live', ... }
 *   getVillas()              -> all published villas
 *   getFeaturedVillas(n)     -> up to n published, featured villas
 *   getVillaBySlug(slug)     -> villa or null (unknown slug)
 *   countByIsland(villas)    -> Map(islandSlug -> count)
 *   resetCache()             -> used by "Try again" buttons
 *
 * Failures in live mode throw DataError. They are never replaced with demo data.
 */
import { SITE } from '../config/site-config.js';
import { isFirebaseConfigured } from '../config/firebase-config.js';
import { normalizeVilla, normalizeVillas, slugify } from './schema-map.js';
import { DataError, DATA_MESSAGES } from './data-error.js';
import * as demoSource from './sources/demo-source.js';

const warn = (message) => console.warn(`[Villa Aesthetic] ${message}`);

export function getDataMode() {
  const setting = SITE.dataSource;
  const configured = isFirebaseConfigured();
  if (setting === 'demo') return { mode: 'demo', configured, reason: 'dataSource is set to "demo".' };
  if (setting === 'firestore') return { mode: 'live', configured, reason: 'dataSource is set to "firestore".' };
  return configured
    ? { mode: 'live', configured, reason: 'Firebase is configured.' }
    : { mode: 'demo', configured, reason: 'Firebase is not configured.' };
}

async function getSource() {
  if (getDataMode().mode === 'demo') return demoSource;
  if (!isFirebaseConfigured()) throw new DataError('config', DATA_MESSAGES.config);
  return import('./sources/firestore-source.js'); // loaded lazily: demo mode never touches Firebase
}

let allPromise = null;

export function resetCache() {
  allPromise = null;
}

export function getVillas() {
  if (!allPromise) {
    allPromise = (async () => {
      const source = await getSource();
      const records = await source.fetchAllPublished();
      return normalizeVillas(records, warn);
    })();
    allPromise.catch(() => {
      allPromise = null; // never cache a failure
    });
  }
  return allPromise;
}

export async function getFeaturedVillas(limit = SITE.featuredCount) {
  const villas = await getVillas();
  return villas.filter((villa) => villa.featured).slice(0, limit);
}

export async function getVillaBySlug(slug) {
  const wanted = String(slug ?? '').trim();
  if (!wanted) return null;

  // Reuse the full list when it is already loaded; otherwise query just this villa.
  if (allPromise) {
    try {
      const villas = await allPromise;
      return villas.find((villa) => villa.slug === wanted) ?? null;
    } catch {
      /* fall through to a direct lookup */
    }
  }
  const source = await getSource();
  const record = await source.fetchBySlug(wanted);
  if (!record) return null;
  const villa = normalizeVilla(record.raw, record.docId, warn);
  return villa && villa.published ? villa : null;
}

export function countByIsland(villas) {
  const counts = new Map();
  villas.forEach((villa) => {
    const key = slugify(villa.island);
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return counts;
}
