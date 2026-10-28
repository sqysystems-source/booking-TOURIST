import { DEMO_VILLAS } from '../demo-villas.js';

/**
 * Demo data source. Returns raw records in the same { raw, docId } shape the
 * Firestore source returns, so both go through the same normalizer.
 * A short delay makes loading states visible and realistic.
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchAllPublished() {
  await delay(250);
  return DEMO_VILLAS.filter((villa) => villa.published === true).map((raw) => ({ raw, docId: raw.id }));
}

export async function fetchBySlug(slug) {
  const all = await fetchAllPublished();
  return all.find(({ raw }) => raw.slug === slug) ?? null;
}
