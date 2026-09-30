import { decodeRing, encodeRing } from './polyline';

describe('encodeRing / decodeRing', () => {
  it('writes the origin as two zero deltas', () => {
    expect(encodeRing([[0, 0]])).toBe('??');
  });

  it('round-trips a ring with negative coordinates and the first point repeated at the end', () => {
    const ring: [number, number][] = [
      [-3.456, 48.123],
      [-2.001, 47.999],
      [0.5, -12.25],
      [-3.456, 48.123],
    ];
    expect(decodeRing(encodeRing(ring))).toEqual(ring);
  });

  it('round-trips big jumps between two points (the whole world)', () => {
    const ring: [number, number][] = [
      [-179.999, -89.999],
      [179.999, 89.999],
      [0, 0],
      [-179.999, 89.999],
    ];
    expect(decodeRing(encodeRing(ring))).toEqual(ring);
  });

  it('gives the very same doubles as the 3-decimal literals it was made from', () => {
    const ring: [number, number][] = [
      [56.299, 25.65],
      [56.389, 24.98],
      [55.759, 24.242],
    ];
    expect(decodeRing(encodeRing(ring))).toEqual(ring);
  });

  it('round-trips an empty ring and a single point', () => {
    expect(encodeRing([])).toBe('');
    expect(decodeRing('')).toEqual([]);
    expect(decodeRing(encodeRing([[12.345, 6.789]]))).toEqual([[12.345, 6.789]]);
  });

  it('is much lighter than the flat array of numbers', () => {
    const ring: [number, number][] = Array.from({ length: 700 }, (_, index) => [
      Math.round((10 + Math.cos(index / 50) * 3) * 1000) / 1000,
      Math.round((45 + Math.sin(index / 50) * 3) * 1000) / 1000,
    ]);
    expect(encodeRing(ring).length).toBeLessThan(JSON.stringify(ring.flat()).length / 2);
  });
});
