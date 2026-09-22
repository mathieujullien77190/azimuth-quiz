import type { Category, Difficulty, GameSettings, Origin, Zone } from '@/types';

export * from './theme';
export { PLACES } from './places';

// --- Score ---
export const MAX_ROUND_POINTS = 1000;
export const MAX_DIRECTION_POINTS = 500;
export const MAX_DISTANCE_POINTS = 500;

// Direction : 0 point a partir de cet ecart (en degres).
export const DIRECTION_TOLERANCE_DEG = 90;
// Distance : 0 point quand l'estimation est ce nombre de fois trop grande / trop petite.
export const DISTANCE_TOLERANCE_RATIO = 4;
// Courbe de decroissance des points (>1 = plus severe pres de la bonne reponse).
export const SCORE_CURVE_EXPONENT = 1.5;

// --- Geographie ---
export const EARTH_RADIUS_KM = 6371;
export const MIN_DISTANCE_KM = 10;
/** Plus grande distance en surface : demi-circonference de la Terre. */
export const MAX_SURFACE_DISTANCE_KM = 20000;
/** Plus grande distance en ligne droite : le diametre de la Terre (inclinaison verticale). */
export const MAX_STRAIGHT_DISTANCE_KM = 12742;
// Reperes affiches sous les curseurs de distance (echelle logarithmique).
export const DISTANCE_MARKS_KM = [100, 1000, 10000] as const;
export const DEFAULT_DISTANCE_KM = 1000;
export const MAX_INCLINATION_DEG = 90;

// Lieux plus proches que ca du point de depart : ecartes (trop faciles, cap instable).
export const MIN_PLACE_DISTANCE_KM = 150;

export const DEFAULT_ORIGIN: Origin = {
  name: 'Paris',
  coordinates: { latitude: 48.8566, longitude: 2.3522 },
  isDevicePosition: false,
};
export const DEVICE_ORIGIN_NAME = 'ta position';
// Au-dela, on demarre depuis DEFAULT_ORIGIN plutot que de bloquer le joueur.
export const LOCATION_TIMEOUT_MS = 6000;

// --- Stockage ---
export const BEST_SCORE_STORAGE_KEY = 'fullazimut:best-score';
export const SETTINGS_STORAGE_KEY = 'fullazimut:settings';

// --- Boussole ---
export const CARDINAL_LABELS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'] as const;

// --- Rangs (solo) ---
export const RANKS = [
  { minRatio: 0.85, title: 'Maître des vents', emoji: '🧭' },
  { minRatio: 0.65, title: 'Capitaine', emoji: '⚓' },
  { minRatio: 0.45, title: 'Navigateur', emoji: '⛵' },
  { minRatio: 0.25, title: 'Mousse', emoji: '🪢' },
  { minRatio: 0, title: 'Naufragé', emoji: '🌊' },
] as const;

// --- Options de partie ---
export const MIN_PLAYERS = 1;
export const MAX_PLAYERS = 6;
export const ROUND_OPTIONS = [5, 10, 15, 20] as const;

/** Prenoms de secours pour un champ de nom laisse vide : un prenom au pif plutot que "Joueur 1",
 * "Joueur 2"... Utilise a la fois par SetupScreen (hint cosmetique, ordre remelange) et par
 * playerDisplayName (identite stable pendant la partie, choisie par index). */
export const NAME_PLACEHOLDERS = [
  'Zoé', 'Max', 'Léo', 'Nina', 'Théo', 'Mia', 'Noa', 'Iris', 'Timéo', 'Luna', 'Gaspard', 'Alba',
] as const;

// Reparties tous les ~50° de teinte (rouge, vert, cyan, bleu, violet, rose) pour rester
// distinctes entre elles, et a l'ecart de l'ambre/jaune de l'accent et de la reponse du theme
// Nuit (aucune entre 3° et 85°) pour qu'aucun joueur ne les prenne par hasard.
export const PLAYER_COLORS = ['#EF4444', '#16A34A', '#0891B2', '#2563EB', '#9333EA', '#DB2777'] as const;

export const CATEGORIES: { id: Category; label: string; emoji: string }[] = [
  { id: 'cities', label: 'Villes', emoji: '🏙️' },
  { id: 'mountains', label: 'Montagnes', emoji: '⛰️' },
  { id: 'landmarks', label: 'Monuments', emoji: '🏛️' },
  { id: 'nature', label: 'Nature', emoji: '🌿' },
  { id: 'kids', label: 'Enfants', emoji: '🧒' },
];

export const DIFFICULTIES: { id: Difficulty; label: string; emoji: string }[] = [
  { id: 'easy', label: 'Facile', emoji: '🟢' },
  { id: 'intermediate', label: 'Intermédiaire', emoji: '🟡' },
  { id: 'hard', label: 'Difficile', emoji: '🟠' },
  { id: 'master', label: 'Maître', emoji: '🔴' },
];

export const ZONES: { id: Zone; label: string; description: string }[] = [
  { id: 'france', label: 'France', description: 'Lyon oui, Cork non' },
  { id: 'europe', label: 'Europe', description: 'Du Portugal à Moscou' },
  { id: 'world', label: 'Monde', description: 'Toute la planète' },
];

/** Pays d'Europe (le filtre de zone ajoute une borne en longitude pour la Russie et la Turquie). */
export const EUROPE_CODES: readonly string[] = [
  'FR', 'GB', 'DE', 'ES', 'IT', 'PT', 'NL', 'BE', 'CH', 'AT', 'CZ', 'PL', 'HU', 'RO', 'GR',
  'DK', 'SE', 'NO', 'FI', 'IS', 'IE', 'TR', 'RU', 'UA',
];
export const EUROPE_MAX_LONGITUDE = 45;
export const EUROPE_MIN_LATITUDE = 30;

export const DEFAULT_SETTINGS: GameSettings = {
  playerNames: [''],
  categories: ['cities', 'mountains', 'landmarks', 'nature'],
  // Choix unique (radio) : Facile par defaut, le plus accessible.
  difficulties: ['easy'],
  zone: 'world',
  rounds: 10,
  straightLine: false,
  useGps: true,
  liveCompass: true,
  showCountry: true,
  allowRevision: false,
  hideOtherAnswers: false,
};
