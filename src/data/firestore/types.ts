import type {
  Category,
  ClueFlagColorId,
  CluePositionInCountry,
  ContourCenterLabel,
  ContourNeighbor,
  Difficulty,
} from '@/types';

/**
 * Firestore shape of the game data (phase 1: written by `scripts/seedFirestore.ts`, read and edited
 * by the admin only — the game itself still reads the bundled JSON). One document per entity, never
 * a big blob (1 MB cap per doc). Firestore refuses nested arrays and `undefined`, hence: contour
 * `points` are flat (`[lon, lat, lon, lat, ...]`), flag colors are objects, and an absent optional
 * field is simply omitted.
 */

export const COLLECTIONS = {
  places: 'places',
  countries: 'countries',
  charadeRiddles: 'charadeRiddles',
  personalityJobs: 'personalityJobs',
  meta: 'meta',
} as const;

/** Bumped by every write (seed or admin edit) so a future game-side cache can tell when to refetch. */
export const DATA_VERSION_DOC = { collection: COLLECTIONS.meta, id: 'dataVersion' } as const;

export type CompassDoc = { category: Category; description?: string; wikiFr?: string; wikiEn?: string };

export type CluesDoc = {
  positionInCountry: CluePositionInCountry;
  population: number;
  climateEmoji: string;
  elevationMeters: number;
  /** IANA identifier (e.g. "Europe/Paris"), not the 2-letter code of `codec.ts`. */
  timezone: string;
  airportCode: string;
  emojis: string[];
  syllables: string[];
};

/** `places/{key}` — `key` is the permanent 3-letter code (see `data/places/codec.ts`). Identity and
 * difficulty are shared by both games; `compass`/`clues` are present only for a place in that pool. */
export type PlaceDoc = {
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  difficulty: Difficulty;
  /** Position 1..size inside the place's Compass group (`compass.category` x `difficulty`), only on a
   * place with `compass`: the game draws random positions and asks for `n in [...]`, Firestore having no
   * "N random documents" query. Kept dense by the seed, the admin's numbering screen and `planRegroup`. */
  n?: number;
  compass?: CompassDoc;
  clues?: CluesDoc;
  /** Curated by hand, `jobCode` looks up `personalityJobs/{code}`. */
  personality?: { name: string; jobCode: string | null };
  wordplay?: { sentence: string; difficulty: Difficulty };
};

export type FlagColorDoc = { id: ClueFlagColorId; hex: string; percent: number };

export type ContourDoc = {
  /** Flat closed ring: `[lon, lat, lon, lat, ...]`. */
  points: number[];
  neighbors?: ContourNeighbor[];
  centerLabel?: ContourCenterLabel;
  difficulty?: Difficulty;
};

/** `countries/{ISO code}`. */
export type CountryDoc = {
  fr: string;
  en: string;
  flag?: FlagColorDoc[];
  currency?: string;
  currencySymbol?: string;
  phoneCode?: string;
  contour?: ContourDoc;
  /** ISO codes of the land neighbors, sorted, absent for an island. */
  borders?: string[];
};

/** `charadeRiddles/{normalized syllable}`. */
export type RiddleDoc = { riddle: string | null };

/** `personalityJobs/{code}`. */
export type JobDoc = { fr: string; en: string };

export type DataVersionDoc = { version: number; updatedAt: number };

/** Size of every Compass group, `counts[category][difficulty]` — a group with no place is absent. */
export type CompassCounts = Partial<Record<Category, Partial<Record<Difficulty, number>>>>;

/** `meta/compassCounts`: read once by the host at launch (see `numbering.ts`). `shuffled` says the `n` of
 * every group follow the shuffled order of `shuffleRank` (set by the seed and by the admin's numbering
 * screen): while it is missing the admin offers to shuffle. The game ignores it. */
export type CompassCountsDoc = { counts: CompassCounts; shuffled?: true };

export const COMPASS_COUNTS_DOC = { collection: COLLECTIONS.meta, id: 'compassCounts' } as const;
