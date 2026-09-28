import { CLUE_ORDER } from '@/games/clues/constants';
import { clueHasMoreToReveal, clueStage, vowelsUnlocked } from './helpers';

describe('clueStage', () => {
  it('counts how many times a clue id was picked', () => {
    expect(clueStage(['emoji', 'letter', 'emoji'], 'emoji')).toBe(2);
    expect(clueStage(['emoji'], 'letter')).toBe(0);
  });
});

describe('clueHasMoreToReveal', () => {
  it('caps single-stage clues at 1 pick', () => {
    expect(clueHasMoreToReveal([], 'isCapital')).toBe(false);
  });

  it('caps 2-stage clues (distance/elevation/population/currency/localTime/letter) at 2 picks', () => {
    expect(clueHasMoreToReveal(['letter'], 'letter')).toBe(true);
    expect(clueHasMoreToReveal(['letter', 'letter'], 'letter')).toBe(false);
  });

  it('caps 3-stage clues (emoji/flagColors) at 3 picks', () => {
    expect(clueHasMoreToReveal(['emoji', 'emoji'], 'emoji')).toBe(true);
    expect(clueHasMoreToReveal(['emoji', 'emoji', 'emoji'], 'emoji')).toBe(false);
  });
});

describe('vowelsUnlocked', () => {
  it('is false until every clue in CLUE_ORDER has been picked at least once', () => {
    expect(vowelsUnlocked(CLUE_ORDER.slice(0, -1))).toBe(false);
    expect(vowelsUnlocked(CLUE_ORDER)).toBe(true);
  });
});
