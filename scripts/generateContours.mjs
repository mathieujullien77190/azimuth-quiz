#!/usr/bin/env node
// Dev-only, one-off generation tool (`npm run generate:contours`) — NOT part of `npm test`, CI, or
// the shipped app. Regenerates auto-derived Contour/Silhouette outlines + country-type neighbor
// hints for every country in `src/constants/places/countries.json` that doesn't already have
// curated Contour data (the 8 hand-curated ones — DE/ES/FR/GR/IE/IT/NO/PT — are left untouched).
// Re-run it after adding a new country to `countries.json`, or to pick up a new `world-atlas`
// release; it's safe to re-run repeatedly, it only ever fills in codes still missing a 7th
// (`contour`) element.
//
// Boundary geometry: `world-atlas`'s pre-built 50m-resolution TopoJSON Natural Earth Admin-0
// boundaries (Natural Earth data is public domain, no attribution required).
// Per-country adjacency (`borders`) and centroid (`latlng`) data: `world-countries`
// (github.com/mledoze/countries), ODbL-1.0 licensed — this comment is that license's required
// attribution for the data itself (see https://github.com/mledoze/countries#license).
//
// See CLAUDE.md's "Silhouette" section for the on-board-fraction neighbor model this script
// targets, and Task 2 of the plan this script was written against for the full pipeline rationale.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as topojsonClient from 'topojson-client';
import * as topojsonSimplify from 'topojson-simplify';
import topology from 'world-atlas/countries-50m.json' with { type: 'json' };
import worldCountries from 'world-countries';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const countriesPath = path.join(rootDir, 'src/constants/places/countries.json');

// --- Config -----------------------------------------------------------------------------------

// Calibrated by comparing resulting point counts against the 8 already hand-curated countries
// (their old contours.json outlines ran ~65-79 points each) plus RU/CA as a big-country sanity
// check: this value lands the median around ~55 points across a representative sample, while
// letting a handful of large/complex countries (Russia, Canada, Norway) run into the low hundreds
// — acceptable per the plan ("don't obsess over the ceiling").
const SIMPLIFY_WEIGHT = 1e-5;
// A ring that still won't clear this many points after simplification is too degenerate to be a
// fair silhouette-guessing target — skip it rather than force it.
const MIN_POINTS = 10;
const COORDINATE_PRECISION = 3;

// XN is an invented in-house placeholder code (not a real country); AQ (Antarctica) has no
// bilateral land borders and isn't a sensible "guess the country" silhouette target either.
const NON_COUNTRY_CODES = new Set(['XN', 'AQ']);

// Arbitrary square canvas for the projector math below — the final neighbor position is stored as
// a 0-1 fraction of it, so the absolute size cancels out; only the aspect ratio (derived from the
// country's own ring inside `boardDimensionsFor`) matters.
const BOARD_SIZE = { width: 1000, height: 1000 };
// Mirrors src/components/ContourBoard/constants.ts's BOARD_PADDING_RATIO.
const BOARD_PADDING_RATIO = 0.06;

// --- Board projector -----------------------------------------------------------------------
// Ported from src/components/ContourBoard/helpers.ts (plain math, no React/React Native there
// either) rather than imported: this script runs under plain Node ESM with no build step, and the
// .ts source can't be loaded directly without one. Keep these in sync by hand if that file's math
// ever changes.

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const ringBounds = (ring) => {
  const lons = ring.map((point) => point[0]);
  const lats = ring.map((point) => point[1]);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  return { minLon, maxLon, minLat, maxLat, lonScale: Math.cos(toRadians((minLat + maxLat) / 2)) };
};

const contentSize = (bounds) => ({
  width: Math.max(1e-6, (bounds.maxLon - bounds.minLon) * bounds.lonScale),
  height: Math.max(1e-6, bounds.maxLat - bounds.minLat),
});

const boardDimensionsFor = (ring, maxWidth, maxHeight) => {
  const { width: contentWidth, height: contentHeight } = contentSize(ringBounds(ring));
  const aspectRatio = contentHeight / contentWidth;
  let width = maxWidth;
  let height = width * aspectRatio;
  if (height > maxHeight) {
    height = maxHeight;
    width = height / aspectRatio;
  }
  return { width, height };
};

