import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

// Meme projet (et meme `.env`, voir `envDir` de vite.config.ts) que le jeu : config cote client, pas un secret,
// l'acces est garde par `firestore.rules`.
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

/**
 * Comptes autorises a ecrire les donnees ; miroir de `isAdmin()` dans `firestore.rules`, qui est la vraie barriere
 * (cette liste ne pilote que l'affichage).
 */
export const ADMIN_EMAILS = ['mathieu.jullien77190@gmail.com', 'douchin.floran@gmail.com'];
