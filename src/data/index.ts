import type { Difficulty, Origin } from '@/types';

export * from './theme';

// --- Geographie (voir helpers/geo) ---
export const EARTH_RADIUS_KM = 6371;

export const DEFAULT_ORIGIN: Origin = {
  name: 'Paris',
  coordinates: { latitude: 48.8566, longitude: 2.3522 },
  isDevicePosition: false,
};
// Au-dela, on part de DEFAULT_ORIGIN plutot que de bloquer le joueur.
export const LOCATION_TIMEOUT_MS = 6000;

// --- Stockage (commun a l'app) ---
// Prefixe renomme depuis "fullazimut:*" : remet volontairement a zero les donnees sauvees des joueurs.
export const LANGUAGE_STORAGE_KEY = 'azimuthquiz:language';
export const THEME_STORAGE_KEY = 'azimuthquiz:theme';
/** Nom du joueur, commun aux jeux (prerempli par `useSetupRoom`). */
export const PLAYER_NAME_STORAGE_KEY = 'azimuthquiz:player-name';
/** Derniere room rejointe, proposee en raccourci « rejoindre » sur l'ecran de preparation. */
export const LAST_JOINED_ROOM_STORAGE_KEY = 'azimuthquiz:last-joined-room';
/** Dernier code de room heberge, reoffert pour la prochaine (`createRoom`). */
export const ROOM_CODE_STORAGE_KEY = 'azimuthquiz:room-code';

// --- Options de jeu (communes) ---
export const ROUND_OPTIONS = [5, 10, 15, 20] as const;

/** Noms par defaut d'un nom vide : chacun prend le premier libre (`freePlaceholder`). Plus de noms que de places. */
export const NAME_PLACEHOLDERS = [
  'Zoé',
  'Max',
  'Léo',
  'Nina',
  'Théo',
  'Mia',
  'Noa',
  'Iris',
  'Timéo',
  'Luna',
  'Gaspard',
  'Chloé',
] as const;

// Teintes espacees d'environ 50 deg, loin de l'ambre/jaune de l'accent et de la couleur « verite » (rien entre 3 et 85 deg).
export const PLAYER_COLORS = ['#EF4444', '#16A34A', '#0891B2', '#2563EB', '#9333EA', '#DB2777'] as const;

/** `PLAYER_COLORS` etendues a `ROOM_MAX_PLAYERS` (firebase/roomApi.ts), toujours hors de la bande ambre/jaune. */
export const ROOM_PLAYER_COLORS = [...PLAYER_COLORS, '#0D9488', '#4F46E5', '#C026D3', '#E11D48'] as const;

/** Emoji de chaque jeu (carte d'accueil et en-tete de preparation). */
export const GAME_ICONS = { compass: '🧭' } as const;

// Libelle/description : voir translations.setup.difficulties (meme id).
export const DIFFICULTIES: { id: Difficulty; emoji: string }[] = [
  { id: 'easy', emoji: '🟢' },
  // Orange et non jaune : sur la puce selectionnee de Night (fond ambre) le jaune disparait ; l'inverse le jour (`difficultyEmoji`).
  { id: 'intermediate', emoji: '🟠' },
  { id: 'hard', emoji: '🔴' },
];

/** Emoji de DIFFICULTIES, point « moyen » echange selon le theme (voir le commentaire de DIFFICULTIES). */
export const difficultyEmoji = (difficulty: (typeof DIFFICULTIES)[number], isDark: boolean): string =>
  difficulty.id === 'intermediate' ? (isDark ? '🟠' : '🟡') : difficulty.emoji;

/** Emojis envoyables depuis le pied de jeu (`useRoomReactions`). */
export const REACTION_EMOJIS = ['🤔', '🥰', '😡', '😱', '😭', '🤞', '👍', '👏'] as const;
/** Duree d'affichage d'une reaction, et delai minimal entre deux reactions d'un meme appareil. */
export const REACTION_DISPLAY_MS = 2500;
export const REACTION_COOLDOWN_MS = 1000;
/** Reactions max par partie et par appareil : au-dela le bouton disparait. */
export const REACTIONS_PER_GAME = 20;

/** Le splash dure au moins SPLASH_MIN_MS, et au plus le plafond : une hydratation sans fin ne cache pas l'app. */
export const SPLASH_MIN_MS = 5000;
export const SPLASH_MAX_MS = 15000;