const createProjector = (ring, size, padding) => {
  const bounds = ringBounds(ring);
  const { width: contentWidth, height: contentHeight } = contentSize(bounds);
  const availableWidth = Math.max(1e-6, size.width - padding * 2);
  const availableHeight = Math.max(1e-6, size.height - padding * 2);
  const scale = Math.min(availableWidth / contentWidth, availableHeight / contentHeight);
  const offsetX = padding + (availableWidth - contentWidth * scale) / 2;
  const offsetY = padding + (availableHeight - contentHeight * scale) / 2;
  return ([lon, lat]) => ({
    x: offsetX + (lon - bounds.minLon) * bounds.lonScale * scale,
    y: offsetY + (bounds.maxLat - lat) * scale,
  });
};

/**
 * Pushes a projected point onto the edge of the board's own inset rectangle, along the ray from
 * board-center through the point — conceptually the same as the deleted `edgeLabelPosition` helper
 * (see `ContourNeighbor`'s doc comment in src/types/index.ts): keeps only the *direction* from
 * center and always lands exactly on the inset boundary, which is how every hand-curated neighbor
 * position in the old neighbors.ts reads too (x/y always close to 0 or 1 on whichever axis is
 * nearest). Falls back to a fixed down-right offset for the degenerate dead-center case.
 */
const clampToBoardEdge = (point, boardSize, insetMargin) => {
  const cx = boardSize.width / 2;
  const cy = boardSize.height / 2;
  let dx = point.x - cx;
  let dy = point.y - cy;
  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) {
    dx = 1;
    dy = 1;
  }
  const halfW = boardSize.width / 2 - insetMargin;
  const halfH = boardSize.height / 2 - insetMargin;
  const scale = 1 / Math.max(Math.abs(dx) / halfW, Math.abs(dy) / halfH);
  return { x: cx + dx * scale, y: cy + dy * scale };
};

// --- Geometry helpers -----------------------------------------------------------------------

/** Shoelace formula over lon/lat — not geodesically accurate, but good enough for a relative
 * "which ring is biggest" comparison within one country's own set of candidate rings. */
const ringArea = (ring) => {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum / 2);
};

/** Largest-area exterior ring across every polygon in every given geometry (several GeoJSON
 * features can share one numeric id — Natural Earth sometimes splits a small offshore islet into
 * its own feature under the same id as the mainland, e.g. Australia + "Ashmore and Cartier Is.")
 * — holes and every smaller island/exclave are dropped, mainland only, matching how the 8 already
 * hand-curated outlines were built. */
const mainlandRing = (geometries) => {
  let best = null;
  let bestArea = -1;
  for (const geometry of geometries) {
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.type === 'MultiPolygon' ? geometry.coordinates : [];
    for (const polygon of polygons) {
      const outer = polygon[0];
      if (!outer || outer.length < 4) continue;
      const area = ringArea(outer);
      if (area > bestArea) {
        bestArea = area;
        best = outer;
      }
    }
  }
  return best;
};

const roundRing = (ring) => {
  const rounded = ring.map(([lon, lat]) => [Number(lon.toFixed(COORDINATE_PRECISION)), Number(lat.toFixed(COORDINATE_PRECISION))]);
  const first = rounded[0];
  const last = rounded[rounded.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) rounded[rounded.length - 1] = [first[0], first[1]];
  return rounded;
};

