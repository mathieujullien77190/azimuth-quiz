/**
 * Regenerates `src/components/Globe3D/globeLand.ts`, the world's outline the 3D globe is decorated with.
 *
 * Source: `world-atlas` (Natural Earth, merged land), 50m by default — ten times finer than the 110m the globe used to
 * show, which looked visibly cut into straight bits once zoomed in. Antarctica is left out (the globe never looks that
 * far south, and its coast is the longest ring of the lot), rings too small to be a dot are dropped, and what is left
 * is simplified (Douglas-Peucker, in degrees) then rounded, which is where most of the weight goes.
 *
 * Not part of the build: a decorative asset, generated once and committed. Run it by hand when the look has to change:
 *
 *   node scripts/globe-land.mjs                            # the committed settings
 *   node scripts/globe-land.mjs --dry                      # what a few tolerances would weigh, writes nothing
 *   node scripts/globe-land.mjs --resolution 10m --tolerance 0.04
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { feature } from 'topojson-client';

const require = createRequire(import.meta.url);

/** Degrees of latitude/longitude under which a bend of the coast is dropped. At the highest zoom the globe shows about
 * 0.1 degree per pixel, so this is already finer than the screen. */
const TOLERANCE = 0.04;
/** A ring is dropped unless it is at least this wide or tall (in degrees): islands smaller than a dot. */
const MIN_RING_SPAN = 0.25;
/** Everything whose northernmost point is south of this is Antarctica (and the sub-antarctic islands): left out. */
const ANTARCTIC_LATITUDE = -55;
/** Decimals kept per coordinate: about a kilometre, under what the highest zoom can show. */
const DECIMALS = 2;

const argument = (name, fallback) => {
  const index = process.argv.indexOf('--' + name);
  return index === -1 ? fallback : process.argv[index + 1];
};

const resolution = argument('resolution', '50m');
const dryRun = process.argv.includes('--dry');

/** The outer ring of every land polygon, as [lon, lat] pairs. */
const landRings = () => {
  const topology = JSON.parse(readFileSync(require.resolve('world-atlas/land-' + resolution + '.json'), 'utf8'));
  const land = feature(topology, topology.objects.land);
  // A land object can come back as a single geometry or as a collection of them, depending on the file.
  const geometries = land.type === 'FeatureCollection' ? land.features.map((entry) => entry.geometry) : [land.geometry];
  const polygons = geometries.flatMap((geometry) =>
    geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates],
  );
  // [0] = the outer ring; a lake inside a continent is not a coast the globe needs.
  return polygons.map((polygon) => polygon[0]);
};

const spanOf = (ring) => {
  const longitudes = ring.map((point) => point[0]);
  const latitudes = ring.map((point) => point[1]);
  return {
    width: Math.max(...longitudes) - Math.min(...longitudes),
    height: Math.max(...latitudes) - Math.min(...latitudes),
    top: Math.max(...latitudes),
  };
};

/** How far a point lies off the line between two others (Douglas-Peucker's own measure). */
const offLine = (point, from, to) => {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const length = Math.hypot(dx, dy);
  if (length === 0) return Math.hypot(point[0] - from[0], point[1] - from[1]);
  return Math.abs(dy * (point[0] - from[0]) - dx * (point[1] - from[1])) / length;
};

/** Douglas-Peucker: keeps the bends that stand out by more than `tolerance`, drops the rest. */
const simplify = (points, tolerance) => {
  if (points.length < 3) return points;
  let farthest = 0;
  let distance = 0;
  for (let index = 1; index < points.length - 1; index += 1) {
    const off = offLine(points[index], points[0], points[points.length - 1]);
    if (off > distance) {
      distance = off;
      farthest = index;
    }
  }
  if (distance <= tolerance) return [points[0], points[points.length - 1]];
  return [
    ...simplify(points.slice(0, farthest + 1), tolerance).slice(0, -1),
    ...simplify(points.slice(farthest), tolerance),
  ];
};

const round = (value) => Number(value.toFixed(DECIMALS));

/** The `M lon lat L lon lat ... Z` path the globe reads (`parseRings`), and what it weighs. */
const buildPath = (tolerance) => {
  const rings = landRings()
    .filter((ring) => {
      const span = spanOf(ring);
      return span.top > ANTARCTIC_LATITUDE && (span.width > MIN_RING_SPAN || span.height > MIN_RING_SPAN);
    })
    .map((ring) => {
      const simplified = simplify(ring, tolerance).map((point) => [round(point[0]), round(point[1])]);
      // Rounding can leave the same point twice in a row, and a ring of two points has no shape to draw.
      return simplified.filter(
        (point, index) =>
          index === 0 || point[0] !== simplified[index - 1][0] || point[1] !== simplified[index - 1][1],
      );
    })
    .filter((ring) => ring.length > 2);

  const path = rings
    .map((ring) => 'M' + ring.map((point) => point[0] + ' ' + point[1]).join('L') + 'Z')
    .join('');
  return { path, rings: rings.length, points: rings.reduce((total, ring) => total + ring.length, 0) };
};

if (dryRun) {
  for (const candidate of [0.005, 0.01, 0.02, 0.04, 0.08, 0.16]) {
    const built = buildPath(candidate);
    console.log(
      'tolerance ' +
        String(candidate).padEnd(6) +
        String(built.rings).padStart(5) +
        ' rings ' +
        String(built.points).padStart(8) +
        ' points ' +
        (built.path.length / 1024).toFixed(0).padStart(5) +
        ' KB',
    );
  }
  process.exit(0);
}

const tolerance = Number(argument('tolerance', TOLERANCE));
const built = buildPath(tolerance);

const header = [
  '/**',
  " * Outline of the world's land for the 3D globe (`Globe3D`), as `lon lat` pairs in degrees, not cut at the date",
  ' * line: there is no seam on a globe. A decorative asset, not game data — Natural Earth ' + resolution,
  ' * (`world-atlas` land-' + resolution + '), outer rings only, Antarctica left out, simplified at ' + tolerance,
  ' * degree and rounded to ' + DECIMALS + ' decimals: ' + built.rings + ' coastlines, ' + built.points + ' points,',
  ' * drawn as one single soup of lines so that the whole world costs one draw (see `scene.ts`).',
  ' *',
  ' * Generated by `scripts/globe-land.mjs`, never hand-edited.',
  ' */',
].join('\n');

writeFileSync(
  'src/components/Globe3D/globeLand.ts',
  header + '\nexport const GLOBE_LAND_PATH =\n  ' + JSON.stringify(built.path).replace(/"/g, "'") + ';\n',
);
console.log(
  'globeLand.ts: ' +
    built.rings +
    ' coastlines, ' +
    built.points +
    ' points, ' +
    (built.path.length / 1024).toFixed(0) +
    ' KB (' +
    resolution +
    ', tolerance ' +
    tolerance +
    ')',
);
