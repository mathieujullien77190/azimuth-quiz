/**
 * Encoded polyline (the algorithm of Google's "Encoded Polyline") for a ring of `[longitude, latitude]`
 * points, at 3 decimals — the precision the silhouettes are stored with. Every coordinate is written as
 * its difference with the same coordinate of the previous point, in a few printable characters: a
 * 700-point outline weighs about 3 KB as text instead of ~12 KB as an array of doubles, and, being one
 * string, it also sidesteps Firestore's ban on nested arrays.
 */
const FACTOR = 1000;

const encodeNumber = (delta: number): string => {
  let rest = delta < 0 ? ~(delta << 1) : delta << 1;
  let chunks = '';
  while (rest >= 0x20) {
    chunks += String.fromCharCode((0x20 | (rest & 0x1f)) + 63);
    rest >>= 5;
  }
  return chunks + String.fromCharCode(rest + 63);
};

export const encodeRing = (points: readonly (readonly [number, number])[]): string => {
  let previous: [number, number] = [0, 0];
  return points
    .map(([longitude, latitude]) => {
      const current: [number, number] = [Math.round(longitude * FACTOR), Math.round(latitude * FACTOR)];
      const chunk = encodeNumber(current[0] - previous[0]) + encodeNumber(current[1] - previous[1]);
      previous = current;
      return chunk;
    })
    .join('');
};

export const decodeRing = (encoded: string): [number, number][] => {
  const points: [number, number][] = [];
  const current = [0, 0];
  let index = 0;
  let axis = 0;
  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    current[axis] += result & 1 ? ~(result >> 1) : result >> 1;
    if (axis === 1) points.push([current[0] / FACTOR, current[1] / FACTOR]);
    axis = 1 - axis;
  }
  return points;
};
