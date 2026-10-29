import { getVillas, resetCache } from '../data/villa-service.js';
import { slugify } from '../data/schema-map.js';
import {
  filterVillas,
  hasActiveFilters,
  islandOptions,
  guestOptions,
  amenityOptions,
  filtersFromParams,
  filtersToParams,
} from '../lib/filters.js';
import { $, h, clear } from '../lib/dom.js';
import { plural } from '../lib/format.js';
import { mountLayout } from '../ui/layout.js';
import { createVillaCard } from '../ui/villa-card.js';
import { showLoading, endLoading, renderEmpty, renderError } from '../ui/states.js';

mountLayout({ page: 'villas' });

const grid = $('#villa-grid');
const form = $('#filters');
const islandSelect = $('#filter-island');
const guestSelect = $('#filter-guests');
const amenityHost = $('#filter-amenities');
const resetButton = $('#filter-reset');
const resultCount = $('#result-count');

let villas = [];
let filters = filtersFromParams(new URLSearchParams(location.search));

function setControlsDisabled(disabled) {
  form.querySelectorAll('select, input, button').forEach((el) => (el.disabled = disabled));
}

function fillSelect(select, options, anyLabel) {
  clear(select);
  select.append(h('option', { value: '' }, anyLabel), ...options);
}

function buildControls() {
  const islands = islandOptions(villas);
  // Keep an island from the URL selectable even if no villa is listed there yet.
  if (filters.island && !islands.some((name) => slugify(name) === slugify(filters.island))) islands.push(filters.island);
  fillSelect(islandSelect, islands.map((name) => h('option', { value: name }, name)), 'All islands');
  fillSelect(guestSelect, guestOptions(villas).map((n) => h('option', { value: String(n) }, plural(n, 'guest'))), 'Any number');

  const options = amenityOptions(villas);
  clear(amenityHost);
  amenityHost.append(
    ...options.map(({ key, label }) =>
      h(
        'label',
        { class: 'chip' },
        h('input', { type: 'checkbox', name: 'amenity', value: key }),
        h('span', {}, label),
      ),
    ),
  );
  if (!options.length) amenityHost.append(h('p', { class: 'muted' }, 'No amenity filters available yet.'));
  syncControls();
}

function syncControls() {
  // Match island case-insensitively with the option text.
  const match = [...islandSelect.options].find((o) => slugify(o.value) === slugify(filters.island) && o.value);
  islandSelect.value = match ? match.value : '';
  $('#filter-min-price').value=filters.minPrice||'';$('#filter-max-price').value=filters.maxPrice||'';
  guestSelect.value = filters.guests ? String(filters.guests) : '';
  amenityHost.querySelectorAll('input').forEach((input) => (input.checked = filters.amenities.includes(input.value)));
}

function readControls() {
  filters = {
    minPrice:Math.max(0,Number($('#filter-min-price').value)||0),
    maxPrice:Math.max(0,Number($('#filter-max-price').value)||0),
    island: islandSelect.value,
    guests: Number(guestSelect.value) || 0,
    amenities: [...amenityHost.querySelectorAll('input:checked')].map((i) => i.value),
  };
}

function updateUrl() {
  const query = filtersToParams(filters).toString();
  history.replaceState(null, '', query ? `?${query}` : location.pathname);
}

function clearFilters() {
  filters = { island: '', guests: 0, amenities: [] };
  syncControls();
  updateUrl();
  render();
  islandSelect.focus();
}

function render() {
  const active = hasActiveFilters(filters);
  resetButton.hidden = !active;
  const matches = filterVillas(villas, filters);

  if (!villas.length) {
    resultCount.textContent = '';
    renderEmpty(grid, {
      title: 'No villas are listed yet',
      text: 'Please check back soon, or contact us and we will help you find a villa.',
      href: 'contact.html',
      hrefLabel: 'Contact us',
    });
    return;
  }

  resultCount.textContent = active
    ? `${plural(matches.length, 'villa')} match${matches.length === 1 ? 'es' : ''} your filters (of ${villas.length})`
    : plural(villas.length, 'villa');

  if (!matches.length) {
    renderEmpty(grid, {
      title: 'No villas match these filters',
      text: 'Try fewer amenities, a smaller group size or a different island.',
      actionLabel: 'Clear filters',
      onAction: clearFilters,
    });
    return;
  }

  endLoading(grid);
  grid.replaceChildren(...matches.map((villa, i) => createVillaCard(villa, { eager: i < 2 })));
}

async function load() {
  setControlsDisabled(true);
  resultCount.textContent = 'Loading villas…';
  showLoading(grid, 6);
  try {
    villas = await getVillas();
    setControlsDisabled(false);
    buildControls();
    render();
  } catch (error) {
    console.error('[Villa Aesthetic] Could not load villas', error.cause ?? error);
    resultCount.textContent = '';
    renderError(grid, {
      text: error.userMessage ?? 'Something went wrong while loading villas.',
      onRetry: () => {
        resetCache();
        load();
      },
    });
  }
}

form.addEventListener('change', () => {
  readControls();
  updateUrl();
  render();
});
form.addEventListener('submit', (event) => event.preventDefault());
resetButton.addEventListener('click', clearFilters);

load();
