// Run with: npm test   (or: node --test)
import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeVilla, normalizeVillas, safeImageUrl, slugify } from '../js/data/schema-map.js';
import { filterVillas, filtersFromParams, filtersToParams, hasActiveFilters } from '../js/lib/filters.js';
import {
  parsePhone,
  parseEmail,
  buildWhatsAppLink,
  buildViberLink,
  buildMailtoLink,
  getChannels,
  buildVillaMessage,
} from '../js/lib/contact-links.js';
import { formatPrice } from '../js/lib/format.js';
import { DEMO_VILLAS } from '../js/data/demo-villas.js';

const published = normalizeVillas(DEMO_VILLAS.map((raw) => ({ raw, docId: raw.id })));

test('demo data: unpublished villas are dropped, others kept', () => {
  assert.equal(published.length, 8);
  assert.ok(!published.some((v) => v.slug === 'draft-example'));
});

test('normalizer: handles missing optional fields and bad data', () => {
  const v = normalizeVilla({ name: 'Test Villa', slug: 'test', published: true, images: ['javascript:alert(1)', 'a.jpg'] });
  assert.equal(v.priceFrom, null);
  assert.equal(v.maxGuests, null);
  assert.deepEqual(v.amenities, []);
  assert.equal(v.images.length, 1);
  assert.equal(v.currency, 'EUR');
  assert.equal(normalizeVilla({ slug: 'x' }), null); // no name
  assert.equal(normalizeVilla(null), null);
});

test('normalizer: published must be exactly true', () => {
  const list = normalizeVillas([
    { raw: { name: 'A', slug: 'a', published: 'true' }, docId: '1' },
    { raw: { name: 'B', slug: 'b', published: true }, docId: '2' },
  ]);
  assert.deepEqual(list.map((v) => v.slug), ['b']);
});

test('normalizer: duplicate slugs are skipped', () => {
  const list = normalizeVillas([
    { raw: { name: 'A', slug: 'same', published: true }, docId: '1' },
    { raw: { name: 'B', slug: 'same', published: true }, docId: '2' },
  ]);
  assert.equal(list.length, 1);
});

test('normalizer: amenity aliases resolve to friendly labels', () => {
  const v = normalizeVilla({ name: 'A', slug: 'a', published: true, amenities: ['private pool', 'WiFi', 'Fire pit'] });
  assert.deepEqual(v.amenities.map((a) => a.key), ['pool', 'wifi', 'x-firepit']);
  assert.equal(v.amenities[0].label, 'Private pool');
});

test('safeImageUrl: only http(s) and relative paths', () => {
  assert.equal(safeImageUrl('https://x.com/a.jpg'), 'https://x.com/a.jpg');
  assert.equal(safeImageUrl('assets/a.jpg'), 'assets/a.jpg');
  assert.equal(safeImageUrl('javascript:alert(1)'), '');
  assert.equal(safeImageUrl('data:text/html,hi'), '');
});

test('slugify handles accents and spacing', () => {
  assert.equal(slugify(' Zákynthos '), 'zakynthos');
});

test('filters: island, guests, amenities combine (AND)', () => {
  assert.equal(filterVillas(published, {}).length, 8);
  assert.deepEqual(filterVillas(published, { island: 'paros' }).map((v) => v.slug), ['casa-elaia']);
  assert.ok(filterVillas(published, { guests: 8 }).every((v) => v.maxGuests >= 8));
  const pool8 = filterVillas(published, { guests: 8, amenities: ['pool'] });
  assert.deepEqual(pool8.map((v) => v.slug).sort(), ['villa-cypressa', 'villa-meltemi', 'villa-pelagos']);
  assert.equal(filterVillas(published, { island: 'Crete', amenities: ['petFriendly'] }).length, 0);
});

test('filters: URL round trip', () => {
  const f = filtersFromParams(new URLSearchParams('island=Paros&guests=4&amenities=pool,seaView'));
  assert.deepEqual(f, { island: 'Paros', guests: 4, amenities: ['pool', 'seaView'] });
  assert.equal(filtersToParams(f).toString(), 'island=Paros&guests=4&amenities=pool%2CseaView');
  assert.equal(hasActiveFilters(filtersFromParams(new URLSearchParams(''))), false);
  assert.equal(filtersFromParams(new URLSearchParams('guests=abc')).guests, 0);
});

test('contact: placeholders never produce links', () => {
  const placeholder = {
    whatsappNumber: 'PLACEHOLDER_WHATSAPP_NUMBER',
    viberNumber: 'PLACEHOLDER_VIBER_NUMBER',
    email: 'PLACEHOLDER_EMAIL_ADDRESS',
  };
  assert.equal(buildWhatsAppLink(placeholder, 'hi'), null);
  assert.equal(buildViberLink(placeholder), null);
  assert.equal(buildMailtoLink(placeholder, 's', 'b'), null);
  assert.ok(getChannels(placeholder).every((c) => !c.enabled && !c.href));
  assert.ok(getChannels({}).every((c) => !c.enabled));
});

test('contact: phone and email validation', () => {
  assert.equal(parsePhone('+30 691 234 5678').digits, '306912345678');
  assert.equal(parsePhone('0030 691 234 5678').e164, '+306912345678');
  assert.equal(parsePhone('12345'), null);
  assert.equal(parsePhone('call me'), null);
  assert.equal(parseEmail('a@b.co'), 'a@b.co');
  assert.equal(parseEmail('not-an-email'), null);
});

test('contact: link formats for real values', () => {
  const c = { whatsappNumber: '+30 691 234 5678', viberNumber: '+30 691 234 5678', email: 'hello@test.invalid' };
  assert.equal(buildWhatsAppLink(c, 'Hi there'), 'https://wa.me/306912345678?text=Hi%20there');
  assert.equal(buildViberLink(c), 'viber://chat?number=%2B306912345678');
  assert.equal(buildMailtoLink(c, 'Sub ject', 'Line1\nLine2'), 'mailto:hello@test.invalid?subject=Sub%20ject&body=Line1%0D%0ALine2');
});

test('contact: villa message includes name and page url', () => {
  const msg = buildVillaMessage({ greeting: 'Hello,' }, { name: 'Villa Selene', island: 'Santorini' }, 'https://x.test/villa.html?slug=villa-selene');
  assert.match(msg, /Villa Selene \(Santorini\)/);
  assert.match(msg, /https:\/\/x\.test\/villa\.html\?slug=villa-selene/);
});

test('price formatting only when provided', () => {
  assert.equal(formatPrice(null), '');
  assert.equal(formatPrice(0), '');
  assert.match(formatPrice(780, 'EUR'), /780/);
  assert.match(formatPrice(780, 'NOTACURRENCY'), /780/);
});
