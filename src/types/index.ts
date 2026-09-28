import type { TextStyle } from 'react-native';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Category = 'cities' | 'mountains' | 'landmarks' | 'nature' | 'kids' | 'capital' | 'citiesFr';

/** Clues only draws from cities, so only these three of the 7 Compass categories apply. */
export type ClueCategory = Extract<Category, 'cities' | 'capital' | 'citiesFr'>;

/** Popularity/fame of the place, from best-known to most niche. */
export type Difficulty = 'easy' | 'intermediate' | 'hard';

/**
 * Base shared by both games: the minimal geographic identity of a place. Compass (`Place`) and
 * Clues (`CluePlace`) each extend it with their own game-specific fields — both keep
 * totally separate place pools (different curation, size and criteria), only this
 * shape is shared.
 */
export type GeoPlace = {
  name: string;
  country: string;
  coordinates: Coordinates;
};

export type Place = Omit<GeoPlace, 'country'> & {
  /** ISO 3166-1 alpha-2 country code: source of the flag AND the displayed name (see
   * `data/places/countries.ts`) — no country name stored per place. */
  code: string;
  category: Category;
  difficulty: Difficulty;
  /** Short trivia about the place: shown collapsed, only on reveal. Absent for
   * places not yet documented (the component then shows nothing). */
  description?: string;
  /** End of the Wikipedia URL (after "https://fr.wikipedia.org/wiki/" or ".../en.wikipedia.org/wiki/"),
   * not the full URL. Absent if nobody has filled it in yet for this place. */
  wikiFr?: string;
  wikiEn?: string;
};

export type Origin = {
  name: string;
  coordinates: Coordinates;
  isDevicePosition: boolean;
};

export type Guess = {
  /** Heading on the horizontal plane, 0 = north. */
  bearing: number;
  /** Estimated distance along the surface. */
  distanceKm: number;
};

export type RoundScore = {
  trueBearing: number;
  trueSurfaceDistanceKm: number;
  /** Angular error on the plane. */
  directionError: number;
  /** |ln(estimate / true distance)| : raw error used to break ties for the "closest" bonus
   * (see `applyBestBonus`), uncapped unlike `distancePoints` — two players both out of
   * tolerance (thus at 0 points) can still have very different errors. */
  distanceError: number;
  directionPoints: number;
  distancePoints: number;
  /** Bonus (1/5 of the category's max) for the player(s) closest in the round, on
   * each category separately. Always 0 in solo (no one to beat). */
  directionBonus: number;
  distanceBonus: number;
  /** Bonus for guessing the exact heading, to the nearest degree (see EXACT_DIRECTION_BONUS).
   * Independent of `directionBonus`: everyone who nails it gets it, not just the round's best. */
  directionExactBonus: number;
  /** Bonus for guessing the exact distance, to the nearest step the slider can actually land on
   * at that magnitude (see EXACT_DISTANCE_BONUS/`roundDistance`). Independent of `distanceBonus`:
   * everyone who nails it gets it, not just the round's best. */
  distanceExactBonus: number;
  total: number;
};

export type Player = {
  name: string;
  color: string;
};

export type PlayerResult = {
  guess: Guess;
  score: RoundScore;
};

export type RoundRecord = {
  place: Place;
  /** One result per player, in player order. */
  results: PlayerResult[];
};

export type GameSettings = {
  playerNames: string[];
  categories: Category[];
  difficulties: Difficulty[];
  rounds: number;
  useGps: boolean;
  /** Starting point when `useGps` is off: latitude/longitude entered by hand,
   * Paris by default. Ignored when `useGps` is on (device position used). */
  customLatitude: number;
  customLongitude: number;
  /** On mobile, the compass rotates so N points to true north. */
  liveCompass: boolean;
  /** Shows the country under the place's name. */
  showCountry: boolean;
  /** During the round, only shows your own arrow/estimate, never the ones already submitted
   * by other players (which remain normally visible on reveal). */
  hideOtherAnswers: boolean;
};

export type Rank = {
  title: string;
  emoji: string;
};

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceHigh: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentDark: string;
  onAccent: string;
  /** Color of the "truth" (true needle, true value). */
  truth: string;
  danger: string;
  success: string;
};

