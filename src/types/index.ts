import type { TextStyle } from 'react-native';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Category = 'cities' | 'mountains' | 'landmarks' | 'nature' | 'kids' | 'capital' | 'citiesFr';

/** Indices only draws from cities, so only these three of the 7 Boussole categories apply. */
export type IndicesCategory = Extract<Category, 'cities' | 'capital' | 'citiesFr'>;

/** Popularity/fame of the place, from best-known to most niche. */
export type Difficulty = 'easy' | 'intermediate' | 'hard';

/**
 * Base shared by both games: the minimal geographic identity of a place. Boussole (`Place`) and
 * Indices (`IndicesPlace`) each extend it with their own game-specific fields — both keep
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
   * `constants/places/countries.ts`) — no country name stored per place. */
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
  /** Estimated distance: along the surface (classic mode), or straight-line (mode "straightLine"). */
  distanceKm: number;
  /** Angle below the horizon, in degrees (0 outside "straightLine" mode). */
  inclination: number;
};

export type RoundScore = {
  trueBearing: number;
  trueInclination: number;
  trueSurfaceDistanceKm: number;
  trueStraightDistanceKm: number;
  /** Angular error: on the plane (surface mode), or in 3D (straight-line mode). */
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
  /**
   * Straight line through the Earth: you choose the heading and the inclination below the
   * horizon, the distance (chord) is derived from it.
   */
  straightLine: boolean;
  useGps: boolean;
  /** Starting point when `useGps` is off: latitude/longitude entered by hand,
   * Paris by default. Ignored when `useGps` is on (device position used). */
  customLatitude: number;
  customLongitude: number;
  /** On mobile, the compass rotates so N points to true north. */
  liveCompass: boolean;
  /** Shows the country under the place's name. */
  showCountry: boolean;
  /** Allows going back to edit a player's already-submitted answer, before the reveal. */
  allowRevision: boolean;
  /** During the round, only shows your own arrow/estimate, never the ones already submitted
   * by other players (which remain normally visible on reveal). */
  hideOtherAnswers: boolean;
};

export type GamePhase = 'loading' | 'guess' | 'reveal' | 'end';

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

// --- Indices: game independent from Full Azimut, with its own places (see constants/indices.ts) ---

/** A clue's identifier: they all have the same "cost" (1 point off the score countdown,
 * see IndicesGameScreen), no imposed order, each player freely picks on their turn. `vowels`
 * is the exception — a hidden bonus clue, absent from `INDICES_CLUE_ORDER`, that only appears
 * once every other clue has been picked, and drops the round's score to 1 instead of the usual
 * -1 (see IndicesGameScreen). */
export type IndicesClueId =
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
export type IndicesPositionInCountry = 'center' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

/** Generic colors used by the supported flags (see constants/indices.ts). */
export type IndicesFlagColorId = 'red' | 'blue' | 'white' | 'green' | 'yellow' | 'black';

/** A flag color and its share of the total area (%), unique colors merged and
 * sorted in their order of appearance on the flag (the clue only reveals the first one).
 * Positional tuple (see FLAG_COLOR_FIELD in constants/places/countries.ts for which is which). */
export type IndicesFlagColorRow = readonly [colorId: IndicesFlagColorId, hex: string, percent: number];

/** A place in the Indices game: extends `GeoPlace`, but its place pool stays independent from
 * Boussole's (see constants/indices.ts vs constants/places/). `code` (country ISO) comes from the
 * place data shared by both games — used for shared lookups (country name, flag, currency). */
export type IndicesPlace = GeoPlace & {
  code: string;
  difficulty: Difficulty;
  positionInCountry: IndicesPositionInCountry;
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

/** How the answer is verified: said out loud (manual right/wrong arbitration),
 * or typed and automatically compared to the place's name. */
export type IndicesAnswerMethod = 'spoken' | 'typed';

export type IndicesSettings = {
  playerNames: string[];
  difficulty: Difficulty;
  categories: IndicesCategory[];
  answerMethod: IndicesAnswerMethod;
  rounds: number;
  /** Each round starts with the first-letter clue already revealed for free, instead of
   * everything locked. */
  startWithFirstLetter: boolean;
};

export type Theme = {
  id: string;
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
