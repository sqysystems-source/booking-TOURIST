import {validateVideo} from './video-model.js';
/**
 * Schema mapping: the single place that knows how a stored villa document
 * (Firestore or demo) maps to the shape the website uses.
 *
 * If your existing admin panel stores fields under different names, change the
 * values on the right-hand side of FIELD_MAP only. Dotted paths are supported
 * for nested data, e.g. `priceFrom: 'pricing.from'`.
 *
 * The three FIREBASE-QUERY fields (slug, published, featured) are also used to
 * build Firestore queries, so they must be top-level, directly queryable fields.
 */
import { resolveAmenity } from './amenities.js';

export const FIELD_MAP = {
  id: 'id',
  slug: 'slug',
  name: 'name',
  island: 'island',
  area: 'area',
  description: 'description',
  shortDescription: 'shortDescription',
  images: 'images',
  maxGuests: 'maxGuests',
  bedrooms: 'bedrooms',
  bathrooms: 'bathrooms',
  amenities: 'amenities',
  priceFrom: 'priceFrom',
  currency: 'currency',
  featured: 'featured',
  published: 'published',
};

const DEFAULT_CURRENCY = 'EUR';
const SHORT_DESCRIPTION_LENGTH = 150;

function pick(raw, path) {
  return String(path)
    .split('.')
    .reduce((value, key) => (value === null || value === undefined ? undefined : value[key]), raw);
}

function read(raw, field) {
  return pick(raw, FIELD_MAP[field]);
}

const toText = (value) => (typeof value === 'string' ? value.trim() : '');

function toCount(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

function toPrice(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function slugify(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Only http(s) and same-site relative URLs are allowed as image sources. */
export function safeImageUrl(url) {
  const value = toText(url);
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return ''; // javascript:, data:, etc.
  return value;
}

function normalizeImages(rawImages, villaName) {
  const list = Array.isArray(rawImages) ? rawImages : rawImages ? [rawImages] : [];
  const out = [];
  list.forEach((item) => {
    const source = typeof item === 'string' ? { url: item } : item && typeof item === 'object' ? item : null;
    if (!source) return;
    const url = safeImageUrl(source.url ?? source.src);
    if (!url) return;
    const width = toCount(source.width);
    const height = toCount(source.height);
    out.push({
      url,
      alt: toText(source.alt) || `${villaName}, photo ${out.length + 1}`,
      width: width || null,
      height: height || null,
      srcset: toText(source.srcset) || '',
    });
  });
  return out;
}

function deriveShortDescription(description) {
  const flat = description.replace(/\s+/g, ' ').trim();
  if (flat.length <= SHORT_DESCRIPTION_LENGTH) return flat;
  const cut = flat.slice(0, SHORT_DESCRIPTION_LENGTH);
  const lastSpace = cut.lastIndexOf(' ');
  return cut.slice(0, lastSpace > 80 ? lastSpace : SHORT_DESCRIPTION_LENGTH).replace(/[,;:.\-–]+$/, '') + '…';
}

/**
 * Converts a stored document into the website's villa shape.
 * Returns null (and reports why) when a record is unusable, so one bad record
 * never breaks the whole listing.
 */
function normalizedVideo(raw,id){try{return validateVideo(raw,id);}catch{return null;}}
export function normalizeVilla(raw, docId = '', onWarn = () => {}) {
  if (!raw || typeof raw !== 'object') return null;

  const name = toText(read(raw, 'name'));
  const id = toText(read(raw, 'id')) || docId;
  const slug = toText(read(raw, 'slug')) || (docId ? slugify(docId) : slugify(name));

  if (!name || !slug) {
    onWarn(`Skipped a villa record (${id || 'no id'}) because it has no name or slug.`);
    return null;
  }

  const description = toText(read(raw, 'description'));
  const shortDescription = toText(read(raw, 'shortDescription')) || deriveShortDescription(description);

  const seen = new Set();
  const amenities = [];
  const rawAmenities = read(raw, 'amenities');
  (Array.isArray(rawAmenities) ? rawAmenities : []).forEach((item) => {
    const resolved = resolveAmenity(item);
    if (resolved && !seen.has(resolved.key)) {
      seen.add(resolved.key);
      amenities.push(resolved);
    }
  });

  const currency = toText(read(raw, 'currency')).toUpperCase() || DEFAULT_CURRENCY;

  return {
    id: id || slug,
    slug,
    name,
    island: toText(read(raw, 'island')),
    area: toText(read(raw, 'area')),
    description,
    shortDescription,
    images: normalizeImages(read(raw, 'images'), name),
    video: normalizedVideo(raw.video,docId||id),
    maxGuests: toCount(read(raw, 'maxGuests')),
    bedrooms: toCount(read(raw, 'bedrooms')),
    bathrooms: toCount(read(raw, 'bathrooms')),
    amenities,
    priceFrom: toPrice(read(raw, 'priceFrom')),
    currency,
    featured: read(raw, 'featured') === true,
    published: read(raw, 'published') === true,
  };
}

/** Normalizes many records, dropping unusable and unpublished ones. */
export function normalizeVillas(records, onWarn = () => {}) {
  const villas = [];
  const slugs = new Set();
  for (const { raw, docId } of records) {
    const villa = normalizeVilla(raw, docId, onWarn);
    if (!villa || !villa.published) continue; // defence in depth: rules + query already enforce this
    if (slugs.has(villa.slug)) {
      onWarn(`Skipped a duplicate slug "${villa.slug}".`);
      continue;
    }
    slugs.add(villa.slug);
    villas.push(villa);
  }
  return villas.sort((a, b) => a.name.localeCompare(b.name, 'en'));
}
