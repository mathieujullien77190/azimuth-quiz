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
  /** True only for a place Contour/Silhouette's city phase should skip (a judgment call
   * specific to that game, e.g. an island city that reads badly pinned onto the
   * mainland-only outline) — Boussole/Indices keep using it normally. Omitted (not
   * `false`) for every other place. */
  excludeFromContour?: boolean;
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

// --- Indices: game independent from Azimuth Quiz, with its own places (see constants/indices.ts) ---

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

// --- Contour: trace a country's outline, independent from both Boussole and Indices ---

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
 * `constants/places/countries.ts`, looked up by `code` — no sea/ocean neighbors any more (dropped:
 * they complicated every consumer for little payoff), so `type: 'country'` is the only variant. */
export type ContourNeighbor = { type: 'country'; code: string; x: number; y: number };

/** Anchor for tier 3/4's own on-board label (the target country's own flag, then its name stacked
 * just below it) — a fraction (0-1) of the board canvas, same model and same reasoning as
 * `ContourNeighbor`'s `x`/`y`: curated per country (part of its `contour.centerLabel` field in
 * `constants/places/countries.json`, see `ContourDataRow`), a plain bounding-box center can read
 * badly for an oddly-shaped country, so it's an editable point (draggable in the admin's Contour
 * view) rather than always derived. */
export type ContourCenterLabel = { x: number; y: number };

/** A country's outline for the Contour game: geometry plus its neighbor list — name/flag come from
 * `constants/places/countries.ts` (shared with Boussole/Indices), looked up by `code` rather than
 * duplicated here. `points` is a closed ring (`[longitude, latitude]` pairs, first === last),
 * mainland only (islands/overseas territories dropped), simplified to ~40-80 points (a handful of
 * large/complex countries run higher, see `scripts/generateContours.mjs`). */
export type ContourCountry = {
  code: string;
  points: readonly (readonly [number, number])[];
  /** See `ContourNeighbor` — merged in from `countries.json`'s `contour.neighbors` at decode time
   * (`constants/contours/codec.ts`), not authored inline with `points`. Hand-curated for the 8
   * original countries, mostly auto-generated (real-world adjacency, projected/clamped position —
   * country-type only, never sea/ocean) for every other one — see `ContourDataRow`. */
  neighbors: ContourNeighbor[];
  /** See `ContourCenterLabel` — merged in from `countries.json`'s `contour.centerLabel` at decode
   * time, same pattern as `neighbors`. */
  centerLabel: ContourCenterLabel;
  /** Curated (not derived — outline recognizability is a judgment call, not measurable), same
   * `Difficulty` scale as Boussole/Indices: how hard the country's silhouette is to place/guess.
   * Merged in from `countries.json`'s `contour.difficulty` at decode time (see `codec.ts`), same
   * pattern as `neighbors` — defaults to `'intermediate'` for every auto-generated country. */
  difficulty: Difficulty;
};

/**
 * Raw, on-disk shape of a country's Contour data: the optional 7th element of `CountryRow`
 * (`constants/places/countries.ts`) — present only for a country that actually has a silhouette,
 * so the vast majority of rows without one stay a plain 6-element array (no `null` padding).
 * `neighbors`/`centerLabel`/`difficulty` are each optional and fall back to their own default at
 * decode time (see `constants/contours/codec.ts`), same defaults `ContourCountry` always resolves
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
  /** How many named places (any category, see `randomPlacesFor`) get a city-placement step each
   * round — 0 would skip the city phase entirely, but the setup screen only offers 1/3/5. */
  placesCount: 1 | 3 | 5;
  /** Which `ContourCountry.difficulty` tier a round's country is drawn from (see `randomCountry`)
   * — single choice, same pattern as Indices' own `IndicesSettings.difficulty`, not Boussole's
   * multi-select `difficulties`. */
  difficulty: Difficulty;
};

export type ContourGuessScore = {
  /** How many hints had already been revealed (0-3) when the correct guess landed — only
   * meaningful for whichever player actually found it (`guessPoints > 0`); 0 for every other
   * player, and for a round nobody found (give-up). */
  hintsUsed: number;
  /** Tiered by `hintsUsed` (see `CONTOUR_GUESS_POINTS_BY_HINTS`) rather than a falloff curve:
   * there's no distance to measure for a country-name guess. 0 for every player except whoever
   * found it, and for a give-up round. */
  guessPoints: number;
  /** CONTOUR_WRONG_GUESS_PENALTY times however many wrong guesses got attributed to this player
   * this round (see ContourGameScreen's post-"Valider" attribution step) — subtracted into
   * `ContourRoundScore.total` below. 0 for a player nobody attributed a wrong guess to. */
  penaltyPoints: number;
};

export type ContourCityScore = {
  /** Mean distance (board pixels) across every placed marker's distance from its true place —
   * purely informational (not itself scored), `Infinity` if the player placed none at all. */
  cityErrorPx: number;
  /** Sum of the per-place scores (see `scoreCityGuess`) across every place drawn this round. */
  cityPoints: number;
};

export type ContourRoundScore = ContourGuessScore &
  ContourCityScore & {
    /** guessPoints + cityPoints - penaltyPoints. */
    total: number;
  };

export type ContourPlayerResult = {
  /** One marker per place drawn this round (see `ContourRoundRecord.places`, same order),
   * `undefined` for any place the player never placed one on (scores 0 for that place). Empty
   * when the round drew no places at all (see `placesCount`/`randomPlacesFor`). */
  cityGuesses: (Point2D | undefined)[];
  score: ContourRoundScore;
};

export type ContourRoundRecord = {
  country: ContourCountry;
  /** The country's full outline (closed ring), projected once for the round and shown as-is
   * from the very start of the 'guess' phase — no holes/gaps, no reveal animation needed. */
  outline: Point2D[];
  /** Canvas size `outline`/every city marker was projected at for this round (the 'guess'/'city'
   * phases' own full-bleed box, which the 'reveal' phase's ordinary Card layout never matches) —
   * the 'reveal' board must be drawn at this exact size, not re-fit to its own (differently
   * shaped) area, or the frozen pixel positions below stop lining up with a freshly re-projected
   * outline. */
  width: number;
  height: number;
  /** Screen-space scale `outline`/every city marker was projected at for this round. */
  boardSize: number;
  /** The round's named places (Boussole `Place`s matching the country, any category, see
   * `randomPlacesFor`): each one's display name and true board position, projected the same way
   * as `outline`, plus its category icon if any (`emoji`, see `placeEmoji`) for the truth marker.
   * One city-placement step per entry, in this order — can be empty (a country with fewer
   * matching places than `ContourSettings.placesCount`), in which case the round skips the city
   * phase entirely. */
  places: { name: string; position: Point2D; emoji: string | undefined }[];
  /** Index of whichever player correctly guessed the country this round, or -1 if nobody did
   * (give-up) — informational only, each player's own `results[i].score.guessPoints` already
   * reflects it (0 for everyone but the guesser, if any). */
  guesserIndex: number;
  /** One result per player, in player order. */
  results: ContourPlayerResult[];
};

/**
 * A round has two steps, back to back on the same board. First a shared puzzle, not turn-based
 * ('guess' — any player can reveal the next hint or type a guess; the first correct one scores
 * and moves straight on, or anyone can give up for 0), then everyone places their city marker(s)
 * turn by turn ('city'), then the final reveal ('reveal', city scores computed and combined with
 * the guess score locked in back during 'guess').
 */
export type ContourPhase = 'guess' | 'city' | 'reveal' | 'end';

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
