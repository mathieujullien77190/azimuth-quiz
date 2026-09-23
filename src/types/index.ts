import type { TextStyle } from 'react-native';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Category = 'cities' | 'mountains' | 'landmarks' | 'nature' | 'kids';

export type Zone = 'france' | 'europe' | 'world';

/** Popularite/notoriete du lieu, du plus connu au plus pointu. */
export type Difficulty = 'easy' | 'intermediate' | 'hard' | 'master';

/**
 * Base commune aux deux jeux : identite geographique minimale d'un lieu. Boussole (`Place`) et
 * Indices (`IndicesPlace`) l'etendent chacun avec leurs propres champs de jeu — les deux gardent
 * des pools de lieux totalement separes (curation, taille et criteres differents), seule cette
 * forme est partagee.
 */
export type GeoPlace = {
  name: string;
  country: string;
  coordinates: Coordinates;
};

export type Place = Omit<GeoPlace, 'country'> & {
  /** Code pays ISO 3166-1 alpha-2 : source du drapeau, du filtre de zone, ET du nom affiche
   * (voir `constants/places/countries.ts`) — pas de nom de pays stocke par lieu. */
  code: string;
  category: Category;
  difficulty: Difficulty;
  /** Anecdote courte sur le lieu : affichee repliee, seulement a la revelation. Absente pour les
   * lieux pas encore documentes (le composant n'affiche alors rien). */
  description?: string;
  /** Fin de l'URL Wikipedia (apres "https://fr.wikipedia.org/wiki/" ou ".../en.wikipedia.org/wiki/"),
   * pas l'URL complete. Absent si personne ne l'a encore renseigne pour ce lieu. */
  wikiFr?: string;
  wikiEn?: string;
};

export type Origin = {
  name: string;
  coordinates: Coordinates;
  isDevicePosition: boolean;
};

export type Guess = {
  /** Cap sur le plan horizontal, 0 = nord. */
  bearing: number;
  /** Distance estimee : sur la surface (mode classique), ou en ligne droite (mode "straightLine"). */
  distanceKm: number;
  /** Angle sous l'horizon, en degres (0 hors mode "straightLine"). */
  inclination: number;
};

export type RoundScore = {
  trueBearing: number;
  trueInclination: number;
  trueSurfaceDistanceKm: number;
  trueStraightDistanceKm: number;
  /** Ecart d'angle : sur le plan (mode surface), ou en 3D (mode ligne droite). */
  directionError: number;
  /** |ln(estimation / vraie distance)| : ecart brut utilise pour departager le bonus "plus proche"
   * (voir `applyBestBonus`), non plafonne contrairement a `distancePoints` — deux joueurs tous
   * deux hors tolerance (donc a 0 point) peuvent quand meme avoir des ecarts tres differents. */
  distanceError: number;
  directionPoints: number;
  distancePoints: number;
  /** Bonus (1/5 du max de la categorie) au(x) joueur(s) le(s) plus proche(s) de la manche, sur
   * chaque categorie separement. Toujours 0 en solo (personne a battre). */
  directionBonus: number;
  distanceBonus: number;
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
  /** Un resultat par joueur, dans l'ordre des joueurs. */
  results: PlayerResult[];
};

export type GameSettings = {
  playerNames: string[];
  categories: Category[];
  difficulties: Difficulty[];
  zone: Zone;
  rounds: number;
  /**
   * Ligne droite a travers la Terre : on choisit le cap et l'inclinaison sous l'horizon,
   * la distance (corde) en est deduite.
   */
  straightLine: boolean;
  useGps: boolean;
  /** Point de depart quand `useGps` est desactive : latitude/longitude saisies a la main,
   * Paris par defaut. Ignore quand `useGps` est actif (position de l'appareil utilisee). */
  customLatitude: number;
  customLongitude: number;
  /** Sur mobile, la boussole tourne pour que le N pointe vers le vrai nord. */
  liveCompass: boolean;
  /** Affiche le pays sous le nom du lieu. */
  showCountry: boolean;
  /** Autorise a revenir modifier la reponse d'un joueur deja validee, avant la revelation. */
  allowRevision: boolean;
  /** Pendant la manche, ne montre que sa propre fleche/estimation, jamais celles deja validees
   * par les autres joueurs (qui restent visibles normalement a la revelation). */
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
  /** Couleur de la "verite" (vraie aiguille, vraie valeur). */
  truth: string;
  danger: string;
  success: string;
};

