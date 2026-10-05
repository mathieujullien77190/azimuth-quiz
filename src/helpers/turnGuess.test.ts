import { hasGuessedThisTurn, missIsFresh } from './turnGuess';

const state = { turnUid: 'zoe', wrongGuessUid: 'zoe', wrongGuessHints: 3 };

describe('hasGuessedThisTurn', () => {
  it('is true for the turn-holder who missed with the current number of hints out', () => {
    expect(hasGuessedThisTurn(state, 3)).toBe(true);
  });

  it('falls back to false once a hint was revealed (the turn passed on), or when the turn has moved', () => {
    expect(hasGuessedThisTurn(state, 4)).toBe(false);
    expect(hasGuessedThisTurn({ ...state, turnUid: 'max' }, 3)).toBe(false);
  });

  it('is false when nobody missed this round, or in a room that predates the rule', () => {
    expect(hasGuessedThisTurn({ ...state, wrongGuessUid: null }, 3)).toBe(false);
    expect(hasGuessedThisTurn({ ...state, wrongGuessHints: null }, 3)).toBe(false);
  });

  it('is false while nobody has the turn', () => {
    expect(hasGuessedThisTurn({ turnUid: null, wrongGuessUid: null, wrongGuessHints: null }, 0)).toBe(false);
  });
});

describe('missIsFresh', () => {
  it('is true while the hints out are still the ones of the miss', () => {
    expect(missIsFresh(3, 3)).toBe(true);
  });

  it('is false as soon as a hint was revealed after the miss', () => {
    expect(missIsFresh(3, 4)).toBe(false);
  });

  it('keeps the older behaviour (true) when no miss was written with a hints count', () => {
    expect(missIsFresh(null, 5)).toBe(true);
  });
});
