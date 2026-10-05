import { describe, expect, it } from 'vitest';

import type { CountryRecord } from '../../api/countries';
import type { PlaceRow } from '../../api/places';

import {
  categoryOf,
  centerOf,
  countryAt,
  countryGroups,
  difficultyColor,
  difficultyOf,
  fromVector,
  hexFloats,
  hexNumber,
  insideShape,
  markFor,
  nearestPoint,
  parseRings,
  drawShape,
  countryLabelsShownAt,
  labelBox,
  labelsShownAt,
  maxLabelsAt,
  PLACE_SHAPES,
  placeBuffers,
  placeShape,
  placeColor,
  raySphereHit,
  rotateSpeedAt,
  searchTargets,
  selectLabels,
  segmentsOf,
  shapeShownAt,
  shapeOf,
  starPositions,
  toVector,
  unwrapRing,
  visiblePlaces,
  wrapLongitude,
} from './helpers';
import {
  CAMERA_DISTANCE,
  CAPITALS_MAX_DISTANCE,
  COUNTRY_LABELS_MAX_DISTANCE,
  COUNTRY_LABELS_MIN_DISTANCE,
  LABELS_MAX_DISTANCE,
  MAX_LABELS,
  MAX_LABELS_CLOSE,
  MIN_DISTANCE,
  MIN_ROTATE_SPEED,
  POINTS_MAX_DISTANCE,
  ROTATE_SPEED,
} from './constants';
import type { LonLat } from './types';

const square = (lon: number, lat: number, size: number): LonLat[] => [
  [lon, lat],
  [lon + size, lat],
  [lon + size, lat + size],
  [lon, lat + size],
];

const row = (key: string, over: Partial<PlaceRow> = {}): PlaceRow => ({
  key,
  name: `Lieu ${key}`,
  code: 'FR',
  coordinates: { latitude: 10, longitude: 20 },
  compass: { category: 'cities', difficulty: 'easy' } as PlaceRow['compass'],
  clues: null,
  ...over,
});

describe('toVector / fromVector', () => {
  it('puts longitude 0 on the equator facing +z, the north pole on +y and longitude 90 on +x', () => {
    const [x, y, z] = toVector(0, 0);
    expect([x, y, z].map((value) => Math.round(value * 1000) / 1000)).toEqual([0, 0, 1]);
    expect(toVector(0, 90)[1]).toBeCloseTo(1, 6);
    expect(toVector(90, 0)[0]).toBeCloseTo(1, 6);
  });

  it('scales with the altitude', () => {
    expect(Math.hypot(...toVector(30, 40, 1.5))).toBeCloseTo(1.5, 6);
  });

  it('goes back to the same longitude and latitude', () => {
    const { lon, lat } = fromVector(toVector(-73.5, 41.25, 2));
    expect(lon).toBeCloseTo(-73.5, 6);
    expect(lat).toBeCloseTo(41.25, 6);
  });
});

describe('wrapLongitude', () => {
  it('brings a longitude back into [-180, 180[', () => {
    expect(wrapLongitude(190)).toBe(-170);
    expect(wrapLongitude(-190)).toBe(170);
    expect(wrapLongitude(10)).toBe(10);
  });
});

describe('parseRings / segmentsOf', () => {
  it('reads every ring of the outline path', () => {
    expect(parseRings('M0 0L10 0L10 10ZM20 20L30 20L30 30Z')).toEqual([
      [
        [0, 0],
        [10, 0],
        [10, 10],
      ],
      [
        [20, 20],
        [30, 20],
        [30, 30],
      ],
    ]);
  });

  it('makes one segment per edge of a closed ring: two ends of three coordinates each', () => {
    const segments = segmentsOf([square(0, 0, 10)], 1);
    expect(segments).toHaveLength(4 * 6);
    // The last edge goes back to the first point.
    expect(segments.slice(-3)).toEqual([...toVector(0, 0, 1)]);
  });
});

