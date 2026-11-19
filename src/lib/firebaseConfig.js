// Firebase (sign-in and the account's progress) and the Firestore project the usage counts go to.
//
// Everything here is a public client value, safe to commit: a Firebase web API key is not a secret,
// it only says which project to talk to, and the Firestore rules decide what that project allows.
//
// Nothing in this file talks to the network. The SDK itself is loaded later, and only when it is
// needed (see firebaseLoader.js).

import { WEB_TARGET } from './target.js';

const env = import.meta.env || {};

/** The web build only: the hosted artifact stays a single page with no account and no counts. */
export const WEB = WEB_TARGET;

const API_KEY = env.VITE_FIREBASE_API_KEY || '';
const AUTH_DOMAIN = env.VITE_FIREBASE_AUTH_DOMAIN || '';
const PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || '';
const APP_ID = env.VITE_FIREBASE_APP_ID || '';

/** The four values above, all of them, and the web build: only then can anything be signed in. */
export const syncAvailable = () => WEB && !!(API_KEY && AUTH_DOMAIN && PROJECT_ID && APP_ID);

/** The counts need a project and a key, and the web build. */
export const usageAvailable = () => WEB && !!(API_KEY && PROJECT_ID);

/** Is Google sign-in switched on in the Firebase console? ("1" once it is). */
export const googleEnabled = () => env.VITE_FIREBASE_GOOGLE === '1';

/** The Firebase web app's settings. */
export const firebaseConfig = () => ({
  apiKey: API_KEY,
  authDomain: AUTH_DOMAIN,
  projectId: PROJECT_ID,
  appId: APP_ID,
});

/** Where a sign-in link sends the reader back to (the site's own address). */
export const signInReturnUrl = () => `${location.origin}${location.pathname}#/settings?signin=1`;

/** The Firestore REST endpoint the usage counts are posted to (no SDK, no credentials). */
export const usageEndpoint = () =>
  `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/ev?key=${API_KEY}`;
