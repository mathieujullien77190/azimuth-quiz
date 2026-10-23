import type { Difficulty } from '@/types';

/** `[longitude, latitude]` en degres. */
export type LonLat = readonly [number, number];
export type Vec3 = readonly [number, number, number];

export type Selection = { kind: 'place'; id: string };

/** Ce que le globe peut viser, trouve par la recherche. */
export type SearchTarget = { kind: 'place'; id: string; label: string; lon: number; lat: number };

/** Lieu projete a l'ecran, pour le choix. */
export type ProjectedPoint = { x: number; y: number; visible: boolean };

/** Sous le pointeur : indice du lieu le plus proche (si assez proche) et position du pointeur (px). */
export type PickResult = { place: number | null; x: number; y: number };

/** Point dessine plus clair, pour le lieu choisi / survole. */
export type Mark = { segments: number[]; point: Vec3 | null } | null;

/** Dessin d'un lieu : rond pour les villes, etoile pour les capitales, carre pour le reste. */
export type PlaceShape = 'round' | 'star' | 'square';

/**
 * Points des lieux pour la scene : positions dans l'ordre des lieux (ce que lit le choix), et les memes points
 * separes par forme, chacun avec ses couleurs, un objet de scene par forme.
 */
export type PlaceBuffers = {
  positions: number[];
  /** Forme de chaque lieu, meme ordre que `positions` (3 nombres par lieu). */
  kinds: PlaceShape[];
  shapes: Record<PlaceShape, { positions: number[]; colors: number[] }>;
};

/** Nom a dessiner a l'ecran : indice de son lieu et position de son point (px, dans le canvas). */
export type LabelPoint = { index: number; x: number; y: number };

/** Place prise a l'ecran par un nom ecrit (px), pour que les noms ne se touchent pas. */
export type LabelBox = { left: number; right: number; top: number; bottom: number };
