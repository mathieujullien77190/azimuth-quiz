import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInAnonymously } from 'firebase/auth';

import { ROOM_CODE_STORAGE_KEY } from '@/data';
import { auth } from '@/firebase/client';

// Hors du barrel : `firebase/auth` entraine la meme chaine ESM que `firebase/client.ts`.
// Commun aux rooms de tous les jeux (forme du code, auth anonyme) ; le reste du document room reste duplique par jeu.

// Sans c/h/w/z/g/q/x/j : difficiles a dire a voix haute en francais.
const CODE_CONSONANTS = 'bdfklmnprstv';
// Seulement a/i/o : e et u se confondent a l'oral.
const CODE_VOWELS = 'aio';
const CODE_SYLLABLES = 4;

const ROOM_CODE_PATTERN = new RegExp(`^([${CODE_CONSONANTS}][${CODE_VOWELS}]){${CODE_SYLLABLES}}$`);

/** Le code a-t-il la forme exacte d'un code genere ? Verifie avant d'interroger Firestore. */
export const isValidRoomCode = (code: string): boolean => ROOM_CODE_PATTERN.test(code);

const randomChar = (chars: string): string => chars[Math.floor(Math.random() * chars.length)];

/**
 * Code court facile a dire : 4 syllabes consonne+voyelle (ex. "tarabota"), ~1,7 M de combinaisons.
 * Collisions non verifiees ici : le `createRoom` de chaque jeu reessaie.
 */
export const generateRoomCode = (): string =>
  Array.from({ length: CODE_SYLLABLES }, () => randomChar(CODE_CONSONANTS) + randomChar(CODE_VOWELS)).join('');

/** Le dernier code heberge par cet appareil (le joueur garde "son" code), essaye en premier par `createRoom`. */
export const loadMyRoomCode = async (): Promise<string | null> => {
  try {
    const code = await AsyncStorage.getItem(ROOM_CODE_STORAGE_KEY);
    return code !== null && isValidRoomCode(code) ? code : null;
  } catch {
    return null;
  }
};

/** Memorise le code heberge. Pas critique en cas d'echec : un code neuf sera tire. */
export const saveMyRoomCode = async (code: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(ROOM_CODE_STORAGE_KEY, code);
  } catch {
    // Pas critique.
  }
};

/** Uid Firebase Auth anonyme (connexion si besoin) : prouve aux regles l'appareil qui a cree/rejoint la room. Un seul par appareil, tous jeux confondus. */
const ensureSignedIn = async (): Promise<string> => {
  if (auth.currentUser) return auth.currentUser.uid;
  const credential = await signInAnonymously(auth);
  return credential.user.uid;
};
export const getLocalUid = ensureSignedIn;
