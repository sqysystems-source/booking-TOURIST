# Villa Aesthetic — live Firestore website

Static HTML/CSS/ES modules for Vercel. The public catalog now uses Firestore **exclusively**. Missing configuration, access errors and outages produce an explicit error/retry state; they never load sample villas. Demo banners and listing badges are removed. The old demo module remains only as an isolated logic-test fixture, with no production import.

The matching **SQySystems `booking_tourist`** workspace is `public/admin-tourist.html` in the separate SQySystems project. It manages this tenant's root `villas` collection. The event/banquet `booking_site` and Fashion panels remain separate.

## Setup

1. Create/select the dedicated tourist Firebase project with its **(default)** Firestore database. Activate Firebase Authentication Email/Password and Firebase Storage. No service-account key belongs in either frontend.
2. Set the six public FIREBASE_* variables in Vercel; see VERCEL_ENV_SETUP.md. The build generates js/config/firebase-config.js. Use the **same project and storageBucket** in SQySystems → Store Connections. Never use the Master project's credentials for this tenant.
3. Create the tenant owner's Firebase Auth user. In this tenant's Firestore Console, create `users/{EXACT_AUTH_UID}` with `role: "admin"` and the owner's email. The browser cannot grant this role. Existing Master accounts remain independent; the workspace supports the existing tenant session/login flow.
4. Publish this repository's `firestore.rules` to the **tourist tenant Firestore** and `storage.rules` to its **Storage bucket**. These are not Booking Events or Master rules. When asked by Firebase, enable the permission allowing Storage rules to consult Firestore.
5. Configure bucket CORS for authenticated draft image previews from the SQySystems origin. Copy `storage.cors.example.json`, replace the tourist-domain placeholder, include every exact SQySystems origin you use, then apply it with `gcloud storage buckets update gs://YOUR_BUCKET --cors-file=storage.cors.example.json`. CORS is not authorization.
6. Deploy the changed SQySystems files and its updated **Master `firestore.rules`**. In sqy-admin choose **Τουριστικά Καταλύματα / Βίλες · booking_tourist** and supply the tourist web config and website origin. This template always uses the dedicated entry, including when a previously shared-panel connection is edited.
7. In the workspace add a real villa as an unpublished draft, save, upload JPEG/PNG/WebP photos, then save again. Add a description and at least one image before publication. `featured: true` includes a published villa on the homepage.
8. Fill real channels in `js/config/contact-config.js`, brand/site URL in `site-config.js`, and replace any editorial hero/island illustrations if desired. Existing enquiry-only WhatsApp/Viber/email flows remain unchanged: this integration does not create reservations, process payments or guarantee dates.

## Vercel

Import the tourist repository as its own Vercel project. Framework **Other**, build command `npm run build`, output directory `.`. Keep `vercel.json` (including Firebase image/connect permissions). Public Firebase web config is intentionally public; no additional private environment variables are introduced. Do not upload private service-account credentials.

## Canonical villa schema

`villas/{id}`: `id`, `slug`, `name`, `island`, `area`, `description`, `shortDescription`, `images`, `maxGuests`, `bedrooms`, `bathrooms`, `amenities`, `priceFrom`, `currency`, `featured`, `published`, plus `revision`, `createdAt`, `updatedAt`.

- `island`: Santorini, Mykonos, Paros, Naxos, Crete, Milos, Corfu or Zakynthos. The UI stores these canonical names, with localized labels.
- `amenities`: existing canonical keys (including `chef`) or bounded custom strings. Known legacy aliases are normalized; custom amenities remain filterable.
- `priceFrom`: EUR per night as a number, or null for price on enquiry; never cents. These are indicative prices.
- `images`: ordered list of up to 12 `{url, alt, storagePath?}` objects. The first image is the cover. Uploads are limited to 8 MB each and kept under `villas/{id}/{uuid}.{jpg|png|webp}`. No SVG uploads.
- New documents use their immutable Latin slug as the document ID. Existing auto-ID documents can be edited; a new listing cannot reuse a known legacy slug. Direct Console/Admin SDK writes must maintain slug uniqueness themselves.
- Published records are publicly readable. Drafts and all writes require the tenant's existing `users/{uid}.role == "admin"` authorization. Do not place private owner/customer information inside public villa documents.
- Admin data streams through onSnapshot. Public pages fetch server data when loaded/retried; reload the public page to see committed changes.

## Image access and cleanup

New image URLs contain no Firebase download token. Public reads follow the villa's publication flag; authenticated admin previews use `getBlob` and need CORS. Unpublishing prevents new unauthenticated requests through these tokenless URLs; previously downloaded/copied media cannot be revoked. Previously issued token URLs from manual uploads must be revoked separately if they should stop working.

Removing attached images is finalized after a successful villa save. Deleting a villa first removes its Firestore record, then best-effort deletes its attached Storage objects. A failed cleanup is reported. Uploads abandoned before saving, or interrupted after completion, may leave unreferenced objects: inspect the relevant villa folder in Storage before deleting them. No unrelated tenant folders or other projects are swept automatically.

## Schema compatibility

The public `js/data/schema-map.js` remains the read contract. If you customize FIELD_MAP or VILLAS_COLLECTION later, update the admin writer and rules together; the provided integration uses the current supplied defaults (`villas`, top-level canonical fields).

## Tests

`npm test` runs the existing tests plus new production-source/query/filter/schema checks using Node mocks. No SDK credentials or production writes are used.

For actual rules validation, install local test dependencies (`firebase`, `@firebase/rules-unit-testing`, `firebase-tools`) in a development environment and run:

```sh
npx firebase emulators:exec --config firebase.emulator.json --only firestore,storage --project demo-tourist-integration "node tests/tourist-rules.emulator.mjs"
```

The included scenarios cover public published queries, draft isolation, role escalation denial, admin CRUD, 12 images / 30 amenities, invalid fields, Storage MIME/size limits and unpublishing. Browser, real-cloud and emulator verification are separate from the Node mock suite; see the integration test report for checks actually run.

Official references: https://firebase.google.com/docs/storage/security/rules-conditions and https://firebase.google.com/docs/storage/web/download-files
