import type { TextStyle } from 'react-native';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Category = 'cities' | 'mountains' | 'landmarks' | 'nature' | 'kids' | 'capital' | 'citiesFr';

/** Indices ne tire que dans les villes : seulement 3 des 7 categories Boussole. */
export type ClueCategory = Extract<Category, 'cities' | 'capital' | 'citiesFr'>;

/** Notoriete du lieu, du plus connu au plus confidentiel. */
export type Difficulty = 'easy' | 'intermediate' | 'hard';

/** Base commune aux 2 jeux : l'identite geographique minimale d'un lieu. `Place` et `CluePlace` l'etendent ; les deux jeux gardent des lieux totalement separes. */
export type GeoPlace = {
  name: string;
  country: string;
  coordinates: Coordinates;
};

export type Place = Omit<GeoPlace, 'country'> & {
  /** Code pays ISO 3166-1 alpha-2 (source du drapeau). */
  code: string;
  /** Id Firestore du lieu (`places/{key}`), pour les avis de difficulte du mode dev. Absent d'un vieux lieu. */
  key?: string;
  /** Noms du pays copies dans le document du lieu : affiches sous le nom si l'option est active. */
  country?: { fr: string; en: string };
  category: Category;
  difficulty: Difficulty;
  /** Anecdote courte, repliee, au reveal seulement. Absente si non documentee. */
  description?: string;
  /** Fin de l'URL Wikipedia (apres `.../wiki/`), pas l'URL complete. Absente si non renseignee. */
  wikiFr?: string;
  wikiEn?: string;
};

export type Origin = {
  name: string;
  coordinates: Coordinates;
  isDevicePosition: boolean;
};

export type Guess = {
  /** Cap sur le plan, 0 = nord : celui tenu tout du long (loxodromie, `helpers/geo`). */
  bearing: number;
  /** Distance estimee en surface, suivant ce cap. */
  distanceKm: number;
};

export type RoundScore = {
  trueBearing: number;
  trueSurfaceDistanceKm: number;
  /** Ecart angulaire sur le plan. */
  directionError: number;
  /** |ln(estime / vraie distance)| : erreur brute pour departager le bonus "plus proche" (`applyBestBonus`), non plafonnee contrairement a `distancePoints`. */
  distanceError: number;
  directionPoints: number;
  distancePoints: number;
  /** Bonus (1/5 du max de la categorie) du ou des joueurs les plus proches, par categorie. Toujours 0 en solo. */
  directionBonus: number;
  distanceBonus: number;
  /** Bonus du cap exact au degre pres (`EXACT_DIRECTION_BONUS`), pour tous ceux qui le trouvent, independant de `directionBonus`. */
  directionExactBonus: number;
  /** Bonus de la distance exacte, au pas du curseur a cette echelle (`EXACT_DISTANCE_BONUS`/`roundDistance`), independant de `distanceBonus`. */
  distanceExactBonus: number;
  /** Ecart loxodromique (km) entre le point vise (cap + distance depuis le depart) et le vrai lieu, affiche "(🎯 N km)". */
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
  /** Un resultat par joueur, dans l'ordre des joueurs. */
  results: PlayerResult[];
};

export type GameSettings = {
  /** Nom du joueur sur cet appareil ; vide = nom par defaut. Reste local : la room ne le partage pas. */
  playerName: string;
  categories: Category[];
  difficulty: Difficulty;
  rounds: number;
  useGps: boolean;
  /** Depart quand `useGps` est faux : latitude/longitude saisies (Paris par defaut). Ignore si `useGps`. */
  customLatitude: number;
  customLongitude: number;
  /** Sur mobile, la boussole tourne pour que N pointe au nord vrai. */
  liveCompass: boolean;
  /** Affiche le pays sous le nom du lieu. */
  showCountry: boolean;
  /** Mode voyage : chaque manche part du lieu de la precedente (`originForRound`). Absent d'une vieille room = faux. */
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
  /** Titres d'ecran et croix : l'accent la nuit, la couleur du texte le jour (l'accent est trop doux sur fond clair). */
  title: string;
  onAccent: string;
  /** Couleur de la verite (aiguille et valeur vraies). */
  truth: string;
  danger: string;
  success: string;
};

