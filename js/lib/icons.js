/** Inline SVG icons (stroke style, 24px grid). Hard-coded, trusted markup. */
const svg = (paths, extra = '') =>
  `<svg class="icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" ${extra}>${paths}</svg>`;

export const ICONS = {
  guests: svg('<circle cx="9" cy="8" r="3.2"/><path d="M3 19.5c.4-3.3 3-5.2 6-5.2s5.6 1.9 6 5.2"/><circle cx="17" cy="9" r="2.4"/><path d="M17.5 14.5c2 .3 3.2 1.8 3.5 4"/>'),
  bed: svg('<path d="M3 18V6"/><path d="M3 14h18v4"/><path d="M21 14v-2.5A2.5 2.5 0 0 0 18.5 9H11v5"/><circle cx="7" cy="11" r="1.6"/>'),
  bath: svg('<path d="M4 12h16v2.5A4.5 4.5 0 0 1 15.5 19h-7A4.5 4.5 0 0 1 4 14.5V12Z"/><path d="M6 12V6.5A2.5 2.5 0 0 1 8.5 4c1 0 2 .6 2.4 1.5"/><path d="M7 19l-1 2M17 19l1 2"/>'),
  pin: svg('<path d="M12 21s-6.5-5.6-6.5-10.8a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21Z"/><circle cx="12" cy="10" r="2.3"/>'),
  check: svg('<path d="m5 12.5 4.2 4.2L19 7"/>'),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  left: svg('<path d="m14.5 5-7 7 7 7"/>'),
  right: svg('<path d="m9.5 5 7 7-7 7"/>'),
  menu: svg('<path d="M4 8h16M4 16h16"/>'),
  chat: svg('<path d="M5 18.5 3.5 21l.7-4A8 8 0 1 1 8 19.3L5 18.5Z"/><path d="M8.5 10h7M8.5 13.5h4"/>'),
  phone: svg('<path d="M6.5 4h3l1.5 4-2 1.3a11 11 0 0 0 5.7 5.7l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4Z"/>'),
  mail: svg('<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>'),
  copy: svg('<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/>'),
  gallery: svg('<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m4 17 5-4.5 3.5 3 3-2.5 4.5 4"/>'),
  info: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.01"/>'),
  alert: svg('<path d="M12 4 3 19.5h18L12 4Z"/><path d="M12 10v4.5M12 17v.01"/>'),
  search: svg('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>'),
  arch: svg('<path d="M6 20V10a6 6 0 0 1 12 0v10"/><path d="M3.5 20h17"/>'),
};

/** Returns a fresh element for an icon (so it can be appended in several places). */
export function icon(name) {
  const template = document.createElement('template');
  template.innerHTML = ICONS[name] ?? '';
  return template.content.firstElementChild;
}
