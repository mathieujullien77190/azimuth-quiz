import type { ClueId } from '@/types';

import { CLUE_ORDER, DEFAULT_CLUE_SETTINGS } from './constants';

const ALL_CLUE_IDS: ClueId[] = [
  'position',
  'population',
  'climate',
  'emoji',
  'elevation',
  'letter',
  'flagColors',
  'bearing',
  'distance',
  'globe',
  'localTime',
  'phoneCode',
  'currency',
  'airportCode',
  'isCapital',
  'personality',
  'wordplay',
];

describe('CLUE_ORDER', () => {
  it('lists every clue id exactly once', () => {
    expect([...CLUE_ORDER].sort()).toEqual([...ALL_CLUE_IDS].sort());
  });
});

describe('DEFAULT_CLUE_SETTINGS', () => {
  it('is a valid, playable settings object', () => {
    expect(DEFAULT_CLUE_SETTINGS.playerName).toBe('');
    expect(DEFAULT_CLUE_SETTINGS.rounds).toBeGreaterThan(0);
  });
});
