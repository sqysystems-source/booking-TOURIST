import {createVideoTour} from '../ui/video-tour.js';
import { SITE } from '../config/site-config.js';
import { CONTACT } from '../config/contact-config.js';
import { getVillaBySlug, resetCache } from '../data/villa-service.js';
import { $, h, paragraphs } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { formatPrice, plural } from '../lib/format.js';
import { setPageMeta } from '../lib/meta.js';
import { buildVillaMessage, buildVillaSubject } from '../lib/contact-links.js';
import { mountLayout } from '../ui/layout.js';
import { createImage } from '../ui/images.js';
import { createLightbox } from '../ui/lightbox.js';
import { createEnquiryDialog } from '../ui/enquiry-dialog.js';
import { showLoading, renderEmpty, renderError } from '../ui/states.js';

mountLayout({ page: 'villas' });

const root = $('#villa-root');
const slug = new URLSearchParams(location.search).get('slug')?.trim() ?? '';

/** Shareable address of this villa page. */
function shareableUrl(villa) {
  const path = `villa.html?slug=${encodeURIComponent(villa.slug)}`;
  return SITE.siteUrl ? `${SITE.siteUrl.replace(/\/+$/, '')}/${path}` : new URL(path, location.href).href;
}

function renderGallery(villa, lightbox) {
  const images = villa.images;
  if (!images.length) {
    return h(
      'div',
      { class: 'gallery gallery--empty' },
      createImage(null, { alt: '', eager: true }),
      h('p', { class: 'gallery__note' }, 'Photos coming soon'),
    );
  }
  const shown = images.slice(0, 5);
  const items = shown.map((image, i) => {
    const isLast = i === shown.length - 1 && images.length > shown.length;
    return h(
      'button',
      {
        type: 'button',
        class: `gallery__item${i === 0 ? ' gallery__item--main' : ''}`,
        'aria-label': `Open photo ${i + 1} of ${images.length}: ${image.alt}`,
        onclick: () => lightbox.open(images, i),
      },
      createImage(image, { alt: image.alt, eager: i === 0, sizes: i === 0 ? '(min-width: 1100px) 760px, 100vw' : '(min-width: 1100px) 280px, 50vw' }),
      isLast ? h('span', { class: 'gallery__more' }, icon('gallery'), `Show all ${images.length} photos`) : null,
    );
  });
  return h('div', { class: `gallery gallery--${shown.length}` }, items);
}

function renderFacts(villa) {
  const facts = [];
  if (villa.maxGuests !== null) facts.push(['guests', `Up to ${plural(villa.maxGuests, 'guest')}`]);
  if (villa.bedrooms !== null) facts.push(['bed', plural(villa.bedrooms, 'bedroom')]);
  if (villa.bathrooms !== null) facts.push(['bath', plural(villa.bathrooms, 'bathroom')]);
  if (!facts.length) return null;
  return h('ul', { class: 'key-facts' }, facts.map(([name, text]) => h('li', {}, icon(name), text)));
}