describe('unwrapRing / shapeOf', () => {
  it('lets the longitude go on past 180 instead of jumping back to -180', () => {
    const ring: LonLat[] = [
      [170, 60],
      [179, 62],
      [-175, 64],
      [-170, 66],
    ];
    expect(unwrapRing(ring).map(([lon]) => lon)).toEqual([170, 179, 185, 190]);
  });

  it('leaves a ring that does not cross the date line as it is', () => {
    expect(unwrapRing(square(10, 10, 5))).toEqual(square(10, 10, 5));
  });

  it('keeps the box, the code and the difficulty of the shape', () => {
    const shape = shapeOf('FR', square(2, 40, 8), 'hard');
    expect(shape).toMatchObject({ code: 'FR', difficulty: 'hard', minLon: 2, maxLon: 10, minLat: 40, maxLat: 48 });
  });
});

describe('insideShape / countryAt / centerOf', () => {
  const near = shapeOf('AA', square(0, 0, 10), 'easy');
  const dateLine = shapeOf(
    'RU',
    [
      [170, 60],
      [179, 60],
      [-175, 60],
      [-170, 60],
      [-170, 70],
      [-175, 70],
      [179, 70],
      [170, 70],
    ],
    'intermediate',
  );

  it('finds a point inside, and not one outside', () => {
    expect(insideShape(5, 5, near)).toBe(true);
    expect(insideShape(15, 5, near)).toBe(false);
    expect(insideShape(5, 15, near)).toBe(false);
  });

  it('finds a point of a country that crosses the date line from either side', () => {
    expect(insideShape(175, 65, dateLine)).toBe(true);
    expect(insideShape(-175, 65, dateLine)).toBe(true);
    expect(insideShape(-160, 65, dateLine)).toBe(false);
  });

  it('gives the code of the country around a point, null elsewhere', () => {
    expect(countryAt(5, 5, [near, dateLine])).toBe('AA');
    expect(countryAt(-172, 65, [near, dateLine])).toBe('RU');
    expect(countryAt(50, 50, [near, dateLine])).toBeNull();
  });

  it('prefers the smallest country when outlines overlap', () => {
    const big = shapeOf('BIG', square(-5, -5, 30), 'easy');
    expect(countryAt(5, 5, [big, near])).toBe('AA');
    expect(countryAt(5, 5, [near, big])).toBe('AA');
  });

  it('puts the middle of a country at the middle of its box, wrapped', () => {
    expect(centerOf(near)).toEqual({ lon: 5, lat: 5 });
    expect(centerOf(dateLine)).toEqual({ lon: -180, lat: 65 });
  });
});

describe('raySphereHit', () => {
  it('meets the near side of the sphere', () => {
    expect(raySphereHit([0, 0, 3], [0, 0, -1])).toEqual([0, 0, 1]);
  });

  it('misses a sphere the ray passes beside', () => {
    expect(raySphereHit([0, 0, 3], [1, 0, 0])).toBeNull();
    expect(raySphereHit([5, 0, 3], [0, 0, -1])).toBeNull();
  });

  it('misses a sphere behind the origin', () => {
    expect(raySphereHit([0, 0, 3], [0, 0, 1])).toBeNull();
  });
});

describe('nearestPoint', () => {
  const points = [
    { x: 10, y: 10, visible: true },
    { x: 14, y: 10, visible: true },
    { x: 11, y: 10, visible: false },
  ];

  it('gives the nearest visible point within the radius', () => {
    expect(nearestPoint(points, 13, 10, 12)).toBe(1);
    expect(nearestPoint(points, 8, 10, 12)).toBe(0);
  });

  it('ignores a point on the far side of the globe, and gives null when none is close', () => {
    expect(nearestPoint(points, 11, 10, 0.5)).toBeNull();
    expect(nearestPoint(points, 100, 100, 12)).toBeNull();
  });
});

