import { syllabify } from './syllabify';

describe('syllabify', () => {
  it('splits on the V-CV rule: one consonant between two vowels joins the next syllable', () => {
    expect(syllabify('Paris')).toEqual(['Pa', 'ris']);
    expect(syllabify('Nice')).toEqual(['Ni', 'ce']);
  });

  it('splits on the VC-CV rule: two consonants between two vowels split between them', () => {
    expect(syllabify('Bordeaux')).toEqual(['Bor', 'deaux']);
    expect(syllabify('Montpellier')).toEqual(['Mont', 'pel', 'lier']);
  });

  it('reads a run of vowel letters as one vowel sound (digraphs/trigraphs fall out for free)', () => {
    expect(syllabify('Toulouse')).toEqual(['Tou', 'lou', 'se']);
    expect(syllabify('Bordeaux')[1]).toBe('deaux');
  });

  it('folds a nasal n/m into the vowel it nasalizes, when followed by another consonant', () => {
    expect(syllabify('Nantes')).toEqual(['Nan', 'tes']);
    expect(syllabify('Montpellier')[0]).toBe('Mont');
  });

  it('does not nasalize a doubled n/m: it stays an ordinary double consonant', () => {
    expect(syllabify('Cannes')).toEqual(['Can', 'nes']);
  });

  it('keeps a run with no following consonant/end-of-word from nasalizing (only n/m before a consonant or the end)', () => {
    // "Avignon": the first "n" of "vignon" is followed by a vowel (o), so it stays a plain
    // consonant rather than folding into the "i" before it.
    expect(syllabify('Avignon')).toEqual(['A', 'vig', 'non']);
  });

  it('splits each word of a multi-word name on its own, never merging across the boundary', () => {
    expect(syllabify('Le Havre')).toEqual(['Le', 'Hav', 're']);
    expect(syllabify('Clermont-Ferrand')).toEqual(['Cler', 'mont', 'Fer', 'rand']);
  });

  it('treats an apostrophe as a word boundary too, like a hyphen', () => {
    expect(syllabify('N’Djamena')).toEqual(['N', 'Dja', 'me', 'na']);
    expect(syllabify("N'Djamena")).toEqual(['N', 'Dja', 'me', 'na']);
  });

  it('keeps a word with no vowel at all as one whole "syllable", never empty', () => {
    expect(syllabify('Y')).toEqual(['Y']);
  });

  it('falls back to the whole name when it is only separators (no word at all)', () => {
    expect(syllabify('---')).toEqual(['---']);
  });

  it('never returns an empty list for a non-blank name', () => {
    for (const name of ['Metz', 'Caen', 'Reims', 'Brest', 'Tours']) {
      expect(syllabify(name).length).toBeGreaterThan(0);
    }
  });

  it('preserves the original casing of each syllable', () => {
    expect(syllabify('BORDEAUX')).toEqual(['BOR', 'DEAUX']);
  });
});
