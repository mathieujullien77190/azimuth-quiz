import type { Difficulty, Origin } from '@/types';

export * from './theme';

// --- Geography (shared: both Compass and Clues resolve an origin and measure a constant-heading route, see helpers/geo) ---
export const EARTH_RADIUS_KM = 6371;

export const DEFAULT_ORIGIN: Origin = {
  name: 'Paris',
  coordinates: { latitude: 48.8566, longitude: 2.3522 },
  isDevicePosition: false,
};
// Beyond this, we start from DEFAULT_ORIGIN rather than blocking the player.
export const LOCATION_TIMEOUT_MS = 6000;

// --- Storage (app-wide, not tied to a single game) ---
// Renamed from "fullazimut:*" along with the app itself (-> Azimuth Quiz, repo azimuth-quiz):
// deliberately resets every existing player's saved settings/theme/score/history/mascot-caught
// state on next launch, rather than keeping the old prefix forever for continuity.
export const LANGUAGE_STORAGE_KEY = 'azimuthquiz:language';
export const THEME_STORAGE_KEY = 'azimuthquiz:theme';
/** The player's name, shared by the 3 games (see `useSetupRoom`'s prefill): typing it in one
 * game's setup fills it in for the others too, even though only Compass' own `GameSettings`
 * otherwise persists across launches. */
export const PLAYER_NAME_STORAGE_KEY = 'azimuthquiz:player-name';
/** The room code this device hosted last, offered again for its next room (see `createRoom`). */
/** The room this device joined last, offered as a one-tap "join" shortcut on the setup screen. */
export const LAST_JOINED_ROOM_STORAGE_KEY = 'azimuthquiz:last-joined-room';
/** The dev code typed in the settings (see `useDevCode`): saved as typed, only `DEV_CODE` turns the dev mode on. */
export const DEV_CODE_STORAGE_KEY = 'azimuthquiz:dev-code';
/** The secret that turns the dev mode on (the difficulty feedback of `useDevFeedback`). Also written in
 * `firestore.rules`, the real gate of the `devFeedback` collection: change both together. */
export const DEV_CODE = 'supermatou';
/** Where the dev mode's difficulty opinions go (read by the admin's "Avis difficulté" page, outside the journal). */
export const DEV_FEEDBACK_COLLECTION = 'devFeedback';
export const ROOM_CODE_STORAGE_KEY = 'azimuthquiz:room-code';

// --- Game options (shared by all 3 games) ---
export const ROUND_OPTIONS = [5, 10, 15, 20] as const;

/** The name a player gets when they leave their name field empty, rather than "Player 1"... One device
 * is one player, so what matters is that the players of a room don't share one: each takes the first
 * name of this list that no other player has (see `freePlaceholder`) — the host "Zoé", the next
 * device "Max", and so on. More names than a room has seats (`ROOM_MAX_PLAYERS`), so one is always
 * free. */
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

// Spread roughly every ~50° of hue (red, green, cyan, blue, violet, pink) to stay
// distinct from each other, and away from the accent's amber/yellow and the Night theme's
// truth color (none between 3° and 85°) so no player picks them by chance.
export const PLAYER_COLORS = ['#EF4444', '#16A34A', '#0891B2', '#2563EB', '#9333EA', '#DB2777'] as const;

/** Same idea as `PLAYER_COLORS`, extended to `ROOM_MAX_PLAYERS` (helpers/roomBase.ts) for an online
 * room's connected-players list — 4 more hues added the same way, still clear of the accent's
 * amber/yellow band. */
export const ROOM_PLAYER_COLORS = [...PLAYER_COLORS, '#0D9488', '#4F46E5', '#C026D3', '#E11D48'] as const;

/** Each game's emoji — its home card and the header of its setup screen. */
export const GAME_ICONS = { compass: '🧭', clues: '🧩', contour: '🗺️' } as const;

// Label/description: see translations.setup.difficulties (same id).
export const DIFFICULTIES: { id: Difficulty; emoji: string }[] = [
  { id: 'easy', emoji: '🟢' },
  // Orange, not yellow (🟡): on Night's selected chip (its own amber accent background), a
  // yellow dot all but disappears. Day's accent is a true orange though, so there it's the
  // reverse — see `difficultyEmoji`, which swaps back to yellow for `intermediate` by day.
  { id: 'intermediate', emoji: '🟠' },
  { id: 'hard', emoji: '🔴' },
];

/** DIFFICULTIES' emoji, with the "moyen" dot swapped per-theme for readability against the
 * selected chip's own accent-colored background (see DIFFICULTIES' comment). */
export const difficultyEmoji = (difficulty: (typeof DIFFICULTIES)[number], isDark: boolean): string =>
  difficulty.id === 'intermediate' ? (isDark ? '🟠' : '🟡') : difficulty.emoji;

/** The emojis a player can send to the room from the game footer (see `useRoomReactions`). */
export const REACTION_EMOJIS = ['🤔', '🥰', '😡', '😱', '😭', '🤞', '👍', '👏'] as const;
/** How long a received reaction stays on screen, and the least time between two reactions from the same device. */
export const REACTION_DISPLAY_MS = 2500;
export const REACTION_COOLDOWN_MS = 1000;
/** Reactions one player may send in a game: past it the reactions button is hidden on that device (the game screen's
 * hook starts over with each game). */
export const REACTIONS_PER_GAME = 20;

/** The startup splash screen stays at least this long (ms) even when nothing is left to load, and is dropped after the
 * longer cap so a hydration that never ends cannot keep the app hidden for ever. */
export const SPLASH_MIN_MS = 5000;
export const SPLASH_MAX_MS = 15000;
