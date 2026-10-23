/**
 * Regenere `globeLand.ts` et `globeMask.ts` (contours du globe 3D) depuis `world-atlas` (Natural Earth, 50m par defaut).
 * Hors build : asset decoratif genere a la main puis commite.
 *
 *   node scripts/globe-land.mjs                            # reglages commites
 *   node scripts/globe-land.mjs --dry                      # poids de quelques tolerances, n'ecrit rien
 *   node scripts/globe-land.mjs --resolution 10m --tolerance 0.04
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { feature } from 'topojson-client';

const require = createRequire(import.meta.url);

/** Degres sous lesquels un coude de cote est supprime (deja plus fin que l'ecran au zoom max : ~0,1 deg/pixel). */
const TOLERANCE = 0.04;
/** Un anneau plus petit (en degres) que ceci est supprime : ce serait moins qu'un point. */
const MIN_RING_SPAN = 0.25;
/** Tout ce dont le point le plus au nord est au sud de ceci (Antarctique, iles subantarctiques) est exclu. */
const ANTARCTIC_LATITUDE = -55;
/** Decimales gardees (~1 km, sous ce que le zoom max montre). */
const DECIMALS = 2;
/** Taille du masque terre/mer (`globeMask.ts`), equirectangulaire. Lignes du pole sud vers le nord (sens d'une `DataTexture`). */
const MASK_WIDTH = 2048;
const MASK_HEIGHT = 1024;

const argument = (name, fallback) => {
  const index = process.argv.indexOf('--' + name);
  return index === -1 ? fallback : process.argv[index + 1];
};

const resolution = argument('resolution', '50m');
const dryRun = process.argv.includes('--dry');

/** L'anneau exterieur de chaque polygone de terre, en paires [lon, lat]. */
const landRings = () => {
  const topology = JSON.parse(readFileSync(require.resolve('world-atlas/land-' + resolution + '.json'), 'utf8'));
  const land = feature(topology, topology.objects.land);
  // Selon le fichier, `land` est une geometrie seule ou une collection.
  const geometries = land.type === 'FeatureCollection' ? land.features.map((entry) => entry.geometry) : [land.geometry];
  const polygons = geometries.flatMap((geometry) =>
    geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates],
  );
  // [0] = anneau exterieur : un lac interieur n'est pas une cote utile.
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

const offLine = (point, from, to) => {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const length = Math.hypot(dx, dy);
  if (length === 0) return Math.hypot(point[0] - from[0], point[1] - from[1]);
  return Math.abs(dy * (point[0] - from[0]) - dx * (point[1] - from[1])) / length;
};

/** Douglas-Peucker : garde les coudes qui depassent `tolerance`. */
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

const buildPath = (tolerance) => {
  const rings = landRings()
    .filter((ring) => {
      const span = spanOf(ring);
      return span.top > ANTARCTIC_LATITUDE && (span.width > MIN_RING_SPAN || span.height > MIN_RING_SPAN);
    })
    .map((ring) => {
      const simplified = simplify(ring, tolerance).map((point) => [round(point[0]), round(point[1])]);
      // L'arrondi peut doubler un point ; un anneau de 2 points ne se dessine pas.
      return simplified.filter(
        (point, index) =>
          index === 0 || point[0] !== simplified[index - 1][0] || point[1] !== simplified[index - 1][1],
      );
    })
    .filter((ring) => ring.length > 2);

  const path = rings
    .map((ring) => 'M' + ring.map((point) => point[0] + ' ' + point[1]).join('L') + 'Z')
    .join('');
  return { path, rings, points: rings.reduce((total, ring) => total + ring.length, 0) };
};

