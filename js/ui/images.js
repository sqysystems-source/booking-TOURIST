import { h } from '../lib/dom.js';

export const PLACEHOLDER_IMAGE = 'assets/img/placeholder.svg';

/**
 * Creates an <img> that is lazy by default, keeps its aspect ratio (no layout jump),
 * supports optional srcset, and swaps to a neutral placeholder if the file fails to load.
 */
export function createImage(image, { alt, sizes = '100vw', eager = false, className = '' } = {}) {
  const img = h('img', {
    class: className,
    src: image?.url || PLACEHOLDER_IMAGE,
    alt: alt ?? image?.alt ?? '',
    loading: eager ? 'eager' : 'lazy',
    decoding: 'async',
  });
  if (image?.srcset) {
    img.srcset = image.srcset;
    img.sizes = sizes;
  }
  if (image?.width && image?.height) {
    img.width = image.width;
    img.height = image.height;
  }
  if (eager) img.setAttribute('fetchpriority', 'high');
  img.addEventListener('error', () => {
    if (img.dataset.fallback) return;
    img.dataset.fallback = '1';
    img.removeAttribute('srcset');
    img.src = PLACEHOLDER_IMAGE;
  });
  return img;
}