describe('colours', () => {
  it('reads #rrggbb as a number and as floats', () => {
    expect(hexNumber('#ff8000')).toBe(0xff8000);
    expect(hexFloats('#ff0000')).toEqual([1, 0, 0]);
    expect(hexFloats('#000080')[2]).toBeCloseTo(128 / 255, 6);
  });

  it('colours a difficulty and a category, grey for a place without category', () => {
    expect(difficultyColor('easy')).toBe(0x4ade80);
    expect(placeColor('cities')).toBe('#60A5FA');
    expect(placeColor(null)).toBe('#93A0BC');
  });
});

describe('places', () => {
  const capital = row('cap', { compass: { category: 'capital', difficulty: 'hard' } as PlaceRow['compass'] });
  const cluesOnly = row('clu', { compass: null, clues: { difficulty: 'intermediate' } as PlaceRow['clues'] });

  it('reads the category and the difficulty of a place, whichever game it is in', () => {
    expect(categoryOf(capital)).toBe('capital');
    expect(categoryOf(cluesOnly)).toBeNull();
    expect(difficultyOf(capital)).toBe('hard');
    expect(difficultyOf(cluesOnly)).toBe('intermediate');
  });

  it('filters by category and difficulty; a place with no category ignores the category filter', () => {
    const rows = [row('a'), capital, cluesOnly];
    const all = new Set(['cities', 'capital', 'citiesFr', 'mountains', 'landmarks', 'nature', 'kids'] as const);
    const every = new Set(['easy', 'intermediate', 'hard'] as const);
    expect(visiblePlaces(rows, all, every).map((r) => r.key)).toEqual(['a', 'cap', 'clu']);
    expect(visiblePlaces(rows, new Set(['cities']), every).map((r) => r.key)).toEqual(['a', 'clu']);
    expect(visiblePlaces(rows, all, new Set(['hard'])).map((r) => r.key)).toEqual(['cap']);
  });

  it('gives round dots to the cities, stars to the capitals, squares to the rest', () => {
    expect(PLACE_SHAPES).toEqual(['round', 'star', 'square']);
    expect(placeShape('cities')).toBe('round');
    expect(placeShape('citiesFr')).toBe('round');
    expect(placeShape('capital')).toBe('star');
    for (const category of ['mountains', 'landmarks', 'nature', 'kids'] as const) expect(placeShape(category)).toBe('square');
    expect(placeShape(null)).toBe('square');
  });

  it('builds every position in order, and the dots split by shape with their colours', () => {
    const { positions, kinds, shapes } = placeBuffers([row('a'), capital, cluesOnly], 1.006);
    expect(positions).toHaveLength(9);
    expect(Math.hypot(...positions.slice(0, 3))).toBeCloseTo(1.006, 6);
    expect(shapes.round.positions).toEqual(positions.slice(0, 3));
    expect(shapes.round.colors).toEqual(hexFloats('#60A5FA'));
    expect(shapes.star.positions).toEqual(positions.slice(3, 6));
    expect(shapes.star.colors).toEqual(hexFloats('#FBBF24'));
    expect(shapes.square.positions).toEqual(positions.slice(6, 9));
    expect(kinds).toEqual(['round', 'star', 'square']);
  });
});

describe('level of detail', () => {
  it('shows the capitals from further away than the other places, and the names only close up', () => {
    expect(shapeShownAt('star', CAPITALS_MAX_DISTANCE)).toBe(true);
    expect(shapeShownAt('star', CAPITALS_MAX_DISTANCE + 0.1)).toBe(false);
    expect(shapeShownAt('round', POINTS_MAX_DISTANCE)).toBe(true);
    expect(shapeShownAt('square', POINTS_MAX_DISTANCE + 0.1)).toBe(false);
    // Between the two thresholds only the capitals are there.
    const between = (CAPITALS_MAX_DISTANCE + POINTS_MAX_DISTANCE) / 2;
    expect([shapeShownAt('star', between), shapeShownAt('round', between)]).toEqual([true, false]);
    expect(labelsShownAt(LABELS_MAX_DISTANCE)).toBe(true);
    expect(labelsShownAt(LABELS_MAX_DISTANCE + 0.1)).toBe(false);
    expect(LABELS_MAX_DISTANCE).toBeLessThan(POINTS_MAX_DISTANCE);
  });
});

