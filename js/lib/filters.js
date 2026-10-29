import { slugify } from '../data/schema-map.js';
import { AMENITIES, AMENITY_ORDER } from '../data/amenities.js';
import { ISLANDS } from '../data/islands.js';

/**
 * Filtering is by features only. It deliberately knows nothing about dates, so it
 * can never imply that a villa is available.
 *
 * filters = { island: 'Paros' | '', guests: number | 0, amenities: ['pool', ...] }
 */
export function filterVillas(villas, filters = {}) {
  const island = slugify(filters.island ?? '');
  const guests = Number(filters.guests) || 0;
  const wanted = filters.amenities ?? [];

  return villas.filter((villa) => {
    if (island && slugify(villa.island) !== island) return false;
    if (guests && !(villa.maxGuests >= guests)) return false;
    if (Number(filters.minPrice)>0 && !(villa.priceFrom>=Number(filters.minPrice))) return false;
    if (Number(filters.maxPrice)>0 && !(villa.priceFrom!==null && villa.priceFrom<=Number(filters.maxPrice))) return false;
    if (wanted.length) {
      const have = new Set(villa.amenities.map((a) => a.key));
      if (!wanted.every((key) => have.has(key))) return false;
    }
    return true;
  });
}

export function hasActiveFilters(filters) {
  return Boolean(filters.island || filters.guests || Number(filters.minPrice)>0 || Number(filters.maxPrice)>0 || (filters.amenities ?? []).length);
}

/** Island names present in the data, in editorial order first, then any extras A-Z. */
export function islandOptions(villas) {
  const present = new Map();
  villas.forEach((v) => v.island && present.set(slugify(v.island), v.island));
  const ordered = [];
  ISLANDS.forEach((island) => {
    const key = slugify(island.name);
    if (present.has(key)) {
      ordered.push(island.name);
      present.delete(key);
    }
  });
  return [...ordered, ...[...present.values()].sort((a, b) => a.localeCompare(b, 'en'))];
}

/** Guest counts to offer, up to the largest capacity in the data. */
export function guestOptions(villas) {
  const max = Math.min(Math.max(2, ...villas.map((v) => v.maxGuests || 0)), 100);
  return Array.from({ length: max }, (_, i) => i + 1);
}

/** Amenities present in the data: known ones in preferred order, then custom A-Z. */
export function amenityOptions(villas) {
  const found = new Map();
  villas.forEach((v) => v.amenities.forEach((a) => found.set(a.key, a.label)));
  const known = AMENITY_ORDER.filter((key) => found.has(key)).map((key) => ({ key, label: AMENITIES[key].label }));
  const custom = [...found.entries()]
    .filter(([key]) => !AMENITIES[key])
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'en'));
  return [...known, ...custom];
}

/** Reads filters from a query string such as ?island=Paros&guests=4&amenities=pool,seaView */
export function filtersFromParams(params) {
  const guests = parseInt(params.get('guests') ?? '', 10);
  return {
    ...(Number(params.get('minPrice'))>0?{minPrice:Number(params.get('minPrice'))}:{}),
    ...(Number(params.get('maxPrice'))>0?{maxPrice:Number(params.get('maxPrice'))}:{}),
    island: (params.get('island') ?? '').trim(),
    guests: Number.isFinite(guests) && guests > 0 ? guests : 0,
    amenities: (params.get('amenities') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

export function filtersToParams(filters) {
  const params = new URLSearchParams();
  if (filters.island) params.set('island', filters.island);
  if (filters.guests) params.set('guests', String(filters.guests));
  if (filters.amenities?.length) params.set('amenities', filters.amenities.join(','));
  if (Number(filters.minPrice)>0) params.set('minPrice',String(filters.minPrice));
  if (Number(filters.maxPrice)>0) params.set('maxPrice',String(filters.maxPrice));
  return params;
}
