import type {
  Category,
  ClueCategory,
  ClueFlagColorId,
  CluePositionInCountry,
  Difficulty,
} from '@/types';

/** Forme Firestore des donnees. Pas de tableaux imbriques ni de `undefined` : couleurs de drapeau en objets, champ optionnel absent = omis. */

export const COLLECTIONS = {
  places: 'places',
  countries: 'countries',
  personalityJobs: 'personalityJobs',
  meta: 'meta',
} as const;

/** Incremente a chaque ecriture, pour qu'un cache cote jeu sache quand relire. */
export const DATA_VERSION_DOC = { collection: COLLECTIONS.meta, id: 'dataVersion' } as const;

export type CompassDoc = { category: Category; description?: string; wikiFr?: string; wikiEn?: string };

export type CluesDoc = {
  positionInCountry: CluePositionInCountry;
  population: number;
  climateEmoji: string;
  elevationMeters: number;
  /** Identifiant IANA (ex. "Europe/Paris"), pas le code a 2 lettres de `codec.ts`. */
  timezone: string;
  airportCode: string;
  emojis: string[];
  /** Categorie Indices, derivee de la categorie Boussole (`cluesCategory`) mais stockee car le jeu la requete. */
  category?: ClueCategory;
  /** Position 1..taille dans le groupe Indices, dense comme `PlaceDoc.n` (voir `numbering.ts`). */
  n?: number;
};

/** Copie du pays dans CHAQUE lieu (aucune lecture en plus) ; l'admin les reecrit dans le meme lot a l'edition du pays. */
export type CountrySnapshot = {
  fr: string;
  en: string;
  flag?: FlagColorDoc[];
  currency?: string;
  currencySymbol?: string;
  phoneCode?: string;
};

/** `places/{key}`, `key` = code permanent a 3 lettres. `compass`/`clues` seulement si le lieu est dans ce jeu. */
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
  clues?: CluesDoc;
  /** Saisi a la main ; `jobCode` pointe `personalityJobs/{code}`. */
  personality?: {
    name: string;
    jobCode: string | null;
    /** Libelles copies de `personalityJobs/{jobCode}`, absents sans metier. */
    job?: { fr: string; en: string };
  };
  wordplay?: { sentence: string; difficulty: Difficulty };
};

export type FlagColorDoc = { id: ClueFlagColorId; hex: string; percent: number };

/**
 * `countries/{ISO}`, copie dans chaque lieu (`denormalize.ts`). Les documents de l'ancien jeu Silhouette portent des
 * champs en plus, hors de ce type : l'admin ne les lit ni ne les efface.
 */
export type CountryDoc = {
  fr: string;
  en: string;
  flag?: FlagColorDoc[];
  currency?: string;
  currencySymbol?: string;
  phoneCode?: string;
};

export type JobDoc = { fr: string; en: string };

export type DataVersionDoc = { version: number; updatedAt: number };

/** Taille de chaque groupe Boussole, `counts[categorie][difficulte]` ; un groupe vide est absent. */
export type CompassCounts = Partial<Record<Category, Partial<Record<Difficulty, number>>>>;

/** `meta/compassCounts`, lu par l'hote au lancement. `shuffled` : les `n` suivent `shuffleRank` (sinon l'admin propose de melanger) ; le jeu l'ignore. */
export type CompassCountsDoc = { counts: CompassCounts; shuffled?: true };

export const COMPASS_COUNTS_DOC = { collection: COLLECTIONS.meta, id: 'compassCounts' } as const;

/** `meta/cluesCounts` : comme `CompassCountsDoc`, pour les groupes Indices. */
export type CluesCountsDoc = { counts: CompassCounts; shuffled?: true };

export const CLUES_COUNTS_DOC = { collection: COLLECTIONS.meta, id: 'cluesCounts' } as const;

/** `journal/{id auto}` : une entree par ecriture de l'admin, avec l'horodatage serveur `at`. */
export const JOURNAL_COLLECTION = 'journal';

/** Un document touche par une ecriture de l'admin : collection, id, ecrit ou supprime. */
export type JournalChange = { c: keyof typeof COLLECTIONS; id: string; op: 'set' | 'delete' };

export type JournalDoc = { changes: JournalChange[] };
