import type { Difficulty } from '@/types';

/** `[longitude, latitude]` in degrees. */
export type LonLat = readonly [number, number];
export type Vec3 = readonly [number, number, number];

/** A country as the globe picks it: its outline (longitudes made continuous across the date line) and its box. */
export type CountryShape = {
  code: string;
  ring: readonly LonLat[];
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
  difficulty: Difficulty;
};

export type Selection = { kind: 'place'; id: string } | { kind: 'country'; id: string };

/** A thing the globe can fly to, found by the search box. */
export type SearchTarget = { kind: 'place' | 'country'; id: string; label: string; lon: number; lat: number };

/** A place as projected on the screen, for picking. */
export type ProjectedPoint = { x: number; y: number; visible: boolean };

/** What is under the pointer: the index of the nearest place (if close enough) and where the ray hits the globe. */
export type PickResult = { place: number | null; lon: number | null; lat: number | null; x: number; y: number };

/** An outline (or a point) drawn brighter than the rest, for the selected / hovered thing. */
export type Mark = { segments: number[]; point: Vec3 | null } | null;

export type CountryGroup = { color: number; positions: number[] };

/** How a place is drawn: a round dot for the cities, a star for the capitals, a square for all the rest. */
export type PlaceShape = 'round' | 'star' | 'square';

/** The dots of the places for the scene: every position in the places' order (what picking reads), and the same dots
 * split by shape, each with its colours, one object of the scene per shape. */
export type PlaceBuffers = {
  positions: number[];
  /** The shape of each place, in the same order as `positions` (3 numbers per place). */
  kinds: PlaceShape[];
  shapes: Record<PlaceShape, { positions: number[]; colors: number[] }>;
};

/** A name to draw on the screen: the index of its place and where its dot is (px, in the canvas). */
export type LabelPoint = { index: number; x: number; y: number };

/** A country name to write: where (the visual centre of its outline) and what. */
export type CountryNameSource = { name: string; lon: number; lat: number };

/** The room a written name takes on the screen (px), to keep the names from touching. */
export type LabelBox = { left: number; right: number; top: number; bottom: number };
