import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

// Same project (and same `.env`, see vite.config.ts `envDir`) as the game: client-side config, not a
// secret — access is gated by `firestore.rules`.
const app = initializeApp({
  apiKey: import.meta.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.EXPO_PUBLIC_FIREBASE_APP_ID,
});

export const auth = getAuth(app);
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true });

/** The accounts allowed to write the game data — mirrored by `isAdmin()` in `firestore.rules`, which is
 * what actually enforces it; this list only drives the screens. */
export const ADMIN_EMAILS = ['mathieu.jullien77190@gmail.com', 'douchin.floran@gmail.com'];
