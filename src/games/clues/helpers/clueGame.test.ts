import { CLUE_PLACES, isCapitalPlace, isFrenchCityPlace } from '@/data';
import { CLUE_ORDER } from '@/games/clues/constants';
import { charadeFor, charadeMaxStage } from '@/games/clues/helpers/charade';
import { personalityFor } from '@/games/clues/helpers/personality';
import { wordplayFor } from '@/games/clues/helpers/wordplay';
import { nameSkeleton } from '@/helpers';
import type { CluePlace, Difficulty, ClueId } from '@/types';

import {
  cluesFor,
  maxScoreForRound,
  normalizePlaceGuess,
  overlayTypedLetters,
  placeCategory,
  randomCluePlace,
  remainingScore,
  skeletonLetterCount,
  totalRevealCount,
  typedSkeleton,
} from './clueGame';

jest.mock('@/games/clues/helpers/personality', () => ({ personalityFor: jest.fn(() => null) }));
jest.mock('@/games/clues/helpers/wordplay', () => ({ wordplayFor: jest.fn(() => null) }));
jest.mock('@/games/clues/helpers/charade', () => ({
  ...jest.requireActual('@/games/clues/helpers/charade'),
  charadeFor: jest.fn(jest.requireActual('@/games/clues/helpers/charade').charadeFor),
}));

const PARIS = CLUE_PLACES.find((place) => place.name === 'Paris')!; // capital
const MARSEILLE = CLUE_PLACES.find((place) => place.name === 'Marseille')!; // citiesFr
const NEW_YORK = CLUE_PLACES.find((place) => place.name === 'New York')!; // plain "cities"
const CITIES_FR_EXCLUDED: ClueId[] = ['localTime', 'isCapital', 'flagColors', 'currency', 'phoneCode'];

beforeEach(() => {
  jest.mocked(personalityFor).mockReturnValue(null);
  jest.mocked(wordplayFor).mockReturnValue(null);
  jest.mocked(charadeFor).mockImplementation(jest.requireActual('@/games/clues/helpers/charade').charadeFor);
});

describe('placeCategory', () => {
  it('is capital for a capital, citiesFr for a French city, cities for anything else', () => {
    expect(placeCategory(PARIS)).toBe('capital');
    expect(placeCategory(MARSEILLE)).toBe('citiesFr');
    expect(placeCategory(NEW_YORK)).toBe('cities');
  });
});

describe('cluesFor', () => {
  it('offers the full CLUE_ORDER for a capital or a plain city, minus personality/wordplay when neither is curated', () => {
    const expected = CLUE_ORDER.filter((id) => id !== 'personality' && id !== 'wordplay');
    expect(cluesFor(PARIS)).toEqual(expected);
    expect(cluesFor(NEW_YORK)).toEqual(expected);
  });

  it('drops the clues that never vary for a French city (citiesFr only)', () => {
    for (const id of CITIES_FR_EXCLUDED) {
      expect(cluesFor(MARSEILLE)).not.toContain(id);
      expect(cluesFor(PARIS)).toContain(id);
      expect(cluesFor(NEW_YORK)).toContain(id);
    }
  });

  it('adds personality back in once curated, for every category', () => {
    jest.mocked(personalityFor).mockReturnValue({ name: 'Quelqu’un', description: null });
    expect(cluesFor(PARIS)).toContain('personality');
    expect(cluesFor(MARSEILLE)).toContain('personality');
  });

  it('adds wordplay back in once curated, for every category', () => {
    jest.mocked(wordplayFor).mockReturnValue({ sentence: 'un jeu de mot', explained: 'un +jeu+ de mot' });
    expect(cluesFor(PARIS)).toContain('wordplay');
    expect(cluesFor(MARSEILLE)).toContain('wordplay');
  });

  it('never drops charade: it always has at least the heuristic syllable split', () => {
    expect(cluesFor(PARIS)).toContain('charade');
    expect(cluesFor(MARSEILLE)).toContain('charade');
  });

  it('drops charade when a hand-curated override empties it out (a name with no usable syllable)', () => {
    jest.mocked(charadeFor).mockReturnValue({ syllables: [] });
    expect(cluesFor(PARIS)).not.toContain('charade');
  });
});

