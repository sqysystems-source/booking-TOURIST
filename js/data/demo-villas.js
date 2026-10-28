/**
 * DEMO LISTINGS – sample content only.
 *
 * These are fictional properties with illustrated placeholder images, used when
 * the site runs in demo mode. They are NOT real villas, prices or availability.
 * Their documents follow the proposed Firestore `villas` structure (see README),
 * so they double as a template for real records.
 *
 * One entry is deliberately unpublished (published: false) to demonstrate that
 * unpublished listings never appear on the public site.
 */

const img = (slug, n, alt) => ({
  url: `assets/img/demo/${slug}-${n}.svg`,
  alt,
  width: 1600,
  height: 1000,
});

export const DEMO_VILLAS = [
  {
    id: 'demo-001',
    slug: 'villa-selene',
    name: 'Villa Selene',
    island: 'Santorini',
    shortDescription: 'A calm, whitewashed retreat with a private pool and long evening light over the water.',
    description:
      'Villa Selene is a sample listing that shows how a finished page looks. Imagine a whitewashed house of cubic terraces arranged around a private pool, with shaded corners for long lunches and a roof terrace for the evening light.\n\nInside, three bedrooms open onto the terraces, and the living space is kept simple: lime-washed walls, handmade furniture and good linen.\n\nThis text, the photos and the price are demonstration content only.',
    images: [
      img('villa-selene', 1, 'Demo illustration: villa terraces and pool at golden hour'),
      img('villa-selene', 2, 'Demo illustration: pool terrace at dusk'),
      img('villa-selene', 3, 'Demo illustration: arched dining terrace facing the sea'),
    ],
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 3,
    amenities: ['Private pool', 'Sea view', 'Wi-Fi', 'Air conditioning', 'Outdoor dining', 'Parking'],
    priceFrom: 780,
    currency: 'EUR',
    featured: true,
    published: true,
  },
  {
    id: 'demo-002',
    slug: 'villa-meltemi',
    name: 'Villa Meltemi',
    island: 'Mykonos',
    shortDescription: 'A spacious family and friends villa with a large pool terrace and breezy outdoor living.',
    description:
      'Villa Meltemi is a sample listing for a larger group. Four bedrooms are spread over two levels, with a wide pool terrace, an outdoor kitchen and plenty of shade.\n\nIt is written here to show what a longer description, a longer amenity list and a higher guest count look like on the site.\n\nAll details are demonstration content only.',
    images: [
      img('villa-meltemi', 1, 'Demo illustration: villa and pool in daylight'),
      img('villa-meltemi', 2, 'Demo illustration: pool terrace with sea beyond'),
      img('villa-meltemi', 3, 'Demo illustration: arched terrace with dining table'),
    ],
    maxGuests: 8,
    bedrooms: 4,
    bathrooms: 4,
    amenities: ['Private pool', 'Sea view', 'Wi-Fi', 'Air conditioning', 'Barbecue', 'Full kitchen', 'Parking'],
    priceFrom: 1150,
    currency: 'EUR',
    featured: true,
    published: true,
  },
  {
    id: 'demo-003',
    slug: 'casa-elaia',
    name: 'Casa Elaia',
    island: 'Paros',
    shortDescription: 'A relaxed house among olive trees, with a pool, a shaded pergola and an easy rhythm.',
    description:
      'Casa Elaia is a sample listing built around an olive grove. Three bedrooms, a pergola for long breakfasts and a private pool make up the house.\n\nIt shows how a mid-range listing with a published nightly price is displayed.\n\nThis is demonstration content only.',
    images: [
      img('casa-elaia', 1, 'Demo illustration: house, pergola and pool in morning light'),
      img('casa-elaia', 2, 'Demo illustration: pool terrace in the morning'),
      img('casa-elaia', 3, 'Demo illustration: arched terrace at golden hour'),
    ],
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 2,
    amenities: ['Private pool', 'Garden', 'Wi-Fi', 'Air conditioning', 'Outdoor dining', 'Washing machine'],
    priceFrom: 520,
    currency: 'EUR',
    featured: true,
    published: true,
  },
  {
    id: 'demo-004',
    slug: 'villa-argiro',
    name: 'Villa Argiro',
    island: 'Naxos',
    shortDescription: 'A compact house for two couples or a small family, a short walk from the beach.',
    description:
      'Villa Argiro is a sample listing without a published price, to show how the site behaves when pricing is not provided. Visitors are simply invited to enquire.\n\nTwo bedrooms, a shaded terrace and a short walk to the sea.\n\nThis is demonstration content only.',
    images: [
      img('villa-argiro', 1, 'Demo illustration: small villa with terrace and umbrella'),
      img('villa-argiro', 2, 'Demo illustration: arched dining terrace'),
      img('villa-argiro', 3, 'Demo illustration: arched terrace at midday'),
    ],
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1,
    amenities: ['Sea view', 'Walk to the beach', 'Wi-Fi', 'Air conditioning', 'Full kitchen'],
    featured: false,
    published: true,
  },
  {
    id: 'demo-005',
    slug: 'villa-pelagos',
    name: 'Villa Pelagos',
    island: 'Crete',
    shortDescription: 'A large villa for groups, with a big pool, a barbecue terrace and room to spread out.',
    description:
      'Villa Pelagos is a sample listing for a large group. Five bedrooms, a long pool and an outdoor barbecue area give everyone space.\n\nIt shows the highest capacity in the demo set.\n\nThis is demonstration content only.',
    images: [
      img('villa-pelagos', 1, 'Demo illustration: large villa with long pool'),
      img('villa-pelagos', 2, 'Demo illustration: pool terrace by the sea'),
      img('villa-pelagos', 3, 'Demo illustration: arched dining terrace at dusk'),
    ],
    maxGuests: 10,
    bedrooms: 5,
    bathrooms: 5,
    amenities: ['Private pool', 'Sea view', 'Barbecue', 'Wi-Fi', 'Air conditioning', 'Full kitchen', 'Parking', 'Garden'],
    priceFrom: 980,
    currency: 'EUR',
    featured: true,
    published: true,
  },
  {
    id: 'demo-006',
    slug: 'sykia-house',
    name: 'Sykia House',
    island: 'Milos',
    shortDescription: 'A small, characterful house by the water for couples, with simple comforts.',
    description:
      'Sykia House is a sample listing for a smaller stay. Two bedrooms, a sunny terrace and no pool, so it also shows how the amenity filter works.\n\nThis is demonstration content only.',
    images: [
      img('sykia-house', 1, 'Demo illustration: small house and terrace in morning light'),
      img('sykia-house', 2, 'Demo illustration: arched terrace in daylight'),
      img('sykia-house', 3, 'Demo illustration: arched terrace in soft morning light'),
    ],
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1,
    amenities: ['Sea view', 'Walk to the beach', 'Wi-Fi', 'Air conditioning'],
    priceFrom: 430,
    currency: 'EUR',
    featured: false,
    published: true,
  },
  {
    id: 'demo-007',
    slug: 'villa-cypressa',
    name: 'Villa Cypressa',
    island: 'Corfu',
    shortDescription: 'A green, garden-surrounded villa with a pool, framed by cypress trees.',
    description:
      'Villa Cypressa is a sample listing set among cypress trees and gardens. Four bedrooms, a pool and a covered terrace for long dinners.\n\nThis is demonstration content only.',
    images: [
      img('villa-cypressa', 1, 'Demo illustration: villa among cypress trees with a pool'),
      img('villa-cypressa', 2, 'Demo illustration: pool terrace at golden hour'),
      img('villa-cypressa', 3, 'Demo illustration: arched terrace in the morning'),
    ],
    maxGuests: 8,
    bedrooms: 4,
    bathrooms: 3,
    amenities: ['Private pool', 'Garden', 'Wi-Fi', 'Air conditioning', 'Barbecue', 'Parking', 'Pet friendly'],
    priceFrom: 690,
    currency: 'EUR',
    featured: false,
    published: true,
  },
  {
    id: 'demo-008',
    slug: 'villa-zephyra',
    name: 'Villa Zephyra',
    island: 'Zakynthos',
    shortDescription: 'A sunset-facing villa with a pool, shaded terraces and a quiet setting.',
    description:
      'Villa Zephyra is a sample listing for a three-bedroom villa with a pool and terraces facing the evening sky.\n\nThis is demonstration content only.',
    images: [
      img('villa-zephyra', 1, 'Demo illustration: villa and pool at dusk'),
      img('villa-zephyra', 2, 'Demo illustration: pool terrace in daylight'),
      img('villa-zephyra', 3, 'Demo illustration: arched terrace at dusk'),
    ],
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 2,
    amenities: ['Private pool', 'Sea view', 'Wi-Fi', 'Air conditioning', 'Outdoor dining'],
    featured: false,
    published: true,
  },
  {
    id: 'demo-009',
    slug: 'draft-example',
    name: 'Unpublished Example (must never appear)',
    island: 'Santorini',
    description: 'This demo record has published: false and must never be displayed on the public site.',
    images: [img('draft-example', 1, 'Demo illustration')],
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    amenities: [],
    featured: true,
    published: false,
  },
];
