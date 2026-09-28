import { getCachedClueHistory, recordClueDraw } from '@/games/clues/helpers/clueHistory';

import { pickClueRoundPlaces } from './helpers';

jest.mock('@/games/clues/helpers/clueHistory', () => ({
  ...jest.requireActual('@/games/clues/helpers/clueHistory'),
  getCachedClueHistory: jest.fn(),
  recordClueDraw: jest.fn(),
}));

beforeEach(() => {
  jest.mocked(getCachedClueHistory).mockReturnValue(null);
  jest.mocked(recordClueDraw).mockClear();
});

describe('pickClueRoundPlaces', () => {
  it('draws one place per round, matching the difficulty', () => {
    const places = pickClueRoundPlaces(4, 'easy', ['cities', 'capital'], 'fr');
    expect(places).toHaveLength(4);
    expect(places.every((place) => place.difficulty === 'easy')).toBe(true);
  });

  it('records every draw in the history, in order', () => {
    const places = pickClueRoundPlaces(3, 'easy', ['cities', 'capital'], 'fr');
    expect(recordClueDraw).toHaveBeenCalledTimes(3);
    places.forEach((place, index) => expect(recordClueDraw).toHaveBeenNthCalledWith(index + 1, place));
  });

  it('works with an already loaded history', () => {
    jest.mocked(getCachedClueHistory).mockReturnValue({});
    expect(pickClueRoundPlaces(2, 'easy', ['capital'], 'en')).toHaveLength(2);
  });

  it('returns nothing for zero rounds', () => {
    expect(pickClueRoundPlaces(0, 'easy', ['cities'], 'fr')).toEqual([]);
  });
});
