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
  /** ISO 3166-1 alpha-2 country code (source of the flag). */
  code: string;
  /** The place's id in Firestore (`places/{key}`): lets the dev mode's difficulty opinions point at the document. Absent
   * on a place written by an older version of the game. */
  key?: string;
  /** The country's names, copied into the place document (no lookup at runtime): shown under the place's name
   * when the game option is on. */
  country?: { fr: string; en: string };
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
  /** Heading on the horizontal plane, 0 = north: the one held all the way (rhumb line, see `helpers/geo`). */
  bearing: number;
  /** Estimated distance along the surface, following that heading. */
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
  /** Rhumb-line gap (km) between the point aimed at (heading + distance from the origin) and the true place: only
   * shown, as "(🎯 N km)" next to the distance guess — the bonuses of the round are per axis (see `applyBestBonus`). */
  targetGapKm: number;
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
  /** This device's player name; empty means "use a default name". Stays local: a room doesn't share it. */
  playerName: string;
  categories: Category[];
  difficulty: Difficulty;
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
  /** Travel mode: every round after the first starts from the place of the previous round (see `originForRound`),
   * instead of always from the starting point. A room made before this option existed has none: read as off. */
  travel: boolean;
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
  /** Screen titles and the quit cross: the accent by night, the text color by day (the accent is too soft for a title on light). */
  title: string;
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

// --- Clues: game independent from Azimuth Quiz, with its own places (Firestore, see data/firestore/) ---

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
  | 'globe'
  | 'localTime'
  | 'phoneCode'
  | 'currency'
  | 'airportCode'
  | 'isCapital'
  | 'personality'
  | 'wordplay'
  | 'vowels';

/** Approximate position of the city within its country, on a 3x3 grid. */
export type CluePositionInCountry = 'center' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

/** Generic colors used by the supported flags. */
export type ClueFlagColorId = 'red' | 'blue' | 'white' | 'green' | 'yellow' | 'black';

/** A flag color and its share of the area (%), as stored in a place: same fields as `ClueFlagColorRow`. */
export type ClueFlagColor = { id: ClueFlagColorId; hex: string; percent: number };

/** A flag color and its share of the total area (%), unique colors merged and
 * sorted in their order of appearance on the flag (the clue only reveals the first one).
 * Positional tuple `[colorId, hex, percent]` (the admin's flag editor); a place stores objects, see `ClueFlagColor`. */
export type ClueFlagColorRow = readonly [colorId: ClueFlagColorId, hex: string, percent: number];

/** A place in the Clues game: extends `GeoPlace`, but its place pool stays independent from
 * Compass's (each game draws its places from Firestore, see `data/firestore/`). `code` is the country ISO code;
 * the country's names, flag and currency are copied into the place. */
export type CluePlace = GeoPlace & {
  code: string;
  /** The place's id in Firestore (`places/{key}`, a permanent 3-letter code such as `"par"` for Paris). Never shown to
   * a player: it identifies the document (the admin's edits). Compass's own `Place` has no equivalent. */
  key: string;
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
  /** A real, Wikipedia-documented person tied to this place (born there, or overwhelmingly
   * identified with it) — absent for the vast majority of places (curated by hand, never
   * invented, see `ClueRow`'s own doc comment). `description` is a short one/two-word tag (a
   * profession, e.g. "footballeur"), itself absent when there's nothing short and safe to add. */
  personality?: { name: string; description: string | null };
  /** Which of the 3 Clues categories the place falls into (capital, French city, other city). */
  category: ClueCategory;
  /** The country's flag colors in order of appearance (objects, not tuples: a place is written to a room
   * document and Firestore refuses nested arrays). Copied from the country into the place. */
  flagColors: ClueFlagColor[];
  /** The country's currency generic name ("Euro", "Dollar"), copied from the country. */
  currencyName: string;
  /** A play on words on the name, one sentence (see `wordplayFor`). Absent when not curated. */
  wordplay?: { sentence: string; difficulty: Difficulty };
};

export type ClueSettings = {
  /** This device's player name; empty means "use a default name". Stays local. */
  playerName: string;
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
 * the neighbor's document names — no sea/ocean neighbors any more (dropped: they complicated every consumer for little
 * payoff), so `type: 'country'` is the only variant. */
export type ContourNeighbor = { type: 'country'; code: string; x: number; y: number };

/** A neighbor with its names (`fr`/`en`) copied in from the round's document: no country lookup at runtime. */
export type ContourNamedNeighbor = ContourNeighbor & { fr: string; en: string };

/** A place offered as a hint (a city or the capital): where it is and what it is called (a place has a single
 * name, whatever the player's language). */
export type ContourPlace = { name: string; longitude: number; latitude: number };

/** Anchor for tier 3/4's own on-board label (the target country's own flag, then its name stacked
 * just below it) — a fraction (0-1) of the board canvas, same model and same reasoning as
 * `ContourNeighbor`'s `x`/`y`: curated per country (the `centerLabel` field of its `countries/{code}` document), a plain
 * bounding-box center can read
 * badly for an oddly-shaped country, so it's an editable point (draggable in the admin's Contour
 * view) rather than always derived. */
export type ContourCenterLabel = { x: number; y: number };

/** A country's outline for the Contour game: geometry plus its neighbor list (from its `countries/{code}` document).
 * `points` is a closed ring (`[longitude, latitude]` pairs, first === last), mainland only (islands/overseas
 * territories dropped), simplified to ~40-80 points (a handful of large/complex countries run higher). */
export type ContourCountry = {
  code: string;
  points: readonly (readonly [number, number])[];
  /** See `ContourNeighbor` — the few neighbors positioned on the board for the hints. */
  neighbors: ContourNeighbor[];
  /** See `ContourCenterLabel`. */
  centerLabel: ContourCenterLabel;
  /** Curated (not derived — outline recognizability is a judgment call, not measurable), same
   * `Difficulty` scale as Compass/Clues: how hard the country's silhouette is to place/guess.
   * `'intermediate'` unless curated. */
  difficulty: Difficulty;
};

/** What a Silhouette round needs about its country, straight from its `countries/{code}` document
 * (`roundCountryFromDoc`): the outline and neighbors of a `ContourCountry`, plus its own names, the capital
 * and the cities offered as hints (`capital` is `null` for a country without one). */
export type ContourRoundCountry = Omit<ContourCountry, 'neighbors'> & {
  fr: string;
  en: string;
  neighbors: ContourNamedNeighbor[];
  capital: ContourPlace | null;
  cities: ContourPlace[];
};

/** The kinds of hints a Silhouette game can use, picked in the setup (at least one): the outline
 * getting more precise, the neighboring countries, the country's cities (capital excluded), its
 * capital. See `buildHintPlan` for the steps each one contributes. */
export type ContourHintCategory = 'silhouette' | 'neighbors' | 'cities' | 'capital';

export type ContourSettings = {
  /** This device's player name; empty means "use a default name". Stays local. */
  playerName: string;
  rounds: number;
  /** Which `ContourCountry.difficulty` tier a round's country is drawn from (see `randomCountry`)
   * — single choice, like Compass' `GameSettings.difficulty` and Clues' `ClueSettings.difficulty`. */
  difficulty: Difficulty;
  /** Which kinds of hints are in play (shared by the room, at least one). A room or a saved setting
   * without it means all of them, see `normalizeHintCategories`. */
  hintCategories: ContourHintCategory[];
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
