/**
 * Firebase / Firestore settings for the PUBLIC website.
 *
 * As shipped, values are empty: the site shows a configuration error, never mock villas.
 * To connect to Firestore, paste your Firebase *web app* config below
 * (Firebase console > Project settings > Your apps > Web app > Config).
 *
 * These web config values identify your project; they are not secrets and are
 * designed to be public. Access is controlled by Firestore security rules
 * (see firestore.rules). NEVER put service-account keys, admin credentials or
 * any private secret in this file or anywhere else in the frontend.
 */
export const FIREBASE_CONFIG = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

/** Name of the Firestore collection that holds villa documents. */
export const VILLAS_COLLECTION = 'villas';

/** Firebase JS SDK version loaded from Google's CDN (no build step needed). */
export const FIREBASE_SDK_VERSION = '10.14.1';

/** Milliseconds to wait for Firestore before showing an error with a retry button. */
export const FIRESTORE_TIMEOUT_MS = 15000;

/** True when the minimum required values have been filled in. */
export function isFirebaseConfigured(config = FIREBASE_CONFIG) {
  const required = ['apiKey', 'projectId', 'appId'];
  return required.every((key) => {
    const value = String(config[key] ?? '').trim();
    return value !== '' && !/^(YOUR_|PLACEHOLDER|REPLACE)/i.test(value);
  });
}
