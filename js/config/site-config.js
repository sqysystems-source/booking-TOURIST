/**
 * Villa Aesthetic – general site settings.
 * Edit this file to change the brand name, navigation, footer text and data source.
 * Contact details live in contact-config.js; Firebase settings in firebase-config.js.
 */
export const SITE = {
  brandName: 'Villa Aesthetic',

  /**
   * Where villa listings come from.
   *   'auto'      – use Firestore when firebase-config.js is filled in, otherwise demo mode (default)
   *   'demo'      – always use the sample listings in js/data/demo-villas.js
   *   'firestore' – always use Firestore. If Firebase is not configured the site shows
   *                 an error instead of falling back to demo listings.
   */
  dataSource: 'auto',

  /**
   * Public origin used when building shareable villa links for enquiries,
   * e.g. 'https://www.villa-aesthetic.example'. Leave empty to use the
   * address the visitor is currently on.
   */
  siteUrl: '',

  nav: [
    { label: 'Home', href: 'index.html', page: 'home' },
    { label: 'Villas', href: 'villas.html', page: 'villas' },
    { label: 'Contact', href: 'contact.html', page: 'contact' },
  ],

  footer: {
    blurb:
      'Villa stays on the Greek islands. We take enquiries and confirm availability and final pricing personally.',
    note:
      'Prices shown on this website are indicative and may change. Nothing is booked until our team has confirmed availability and the final price with you.',
  },

  /** Short explanations reused across the site. */
  messages: {
    enquiryOnly:
      'This website handles enquiries only. Our team confirms availability and final pricing before anything is booked.',
    filterNote:
      'Filters narrow the list by features only. They do not check dates, so availability is always confirmed by our team.',
    priceNote: 'Indicative price. Final pricing is confirmed by our team.',
    demoBanner:
      'The villas, photos and prices on this site are sample content, not real properties.',
  },

  /** Number of featured villas shown on the homepage. */
  featuredCount: 3,
};
