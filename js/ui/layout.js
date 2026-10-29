/**
 * Shared page chrome: skip link, header, mobile navigation and footer.
 * Every page calls mountLayout({ page }) so navigation and footer are edited in one place
 * (js/config/site-config.js).
 */
import { SITE } from '../config/site-config.js';
import { CONTACT } from '../config/contact-config.js';
import { h, $ } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { getChannels } from '../lib/contact-links.js';
import { getDataMode } from '../data/villa-service.js';

function buildBrand() {
  return h(
    'a',
    { class: 'brand', href: 'index.html', 'aria-label': `${SITE.brandName}, home` },
    h('span', { class: 'brand__mark' }, icon('arch')),
    h('span', { class: 'brand__name' }, SITE.brandName),
  );
}

function buildHeader(page) {
  const navList = h(
    'ul',
    { class: 'primary-nav__list' },
    SITE.nav.map((item) =>
      h(
        'li',
        {},
        h('a', { href: item.href, 'aria-current': item.page === page ? 'page' : null }, item.label),
      ),
    ),
  );

  const nav = h('nav', { class: 'primary-nav', id: 'primary-nav', 'aria-label': 'Main' }, navList);

  const toggle = h(
    'button',
    {
      type: 'button',
      class: 'nav-toggle',
      'aria-expanded': 'false',
      'aria-controls': 'primary-nav',
      'aria-label': 'Open menu',
    },
    icon('menu'),
  );

  const header = h(
    'header',
    { class: 'site-header', data: { overlay: page === 'home' ? 'true' : 'false' } },
    h(
      'div',
      { class: 'container site-header__inner' },
      buildBrand(),
      nav,
      h('a', { class: 'btn btn-primary btn-small site-header__cta', href: 'villas.html' }, 'Explore Villas'),
      toggle,
    ),
  );

  const setOpen = (open) => {
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setOpen(!header.classList.contains('is-open')));
  nav.addEventListener('click', (event) => event.target.closest('a') && setOpen(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 900px)').addEventListener('change', (e) => e.matches && setOpen(false));

  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  return header;
}

function buildFooter() {
  const channels = getChannels(CONTACT).filter((c) => c.enabled);
  const contactItems = channels.length
    ? channels.map((c) =>
        h('li', {}, c.id === 'viber' ? `Viber: ${c.display}` : h('a', { href: c.href, ...(c.id === 'whatsapp' ? { target: '_blank', rel: 'noopener' } : {}) }, `${c.label}: ${c.display}`)),
      )
    : [h('li', { class: 'footer__muted' }, 'Contact details are being set up.')];

  return h(
    'footer',
    { class: 'site-footer' },
    h(
      'div',
      { class: 'container site-footer__grid' },
      h(
        'div',
        { class: 'site-footer__about' },
        h('p', { class: 'site-footer__brand' }, SITE.brandName),
        h('p', {}, SITE.footer.blurb),
      ),
      h('nav', { 'aria-label': 'Footer' }, h('h2', { class: 'site-footer__heading' }, 'Explore'), h('ul', {}, SITE.nav.map((i) => h('li', {}, h('a', { href: i.href }, i.label))))),
      h('div', {}, h('h2', { class: 'site-footer__heading' }, 'Contact'), h('ul', {}, contactItems)),
    ),
    h(
      'div',
      { class: 'container site-footer__legal' },
      h('p', {}, SITE.footer.note),
      h('p', {}, `© ${new Date().getFullYear()} ${SITE.brandName}`),
    ),
  );
}

export function mountLayout({ page }) {
  const { mode } = getDataMode();

  const skip = h('a', { class: 'skip-link', href: '#main' }, 'Skip to content');
  const parts = [skip];
  parts.push(buildHeader(page));

  const headerHost = $('#site-header');
  headerHost.replaceWith(...parts);
  $('#site-footer').replaceWith(buildFooter());
  document.documentElement.dataset.dataMode = mode;
}
