import { h } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { formatPrice, plural } from '../lib/format.js';
import { createImage } from './images.js';

export const villaUrl = (villa) => `villa.html?slug=${encodeURIComponent(villa.slug)}`;

const CARD_SIZES = '(min-width: 1100px) 380px, (min-width: 700px) 45vw, 92vw';

export function createVillaCard(villa, { eager = false } = {}) {
  const price = formatPrice(villa.priceFrom, villa.currency);
  const facts = [];
  if (villa.maxGuests !== null) facts.push(['guests', plural(villa.maxGuests, 'guest')]);
  if (villa.bedrooms !== null) facts.push(['bed', plural(villa.bedrooms, 'bedroom')]);

  return h(
    'article',
    { class: 'villa-card' },
    h(
      'div',
      { class: 'villa-card__media' },
      createImage(villa.images[0], { alt: villa.images[0]?.alt ?? `${villa.name}`, sizes: CARD_SIZES, eager }),
    ),
    h(
      'div',
      { class: 'villa-card__body' },
      villa.island ? h('p', { class: 'villa-card__island' }, icon('pin'), villa.island) : null,
      h('h3', { class: 'villa-card__name' }, h('a', { href: villaUrl(villa) }, villa.name)),
      facts.length
        ? h('ul', { class: 'facts' }, facts.map(([name, text]) => h('li', {}, icon(name), text)))
        : null,
      villa.shortDescription ? h('p', { class: 'villa-card__desc' }, villa.shortDescription) : null,
      h(
        'p',
        { class: price ? 'villa-card__price' : 'villa-card__price villa-card__price--none' },
        price
          ? [h('span', { class: 'price' }, `From ${price}`), h('span', { class: 'price-unit' }, ' per night, indicative')]
          : 'Enquire for pricing',
      ),
    ),
  );
}
