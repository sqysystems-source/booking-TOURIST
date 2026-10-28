/**
 * Contact channel UI (WhatsApp, Viber, email), used on the homepage, the contact page
 * and inside the villa enquiry dialog.
 *
 * Channels whose details are still placeholders are shown as disabled and have no link.
 */
import { CONTACT } from '../config/contact-config.js';
import { h } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { getChannels } from '../lib/contact-links.js';
import { copyText, isLocalHost } from '../lib/clipboard.js';

const META = {
  whatsapp: { icon: 'chat', action: 'Message on WhatsApp', blurb: 'Quick questions and photos.' },
  viber: { icon: 'phone', action: 'Open Viber chat', blurb: 'Message us on Viber.' },
  email: { icon: 'mail', action: 'Write an email', blurb: 'Longer enquiries and group details.' },
};

/** Small announcer so screen-reader and sighted users both get copy feedback. */
function createStatus() {
  const node = h('p', { class: 'copy-status', role: 'status', 'aria-live': 'polite' });
  let timer;
  node.say = (text) => {
    node.textContent = text;
    clearTimeout(timer);
    timer = setTimeout(() => (node.textContent = ''), 4000);
  };
  return node;
}

export function configurationHint() {
  const any = getChannels(CONTACT).some((c) => c.enabled);
  if (any || !isLocalHost()) return null;
  return h(
    'p',
    { class: 'dev-hint', role: 'note' },
    'Developer note: contact details are still placeholders, so the buttons are switched off. Edit js/config/contact-config.js. This note only shows on localhost.',
  );
}

/**
 * Large contact cards.
 * @param {{message?: string, subject?: string, onViberUse?: () => void}} options
 */
export function createContactCards({ message = '', subject = '' } = {}) {
  const status = createStatus();
  const channels = getChannels(CONTACT, { message, subject });

  const cards = channels.map((channel) => {
    const meta = META[channel.id];
    const heading = h('h3', { class: 'channel-card__title' }, h('span', { class: 'channel-card__icon' }, icon(meta.icon)), channel.label);
    const body = [heading];

    if (!channel.enabled) {
      body.push(
        h('p', { class: 'channel-card__value channel-card__value--off' }, 'Not available yet'),
        h('button', { type: 'button', class: 'btn btn-outline btn-block', disabled: true }, meta.action),
      );
    } else {
      body.push(h('p', { class: 'channel-card__value' }, channel.display));
      body.push(
        h(
          'a',
          {
            class: 'btn btn-primary btn-block',
            href: channel.href,
            ...(channel.id === 'whatsapp' ? { target: '_blank', rel: 'noopener' } : {}),
          },
          meta.action,
        ),
      );
      if (channel.id === 'viber') {
        body.push(
          h(
            'button',
            {
              type: 'button',
              class: 'btn btn-text btn-block',
              onclick: async () => status.say((await copyText(channel.copyValue)) ? 'Viber number copied.' : 'Could not copy. Please select the number above.'),
            },
            icon('copy'),
            'Copy Viber number',
          ),
        );
      }
    }
    return h('li', { class: `channel-card${channel.enabled ? '' : ' is-off'}` }, body);
  });

  return h('div', { class: 'channel-cards' }, h('ul', { class: 'channel-cards__list' }, cards), status);
}

/**
 * Compact action buttons for the enquiry dialog. The message is read from `getMessage()`
 * at click time, so edits made in the textarea are always what gets sent.
 */
export function createEnquiryActions({ getMessage, subject, onStatus }) {
  const wrapper = h('div', { class: 'enquiry-actions' });
  const items = [];

  const refresh = () => {
    const message = getMessage();
    getChannels(CONTACT, { message, subject }).forEach((channel, i) => {
      const link = items[i];
      if (link && channel.enabled) link.setAttribute('href', channel.href);
    });
  };

  getChannels(CONTACT, { message: getMessage(), subject }).forEach((channel) => {
    const meta = META[channel.id];
    if (!channel.enabled) {
      const off = h('button', { type: 'button', class: 'btn btn-outline', disabled: true }, icon(meta.icon), `${channel.label} (not set up yet)`);
      items.push(off);
      wrapper.append(off);
      return;
    }
    const link = h(
      'a',
      {
        class: 'btn btn-primary',
        href: channel.href,
        ...(channel.id === 'whatsapp' ? { target: '_blank', rel: 'noopener' } : {}),
        onclick: async () => {
          refresh();
          if (channel.id === 'viber') {
            const ok = await copyText(getMessage());
            onStatus(ok ? 'Message copied. Paste it into Viber to send it.' : 'Viber cannot prefill messages. Please copy the message above.');
          }
        },
      },
      icon(meta.icon),
      channel.id === 'viber' ? 'Open Viber and copy message' : channel.label,
    );
    items.push(link);
    wrapper.append(link);
  });

  wrapper.refresh = refresh;
  wrapper.hasAny = () => getChannels(CONTACT).some((c) => c.enabled);
  return wrapper;
}