const median = (numbers) => {
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

// --- Load + index reference data -------------------------------------------------------------

const countries = JSON.parse(readFileSync(countriesPath, 'utf8'));

const cca2ToCcn3 = new Map();
const cca2ToInfo = new Map();
const cca3ToCca2 = new Map();
for (const entry of worldCountries) {
  if (entry.ccn3) cca2ToCcn3.set(entry.cca2, String(entry.ccn3).padStart(3, '0'));
  if (entry.cca3) cca3ToCca2.set(entry.cca3, entry.cca2);
  cca2ToInfo.set(entry.cca2, { latlng: entry.latlng, borders: entry.borders ?? [] });
}

const presimplified = topojsonSimplify.presimplify(topology, topojsonSimplify.sphericalTriangleArea);
const simplified = topojsonSimplify.simplify(presimplified, SIMPLIFY_WEIGHT);
const collection = topojsonClient.feature(simplified, simplified.objects.countries);

const featuresById = new Map();
for (const feature of collection.features) {
  if (feature.id === undefined) continue;
  const id = String(feature.id).padStart(3, '0');
  if (!featuresById.has(id)) featuresById.set(id, []);
  featuresById.get(id).push(feature);
}

// --- Pass 1: match + simplify an outline for every code still missing one --------------------

const alreadyCurated = [];
const nonCountry = [];
const unmatched = [];
/** @type {{ code: string; points: number[][]; neighbors?: { type: 'country'; code: string; x: number; y: number }[] }[]} */
const generated = [];

for (const code of Object.keys(countries).sort()) {
  const row = countries[code];
  if (row[6] !== undefined) {
    alreadyCurated.push(code);
    continue;
  }
  if (NON_COUNTRY_CODES.has(code)) {
    nonCountry.push(code);
    continue;
  }
  const ccn3 = cca2ToCcn3.get(code);
  if (!ccn3) {
    unmatched.push({ code, reason: 'not found in world-countries (no ccn3)' });
    continue;
  }
  const features = featuresById.get(ccn3);
  if (!features) {
    unmatched.push({ code, reason: 'no TopoJSON feature at this ccn3 (likely folded into a parent territory, or a micro-state Natural Earth omits at 50m)' });
    continue;
  }
  const ring = mainlandRing(features.map((feature) => feature.geometry));
  if (!ring) {
    unmatched.push({ code, reason: 'matched feature(s) have no polygon geometry' });
    continue;
  }
  const rounded = roundRing(ring);
  if (rounded.length < MIN_POINTS) {
    unmatched.push({ code, reason: `ring too degenerate after simplification (${rounded.length} points)` });
    continue;
  }
  generated.push({ code, points: rounded });
}

// --- Pass 2: country-type neighbors, now that the final set of codes-with-an-outline is known --

const finalizedCodes = new Set([...alreadyCurated, ...generated.map((entry) => entry.code)]);
let withNeighbors = 0;
let withoutNeighbors = 0;

for (const entry of generated) {
  const info = cca2ToInfo.get(entry.code);
  const neighborCodes = [...new Set((info?.borders ?? []).map((cca3) => cca3ToCca2.get(cca3)))].filter(
    (neighborCode) => neighborCode && neighborCode !== entry.code && finalizedCodes.has(neighborCode),
  );

  const { width, height } = boardDimensionsFor(entry.points, BOARD_SIZE.width, BOARD_SIZE.height);
  const padding = Math.min(width, height) * BOARD_PADDING_RATIO;
  const project = createProjector(entry.points, { width, height }, padding);

  const neighbors = [];
  for (const neighborCode of neighborCodes) {
    const neighborLatLng = cca2ToInfo.get(neighborCode)?.latlng;
    if (!neighborLatLng) continue;
    const [lat, lon] = neighborLatLng;
    const projected = project([lon, lat]);
    const edge = clampToBoardEdge(projected, { width, height }, padding);
    neighbors.push({
      type: 'country',
      code: neighborCode,
      x: Number((edge.x / width).toFixed(4)),
      y: Number((edge.y / height).toFixed(4)),
    });
  }

  if (neighbors.length > 0) {
    entry.neighbors = neighbors;
    withNeighbors++;
  } else {
    withoutNeighbors++;
  }
}

// --- Merge + write back, same one-entry-per-line format as serializeCountries ------------------

for (const entry of generated) {
  const contour = { points: entry.points };
  if (entry.neighbors && entry.neighbors.length > 0) contour.neighbors = entry.neighbors;
  countries[entry.code] = [...countries[entry.code], contour];
}

const lines = Object.keys(countries)
  .sort()
  .map((code) => '  ' + JSON.stringify(code) + ': ' + JSON.stringify(countries[code]));
writeFileSync(countriesPath, '{\n' + lines.join(',\n') + '\n}\n', 'utf8');

// --- Summary -------------------------------------------------------------------------------

const pointCounts = generated.map((entry) => entry.points.length);
const taiwanFeature = featuresById.get(cca2ToCcn3.get('TW') ?? '');

console.log('--- generateContours summary ---');
console.log(`Codes processed: ${Object.keys(countries).length}`);
console.log(`Skipped as non-country: ${nonCountry.join(', ') || '(none)'}`);
console.log(`Already curated, left untouched (${alreadyCurated.length}): ${alreadyCurated.join(', ')}`);
console.log(`Newly generated (${generated.length}): ${generated.map((entry) => entry.code).join(', ')}`);
console.log(`Unmatched / skipped as too hard (${unmatched.length}):`);
for (const { code, reason } of unmatched) console.log(`  ${code}: ${reason}`);
console.log(`Generated countries with >=1 neighbor: ${withNeighbors}, with 0 neighbors: ${withoutNeighbors}`);
if (pointCounts.length > 0) {
  console.log(`Point counts — min: ${Math.min(...pointCounts)}, median: ${median(pointCounts)}, max: ${Math.max(...pointCounts)}`);
}
console.log(`Taiwan (TW): ${taiwanFeature ? 'matched its own feature' : 'NOT matched — check manually'}`);
console.log(`Total with Contour data now: ${alreadyCurated.length + generated.length} / ${Object.keys(countries).length}`);
