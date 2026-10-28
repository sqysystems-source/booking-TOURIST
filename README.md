# Villa Aesthetic: public website (phase 1)

Public website for **Villa Aesthetic**, villa holiday rentals on the Greek islands.
Plain **HTML, CSS and vanilla JavaScript** (ES modules), **Firebase Firestore** for data, deployable to **Vercel** with no build step.

This phase is the public site only. It has **no admin panel, no villa upload forms, no admin login, no payments, no checkout, no availability calendar and no contact form**. Visitors send enquiries through WhatsApp, Viber or email; our team confirms availability and final pricing.

---

## 1. Run locally

ES modules do not load from `file://`, so use any static server from the project folder:

```bash
# Option A (Node 18+)
npm start                    # serves http://localhost:3000

# Option B (Python)
python3 -m http.server 3000  # then open http://localhost:3000
```

Run the logic tests (filters, normalizer, contact links):

```bash
npm test
```

## 2. Demo mode vs Firestore

The data source is chosen in `js/config/site-config.js`:

| `dataSource` | Behaviour |
| --- | --- |
| `'auto'` (default) | Firestore if `js/config/firebase-config.js` is filled in, otherwise **demo mode** |
| `'demo'` | Always use the sample listings in `js/data/demo-villas.js` |
| `'firestore'` | Always use Firestore. If Firebase is not configured, an error is shown (never silent demo data) |

**Demo mode** is obvious to visitors: a bar at the top of every page ("Demo mode"), a "Demo listing" badge on every card and villa page, illustrated placeholder images labelled "Demo illustration", and a `noindex` meta tag so sample content is never indexed as real properties.

**Live mode:** if Firestore cannot be reached, the site shows an error with a **Try again** button. It never falls back to demo listings. Demo mode never contacts Firebase at all (the SDK is loaded lazily, only in live mode).

To go live:

1. Create a Firebase project and a Firestore database.
2. Firebase console > Project settings > Your apps > add a **Web app** and copy its config.
3. Paste the values into `js/config/firebase-config.js` (see `firebase-config.example.js`). These web config values are public identifiers, not secrets; the security rules protect the data.
4. Deploy the rules in `firestore.rules` (section 5).
5. Add published documents to the `villas` collection (section 3).

> Never put service-account keys, admin credentials or any private secret in this repository or in any frontend file. `.gitignore` already excludes common key file names.

## 3. Proposed `villas` collection

One document per villa in the `villas` collection.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | no | Defaults to the Firestore document ID |
| `slug` | string | **yes** | Unique, URL-safe, e.g. `villa-selene`. Used in `/villa.html?slug=villa-selene` |
| `name` | string | **yes** | |
| `island` | string | recommended | e.g. `Paros`. Matching ignores case and accents |
| `description` | string | recommended | Blank line = new paragraph |
| `images` | array | recommended | Strings (URLs) or objects, see below. First image is the cover |
| `maxGuests` | number | recommended | |
| `bedrooms` | number | recommended | |
| `bathrooms` | number | recommended | |
| `amenities` | array of strings | optional | e.g. `["Private pool", "Sea view", "Wi-Fi"]` |
| `priceFrom` | number | optional | Indicative nightly price. **Shown only when present and above 0** |
| `currency` | string | optional | ISO code, defaults to `EUR` |
| `featured` | boolean | optional | `true` to appear on the homepage |
| `published` | boolean | **yes** | Only `true` is ever shown or readable by the public |
| `shortDescription` | string | optional | Card text. Derived from `description` if missing |
| `area` | string | optional | e.g. a village or beach name, shown beside the island |

Image objects: `{ "url": "https://...", "alt": "Pool terrace at sunset", "width": 1600, "height": 1067, "srcset": "https://... 800w, https://... 1600w" }`. Only `url` is required. `width`/`height` prevent layout jumps; `srcset` enables responsive images. Only `http(s)` and relative URLs are accepted.

Example document:

```json
{
  "slug": "casa-elaia",
  "name": "Casa Elaia",
  "island": "Paros",
  "description": "A relaxed house among olive trees.\n\nThree bedrooms and a private pool.",
  "images": [{ "url": "https://example.com/casa-elaia-1.jpg", "alt": "Pool and pergola", "width": 1600, "height": 1067 }],
  "maxGuests": 6,
  "bedrooms": 3,
  "bathrooms": 2,
  "amenities": ["Private pool", "Garden", "Wi-Fi"],
  "priceFrom": 520,
  "currency": "EUR",
  "featured": true,
  "published": true
}
```

### Adapting to your existing admin panel's schema

Everything that knows field names lives in **`js/data/schema-map.js`**. Change the right-hand side of `FIELD_MAP`, for example:

```js
export const FIELD_MAP = {
  slug: 'urlSlug',
  name: 'title',
  island: 'location.island',     // dotted paths are supported
  priceFrom: 'pricing.from',
  published: 'status.published', // must stay a boolean
  // ...
};
```

`slug`, `published` and `featured` are also used in Firestore queries, so they must be real, directly queryable fields. If your panel uses a status string (e.g. `"live"`) instead of a boolean, either add a boolean `published` field when saving, or adjust the query in `js/data/sources/firestore-source.js` and the rules together.

## 4. Where to change things

