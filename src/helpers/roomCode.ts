import { signInAnonymously } from 'firebase/auth';

import { auth } from '@/helpers/firebase';

// Not re-exported from `helpers/index.ts`'s barrel: `firebase/auth` drags in the same ESM-only
// Firestore chain as `helpers/firebase.ts` itself — keeping this out of the barrel means only
// whatever actually calls into Firebase pays that cost, not every test that imports `@/helpers`
// for something unrelated. Shared by every game's own room helpers (`games/<jeu>/helpers/room.ts`)
// — the only two pieces of the online-room machinery with zero game-specific coupling (room code
// shape, anonymous auth) — everything else (the room document's own fields) stays duplicated per
// game, since each game's round state is shaped too differently to share profitably yet.

// No c/h/w/z/g/q/x/j — awkward to say out loud in French, dropped by request.
const CODE_CONSONANTS = 'bdfklmnprstv';
// Only a/i/o — e and u dropped by request (too easy to confuse said out loud).
const CODE_VOWELS = 'aio';
const CODE_SYLLABLES = 4;

/** Every room code is `CODE_SYLLABLES` consonant+vowel pairs — a code is complete once it
 * reaches this length, before that it's still being typed. */
export const ROOM_CODE_LENGTH = CODE_SYLLABLES * 2;

const ROOM_CODE_PATTERN = new RegExp(`^([${CODE_CONSONANTS}][${CODE_VOWELS}]){${CODE_SYLLABLES}}$`);

/** Whether a string has the exact consonant+vowel shape of a generated room code — checked
 * before ever querying Firestore, so typing something the wrong shape (however long) never
 * fires a "code not found" against the backend for no reason. */
export const isValidRoomCode = (code: string): boolean => ROOM_CODE_PATTERN.test(code);

const randomChar = (chars: string): string => chars[Math.floor(Math.random() * chars.length)];

/** A short, easy-to-say room code: 4 consonant+vowel syllables (e.g. "tarabota"), not a random
 * alphanumeric string — (12 consonants × 3 vowels)^4 ≈ 1.7M combinations, plenty for a handful of
 * friends playing together. Collisions aren't checked here: each game's own `createRoom` retries
 * on one. */
export const generateRoomCode = (): string =>
  Array.from({ length: CODE_SYLLABLES }, () => randomChar(CODE_CONSONANTS) + randomChar(CODE_VOWELS)).join('');

/** An anonymous Firebase Auth uid, signing in if needed — proves "the device that created/joined
 * this room" to security rules without any actual login screen. Shared across every game's rooms:
 * one Firebase Auth identity per device, regardless of which game's room it's currently in. */
const ensureSignedIn = async (): Promise<string> => {
  if (auth.currentUser) return auth.currentUser.uid;
  const credential = await signInAnonymously(auth);
  return credential.user.uid;
};
export const getLocalUid = ensureSignedIn;
