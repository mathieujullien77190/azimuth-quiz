import type { TextStyle } from 'react-native';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Category = 'cities' | 'mountains' | 'landmarks' | 'nature' | 'kids';

export type Zone = 'france' | 'europe' | 'world';

export type Place = {
  name: string;
  country: string;
  /** Code pays ISO 3166-1 alpha-2 (drapeau, filtre de zone). */
  code: string;
  category: Category;
  coordinates: Coordinates;
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
  directionPoints: number;
  distancePoints: number;
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
  zone: Zone;
  rounds: number;
  /**
   * Ligne droite a travers la Terre : on choisit le cap et l'inclinaison sous l'horizon,
   * la distance (corde) en est deduite.
   */
  straightLine: boolean;
  useGps: boolean;
  /** Affiche le pays sous le nom du lieu. */
  showCountry: boolean;
  /** Autorise a revenir modifier la reponse d'un joueur deja validee, avant la revelation. */
  allowRevision: boolean;
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
