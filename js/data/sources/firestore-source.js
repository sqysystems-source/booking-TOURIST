/**
 * Firestore data source (read-only, public).
 *
 * - Loads the Firebase JS SDK from Google's CDN only when this module is used,
 *   without blocking static page rendering.
 * - Every query includes `published == true`. Firestore security rules enforce
 *   the same thing server-side (see firestore.rules).
 * - Only equality filters are used, so no composite index is required.
 */
import {
  FIREBASE_CONFIG,
  FIREBASE_SDK_VERSION,
  FIRESTORE_TIMEOUT_MS,
  VILLAS_COLLECTION,
  isFirebaseConfigured,
} from '../../config/firebase-config.js';
import { FIELD_MAP } from '../schema-map.js';
import { DataError, DATA_MESSAGES } from '../data-error.js';
import { withTimeout } from '../../lib/async.js';

let sdkPromise = null;

function loadFirestore() {
  if (!isFirebaseConfigured()) {
    return Promise.reject(new DataError('config', DATA_MESSAGES.config));
  }
  if (!sdkPromise) {
    const base = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;
    sdkPromise = Promise.all([import(`${base}/firebase-app.js`), import(`${base}/firebase-firestore.js`)])
      .then(([appSdk, firestoreSdk]) => {
        const app = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp(FIREBASE_CONFIG);
        return { db: firestoreSdk.getFirestore(app), fs: firestoreSdk };
      })
      .catch((error) => {
        sdkPromise = null; // allow a retry
        throw new DataError('network', DATA_MESSAGES.network, error);
      });
  }
  return sdkPromise;
}

function toDataError(error) {
  if (error instanceof DataError) return error;
  const code = String(error?.code ?? '');
  if (code.includes('permission-denied')) return new DataError('permission', DATA_MESSAGES.permission, error);
  if (code.includes('failed-precondition')) return new DataError('index', DATA_MESSAGES.index, error);
  if (code.includes('unavailable') || code.includes('deadline')) return new DataError('network', DATA_MESSAGES.network, error);
  return new DataError('unknown', DATA_MESSAGES.unknown, error);
}

async function run(buildQuery) {
  try {
    const { db, fs } = await withTimeout(loadFirestore(), FIRESTORE_TIMEOUT_MS);
    const q = buildQuery(fs, fs.collection(db, VILLAS_COLLECTION));
    const snapshot = await withTimeout(fs.getDocsFromServer(q), FIRESTORE_TIMEOUT_MS);
    return snapshot.docs.map((doc) => ({ raw: doc.data(), docId: doc.id }));
  } catch (error) {
    throw toDataError(error);
  }
}

/** All published villas. */
export function fetchAllPublished() {
  return run(({ query, where }, villas) => query(villas, where(FIELD_MAP.published, '==', true)));
}

/** One published villa by slug, or null when there is none. */
export async function fetchBySlug(slug) {
  const records = await run(({ query, where, limit }, villas) =>
    query(villas, where(FIELD_MAP.published, '==', true), where(FIELD_MAP.slug, '==', slug), limit(1)),
  );
  return records[0] ?? null;
}

/** Homepage configuration is a separate public document; no villa query changes. */
export async function fetchHero(){
 const {db,fs}=await withTimeout(loadFirestore(),FIRESTORE_TIMEOUT_MS);
 const snapshot=await withTimeout(fs.getDocFromServer(fs.doc(db,'site_content','hero')),FIRESTORE_TIMEOUT_MS);
 return snapshot.exists()?snapshot.data():null;
}