describe('totalRevealCount', () => {
  const TWO_STAGE: ClueId[] = ['distance', 'elevation', 'population', 'currency', 'localTime', 'letter', 'wordplay'];
  const THREE_STAGE: ClueId[] = ['emoji', 'flagColors'];

  /** Rebuilds the expected total the same way `totalRevealCount` should, but independently (from
   * `cluesFor`/the real per-clue stage rules), so this actually exercises the production
   * function's own wiring rather than just mirroring its implementation line for line. */
  const expectedTotal = (place: CluePlace): number =>
    cluesFor(place).reduce((total, clueId) => {
      if (clueId === 'charade') return total + charadeMaxStage(charadeFor(place));
      return total + (THREE_STAGE.includes(clueId) ? 3 : TWO_STAGE.includes(clueId) ? 2 : 1);
    }, 0);

  it('matches revealing every clue offered for the place, including every multi-stage one', () => {
    expect(totalRevealCount(PARIS)).toBe(expectedTotal(PARIS));
    expect(totalRevealCount(MARSEILLE)).toBe(expectedTotal(MARSEILLE));
  });

  it('is lower for a citiesFr place, by exactly the dropped clues’ own cost (their charade cost aside)', () => {
    // Isolates the citiesFr drop from the two places' own (different) charade cost: adds it back
    // on both sides before comparing.
    const withoutCharade = (place: CluePlace) => totalRevealCount(place) - charadeMaxStage(charadeFor(place));
    // localTime (2 stages) + isCapital (1) + flagColors (3) + currency (2 stages) + phoneCode (1) = 9.
    expect(withoutCharade(PARIS) - withoutCharade(MARSEILLE)).toBe(9);
  });

  it('grows with the place’s own charade cost (more syllables, more possible clicks)', () => {
    const short: CluePlace = { ...NEW_YORK, name: 'Pau', code: 'FR' };
    const long: CluePlace = { ...NEW_YORK, name: 'Antananarivo', code: 'MG' };
    expect(totalRevealCount(long)).toBeGreaterThan(totalRevealCount(short));
  });

  it('counts one more when personality is curated for the place', () => {
    const without = totalRevealCount(PARIS);
    jest.mocked(personalityFor).mockReturnValue({ name: 'Quelqu’un', description: null });
    expect(totalRevealCount(PARIS)).toBe(without + 1);
  });

  it('counts two more (its 2 stages) when wordplay is curated for the place', () => {
    const without = totalRevealCount(PARIS);
    jest.mocked(wordplayFor).mockReturnValue({ sentence: 'un jeu de mot', explained: 'un +jeu+ de mot' });
    expect(totalRevealCount(PARIS)).toBe(without + 2);
  });
});

describe('maxScoreForRound', () => {
  it('rounds up to the next multiple of ten', () => {
    expect(maxScoreForRound(26)).toBe(30);
    expect(maxScoreForRound(21)).toBe(30);
    expect(maxScoreForRound(20)).toBe(20);
    expect(maxScoreForRound(1)).toBe(10);
  });
});

describe('remainingScore', () => {
  const maxScore = maxScoreForRound(totalRevealCount(PARIS));

  it('starts at the round maximum when nothing is revealed', () => {
    expect(remainingScore([], PARIS)).toBe(maxScore);
  });

  it('loses one point per revealed clue', () => {
    expect(remainingScore(['distance', 'elevation', 'distance'], PARIS)).toBe(maxScore - 3);
  });

  it('drops straight to 1 once the vowels are revealed', () => {
    expect(remainingScore(['vowels'], PARIS)).toBe(1);
    expect(remainingScore(['distance', 'vowels'], PARIS)).toBe(1);
  });

  it('keeps the lower plain countdown when it is already under 1', () => {
    const everything = Array<ClueId>(maxScore).fill('distance');
    expect(remainingScore([...everything, 'vowels'], PARIS)).toBe(0);
  });

  it('gives a citiesFr place a lower starting score than an equivalent capital/city', () => {
    expect(remainingScore([], MARSEILLE)).toBeLessThan(remainingScore([], PARIS));
  });
});

describe('randomCluePlace', () => {
  const difficulties: Difficulty[] = ['easy', 'intermediate', 'hard'];

  it.each(difficulties)('only returns places matching difficulty %s', (difficulty) => {
    for (let i = 0; i < 20; i += 1) {
      expect(randomCluePlace(difficulty, ['cities', 'capital'], 'fr').difficulty).toBe(difficulty);
    }
  });

  it('falls back to the full pool when the filtered pool is empty', () => {
    const place = randomCluePlace('does-not-exist' as Difficulty, ['cities', 'capital'], 'fr');
    expect(CLUE_PLACES).toContainEqual(place);
  });

  it('only draws capitals when "cities" is not selected', () => {
    for (let i = 0; i < 20; i += 1) {
      const place = randomCluePlace('easy', ['capital'], 'fr');
      expect(isCapitalPlace(place)).toBe(true);
    }
  });

  it('only draws non-capital cities when "capital" is not selected', () => {
    for (let i = 0; i < 20; i += 1) {
      const place = randomCluePlace('easy', ['cities'], 'fr');
      expect(isCapitalPlace(place)).toBe(false);
    }
  });

  it('only draws French cities when "citiesFr" is the only category selected', () => {
    for (let i = 0; i < 20; i += 1) {
      const place = randomCluePlace('easy', ['citiesFr'], 'fr');
      expect(isFrenchCityPlace(place)).toBe(true);
    }
  });

  it('never draws a French city when "citiesFr" is not selected', () => {
    for (let i = 0; i < 20; i += 1) {
      const place = randomCluePlace('easy', ['cities', 'capital'], 'fr');
      expect(isFrenchCityPlace(place)).toBe(false);
    }
  });

  it('in English, never draws an "easy" French place (a French easy place is bumped to intermediate)', () => {
    for (let i = 0; i < 20; i += 1) {
      const place = randomCluePlace('easy', ['cities', 'capital'], 'en');
      if (place.code === 'FR') expect(place.difficulty).not.toBe('easy');
    }
  });
});

