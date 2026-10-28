/**
 * Accessible photo lightbox built on the native <dialog> element:
 * focus is trapped while open and restored to the opening button on close,
 * Esc closes, Left/Right arrows (and swipes) move between photos.
 */
import { h } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { PLACEHOLDER_IMAGE } from './images.js';

export function createLightbox() {
  let images = [];
  let index = 0;

  const count = h('p', { class: 'lightbox__count', 'aria-live': 'polite' });
  const closeButton = h('button', { type: 'button', class: 'icon-button icon-button--light', 'aria-label': 'Close photo gallery' }, icon('close'));
  const prev = h('button', { type: 'button', class: 'icon-button icon-button--light lightbox__nav lightbox__nav--prev', 'aria-label': 'Previous photo' }, icon('left'));
  const next = h('button', { type: 'button', class: 'icon-button icon-button--light lightbox__nav lightbox__nav--next', 'aria-label': 'Next photo' }, icon('right'));
  const picture = h('img', { class: 'lightbox__image', alt: '', decoding: 'async' });
  const caption = h('figcaption', { class: 'lightbox__caption' });

  picture.addEventListener('error', () => {
    if (!picture.dataset.fallback) {
      picture.dataset.fallback = '1';
      picture.src = PLACEHOLDER_IMAGE;
    }
  });

  const dialog = h(
    'dialog',
    { class: 'lightbox', 'aria-label': 'Photo gallery' },
    h('div', { class: 'lightbox__bar' }, count, closeButton),
    h('div', { class: 'lightbox__stage' }, prev, h('figure', { class: 'lightbox__figure' }, picture, caption), next),
  );

  function show(i) {
    index = (i + images.length) % images.length;
    const image = images[index];
    delete picture.dataset.fallback;
    picture.src = image.url;
    picture.alt = image.alt;
    caption.textContent = image.alt;
    count.textContent = `Photo ${index + 1} of ${images.length}`;
    const single = images.length < 2;
    prev.hidden = single;
    next.hidden = single;
    // Warm the neighbours so paging feels instant.
    [index + 1, index - 1].forEach((n) => {
      if (images.length > 1) new Image().src = images[(n + images.length) % images.length].url;
    });
  }

  prev.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog || event.target.classList.contains('lightbox__stage')) dialog.close();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(index - 1);
    if (event.key === 'ArrowRight') show(index + 1);
  });
  dialog.addEventListener('close', () => document.documentElement.classList.remove('no-scroll'));

  let startX = null;
  dialog.addEventListener('touchstart', (e) => (startX = e.changedTouches[0].clientX), { passive: true });
  dialog.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
  });

  document.body.append(dialog);

  return {
    open(list, startIndex = 0) {
      if (!list.length) return;
      images = list;
      show(startIndex);
      dialog.showModal();
      document.documentElement.classList.add('no-scroll');
    },
  };
}
