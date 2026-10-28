/**
 * Builds contact links from contact-config.js.
 * Pure functions with no DOM access, so they can be unit-tested.
 *
 * A channel is only "enabled" when its value is real: placeholders, empty values
 * and malformed numbers/addresses produce NO link at all.
 */

const PLACEHOLDER = /placeholder|replace_with|your[_ -]/i;

/** Returns { digits, e164, display } for a usable international number, else null. */
export function parsePhone(value) {
  const text = String(value ?? '').trim();
  if (!text || PLACEHOLDER.test(text)) return null;
  if (/[^\d+\s().-]/.test(text)) return null; // letters or other symbols: not a number
  let digits = text.replace(/[^\d+]/g, '');
  if (digits.startsWith('00')) digits = '+' + digits.slice(2);
  digits = digits.replace(/\+/g, (m, i) => (i === 0 ? '+' : ''));
  const bare = digits.replace('+', '');
  if (!/^\d{8,15}$/.test(bare)) return null;
  return { digits: bare, e164: '+' + bare, display: text };
}

export function parseEmail(value) {
  const text = String(value ?? '').trim();
  if (!text || PLACEHOLDER.test(text)) return null;
  return /^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]{2,}$/.test(text) ? text : null;
}

const CRLF = '\r\n';

export function buildWhatsAppLink(contact, message) {
  const phone = parsePhone(contact.whatsappNumber);
  if (!phone) return null;
  const base = `https://wa.me/${phone.digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/**
 * Viber's supported deep link opens a chat with a number: viber://chat?number=%2B<number>.
 * Viber does not support a prefilled message, so the UI offers a copy button instead.
 */
export function buildViberLink(contact) {
  const phone = parsePhone(contact.viberNumber);
  return phone ? `viber://chat?number=${encodeURIComponent(phone.e164)}` : null;
}

export function buildMailtoLink(contact, subject, body) {
  const email = parseEmail(contact.email);
  if (!email) return null;
  const parts = [];
  if (subject) parts.push(`subject=${encodeURIComponent(subject)}`);
  if (body) parts.push(`body=${encodeURIComponent(body.replace(/\r?\n/g, CRLF))}`);
  return `mailto:${email}${parts.length ? '?' + parts.join('&') : ''}`;
}

/** Description of each channel and whether it is usable. */
export function getChannels(contact, { message = '', subject = '' } = {}) {
  const wa = parsePhone(contact.whatsappNumber);
  const viber = parsePhone(contact.viberNumber);
  const email = parseEmail(contact.email);
  return [
    { id: 'whatsapp', label: 'WhatsApp', enabled: Boolean(wa), href: buildWhatsAppLink(contact, message), display: wa?.display ?? '' },
    { id: 'viber', label: 'Viber', enabled: Boolean(viber), href: buildViberLink(contact), display: viber?.display ?? '', copyValue: viber?.e164 ?? '' },
    { id: 'email', label: 'Email', enabled: Boolean(email), href: buildMailtoLink(contact, subject, message), display: email ?? '' },
  ];
}

/** The message pre-filled when someone enquires about a particular villa. */
export function buildVillaMessage(contact, villa, url) {
  const lines = [
    contact.greeting || 'Hello,',
    '',
    `I'd like to request availability for ${villa.name}${villa.island ? ` (${villa.island})` : ''}.`,
    url ? `Villa page: ${url}` : '',
    '',
    'Dates: ',
    'Guests: ',
    '',
    'Thank you!',
  ];
  return lines.filter((line, i) => line !== '' || lines[i - 1] !== '').join('\n');
}

export function buildGeneralMessage(contact) {
  return [contact.greeting || 'Hello,', '', (contact.generalMessage || '').trim(), '', 'Thank you!'].join('\n');
}

export function buildVillaSubject(villa) {
  return `Availability request: ${villa.name}`;
}