describe('zoom helpers', () => {
  it('allows more names the closer the camera gets, within the limits', () => {
    expect(maxLabelsAt(LABELS_MAX_DISTANCE)).toBe(MAX_LABELS);
    expect(maxLabelsAt(LABELS_MAX_DISTANCE + 1)).toBe(MAX_LABELS);
    expect(maxLabelsAt(MIN_DISTANCE)).toBe(MAX_LABELS_CLOSE);
    expect(maxLabelsAt(MIN_DISTANCE - 0.5)).toBe(MAX_LABELS_CLOSE);
    const middle = maxLabelsAt((LABELS_MAX_DISTANCE + MIN_DISTANCE) / 2);
    expect(middle).toBeGreaterThan(MAX_LABELS);
    expect(middle).toBeLessThan(MAX_LABELS_CLOSE);
  });

  it('slows the drag down with the distance to the ground, never past its limits', () => {
    expect(rotateSpeedAt(CAMERA_DISTANCE)).toBeCloseTo(ROTATE_SPEED, 6);
    expect(rotateSpeedAt(CAMERA_DISTANCE + 4)).toBe(ROTATE_SPEED);
    expect(rotateSpeedAt(MIN_DISTANCE)).toBe(MIN_ROTATE_SPEED);
    expect(rotateSpeedAt(2)).toBeLessThan(rotateSpeedAt(3));
    expect(rotateSpeedAt(2)).toBeGreaterThan(MIN_ROTATE_SPEED);
  });
});

describe('country names', () => {
  it('are shown from further away than the city names, and give way to them when very close', () => {
    expect(COUNTRY_LABELS_MAX_DISTANCE).toBeGreaterThan(LABELS_MAX_DISTANCE);
    expect(countryLabelsShownAt(COUNTRY_LABELS_MAX_DISTANCE)).toBe(true);
    expect(countryLabelsShownAt(COUNTRY_LABELS_MAX_DISTANCE + 0.1)).toBe(false);
    expect(countryLabelsShownAt(COUNTRY_LABELS_MIN_DISTANCE)).toBe(true);
    expect(countryLabelsShownAt(COUNTRY_LABELS_MIN_DISTANCE - 0.1)).toBe(false);
  });

  it('take a box to the right of their dot, sized by their own letter width and height', () => {
    expect(labelBox({ x: 10, y: 20 }, 'Paris')).toEqual({ left: 10, right: 10 + 10 + 5 * 7, top: 12, bottom: 28 });
    expect(labelBox({ x: 0, y: 0 }, 'FRANCE', 9, 20)).toEqual({ left: 0, right: 10 + 6 * 9, top: -10, bottom: 10 });
  });

  it('keep the city names out of their room: a blocked box drops the names that would touch it', () => {
    const points = [{ x: 100, y: 100, visible: true }, { x: 100, y: 200, visible: true }];
    const blocked = [labelBox({ x: 95, y: 98 }, 'FRANCE', 9, 20)];
    const labels = selectLabels(points, ['round', 'round'], ['Paris', 'Lyon'], 400, 300, 10, { blocked });
    expect(labels.map((label) => label.index)).toEqual([1]);
    // And a name can be measured with its own letter width and height.
    const wide = selectLabels(points, ['round', 'round'], ['Paris', 'Lyon'], 400, 300, 10, { charPx: 100, lineHeight: 200 });
    expect(wide).toHaveLength(1);
  });
});