export type ThemeTypography = {
  /** Big text: place name, scores, title. */
  display: TextStyle;
  /** Medium text: values, buttons. */
  heading: TextStyle;
  /** Small labels (letter-spaced uppercase, depends on the theme). */
  label: TextStyle;
  body: TextStyle;
};

// --- Clues: game independent from Azimuth Quiz, with its own places (see data/clues.ts) ---

/** A clue's identifier: they all have the same "cost" (1 point off the score countdown,
 * see ClueGameScreen), no imposed order, each player freely picks on their turn. `vowels`
 * is the exception — a hidden bonus clue, absent from `CLUE_ORDER`, that only appears
 * once every other clue has been picked, and drops the round's score to 1 instead of the usual
 * -1 (see ClueGameScreen). */
export type ClueId =
  | 'position'
  | 'population'
  | 'climate'
  | 'emoji'
  | 'elevation'
  | 'letter'
  | 'flagColors'
  | 'bearing'
  | 'distance'
  | 'localTime'
  | 'phoneCode'
  | 'currency'
  | 'airportCode'
  | 'isCapital'
  | 'vowels';

/** Approximate position of the city within its country, on a 3x3 grid. */
export type CluePositionInCountry = 'center' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

/** Generic colors used by the supported flags (see data/clues.ts). */
export type ClueFlagColorId = 'red' | 'blue' | 'white' | 'green' | 'yellow' | 'black';

/** A flag color and its share of the total area (%), unique colors merged and
 * sorted in their order of appearance on the flag (the clue only reveals the first one).
 * Positional tuple (see FLAG_COLOR_FIELD in data/places/countries.ts for which is which). */
export type ClueFlagColorRow = readonly [colorId: ClueFlagColorId, hex: string, percent: number];

/** A place in the Clues game: extends `GeoPlace`, but its place pool stays independent from
 * Compass's (see data/clues.ts vs data/places/). `code` (country ISO) comes from the
 * place data shared by both games — used for shared lookups (country name, flag, currency). */
export type CluePlace = GeoPlace & {
  code: string;
  difficulty: Difficulty;
  positionInCountry: CluePositionInCountry;
  population: number;
  /** General climate trend, as an emoji (sun, rain, snow, desert...). */
  climateEmoji: string;
  elevationMeters: number;
  /** IANA timezone identifier (e.g. "Europe/Paris"), for the local-time clue. */
  timezone: string;
  /** Country's international phone code (e.g. "+33"). */
  phoneCode: string;
  /** Country's currency symbol (e.g. "€", "$"): several countries can legitimately share
   * the same symbol (euro zone...), the clue is then deliberately weaker. */
  currency: string;
  /** IATA code (3 letters) of the city's main commercial airport. */
  airportCode: string;
  /** 3 candidate emoji evoking the city (landmark/culture/nature...): the clue draws one at
   * random on each reveal, not always the same one. */
  emojis: readonly [string, string, string];
};

export type ClueSettings = {
  playerNames: string[];
  difficulty: Difficulty;
  categories: ClueCategory[];
  rounds: number;
  /** Each round starts with the first-letter clue already revealed for free, instead of
   * everything locked. */
  startWithFirstLetter: boolean;
};

// --- Contour: trace a country's outline, independent from both Compass and Clues ---

/** Screen-space point (pixels) inside a `ContourBoard`: not a geographic coordinate. */
export type Point2D = {
  x: number;
  y: number;
};

/** A single hand-curated neighbor worth hinting at in the 'guess' phase, each with its own display
 * spot: `x`/`y` are a fraction (0-1) of the board's own canvas (`ContourBoard`'s `width`/`height`,
 * same for the admin's own preview canvas — both fit to the exact same aspect ratio via
 * `boardDimensionsFor`), not a geographic coordinate. Deliberately on-board rather than lon/lat:
 * a real-world position (e.g. genuinely out in the Atlantic) has to be visually pulled onto the
 * small board somehow, and doing that via a screen-space clamp (the old `edgeLabelPosition`)
 * only ever preserved *direction* from center, discarding distance — dragging the admin's curated
 * point toward or away from the country changed the stored data but never visibly moved it,
 * reading as broken. Storing the on-board spot directly instead means what's dragged in the admin
 * is exactly what renders in the game, at the same relative spot regardless of screen size (see
 * `ContourGameScreen`'s `projectRound`, which just scales `x*width`/`y*height`). Authored per
 * country (not a global by-code lookup): the same neighbor can need a different display spot
 * depending on which country it's being hinted from. Name/flag come from
 * `data/places/countries.ts`, looked up by `code` — no sea/ocean neighbors any more (dropped:
 * they complicated every consumer for little payoff), so `type: 'country'` is the only variant. */
