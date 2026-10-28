/**
 * Known amenities. Villa documents may store amenities as plain strings
 * ("Private pool", "wifi", "Sea View" ...). Anything that matches a key or an
 * alias below is shown with the friendly label; anything else is shown as typed
 * and is still filterable.
 *
 * Add or rename amenities here without touching any other code.
 */
export const AMENITIES = {
  pool: { label: 'Private pool', aliases: ['private pool', 'pool', 'swimming pool'] },
  seaView: { label: 'Sea view', aliases: ['sea view', 'seaview', 'view', 'ocean view'] },
  wifi: { label: 'Wi-Fi', aliases: ['wifi', 'wi-fi', 'wi fi', 'internet'] },
  airConditioning: { label: 'Air conditioning', aliases: ['air conditioning', 'ac', 'a/c', 'aircon', 'air-conditioning'] },
  kitchen: { label: 'Full kitchen', aliases: ['kitchen', 'full kitchen', 'equipped kitchen'] },
  bbq: { label: 'Barbecue', aliases: ['bbq', 'barbecue', 'barbeque', 'grill'] },
  parking: { label: 'Parking', aliases: ['parking', 'private parking', 'free parking'] },
  beachNearby: { label: 'Walk to the beach', aliases: ['beach nearby', 'walk to beach', 'beach access', 'near beach', 'walk to the beach'] },
  outdoorDining: { label: 'Outdoor dining', aliases: ['outdoor dining', 'terrace dining', 'alfresco dining'] },
  garden: { label: 'Garden', aliases: ['garden', 'private garden'] },
  jacuzzi: { label: 'Hot tub', aliases: ['jacuzzi', 'hot tub', 'whirlpool'] },
  washer: { label: 'Washing machine', aliases: ['washing machine', 'washer', 'laundry'] },
  petFriendly: { label: 'Pet friendly', aliases: ['pet friendly', 'pets allowed', 'pets'] },
};

/** Preferred display order for filter chips (known keys first). */
export const AMENITY_ORDER = Object.keys(AMENITIES);

const ALIAS_LOOKUP = new Map();
for (const [key, def] of Object.entries(AMENITIES)) {
  ALIAS_LOOKUP.set(simplify(key), key);
  for (const alias of def.aliases) ALIAS_LOOKUP.set(simplify(alias), key);
}

function simplify(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/** Turns any stored amenity string into a stable { key, label } pair. */
export function resolveAmenity(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return null;
  const known = ALIAS_LOOKUP.get(simplify(text));
  if (known) return { key: known, label: AMENITIES[known].label };
  const key = 'x-' + simplify(text);
  const label = text.charAt(0).toUpperCase() + text.slice(1);
  return { key, label };
}