export type ThemeTypography = {
  /** Gros texte : nom du lieu, scores, titre. */
  display: TextStyle;
  /** Texte moyen : valeurs, boutons. */
  heading: TextStyle;
  /** Petits libelles (majuscules espacees, selon le theme). */
  label: TextStyle;
  body: TextStyle;
};

// --- Indices : jeu independant, avec ses propres lieux (Firestore, voir data/firestore/) ---

/** Id d'un indice : tous coutent 1 point, sans ordre impose. `vowels` est l'exception : indice bonus cache, absent de `CLUE_ORDER`, qui n'apparait qu'apres tous les autres et fait tomber le score de la manche a 1 (voir ClueGameScreen). */
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

/** Position approximative de la ville dans son pays, sur une grille 3x3. */
export type CluePositionInCountry = 'center' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

/** Couleurs generiques des drapeaux geres. */
export type ClueFlagColorId = 'red' | 'blue' | 'white' | 'green' | 'yellow' | 'black';

/** Couleur de drapeau et sa part de surface (%), telle que stockee : memes champs que `ClueFlagColorRow`. */
export type ClueFlagColor = { id: ClueFlagColorId; hex: string; percent: number };

/** Couleur de drapeau et sa part de surface (%), couleurs uniques fusionnees dans l'ordre d'apparition (l'indice ne revele que la 1re). Tuple `[colorId, hex, percent]` (editeur de drapeau de l'admin) ; un lieu stocke des objets (`ClueFlagColor`). */
export type ClueFlagColorRow = readonly [colorId: ClueFlagColorId, hex: string, percent: number];

/** Un lieu d'Indices : etend `GeoPlace`, pool independant de Boussole. `code` = code pays ISO ; nom, drapeau et devise du pays sont copies dans le lieu. */
export type CluePlace = GeoPlace & {
  code: string;
  /** Id Firestore (`places/{key}`, code permanent de 3 lettres, ex. `"par"`). Jamais montre au joueur : sert aux editions de l'admin. */
  key: string;
  difficulty: Difficulty;
  positionInCountry: CluePositionInCountry;
  population: number;
  /** Tendance climatique generale, en emoji. */
  climateEmoji: string;
  elevationMeters: number;
  /** Fuseau IANA (ex. "Europe/Paris"), pour l'indice d'heure locale. */
  timezone: string;
  /** Indicatif telephonique international du pays (ex. "+33"). */
  phoneCode: string;
  /** Symbole de la devise : plusieurs pays peuvent le partager (zone euro), l'indice est alors volontairement plus faible. */
  currency: string;
  /** Code IATA (3 lettres) de l'aeroport commercial principal. */
  airportCode: string;
  /** 3 emojis evoquant la ville : l'indice en tire un au hasard a chaque reveal. */
  emojis: readonly [string, string, string];
  /** Personne reelle documentee par Wikipedia liee au lieu ; absente pour la plupart (curation manuelle, voir `ClueRow`). `description` : etiquette courte (ex. "footballeur"), absente si rien de sur a ajouter. */
  personality?: { name: string; description: string | null };
  /** Parmi les 3 categories d'Indices : capitale, ville francaise, autre ville. */
  category: ClueCategory;
  /** Couleurs du drapeau dans l'ordre d'apparition (objets, pas tuples : Firestore refuse les tableaux imbriques). Copiees du pays. */
  flagColors: ClueFlagColor[];
  /** Nom generique de la devise ("Euro"), copie du pays. */
  currencyName: string;
  /** Jeu de mots sur le nom, une phrase (`wordplayFor`). Absent si non cure. */
  wordplay?: { sentence: string; difficulty: Difficulty };
};

export type ClueSettings = {
  /** Nom du joueur sur cet appareil ; vide = nom par defaut. Reste local. */
  playerName: string;
  difficulty: Difficulty;
  categories: ClueCategory[];
  rounds: number;
  /** Chaque manche commence avec l'indice de premiere lettre deja revele gratuitement. */
  startWithFirstLetter: boolean;
};

/** Les deux themes (voir src/themes) : 'night' par defaut. */
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
  /** Epaisseur du "relief" sous les boutons principaux (0 = plat). */
  buttonDepth: number;
  compass: { faceInner: string; faceOuter: string };
};
