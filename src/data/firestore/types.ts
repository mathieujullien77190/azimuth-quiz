import type {
  Category,
  ClueCategory,
  ClueFlagColorId,
  CluePositionInCountry,
  ContourCenterLabel,
  ContourNeighbor,
  Difficulty,
} from '@/types';

/**
 * Firestore shape of the game data (the only copy: the games read it, the admin edits it). One document per entity, never
 * a big blob (1 MB cap per doc). Firestore refuses nested arrays and `undefined`, hence: contour
 * `points` are flat (`[lon, lat, lon, lat, ...]`), flag colors are objects, and an absent optional
 * field is simply omitted.
 */

export const COLLECTIONS = {
  places: 'places',
  countries: 'countries',
  contours: 'contours',
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
  /** The riddle of each syllable, same order as `syllables` (`null` when it has none): copied here from
   * `charadeRiddles/{syllable}` so a round reads no dictionary. The admin rewrites it when a riddle or the
   * syllables change. */
  riddles?: (string | null)[];
  /** The place's Clues category, derived from its Compass category (`capital` / `citiesFr`, otherwise
   * `cities`, see `cluesCategory`) but stored because the game queries on it. */
  category?: ClueCategory;
  /** Position 1..size inside the place's Clues group (`clues.category` x `difficulty`), kept dense like
   * `PlaceDoc.n` is for Compass — see `numbering.ts`. */
  n?: number;
};

/** What a place carries of its country, copied from `countries/{code}` into EVERY place of that country:
 * the game then needs no country lookup (no extra read) to show the country name, flag, currency or phone
 * code. The admin rewrites all the places of a country in the same batch when the country is edited. */
export type CountrySnapshot = {
  fr: string;
  en: string;
  flag?: FlagColorDoc[];
  currency?: string;
  currencySymbol?: string;
  phoneCode?: string;
};

/** `places/{key}` — `key` is the place's permanent 3-letter code (`"par"` for Paris). Identity and
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
  /** Snapshot of the place's country (see `CountrySnapshot`), kept up to date by the admin. */
  country?: CountrySnapshot;
  compass?: CompassDoc;
  clues?: CluesDoc;
  /** Curated by hand, `jobCode` looks up `personalityJobs/{code}`. */
  personality?: {
    name: string;
    jobCode: string | null;
    /** The job's labels copied from `personalityJobs/{jobCode}` (the game shows `job.fr`). Absent when
     * there is no job. */
    job?: { fr: string; en: string };
  };
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

/** `meta/cluesCounts`: same as `CompassCountsDoc` for the Clues groups (`clues.category` x `difficulty`),
 * read once by the host at launch. `shuffled`: the `clues.n` follow the shuffled order of `shuffleRank`. */
export type CluesCountsDoc = { counts: CompassCounts; shuffled?: true };

export const CLUES_COUNTS_DOC = { collection: COLLECTIONS.meta, id: 'cluesCounts' } as const;

/** A place offered as a hint on the Silhouette board: where it is and what it is called. */
export type ContourPlaceDoc = { name: string; lon: number; lat: number };

/** A neighbor of a silhouette, with its names copied in (`fr`/`en`) so the hint never looks a country up. */
export type ContourNeighborDoc = ContourNeighbor & { fr: string; en: string };

/**
 * `contours/{ISO code}`: everything one Silhouette round needs about its country in a single document
 * (moved out of `countries/{code}.contour`, which the countries list read in full). Names are copied in,
 * and so are the capital and the cities offered as hints (chosen once by `buildContourDocs`, as the game
 * used to choose them at every round). `n` is the position 1..size inside the country's difficulty group.
 */
export type ContourCountryDoc = {
  fr: string;
  en: string;
  /** Flat closed ring: `[lon, lat, lon, lat, ...]`. */
  points: number[];
  difficulty: Difficulty;
  centerLabel: ContourCenterLabel;
  neighbors: ContourNeighborDoc[];
  /** Own outline as an encoded polyline (`polyline.ts`) — the same ring as `points`, 3-4 times lighter. Added by
   * the polyline migration; a document without it is read from `points`. */
  ring?: string;
  /** The outline of every country in `borderCodes` (encoded polyline, copied as is so the shared edges stay
   * exact): a round reads ONE document instead of the country plus its neighbours. */
  neighborRings?: Record<string, string>;
  /** ISO codes of the countries sharing a land border (the board draws them as a backdrop). TEMPORARY as a
   * source of neighbour documents: the two-step read that uses it goes away once `neighborRings` is everywhere. */
  borderCodes: string[];
  capital?: ContourPlaceDoc;
  cities?: ContourPlaceDoc[];
  n?: number;
};

/** Size of every silhouette difficulty group. */
export type ContourCounts = Partial<Record<Difficulty, number>>;

/** `meta/contourCounts`. */
export type ContourCountsDoc = { counts: ContourCounts; shuffled?: true };

export const CONTOUR_COUNTS_DOC = { collection: COLLECTIONS.meta, id: 'contourCounts' } as const;
