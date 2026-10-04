import type { Origin, Place } from '@/types';

import { originForRound, separateRepeats, travelFromPlace } from './originForRound';

const place = (name: string, latitude: number): Place => ({
  name,
  code: 'XX',
  coordinates: { latitude, longitude: 0 },
  category: 'cities',
  difficulty: 'easy',
});

const origin: Origin = { name: 'Ici', coordinates: { latitude: 48, longitude: 2 }, isDevicePosition: false };
const places = [place('Rome', 41), place('Oslo', 59), place('Lima', -12)];

describe('originForRound', () => {
  it('is null until the room has delivered its origin', () => {
    expect(originForRound({ origin: null, places, roundIndex: 1 }, true)).toBeNull();
  });

  it('is always the starting point without travel mode (or in a room made before the option)', () => {
    expect(originForRound({ origin, places, roundIndex: 2 }, false)).toEqual(origin.coordinates);
    expect(originForRound({ origin, places, roundIndex: 2 }, undefined)).toEqual(origin.coordinates);
  });

  it('is the starting point on the first round of travel mode', () => {
    expect(originForRound({ origin, places, roundIndex: 0 }, true)).toEqual(origin.coordinates);
  });

  it('is the previous place on every later round of travel mode', () => {
    expect(originForRound({ origin, places, roundIndex: 1 }, true)).toEqual(places[0].coordinates);
    expect(originForRound({ origin, places, roundIndex: 2 }, true)).toEqual(places[1].coordinates);
  });

  it('falls back to the starting point if the previous place is missing', () => {
    expect(originForRound({ origin, places: [], roundIndex: 1 }, true)).toEqual(origin.coordinates);
  });
});

describe('travelFromPlace', () => {
  it('names the previous place in travel mode, after the first round only', () => {
    expect(travelFromPlace({ places, roundIndex: 0 }, true)).toBeUndefined();
    expect(travelFromPlace({ places, roundIndex: 1 }, true)).toBe(places[0]);
    expect(travelFromPlace({ places, roundIndex: 1 }, false)).toBeUndefined();
    expect(travelFromPlace({ places, roundIndex: 1 }, undefined)).toBeUndefined();
  });
});

describe('separateRepeats', () => {
  const [rome, oslo, lima] = places;

  it('leaves a draw without repeats as it is (and does not touch its input)', () => {
    const draw = [rome, oslo, lima];
    expect(separateRepeats(draw)).toEqual([rome, oslo, lima]);
    expect(separateRepeats(draw)).not.toBe(draw);
  });

  it('swaps a place that follows itself with the next different one', () => {
    expect(separateRepeats([rome, rome, oslo])).toEqual([rome, oslo, rome]);
  });

  it('leaves the repeat when there is nothing different to swap with', () => {
    expect(separateRepeats([rome, rome])).toEqual([rome, rome]);
  });
});