describe('selectLabels', () => {
  const at = (x: number, y: number, visible = true) => ({ x, y, visible });

  it('keeps the places in sight and inside the canvas only', () => {
    const labels = selectLabels(
      [at(100, 100), at(100, 100, false), at(-5, 100), at(100, 500), at(300, 100)],
      ['round', 'round', 'round', 'round', 'round'],
      ['A', 'B', 'C', 'D', 'E'],
      400,
      300,
    );
    expect(labels.map((label) => label.index).sort()).toEqual([0, 4]);
  });

  it('puts the capitals first, then the places closest to the middle', () => {
    const labels = selectLabels(
      [at(10, 10), at(200, 150), at(300, 200)],
      ['round', 'round', 'star'],
      ['Far', 'Middle', 'Capital'],
      400,
      300,
    );
    expect(labels.map((label) => label.index)).toEqual([2, 1, 0]);
    expect(labels[0]).toEqual({ index: 2, x: 300, y: 200 });
  });

  it('drops a name that would touch one already kept', () => {
    const labels = selectLabels(
      [at(100, 100), at(110, 104), at(100, 200)],
      ['star', 'round', 'round'],
      ['Paris', 'Versailles', 'Lyon'],
      400,
      300,
    );
    expect(labels.map((label) => label.index).sort()).toEqual([0, 2]);
  });

  it('stops at the given maximum', () => {
    const points = Array.from({ length: 5 }, (_, index) => at(20 + index * 80, 100));
    const kinds = points.map(() => 'round' as const);
    const names = points.map(() => 'Ab');
    expect(selectLabels(points, kinds, names, 500, 300, 3)).toHaveLength(3);
    expect(selectLabels(points, kinds, names, 500, 300)).toHaveLength(5);
  });
});

describe('drawShape', () => {
  const fakeContext = () => {
    const calls: string[] = [];
    return {
      calls,
      context: {
        fillStyle: '' as string | CanvasGradient | CanvasPattern,
        beginPath: () => calls.push('begin'),
        arc: (...args: number[]) => calls.push(`arc ${args.join(',')}`),
        moveTo: () => calls.push('move'),
        lineTo: () => calls.push('line'),
        closePath: () => calls.push('close'),
        fill: () => calls.push('fill'),
      },
    };
  };

  it('paints a white round dot as one arc', () => {
    const { calls, context } = fakeContext();
    drawShape(context, 'round', 64);
    expect(context.fillStyle).toBe('#ffffff');
    expect(calls[0]).toBe('begin');
    expect(calls[1]).toMatch(/^arc 32,32,/);
    expect(calls.slice(-2)).toEqual(['close', 'fill']);
  });

  it('paints a star as ten points, alternating the tips and the hollows', () => {
    const { calls, context } = fakeContext();
    drawShape(context, 'star', 64);
    expect(calls.filter((call) => call === 'move')).toHaveLength(1);
    expect(calls.filter((call) => call === 'line')).toHaveLength(9);
    expect(calls.slice(-2)).toEqual(['close', 'fill']);
  });
});

describe('countryGroups', () => {
  it('makes one group of segments per wanted difficulty', () => {
    const shapes = [shapeOf('AA', square(0, 0, 5), 'easy'), shapeOf('BB', square(10, 0, 5), 'hard')];
    const groups = countryGroups(shapes, new Set(['easy', 'hard']), 1.002);
    expect(groups.map((group) => group.difficulty)).toEqual(['easy', 'hard']);
    expect(groups[0].positions).toHaveLength(4 * 6);
    expect(countryGroups(shapes, new Set(['hard']), 1.002).map((group) => group.difficulty)).toEqual(['hard']);
  });
});

