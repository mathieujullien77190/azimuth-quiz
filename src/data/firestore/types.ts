import type { Category, Difficulty } from '@/types';

/** Forme Firestore des donnees. Pas de tableaux imbriques ni de `undefined` : champ optionnel absent = omis. */

export const COLLECTIONS = {
  places: 'places',
  meta: 'meta',
} as const;

/** Incremente a chaque ecriture, pour qu'un cache cote jeu sache quand relire. */
export const DATA_VERSION_DOC = { collection: COLLECTIONS.meta, id: 'dataVersion' } as const;

export type CompassDoc = { category: Category; description?: string; wikiFr?: string; wikiEn?: string };

/** Copie du pays dans CHAQUE lieu (aucune lecture en plus) ; l'admin ne les edite plus. */
export type CountrySnapshot = {
  fr: string;
  en: string;
};

/** `places/{key}`, `key` = code permanent a 3 lettres. `compass` seulement si le lieu est dans le jeu. */
export type PlaceDoc = {
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  difficulty: Difficulty;
  /** Position 1..taille dans le groupe Boussole : Firestore n'a pas de requete « N documents au hasard ». Dense (seed, admin, `planRegroup`). */
  n?: number;
  country?: CountrySnapshot;
  compass?: CompassDoc;
};

export type DataVersionDoc = { version: number; updatedAt: number };

/** Taille de chaque groupe Boussole, `counts[categorie][difficulte]` ; un groupe vide est absent. */
export type CompassCounts = Partial<Record<Category, Partial<Record<Difficulty, number>>>>;

/** `meta/compassCounts`, lu par l'hote au lancement. `shuffled` : les `n` suivent `shuffleRank` (sinon l'admin propose de melanger) ; le jeu l'ignore. */
export type CompassCountsDoc = { counts: CompassCounts; shuffled?: true };

export const COMPASS_COUNTS_DOC = { collection: COLLECTIONS.meta, id: 'compassCounts' } as const;

/** `journal/{id auto}` : une entree par ecriture de l'admin, avec l'horodatage serveur `at`. */
export const JOURNAL_COLLECTION = 'journal';

/** Un document touche par une ecriture de l'admin : collection, id, ecrit ou supprime. */
export type JournalChange = { c: keyof typeof COLLECTIONS; id: string; op: 'set' | 'delete' };

export type JournalDoc = { changes: JournalChange[] };