/** Masque RLE terre/mer (premiere course = mer), par remplissage de lignes et regle pair-impair (gere une ile dans une baie). */
const buildMask = (rings) => {
  const edges = [];
  for (const ring of rings) {
    // Un anneau saute de +180 a -180 a la ligne de changement de date (Russie, Fiji...) : on deroule la longitude
    // pour le refermer, puis on le pose aussi a +-360 car il peut etre decale d'un tour.
    const open = [ring[0][0]];
    for (let index = 1; index < ring.length; index += 1) {
      const jump = ring[index][0] - ring[index - 1][0];
      const turn = Math.abs(jump) > 180 ? (jump > 0 ? -360 : 360) : 0;
      open.push(open[index - 1] + jump + turn);
    }
    for (const shift of [-360, 0, 360]) {
      for (let index = 0; index < ring.length; index += 1) {
        const next = (index + 1) % ring.length;
        // Une arete horizontale ne coupe jamais une ligne (elle compterait deux fois).
        if (ring[index][1] === ring[next][1]) continue;
        edges.push([open[index] + shift, ring[index][1], open[next] + shift, ring[next][1]]);
      }
    }
  }

  const runs = [];
  let land = false;
  let run = 0;
  for (let row = 0; row < MASK_HEIGHT; row += 1) {
    const latitude = -90 + ((row + 0.5) / MASK_HEIGHT) * 180;
    const crossings = [];
    for (const [x1, y1, x2, y2] of edges) {
      if ((y1 <= latitude && y2 > latitude) || (y2 <= latitude && y1 > latitude)) {
        crossings.push(x1 + ((latitude - y1) / (y2 - y1)) * (x2 - x1));
      }
    }
    crossings.sort((a, b) => a - b);

    let crossed = 0;
    let inside = false;
    for (let column = 0; column < MASK_WIDTH; column += 1) {
      const longitude = -180 + ((column + 0.5) / MASK_WIDTH) * 360;
      while (crossed < crossings.length && crossings[crossed] < longitude) {
        inside = !inside;
        crossed += 1;
      }
      if (inside === land) {
        run += 1;
      } else {
        runs.push(run);
        land = inside;
        run = 1;
      }
    }
  }
  runs.push(run);
  return runs;
};

if (dryRun) {
  for (const candidate of [0.005, 0.01, 0.02, 0.04, 0.08, 0.16]) {
    const built = buildPath(candidate);
    console.log(
      'tolerance ' +
        String(candidate).padEnd(6) +
        String(built.rings.length).padStart(5) +
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

const mask = buildMask(built.rings);
const runs = mask.map((run) => run.toString(36)).join('.');

const landHeader = [
  '/**',
  " * Outline of the world's land for the 3D globe (`Globe3D`), as `lon lat` pairs in degrees, not cut at the date",
  ' * line: there is no seam on a globe. A decorative asset, not game data — Natural Earth ' + resolution,
  ' * (`world-atlas` land-' + resolution + '), outer rings only, Antarctica left out, simplified at ' + tolerance,
  ' * degree and rounded to ' + DECIMALS + ' decimals: ' + built.rings.length + ' coastlines, ' + built.points + ' points,',
  ' * drawn as one single soup of lines so that the whole world costs one draw (see `scene.ts`).',
  ' *',
  ' * Generated by `scripts/globe-land.mjs`, never hand-edited.',
  ' */',
].join('\n');

const maskHeader = [
  '/**',
  ' * Which pixels of the world are land, to colour the continents in on the 3D globe: an equirectangular map of',
  ' * ' + MASK_WIDTH + ' x ' + MASK_HEIGHT + ' pixels (rows from the south pole up, as a three.js `DataTexture` reads them),',
  ' * run-length encoded in base 36 — the lengths of the stretches of sea and land, starting with sea, ' + mask.length,
  ' * of them. Rasterised from the very outline of `globeLand.ts`, so the colour and the coastline drawn over it',
  ' * cannot disagree.',
  ' *',
  ' * Generated by `scripts/globe-land.mjs`, never hand-edited.',
  ' */',
  'export const GLOBE_MASK = {',
  '  width: ' + MASK_WIDTH + ',',
  '  height: ' + MASK_HEIGHT + ',',
  '  runs:',
].join('\n');

const quoted = (value) => JSON.stringify(value).replace(/"/g, "'");

writeFileSync(
  'src/components/Globe3D/globeLand.ts',
  landHeader + '\nexport const GLOBE_LAND_PATH =\n  ' + quoted(built.path) + ';\n',
);
writeFileSync('src/components/Globe3D/globeMask.ts', maskHeader + '\n    ' + quoted(runs) + ',\n};\n');
console.log(
  'globeLand.ts: ' +
    built.rings.length +
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
console.log('globeMask.ts: ' + MASK_WIDTH + 'x' + MASK_HEIGHT + ', ' + mask.length + ' runs, ' + (runs.length / 1024).toFixed(0) + ' KB');