function renderVilla(villa) {
  const url = shareableUrl(villa);
  const price = formatPrice(villa.priceFrom, villa.currency);
  const lightbox = createLightbox();
  const enquiry = createEnquiryDialog({
    title: `Enquire about ${villa.name}`,
    message: buildVillaMessage(CONTACT, villa, url),
    subject: buildVillaSubject(villa),
  });
  const openEnquiry = () => enquiry.open();

  setPageMeta({
    title: `${villa.name}${villa.island ? `, ${villa.island}` : ''} | ${SITE.brandName}`,
    description:
      villa.shortDescription ||
      `${villa.name}${villa.island ? ` on ${villa.island}` : ''}. Request availability from ${SITE.brandName}.`,
    url,
    image: villa.images[0] ? new URL(villa.images[0].url, location.href).href : undefined,
  });

  const enquiryCard = h(
    'aside',
    { class: 'enquiry-card', 'aria-label': 'Availability request' },
    h('h2', { class: 'enquiry-card__title' }, 'Interested in this villa?'),
    price
      ? h('p', { class: 'enquiry-card__price' }, h('span', { class: 'price' }, `From ${price}`), ' per night')
      : h('p', { class: 'enquiry-card__price enquiry-card__price--none' }, 'Pricing on request'),
    price ? h('p', { class: 'enquiry-card__note' }, SITE.messages.priceNote) : null,
    h('button', { type: 'button', class: 'btn btn-primary btn-block', onclick: openEnquiry }, 'Request Availability'),
    h('p', { class: 'enquiry-card__note' }, SITE.messages.enquiryOnly),
  );

  const mobileBar = h(
    'div',
    { class: 'mobile-cta' },
    h('p', { class: 'mobile-cta__price' }, price ? [h('span', { class: 'price' }, `From ${price}`), ' per night'] : 'Pricing on request'),
    h('button', { type: 'button', class: 'btn btn-primary', onclick: openEnquiry }, 'Request Availability'),
  );

  const amenities = villa.amenities.length
    ? h(
        'section',
        { class: 'detail-block', 'aria-labelledby': 'amenities-title' },
        h('h2', { id: 'amenities-title' }, 'Amenities'),
        h('ul', { class: 'amenity-list' }, villa.amenities.map((a) => h('li', {}, icon('check'), a.label))),
      )
    : null;

  root.replaceChildren(
    h(
      'div',
      { class: 'container' },
      h(
        'nav',
        { class: 'breadcrumb', 'aria-label': 'Breadcrumb' },
        h('a', { href: 'villas.html' }, 'All villas'),
        villa.island ? h('a', { href: `villas.html?island=${encodeURIComponent(villa.island)}` }, villa.island) : null,
        h('span', { 'aria-current': 'page' }, villa.name),
      ),
      h(
        'header',
        { class: 'villa-head' },
        villa.island ? h('p', { class: 'villa-head__island' }, icon('pin'), [villa.island, villa.area].filter(Boolean).join(', ')) : null,
        h('h1', { class: 'villa-head__title' }, villa.name),
      ),
      renderGallery(villa, lightbox),
      h(
        'div',
        { class: 'villa-layout' },
        h(
          'div',
          { class: 'villa-main' },
          renderFacts(villa),
          villa.description
            ? h('section', { class: 'detail-block', 'aria-labelledby': 'about-title' }, h('h2', { id: 'about-title' }, 'About this villa'), h('div', { class: 'prose' }, paragraphs(villa.description)))
            : null,
          createVideoTour(villa),
          amenities,
          h(
            'section',
            { class: 'detail-block detail-block--note' },
            h('h2', {}, 'How availability works'),
            h('p', {}, 'Send us your dates and group size and we will check availability and confirm the final price with you. Nothing is booked until our team has confirmed it.'),
          ),
        ),
        enquiryCard,
      ),
    ),
    mobileBar,
  );
  document.body.classList.add('has-mobile-cta');
}

function renderNotFound() {
  setPageMeta({ title: `Villa not found | ${SITE.brandName}`, description: 'This villa page could not be found.', noindex: true });
  root.replaceChildren(h('div', { class: 'container' }, h('div', { class: 'state-host' })));
  renderEmpty($('.state-host', root), {
    title: 'We could not find that villa',
    text: slug
      ? 'The link may be out of date, or the villa may no longer be listed.'
      : 'This page needs a villa link, for example villa.html?slug=villa-name.',
    href: 'villas.html',
    hrefLabel: 'See all villas',
  });
}

async function load() {
  root.replaceChildren(h('div', { class: 'container' }, h('div', { class: 'state-host' })));
  const host = $('.state-host', root);
  host.className = 'state-host villa-loading';
  showLoading(host, 1, 'Loading villa');
  try {
    const villa = slug ? await getVillaBySlug(slug) : null;
    if (!villa) return renderNotFound();
    renderVilla(villa);
  } catch (error) {
    console.error('[Villa Aesthetic] Could not load villa', error.cause ?? error);
    setPageMeta({ title: `Villa unavailable | ${SITE.brandName}`, noindex: true });
    renderError(host, {
      title: 'We could not load this villa',
      text: error.userMessage ?? 'Something went wrong while loading this villa.',
      onRetry: () => {
        resetCache();
        load();
      },
    });
  }
}

load();
