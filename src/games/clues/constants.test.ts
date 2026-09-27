import type { ClueId } from '@/types';

import { CLUE_ANSWER_METHODS, CLUE_ORDER, DEFAULT_CLUE_SETTINGS } from './constants';

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
  'localTime',
  'phoneCode',
  'currency',
  'airportCode',
  'isCapital',
];

describe('CLUE_ORDER', () => {
  it('lists every clue id exactly once', () => {
    expect([...CLUE_ORDER].sort()).toEqual([...ALL_CLUE_IDS].sort());
  });
});

describe('CLUE_ANSWER_METHODS', () => {
  it('lists both answer methods', () => {
    expect(CLUE_ANSWER_METHODS.map((method) => method.id).sort()).toEqual(['spoken', 'typed'].sort());
  });
});

describe('DEFAULT_CLUE_SETTINGS', () => {
  it('is a valid, playable settings object', () => {
    expect(DEFAULT_CLUE_SETTINGS.playerNames.length).toBeGreaterThan(0);
    expect(DEFAULT_CLUE_SETTINGS.rounds).toBeGreaterThan(0);
    expect(['spoken', 'typed']).toContain(DEFAULT_CLUE_SETTINGS.answerMethod);
  });
});