describe('searchTargets', () => {
  const country = (code: string, fr: string, en: string): CountryRecord => ({
    code,
    fr,
    en,
    flag: null,
    currency: null,
    currencySymbol: null,
    phoneCode: null,
    neighbors: [],
    difficulty: null,
  });
  const countries = [country('FR', 'France', 'France'), country('JP', 'Japon', 'Japan'), country('XX', 'Xanadu', 'Xanadu')];
  const shapes = [shapeOf('FR', square(0, 40, 10), 'easy')];
  const rows = [
    row('par', { name: 'Paris', code: 'FR', coordinates: { latitude: 48.8, longitude: 2.3 } }),
    row('tok', { name: 'Tokyo', code: 'JP', coordinates: { latitude: 35.6, longitude: 139.7 } }),
    row('kyo', { name: 'Kyoto', code: 'JP', coordinates: { latitude: 35.0, longitude: 135.7 } }),
  ];

  it('finds nothing for an empty query', () => {
    expect(searchTargets('  ', countries, shapes, rows)).toEqual([]);
  });

  it('finds a country by its name (either language) or its exact code, at the middle of its outline', () => {
    expect(searchTargets('fran', countries, shapes, rows)[0]).toMatchObject({ kind: 'country', id: 'FR', lon: 5, lat: 45 });
    expect(searchTargets('japan', countries, shapes, rows)[0]).toMatchObject({ kind: 'country', id: 'JP' });
    expect(searchTargets('jp', countries, shapes, rows)[0]).toMatchObject({ id: 'JP' });
  });

  it('places a country without an outline at the middle of its own places, and drops one without either', () => {
    const japan = searchTargets('japon', countries, shapes, rows)[0];
    expect(japan.lon).toBeCloseTo((139.7 + 135.7) / 2, 6);
    expect(japan.lat).toBeCloseTo((35.6 + 35.0) / 2, 6);
    expect(searchTargets('xanadu', countries, shapes, rows)).toEqual([]);
  });

  it('finds places by name, after the countries, and keeps the first few', () => {
    const found = searchTargets('o', countries, shapes, rows);
    expect(found.map((target) => target.id)).toEqual(['JP', 'tok', 'kyo']);
    expect(searchTargets('tokyo', countries, shapes, rows)).toEqual([
      { kind: 'place', id: 'tok', label: '📍 Tokyo', lon: 139.7, lat: 35.6 },
    ]);
    const many = Array.from({ length: 20 }, (_, index) => row(`k${index}`, { name: `Ville ${index}` }));
    expect(searchTargets('ville', [], [], many)).toHaveLength(8);
  });
});

describe('markFor', () => {
  const shapes = [shapeOf('FR', square(0, 40, 10), 'easy')];
  const rows = [row('par', { coordinates: { latitude: 48.8, longitude: 2.3 } })];

  it('draws a country as its outline, brighter', () => {
    const mark = markFor({ kind: 'country', id: 'FR' }, shapes, rows);
    expect(mark?.segments).toHaveLength(4 * 6);
    expect(mark?.point).toBeNull();
  });

  it('draws a place as one dot', () => {
    const mark = markFor({ kind: 'place', id: 'par' }, shapes, rows);
    expect(mark?.segments).toEqual([]);
    expect(mark?.point).toHaveLength(3);
  });

  it('draws nothing for no target, or one that no longer exists', () => {
    expect(markFor(null, shapes, rows)).toBeNull();
    expect(markFor({ kind: 'country', id: 'ZZ' }, shapes, rows)).toBeNull();
    expect(markFor({ kind: 'place', id: 'nope' }, shapes, rows)).toBeNull();
  });
});

describe('starPositions', () => {
  it('scatters the same stars on a sphere of the given radius, every time', () => {
    const stars = starPositions(50, 60, 7);
    expect(stars).toHaveLength(150);
    for (let index = 0; index < stars.length; index += 3) {
      expect(Math.hypot(stars[index], stars[index + 1], stars[index + 2])).toBeCloseTo(60, 6);
    }
    expect(starPositions(50, 60, 7)).toEqual(stars);
    expect(starPositions(50, 60, 8)).not.toEqual(stars);
  });
});
