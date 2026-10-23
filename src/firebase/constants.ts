// Constantes du dossier firebase/. PUR : aucun import de `firebase/*` (utilise aussi par l'admin), donc rien ici
// qui depende du SDK (`Timestamp`, `serverTimestamp()`...).

import type { Difficulty } from '@/types';

// ---------------------------------------------------------------------------------------------------------------
// Collections et documents
// ---------------------------------------------------------------------------------------------------------------

/** Collections lues par le jeu et l'admin ; cles de `JournalChange.c`. */
export const COLLECTIONS = {
  places: 'places',
  meta: 'meta',
} as const;

/** `meta/compassCounts` : taille de chaque groupe Boussole, lue par l'hote au lancement. */
export const COUNTS_DOC = { collection: COLLECTIONS.meta, id: 'compassCounts' } as const;

/** `meta/dataVersion` : incremente a chaque ecriture, pour qu'un cache cote jeu sache quand relire. */
export const DATA_VERSION_DOC = { collection: COLLECTIONS.meta, id: 'dataVersion' } as const;

/** Collection du journal de l'admin (une entree par ecriture), hors du jeu. */
export const JOURNAL_COLLECTION = 'journal';

// ---------------------------------------------------------------------------------------------------------------
// Rooms
// ---------------------------------------------------------------------------------------------------------------

/** Une room ne tient pas plus de joueurs connectes qu'il n'y a de couleurs. */
export const ROOM_MAX_PLAYERS = 10;

/** Collection des parties en ligne. */
export const ROOMS_COLLECTION = 'rooms';

// ---------------------------------------------------------------------------------------------------------------
// Code de room
// ---------------------------------------------------------------------------------------------------------------

/** Consonnes du code, sans c/h/w/z/g/q/x/j : difficiles a dire a voix haute en francais. */
export const CODE_CONSONANTS = 'bdfklmnprstv';

/** Nombre de syllabes (consonne + voyelle) d'un code. */
export const CODE_SYLLABLES = 4;

/** Voyelles du code, seulement a/i/o : e et u se confondent a l'oral. */
export const CODE_VOWELS = 'aio';

/** Forme exacte d'un code genere. */
export const ROOM_CODE_PATTERN = new RegExp(`^([${CODE_CONSONANTS}][${CODE_VOWELS}]){${CODE_SYLLABLES}}$`);

// ---------------------------------------------------------------------------------------------------------------
// Tirage des manches
// ---------------------------------------------------------------------------------------------------------------

/** Difficultes de la plus facile a la plus dure : l'anglais releve un lieu d'un cran. */
export const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'intermediate', 'hard'];

/** Positions tirees par manche quand une difficulte est refiltree ensuite (anglais) : marge de lecture. */
export const DRAW_PER_ROUND_WITH_BUMP = 3;

/** Plafond Firestore des valeurs d'un filtre `in` (et d'une requete `or`) : taille d'une tranche de numeros. */
export const IN_LIMIT = 30;

// ---------------------------------------------------------------------------------------------------------------
// Erreurs
// ---------------------------------------------------------------------------------------------------------------

/** Collection des compteurs d'erreurs du jour (appareil et global). */
export const ERROR_QUOTA_COLLECTION = 'errorQuota';

/** Collection des erreurs de jeu. */
export const ERRORS_COLLECTION = 'errors';

/** Une erreur est nettoyable apres ce delai (ms, 30 jours) : `expireAt`. */
export const ERROR_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
