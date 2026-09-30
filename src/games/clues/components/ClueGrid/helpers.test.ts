import { FIXTURE_CLUE_PLACES as CLUE_PLACES } from '@/helpers/storyFixtures';
import { CLUE_ORDER } from '@/games/clues/constants';
import type { ClueId, CluePlace } from '@/types';

import { clueHasMoreToReveal, clueStage, vowelsUnlocked } from './helpers';

const PARIS: CluePlace = CLUE_PLACES.find((place) => place.name === 'Paris')!;

describe('clueStage', () => {
  it('counts how many times a clue id was picked', () => {
    expect(clueStage(['emoji', 'letter', 'emoji'], 'emoji')).toBe(2);
    expect(clueStage(['emoji'], 'letter')).toBe(0);
  });
});

describe('clueHasMoreToReveal', () => {
  it('caps single-stage clues at 1 pick', () => {
    expect(clueHasMoreToReveal([], 'isCapital', PARIS)).toBe(false);
  });

  it('caps 2-stage clues (distance/elevation/population/currency/localTime/letter) at 2 picks', () => {
    expect(clueHasMoreToReveal(['letter'], 'letter', PARIS)).toBe(true);
    expect(clueHasMoreToReveal(['letter', 'letter'], 'letter', PARIS)).toBe(false);
  });

  it('caps 3-stage clues (emoji/flagColors) at 3 picks', () => {
    expect(clueHasMoreToReveal(['emoji', 'emoji'], 'emoji', PARIS)).toBe(true);
    expect(clueHasMoreToReveal(['emoji', 'emoji', 'emoji'], 'emoji', PARIS)).toBe(false);
  });

  it('caps charade at the place’s own max stage ("Paris" = 2 syllables + the clear stage = 3)', () => {
    expect(clueHasMoreToReveal(['charade', 'charade'], 'charade', PARIS)).toBe(true);
    expect(clueHasMoreToReveal(['charade', 'charade', 'charade'], 'charade', PARIS)).toBe(false);
  });
});

describe('vowelsUnlocked', () => {
  it('is false until every clue offered has been picked at least once', () => {
    expect(vowelsUnlocked(CLUE_ORDER.slice(0, -1), CLUE_ORDER)).toBe(false);
    expect(vowelsUnlocked(CLUE_ORDER, CLUE_ORDER)).toBe(true);
  });

  it('only requires the ids actually offered, not the full CLUE_ORDER', () => {
    const reduced: ClueId[] = ['population', 'letter'];
    expect(vowelsUnlocked(['population'], reduced)).toBe(false);
    expect(vowelsUnlocked(['population', 'letter'], reduced)).toBe(true);
  });
});
