import { describe, expect, it } from 'vitest';

import type { PlaceRow } from '../../api/places';

import {
  categoryOf,
  difficultyOf,
  hexFloats,
  hexNumber,
  markFor,
  nearestPoint,
  parseRings,
  drawShape,
  labelBox,
  labelsShownAt,
  maxLabelsAt,
  PLACE_SHAPES,
  placeBuffers,
  placeShape,
  placeColor,
  rotateSpeedAt,
  searchTargets,
  selectLabels,
  segmentsOf,
  shapeShownAt,
  starPositions,
  toVector,
  visiblePlaces,
} from './helpers';
import {
  CAMERA_DISTANCE,
  CAPITALS_MAX_DISTANCE,
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
  country: 'France',
  coordinates: { latitude: 10, longitude: 20 },
  compass: { category: 'cities', difficulty: 'easy' } as PlaceRow['compass'],
  clues: null,
  ...over,
});

describe('toVector', () => {
  it('puts longitude 0 on the equator facing +z, the north pole on +y and longitude 90 on +x', () => {
    const [x, y, z] = toVector(0, 0);
    expect([x, y, z].map((value) => Math.round(value * 1000) / 1000)).toEqual([0, 0, 1]);
    expect(toVector(0, 90)[1]).toBeCloseTo(1, 6);
    expect(toVector(90, 0)[0]).toBeCloseTo(1, 6);
  });

  it('scales with the altitude', () => {
    expect(Math.hypot(...toVector(30, 40, 1.5))).toBeCloseTo(1.5, 6);
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

  it('colours a category, grey for a place without category', () => {
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

describe('labelBox', () => {
  it('takes a box to the right of its dot, sized by the name', () => {
    expect(labelBox({ x: 10, y: 20 }, 'Paris')).toEqual({ left: 10, right: 10 + 10 + 5 * 7, top: 12, bottom: 28 });
  });
});

describe('searchTargets', () => {
  const rows = [
    row('par', { name: 'Paris', country: 'France', coordinates: { latitude: 48.8, longitude: 2.3 } }),
    row('tok', { name: 'Tokyo', country: 'Japon', coordinates: { latitude: 35.6, longitude: 139.7 } }),
  ];

  it('finds nothing for an empty query', () => {
    expect(searchTargets('  ', rows)).toEqual([]);
  });

  it('finds places by name or by country, and keeps the first few', () => {
    expect(searchTargets('tokyo', rows)).toEqual([{ kind: 'place', id: 'tok', label: '📍 Tokyo', lon: 139.7, lat: 35.6 }]);
    expect(searchTargets('fran', rows).map((target) => target.id)).toEqual(['par']);
    const many = Array.from({ length: 20 }, (_, index) => row(`k${index}`, { name: `Ville ${index}` }));
    expect(searchTargets('ville', many)).toHaveLength(8);
  });
});

describe('markFor', () => {
  const rows = [row('par', { coordinates: { latitude: 48.8, longitude: 2.3 } })];

  it('draws a place as one dot', () => {
    const mark = markFor({ kind: 'place', id: 'par' }, rows);
    expect(mark?.segments).toEqual([]);
    expect(mark?.point).toHaveLength(3);
  });

  it('draws nothing for no target, or one that no longer exists', () => {
    expect(markFor(null, rows)).toBeNull();
    expect(markFor({ kind: 'place', id: 'nope' }, rows)).toBeNull();
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
