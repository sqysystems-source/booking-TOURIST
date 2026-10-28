import { CONTACT } from '../config/contact-config.js';
import { $ } from '../lib/dom.js';
import { buildGeneralMessage } from '../lib/contact-links.js';
import { mountLayout } from '../ui/layout.js';
import { createContactCards, configurationHint } from '../ui/contact-panel.js';

mountLayout({ page: 'contact' });

$('#contact-channels').append(
  createContactCards({ message: buildGeneralMessage(CONTACT), subject: CONTACT.generalEmailSubject }),
  configurationHint(),
);