export type ThemeTypography = {
  /** Gros textes : nom du lieu, scores, titre. */
  display: TextStyle;
  /** Textes moyens : valeurs, boutons. */
  heading: TextStyle;
  /** Petites etiquettes (majuscules espacees, selon le theme). */
  label: TextStyle;
  body: TextStyle;
};

// --- Indices : jeu independant de Full Azimut, avec ses propres lieux (voir constants/indices.ts) ---

/** Identifiant d'un indice. Le cout de chacun (voir INDICES_CLUE_COSTS) porte la notion de
 * difficulte : pas d'ordre impose, chacun choisit librement a son tour (voir IndicesGameScreen). */
export type IndicesClueId =
  | 'position'
  | 'population'
  | 'climate'
  | 'emoji'
  | 'elevation'
  | 'letterCount'
  | 'wordCount'
  | 'flagColors'
  | 'bearing'
  | 'distance'
  | 'localTime'
  | 'phoneCode'
  | 'currency'
  | 'airportCode';

/** Position approximative de la ville dans son pays, sur une grille 3x3. */
export type IndicesPositionInCountry = 'center' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

/** Couleurs generiques utilisees par les drapeaux geres (voir constants/indices.ts). */
export type IndicesFlagColorId = 'red' | 'blue' | 'white' | 'green' | 'yellow' | 'black';

/** Une couleur du drapeau et sa part de la surface totale (%), couleurs uniques fusionnees et
 * triees dans leur ordre d'apparition sur le drapeau (l'indice ne revele que la premiere).
 * Tuple positionnel (voir INDICES_FLAG_COLOR_FIELD dans constants/indices.ts pour qui est qui). */
export type IndicesFlagColorRow = readonly [colorId: IndicesFlagColorId, hex: string, percent: number];

/** Lieu du jeu Indices : etend `GeoPlace`, mais son pool de lieux reste independant de celui de
 * Boussole (voir constants/indices.ts vs constants/places/). */
export type IndicesPlace = GeoPlace & {
  difficulty: Difficulty;
  positionInCountry: IndicesPositionInCountry;
  population: number;
  /** Tendance climatique generale, en emoji (soleil, pluie, neige, desert...). */
  climateEmoji: string;
  elevationMeters: number;
  /** Identifiant de fuseau horaire IANA (ex. "Europe/Paris"), pour l'indice heure locale. */
  timezone: string;
  /** Indicatif telephonique international du pays (ex. "+33"). */
  phoneCode: string;
  /** Symbole de la devise du pays (ex. "€", "$") : plusieurs pays peuvent legitimement partager
   * le meme symbole (zone euro...), l'indice est alors volontairement plus faible. */
  currency: string;
  /** Code IATA (3 lettres) du principal aeroport commercial de la ville. */
  airportCode: string;
  /** 3 emoji candidats evoquant la ville (monument/culture/nature...) : l'indice en tire un au
   * hasard a chaque revelation, pas toujours le meme. */
  emojis: readonly [string, string, string];
};

/** Qui peut buzzer/proposer une reponse : uniquement celui qui a choisi le dernier indice (pas de
 * selection a faire), ou n'importe quel joueur (on demande alors qui a buzze). */
export type IndicesBuzzerMode = 'turnPlayer' | 'anyone';

/** Comment la reponse est verifiee : dite a voix haute (arbitrage manuel bonne/mauvaise reponse),
 * ou tapee et comparee automatiquement au nom du lieu. */
export type IndicesAnswerMethod = 'spoken' | 'typed';

export type IndicesSettings = {
  playerNames: string[];
  difficulty: Difficulty;
  buzzerMode: IndicesBuzzerMode;
  answerMethod: IndicesAnswerMethod;
  rounds: number;
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
  /** Epaisseur du "relief" sous les boutons principaux (0 = a plat). */
  buttonDepth: number;
  compass: { faceInner: string; faceOuter: string };
};
