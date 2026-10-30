import { SITE } from '../config/site-config.js';
import { CONTACT } from '../config/contact-config.js';
import { ISLANDS } from '../data/islands.js';
import { getVillas, resetCache, countByIsland } from '../data/villa-service.js';
import { slugify } from '../data/schema-map.js';
import { $, h } from '../lib/dom.js';
import { plural } from '../lib/format.js';
import { buildGeneralMessage } from '../lib/contact-links.js';
import { mountLayout } from '../ui/layout.js';
import { createVillaCard } from '../ui/villa-card.js';
import { createImage } from '../ui/images.js';
import { showLoading, endLoading, renderEmpty, renderError } from '../ui/states.js';
import { createContactCards, configurationHint } from '../ui/contact-panel.js';

mountLayout({ page: 'home' });

const featuredGrid = $('#featured-grid');
const islandList = $('#island-list');

function renderIslands() {
  islandList.replaceChildren(
    ...ISLANDS.map((island) =>
      h(
        'li',
        {},
        h(
          'a',
          { class: 'island-card', href: `villas.html?island=${encodeURIComponent(island.name)}` },
          h(
            'span',
            { class: 'island-card__arch' },
            createImage({ url: island.image }, { alt: `Illustration of ${island.name}`, sizes: '(min-width: 900px) 22vw, 46vw' }),
          ),
          h('span', { class: 'island-card__name' }, island.name),
          h('span', { class: 'island-card__group' }, island.group),
          h('span', { class: 'island-card__blurb' }, island.blurb),
          h('span', { class: 'island-card__count', 'data-island': slugify(island.name) }),
        ),
      ),
    ),
  );
}

function updateIslandCounts(villas) {
  const counts = countByIsland(villas);
  islandList.querySelectorAll('[data-island]').forEach((node) => {
    const n = counts.get(node.dataset.island) ?? 0;
    node.textContent = n ? plural(n, 'villa') : 'Villas coming soon';
    node.classList.toggle('is-none', !n);
  });
}

async function load() {
  showLoading(featuredGrid, SITE.featuredCount, 'Loading featured villas');
  try {
    const villas = await getVillas();
    endLoading(featuredGrid);
    const featured = villas.filter((v) => v.featured).slice(0, SITE.featuredCount);
    if (featured.length) {
      featuredGrid.replaceChildren(...featured.map((villa, i) => createVillaCard(villa, { eager: i === 0 })));
    } else {
      renderEmpty(featuredGrid, {
        title: 'Featured villas are coming soon',
        text: 'Browse every villa we currently list instead.',
        href: 'villas.html',
        hrefLabel: 'Explore Villas',
      });
    }
    updateIslandCounts(villas);
  } catch (error) {
    console.error('[Villa Aesthetic] Could not load villas', error.cause ?? error);
    renderError(featuredGrid, {
      text: error.userMessage ?? 'Something went wrong while loading villas.',
      onRetry: () => {
        resetCache();
        load();
      },
    });
  }
}

renderIslands();
load();

const contactHost = $('#home-contact');
contactHost.append(
  createContactCards({ message: buildGeneralMessage(CONTACT), subject: CONTACT.generalEmailSubject }),
  configurationHint(),
);

import {mountHeroSlider} from '../ui/hero-slider.js';
void mountHeroSlider();