describe('normalizePlaceGuess', () => {
  it('lowercases the value', () => {
    expect(normalizePlaceGuess('PARIS')).toBe('paris');
  });

  it('strips accents', () => {
    expect(normalizePlaceGuess('São Paulo')).toBe('saopaulo');
  });

  it('drops spaces and punctuation entirely, not just collapses them', () => {
    expect(normalizePlaceGuess("  Côte d'Ivoire! ")).toBe('cotedivoire');
  });

  it('treats equivalent spellings as equal', () => {
    expect(normalizePlaceGuess('Rio de Janeiro')).toBe(normalizePlaceGuess('  rio   DE Janeiro  '));
  });

  it('treats any accented letter as its unaccented base letter (é=e, ń=n...), not just the common ones', () => {
    expect(normalizePlaceGuess('Gdańsk')).toBe('gdansk');
    expect(normalizePlaceGuess('École')).toBe(normalizePlaceGuess('Ecole'));
  });

  it('treats an apostrophe, a space, and no separator at all as equal', () => {
    const withApostrophe = normalizePlaceGuess("N'Djamena");
    expect(normalizePlaceGuess('N Djamena')).toBe(withApostrophe);
    expect(normalizePlaceGuess('Ndjamena')).toBe(withApostrophe);
  });
});

describe('skeletonLetterCount', () => {
  it('sums the letter slots across every word', () => {
    const groups = nameSkeleton('Rio de Janeiro', { groupByWord: true, lengthKnown: true });
    expect(skeletonLetterCount(groups)).toBe(12);
  });

  it('is 0 for an empty skeleton', () => {
    expect(skeletonLetterCount([])).toBe(0);
  });

  it('does not count a hyphen as a letter', () => {
    const groups = nameSkeleton('Abu-Dhabi', { groupByWord: true, lengthKnown: true });
    expect(skeletonLetterCount(groups)).toBe(8);
  });
});

describe('overlayTypedLetters', () => {
  it('fills each slot with the typed letter at its position, ignoring spaces/punctuation typed', () => {
    const groups = nameSkeleton('Rio de Janeiro', { groupByWord: true, lengthKnown: true });
    expect(overlayTypedLetters(groups, 'Rio de Jan')).toEqual([
      ['R', 'I', 'O'],
      ['D', 'E'],
      ['J', 'A', 'N', null, null, null, null],
    ]);
  });

  it('falls back to the clue-revealed letter (or blank) once past what has been typed', () => {
    const groups = nameSkeleton('Paris', { groupByWord: true, lengthKnown: true });
    expect(overlayTypedLetters(groups, 'Pa')).toEqual([['P', 'A', null, null, null]]);
  });

  it('keeps a hyphen in place and does not consume a typed letter for it', () => {
    const groups = nameSkeleton('Abu-Dhabi', { groupByWord: true, lengthKnown: true });
    expect(overlayTypedLetters(groups, 'abudh')).toEqual([['A', 'B', 'U', '-', 'D', 'H', null, null, null]]);
  });

  it('an empty guess leaves the skeleton untouched', () => {
    const groups = nameSkeleton('Paris', { groupByWord: true, lengthKnown: true });
    expect(overlayTypedLetters(groups, '')).toEqual(groups);
  });
});

describe('typedSkeleton', () => {
  it('is empty for an empty (or blank) text', () => {
    expect(typedSkeleton('')).toEqual([]);
    expect(typedSkeleton('   ')).toEqual([]);
  });

  it('boxes every typed character, uppercased, one group per space-separated word', () => {
    expect(typedSkeleton('rio de')).toEqual([
      ['R', 'I', 'O'],
      ['D', 'E'],
    ]);
  });

  it('keeps a hyphen in place, not a letter box', () => {
    expect(typedSkeleton('abu-dhabi')).toEqual([['A', 'B', 'U', '-', 'D', 'H', 'A', 'B', 'I']]);
  });
});