export type ContourNeighbor = { type: 'country'; code: string; x: number; y: number };

/** Anchor for tier 3/4's own on-board label (the target country's own flag, then its name stacked
 * just below it) — a fraction (0-1) of the board canvas, same model and same reasoning as
 * `ContourNeighbor`'s `x`/`y`: curated per country (part of its `contour.centerLabel` field in
 * `data/places/countries.json`, see `ContourDataRow`), a plain bounding-box center can read
 * badly for an oddly-shaped country, so it's an editable point (draggable in the admin's Contour
 * view) rather than always derived. */
export type ContourCenterLabel = { x: number; y: number };

/** A country's outline for the Contour game: geometry plus its neighbor list — name/flag come from
 * `data/places/countries.ts` (shared with Compass/Clues), looked up by `code` rather than
 * duplicated here. `points` is a closed ring (`[longitude, latitude]` pairs, first === last),
 * mainland only (islands/overseas territories dropped), simplified to ~40-80 points (a handful of
 * large/complex countries run higher, see `scripts/generateContours.mjs`). */
export type ContourCountry = {
  code: string;
  points: readonly (readonly [number, number])[];
  /** See `ContourNeighbor` — merged in from `countries.json`'s `contour.neighbors` at decode time
   * (`data/contours/codec.ts`), not authored inline with `points`. Hand-curated for the 8
   * original countries, mostly auto-generated (real-world adjacency, projected/clamped position —
   * country-type only, never sea/ocean) for every other one — see `ContourDataRow`. */
  neighbors: ContourNeighbor[];
  /** See `ContourCenterLabel` — merged in from `countries.json`'s `contour.centerLabel` at decode
   * time, same pattern as `neighbors`. */
  centerLabel: ContourCenterLabel;
  /** Curated (not derived — outline recognizability is a judgment call, not measurable), same
   * `Difficulty` scale as Compass/Clues: how hard the country's silhouette is to place/guess.
   * Merged in from `countries.json`'s `contour.difficulty` at decode time (see `codec.ts`), same
   * pattern as `neighbors` — defaults to `'intermediate'` for every auto-generated country. */
  difficulty: Difficulty;
};

/**
 * Raw, on-disk shape of a country's Contour data: the optional 7th element of `CountryRow`
 * (`data/places/countries.ts`) — present only for a country that actually has a silhouette,
 * so the vast majority of rows without one stay a plain 6-element array (no `null` padding).
 * `neighbors`/`centerLabel`/`difficulty` are each optional and fall back to their own default at
 * decode time (see `data/contours/codec.ts`), same defaults `ContourCountry` always resolves
 * to — only `points` is mandatory, there's no sensible default outline.
 */
export type ContourDataRow = {
  points: readonly (readonly [number, number])[];
  neighbors?: ContourNeighbor[];
  centerLabel?: ContourCenterLabel;
  difficulty?: Difficulty;
};

export type ContourSettings = {
  playerNames: string[];
  rounds: number;
  /** Which `ContourCountry.difficulty` tier a round's country is drawn from (see `randomCountry`)
   * — single choice, same pattern as Clues' own `ClueSettings.difficulty`, not Compass's
   * multi-select `difficulties`. */
  difficulty: Difficulty;
};

/** The two available themes (see src/themes): 'night' is the default. */
export type ThemeId = 'night' | 'day';

export type Theme = {
  id: ThemeId;
  name: string;
  tagline: string;
  isDark: boolean;
  colors: ThemeColors;
  radius: { sm: number; md: number; lg: number; button: number };
  typography: ThemeTypography;
  card: { borderWidth: number; shadowColor: string | null; shadowOpacity: number };
  /** Thickness of the "relief" under the main buttons (0 = flat). */
  buttonDepth: number;
  compass: { faceInner: string; faceOuter: string };
};
