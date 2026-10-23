import type { Category, Difficulty } from '@/types';

/**
 * Le globe est une sphere de rayon 1 autour du centre de la scene : toutes les tailles ci-dessous sont dans cette
 * unite.
 */
export const GLOBE_RADIUS = 1;
/**
 * Ce qui est dessine au sol est decolle d'un cheveu, dans cet ordre, pour que chaque couche gagne ses pixels sur
 * celle du dessous.
 */
export const LAND_ALTITUDE = 1.001;
export const PLACE_ALTITUDE = 1.006;

/** Distance de depart de la camera, et limites proche / loin de la molette. */
export const CAMERA_DISTANCE = 3.2;
/**
 * MIN_DISTANCE laisse la camera a ~0,045 (du rayon) au-dessus du sol : de quoi lire une ville rue par rue. Si pres,
 * le plan proche doit etre plus pres que le sol (CAMERA_NEAR) et le glisse doit ralentir avec la distance (voir
 * rotateSpeedAt).
 */
export const MIN_DISTANCE = 1.045;
export const CAMERA_NEAR = 0.01;
/**
 * Vitesse de rotation au glisse : ROTATE_SPEED a la distance d'ouverture, moins a l'approche du sol (jamais sous
 * MIN_ROTATE_SPEED), pour rester controlable de pres.
 */
export const ROTATE_SPEED = 0.7;
export const MIN_ROTATE_SPEED = 0.03;
export const MAX_DISTANCE = 8;
export const CAMERA_FOV = 45;
export const HOME_VIEW = { lon: 10, lat: 25 };
export const FLY_DISTANCE = 2;
export const FLY_MS = 900;

/** Fond etoile : quelques points sur une sphere lointaine, rien d'autre dans la scene. */
export const STAR_COUNT = 1400;
export const STAR_RADIUS = 60;
export const STAR_SEED = 20261004;
export const STAR_COLOR = 0x9fb0d0;
export const STAR_SIZE = 1.4;

export const SEA_COLOR = 0x0b1a36;
export const LAND_LINE_COLOR = 0x4d5f86;
export const SELECTED_COLOR = 0xffffff;
export const HOVER_COLOR = 0xfde68a;
/** Couleur d'un lieu sans categorie Boussole. */
export const NEUTRAL_PLACE_COLOR = '#93A0BC';
/** Taille du point (px) par forme : l'etoile est plus grande pour que ses branches se lisent. */
export const PLACE_SIZES = { round: 7, star: 13, square: 6 } as const;
/** Cote (px) de l'image d'ou se decoupe un point rond / etoile, et opacite sous laquelle ses coins sont ecartes. */
export const SPRITE_SIZE = 64;
export const SPRITE_ALPHA_TEST = 0.5;
export const MARK_SIZE = 13;

/**
 * Niveau de detail selon la distance de la camera au centre (ouverture ~3,2, la molette va de MIN_DISTANCE a
 * MAX_DISTANCE) : dezoome, la carte ne serait qu'un nuage de points, donc les lieux n'apparaissent qu'en s'approchant
 * : capitales (etoiles) des CAPITALS_MAX_DISTANCE pour que le monde ne soit jamais vide, puis les autres des
 * POINTS_MAX_DISTANCE, et les noms permanents des LABELS_MAX_DISTANCE (voler vers un lieu, a FLY_DISTANCE, les
 * montre). Au-dela du seuil un lieu n'est ni dessine ni cliquable.
 */
export const CAPITALS_MAX_DISTANCE = 3.6;
export const POINTS_MAX_DISTANCE = 2.6;
export const LABELS_MAX_DISTANCE = 2.4;
/**
 * Noms permis en meme temps : MAX_LABELS a LABELS_MAX_DISTANCE, jusqu'a MAX_LABELS_CLOSE a MIN_DISTANCE ; ecart
 * minimum (px) entre deux, et place estimee d'un nom (px par lettre, hauteur de ligne, place du point a sa gauche).
 */
export const MAX_LABELS = 40;
export const MAX_LABELS_CLOSE = 120;
export const LABEL_GAP_PX = 4;
export const LABEL_CHAR_PX = 7;
export const LABEL_HEIGHT_PX = 16;
export const LABEL_OFFSET_PX = 10;

/**
 * Un lieu est choisi quand le pointeur est a moins de cette distance (px), et un appui est un clic s'il a bouge de
 * moins.
 */
export const PICK_RADIUS_PX = 12;
export const CLICK_SLOP_PX = 4;

export const SEARCH_RESULTS = 8;

export const ALL_CATEGORIES: Category[] = ['cities', 'capital', 'citiesFr', 'mountains', 'landmarks', 'nature', 'kids'];
export const ALL_DIFFICULTIES: Difficulty[] = ['easy', 'intermediate', 'hard'];
