import { h, clear } from '../lib/dom.js';
import { icon } from '../lib/icons.js';

/** Skeleton cards shown while villas load. */
export function showLoading(container, count = 3, label = 'Loading villas') {
  clear(container);
  container.setAttribute('aria-busy', 'true');
  const cards = Array.from({ length: count }, () =>
    h(
      'div',
      { class: 'skeleton-card', 'aria-hidden': 'true' },
      h('div', { class: 'skeleton skeleton-card__media' }),
      h('div', { class: 'skeleton skeleton-line skeleton-line--short' }),
      h('div', { class: 'skeleton skeleton-line' }),
      h('div', { class: 'skeleton skeleton-line' }),
    ),
  );
  container.append(h('p', { class: 'visually-hidden', role: 'status' }, `${label}…`), ...cards);
}

export function endLoading(container) {
  container.removeAttribute('aria-busy');
}

function panel({ kind, iconName, title, text, actions = [], role }) {
  return h(
    'div',
    { class: `state state--${kind}`, role },
    h('span', { class: 'state__icon', 'aria-hidden': 'true' }, icon(iconName)),
    h('h2', { class: 'state__title' }, title),
    text ? h('p', { class: 'state__text' }, text) : null,
    actions.length ? h('div', { class: 'state__actions' }, actions) : null,
  );
}

export function renderEmpty(container, { title, text, actionLabel, onAction, href, hrefLabel }) {
  endLoading(container);
  clear(container);
  const actions = [];
  if (actionLabel) actions.push(h('button', { type: 'button', class: 'btn btn-primary', onclick: onAction }, actionLabel));
  if (href) actions.push(h('a', { class: 'btn btn-outline', href }, hrefLabel));
  container.append(panel({ kind: 'empty', iconName: 'search', title, text, actions }));
}

export function renderError(container, { title = 'We could not load the villas', text, onRetry }) {
  endLoading(container);
  clear(container);
  const actions = onRetry ? [h('button', { type: 'button', class: 'btn btn-primary', onclick: onRetry }, 'Try again')] : [];
  container.append(panel({ kind: 'error', iconName: 'alert', title, text, actions, role: 'alert' }));
}