| What | Where |
| --- | --- |
| **Contact details** (WhatsApp, Viber, email, message wording) | `js/config/contact-config.js` |
| Brand name, navigation, footer text, notices, data source | `js/config/site-config.js` |
| Firebase settings | `js/config/firebase-config.js` |
| Demo villas | `js/data/demo-villas.js` |
| Island discovery content | `js/data/islands.js` |
| Amenity names and aliases | `js/data/amenities.js` |
| Page copy | the `.html` files |
| Colours, fonts, spacing | CSS variables at the top of `css/base.css` |
| Security headers / CSP | `vercel.json` |

### Contact setup

All values in `contact-config.js` are **placeholders**. Until you replace them, the buttons are disabled and **no link is generated**: placeholders and malformed values never become links.

- **WhatsApp**: `https://wa.me/<number>?text=...`. Villa enquiries prefill the villa name and page URL.
- **Email**: `mailto:` with subject and body prefilled the same way.
- **Viber**: opens a chat using Viber's supported deep link `viber://chat?number=%2B<number>`. Viber cannot prefill message text, so the enquiry dialog offers **Copy message** (also copied automatically when opening Viber), and the Viber number is shown on screen with a **Copy number** button as a fallback (for example on a desktop without Viber).

Use international format with country code (`+30 ...`). On `localhost` a developer note reminds you while contacts are still placeholders; visitors never see it.

If you set `siteUrl` in `site-config.js`, villa links in messages use your public domain; otherwise the address the visitor is on.

## 5. Firestore security rules and indexes

`firestore.rules` allows public **read of villas with `published == true`** and denies all public writes and all other access. Unpublished villas cannot be read by the public.

```bash
npm install -g firebase-tools
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:rules,firestore:indexes
```

(or paste `firestore.rules` into Firebase console > Firestore > Rules).

Because list reads are only allowed when every result is published, the site always queries with `where('published', '==', true)`. Keep that if you change queries.

**Indexes:** none are required. The site uses only equality filters (`published`, `slug`), which Firestore serves from automatic single-field indexes, and sorts in the browser. `firestore.indexes.json` is therefore empty. If you later add server-side `orderBy` on another field together with `where('published', '==', true)`, Firestore will log an error with a link that creates the needed composite index.

The site loads the whole published list once and filters in the browser, which is fine for a catalogue of up to a few hundred villas. For much larger catalogues, add server-side filtering in `firestore-source.js`.

## 6. Push to GitHub and deploy to Vercel

Nothing has been uploaded or deployed by this project. These are the steps to do it yourself.

**GitHub**

```bash
cd villa-aesthetic
git init
git add .
git commit -m "Initial Villa Aesthetic public website"
git branch -M main
# create an empty repo on github.com first (no README), then:
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
```

**Vercel**

1. Go to vercel.com > **Add New > Project** and import the GitHub repository.
2. Framework preset: **Other**. Leave **Build Command** and **Output Directory** empty (static site, project root).
3. Click **Deploy**. Every push to `main` redeploys automatically.
4. Add your domain under Project > Settings > Domains, then set `siteUrl` in `js/config/site-config.js`.

(CLI alternative: `npm i -g vercel`, then `vercel` and `vercel --prod` inside the folder.)

`vercel.json` adds security headers including a Content Security Policy that allows only this site, Google Fonts and the Firebase SDK/Firestore. If you add other third-party scripts or image/font hosts, extend the policy there. Villa photos may come from any `https:` host.

## 7. Connecting the separate admin panel later

The website and the admin panel only need to share the **Firestore `villas` collection**.

1. Point the admin panel at the same Firebase project.
2. Have it save documents in the structure above (or adapt `FIELD_MAP`).
3. A villa goes live by setting `published: true`; setting it back to `false` hides it immediately.
4. Admin writes should use the **Firebase Admin SDK** on a server (it bypasses the public rules), or browser writes from signed-in admins using the optional rule at the bottom of `firestore.rules`. Keep admin credentials in the panel's own environment, never in this site.
5. Store photos in Firebase Storage or any CDN and save the public `https` URLs in `images`.

The website talks to data only through `js/data/villa-service.js` (`getVillas`, `getFeaturedVillas`, `getVillaBySlug`), so a different backend can replace Firestore by adding a source module next to `firestore-source.js`.

## 8. Project structure

```
index.html villas.html villa.html contact.html 404.html
css/        base.css (tokens), components.css, pages.css
js/config/  site-config, contact-config, firebase-config(+example)
js/data/    demo-villas, islands, amenities, schema-map, villa-service, sources/
js/lib/     dom, filters, contact-links, format, clipboard, meta, icons, async
js/ui/      layout, villa-card, lightbox, enquiry-dialog, contact-panel, states, images
js/pages/   one entry module per page
assets/     favicon.svg, img/ (demo illustrations)
tests/      logic.test.mjs
firestore.rules  firestore.indexes.json  firebase.json  vercel.json
```

## 9. Notes and limitations

- **Images are demo illustrations**, not photographs, and are labelled as such. Replace them with authorized photography in Firestore (`images`). Also replace `assets/img/hero.svg` and the island images, and update the `alt` text on the homepage when you do. There are no invented reviews, ratings or property claims.
- **Social share previews:** `villa.html` sets its title, description and canonical link with JavaScript. Search engines run it, but many social crawlers do not, so shared links may show the generic preview. Add `og:image` with an absolute URL once you have a domain. If rich per-villa previews matter, a small Vercel serverless function can render the tags server-side later.
- **Fonts** (Fraunces and Hanken Grotesk) load from Google Fonts. If blocked, the site falls back to Georgia and system sans-serif.
- Filters are by features only and never imply availability.
- The Firebase SDK version is pinned in `firebase-config.js` (`FIREBASE_SDK_VERSION`).
