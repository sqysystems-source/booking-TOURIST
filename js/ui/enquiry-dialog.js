/**
 * "Request Availability" dialog.
 *
 * There is no booking and no form submission here: the visitor reviews a
 * prefilled message (villa name + page link), can add dates and guests, and then
 * sends it through WhatsApp, Viber or email. Those apps do the actual sending.
 */
import { SITE } from '../config/site-config.js';
import { CONTACT } from '../config/contact-config.js';
import { h } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { copyText } from '../lib/clipboard.js';
import { getChannels } from '../lib/contact-links.js';
import { createEnquiryActions, configurationHint } from './contact-panel.js';

export function createEnquiryDialog({ title, message, subject }) {
  const titleId = 'enquiry-title';
  const messageId = 'enquiry-message';

  const status = h('p', { class: 'copy-status', role: 'status', 'aria-live': 'polite' });
  let statusTimer;
  const say = (text) => {
    status.textContent = text;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => (status.textContent = ''), 4500);
  };

  const textarea = h('textarea', { id: messageId, class: 'field__input', rows: '9' });
  textarea.value = message;

  const actions = createEnquiryActions({ getMessage: () => textarea.value, subject, onStatus: say });
  textarea.addEventListener('input', () => actions.refresh());

  const viber = getChannels(CONTACT).find((c) => c.id === 'viber');
  const viberNote = viber?.enabled
    ? h(
        'p',
        { class: 'enquiry__viber' },
        `Viber number: ${viber.display} `,
        h(
          'button',
          {
            type: 'button',
            class: 'btn btn-text',
            onclick: async () => say((await copyText(viber.copyValue)) ? 'Viber number copied.' : 'Could not copy the number.'),
          },
          icon('copy'),
          'Copy number',
        ),
      )
    : null;

  const closeButton = h('button', { type: 'button', class: 'icon-button', 'aria-label': 'Close' }, icon('close'));

  const dialog = h(
    'dialog',
    { class: 'dialog enquiry', 'aria-labelledby': titleId },
    h(
      'div',
      { class: 'dialog__head' },
      h('h2', { id: titleId, class: 'dialog__title' }, title),
      closeButton,
    ),
    h('p', { class: 'dialog__intro' }, SITE.messages.enquiryOnly),
    h('label', { class: 'field__label', for: messageId }, 'Your message. Add your dates and number of guests before sending.'),
    textarea,
    h('p', { class: 'enquiry__lead' }, 'Send it with:'),
    actions,
    viberNote,
    configurationHint(),
    h(
      'div',
      { class: 'enquiry__extra' },
      h(
        'button',
        {
          type: 'button',
          class: 'btn btn-text',
          onclick: async () => say((await copyText(textarea.value)) ? 'Message copied.' : 'Could not copy. Please select the text and copy it.'),
        },
        icon('copy'),
        'Copy message',
      ),
    ),
    status,
  );

  const close = () => dialog.close();
  closeButton.addEventListener('click', close);
  dialog.addEventListener('click', (event) => event.target === dialog && close());
  dialog.addEventListener('close', () => document.documentElement.classList.remove('no-scroll'));
  document.body.append(dialog);

  return {
    open() {
      actions.refresh();
      dialog.showModal();
      document.documentElement.classList.add('no-scroll');
    },
  };
}
