import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlaceDoc } from '@/data/firestore/types';

const h = vi.hoisted(() => ({
  state: { places: {} as Record<string, unknown> },
  putPlace: undefined as unknown as (key: string, value: unknown) => Promise<void>,
}));

vi.mock('../data', () => ({
  data: () => h.state,
  putPlace: (key: string, value: unknown) => h.putPlace(key, value),
}));

import { saveWordplayDifficulty, saveWordplaySentence, wordplayEntryFor } from './wordplay';

const place = (overrides: Partial<PlaceDoc> = {}): PlaceDoc => ({
  name: 'Paris',
  code: 'FR',
  latitude: 0,
  longitude: 0,
  difficulty: 'easy',
  ...overrides,
});

const ref = { key: 'par', name: 'Paris', code: 'FR' };

beforeEach(() => {
  h.state.places = { par: place() };
  h.putPlace = vi.fn(async () => {});
});

describe('wordplayEntryFor', () => {
  it('starts with an empty intermediate entry', () => {
    expect(wordplayEntryFor(ref)).toEqual({ sentence: '', difficulty: 'intermediate' });
  });

  it('returns the curated entry', () => {
    h.state.places = { par: place({ wordplay: { sentence: 'Paris sportif', difficulty: 'hard' } }) };

    expect(wordplayEntryFor(ref)).toEqual({ sentence: 'Paris sportif', difficulty: 'hard' });
  });
});

describe('saveWordplaySentence', () => {
  it('writes the trimmed sentence on the place and returns the entry', async () => {
    const entry = { sentence: '', difficulty: 'easy' as const };

    const updated = await saveWordplaySentence(ref, entry, '  Paris sportif ');

    expect(updated).toEqual({ sentence: 'Paris sportif', difficulty: 'easy' });
    expect(h.putPlace).toHaveBeenCalledWith('par', place({ wordplay: updated }));
  });
});

describe('saveWordplayDifficulty', () => {
  it('writes the new difficulty and keeps the sentence', async () => {
    const entry = { sentence: 'Paris sportif', difficulty: 'easy' as const };

    const updated = await saveWordplayDifficulty(ref, entry, 'hard');

    expect(updated).toEqual({ sentence: 'Paris sportif', difficulty: 'hard' });
    expect(h.putPlace).toHaveBeenCalledWith('par', place({ wordplay: updated }));
  });
});
