/**
 * Tiny DOM helpers. Content is always inserted as text nodes (never as HTML),
 * so data from Firestore cannot inject markup or scripts.
 */
export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/**
 * h('a', { class: 'btn', href: '#', onclick: fn, aria: { label: 'Close' }, data: { id: 1 } }, 'Text', child)
 * `html` is only for trusted, hard-coded markup (the SVG icons).
 */
export function h(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'aria') for (const [a, v] of Object.entries(value)) node.setAttribute(`aria-${a}`, v);
    else if (key === 'data') for (const [d, v] of Object.entries(value)) node.dataset[d] = v;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, value);
  }
  append(node, children);
  return node;
}

export function append(parent, children) {
  for (const child of [children].flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    parent.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return parent;
}

export function clear(node) {
  node.replaceChildren();
  return node;
}

/** Splits text on blank lines into <p> elements. */
export function paragraphs(text) {
  return String(text ?? '')
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => h('p', {}, part));
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
