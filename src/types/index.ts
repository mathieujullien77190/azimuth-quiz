import type { TextStyle } from 'react-native';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Category = 'cities' | 'mountains' | 'landmarks' | 'nature' | 'kids' | 'capital' | 'citiesFr';

/** Notoriete du lieu, du plus connu au plus confidentiel. */
export type Difficulty = 'easy' | 'intermediate' | 'hard';

/** Identite geographique minimale d'un lieu, etendue par `Place`. */
export type GeoPlace = {
  name: string;
  country: string;
  coordinates: Coordinates;
};

export type Place = Omit<GeoPlace, 'country'> & {
  /** Code pays ISO 3166-1 alpha-2 (source du drapeau). */
  code: string;
  /** Id Firestore du lieu (`places/{key}`), Absent d'un vieux lieu. */
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
