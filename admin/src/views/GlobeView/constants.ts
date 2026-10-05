import type { Category, Difficulty } from '@/types';

/** The globe is a sphere of radius 1 around the middle of the scene: every size below is in those units. */
export const GLOBE_RADIUS = 1;
/** Everything drawn on the ground is pushed out a hair, in this order, so each layer wins its pixels over the one
 * below. */
export const LAND_ALTITUDE = 1.001;
export const PLACE_ALTITUDE = 1.006;

/** How far the camera starts from the middle, and how close / far the wheel lets it go. */
export const CAMERA_DISTANCE = 3.2;
/** MIN_DISTANCE leaves the camera ~0.045 (of the globe's radius) above the ground: three wheel notches closer than the
 * old 1.35 (each notch halving what was left), enough to read a city street by street. So close, the near plane must
 * be nearer than the ground (CAMERA_NEAR) and dragging must slow down with the distance (see rotateSpeedAt). */
export const MIN_DISTANCE = 1.045;
export const CAMERA_NEAR = 0.01;
/** How fast a drag turns the globe: ROTATE_SPEED at the opening distance, less as the camera nears the ground (never
 * less than MIN_ROTATE_SPEED), so that dragging stays controllable up close. */
export const ROTATE_SPEED = 0.7;
export const MIN_ROTATE_SPEED = 0.03;
export const MAX_DISTANCE = 8;
export const CAMERA_FOV = 45;
/** The view the globe opens on (and goes back to with the reset button). */
export const HOME_VIEW = { lon: 10, lat: 25 };
/** How close the camera gets when flying to a place, and how long the flight takes. */
export const FLY_DISTANCE = 2;
export const FLY_MS = 900;

/** The starry background: a few points scattered on a far sphere, nothing else in the scene. */
export const STAR_COUNT = 1400;
export const STAR_RADIUS = 60;
export const STAR_SEED = 20261004;
export const STAR_COLOR = 0x9fb0d0;
export const STAR_SIZE = 1.4;

export const SEA_COLOR = 0x0b1a36;
export const LAND_LINE_COLOR = 0x4d5f86;
export const SELECTED_COLOR = 0xffffff;
export const HOVER_COLOR = 0xfde68a;
/** What a place without a Compass category is drawn in. */
export const NEUTRAL_PLACE_COLOR = '#93A0BC';
/** A place's dot, in px, by shape: the star is bigger so that its branches read. */
export const PLACE_SIZES = { round: 7, star: 13, square: 6 } as const;
/** The side (px) of the picture a round / star dot is cut from, and the opacity under which its corners are dropped. */
export const SPRITE_SIZE = 64;
export const SPRITE_ALPHA_TEST = 0.5;
export const MARK_SIZE = 13;

/** Level of detail, by how far the camera is from the middle of the globe (the globe opens at ~3.2, the wheel goes
 * from MIN_DISTANCE to MAX_DISTANCE): zoomed out, the map would be a cloud of dots, so the places only appear as one
 * comes closer — the capitals (stars) first, from CAPITALS_MAX_DISTANCE, so the world is never empty, then every other
 * place from POINTS_MAX_DISTANCE — and the permanent names only from LABELS_MAX_DISTANCE (flying to a place, at
 * FLY_DISTANCE, shows them). Beyond its threshold a place is neither drawn nor pickable. */
export const CAPITALS_MAX_DISTANCE = 3.6;
export const POINTS_MAX_DISTANCE = 2.6;
export const LABELS_MAX_DISTANCE = 2.4;
/** The names allowed at once: MAX_LABELS at LABELS_MAX_DISTANCE, growing to MAX_LABELS_CLOSE at MIN_DISTANCE; the least
 * gap (px) kept between two of them, and the size a name is reckoned to take (px per letter, line height, and the room
 * the dot itself takes on its left). */
export const MAX_LABELS = 40;
export const MAX_LABELS_CLOSE = 120;
export const LABEL_GAP_PX = 4;
export const LABEL_CHAR_PX = 7;
export const LABEL_HEIGHT_PX = 16;
export const LABEL_OFFSET_PX = 10;

/** A place is picked when the pointer is this close (px) to it, and a press is a click when it moved less than this. */
export const PICK_RADIUS_PX = 12;
export const CLICK_SLOP_PX = 4;

export const SEARCH_RESULTS = 8;

export const ALL_CATEGORIES: Category[] = ['cities', 'capital', 'citiesFr', 'mountains', 'landmarks', 'nature', 'kids'];
export const ALL_DIFFICULTIES: Difficulty[] = ['easy', 'intermediate', 'hard'];
