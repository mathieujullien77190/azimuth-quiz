import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CluesDoc, PlaceDoc } from '@/data/firestore/types';

const h = vi.hoisted(() => ({
  state: { places: {} as Record<string, unknown> },
  applyPlaceChange: undefined as unknown as (key: string, value: unknown) => Promise<void>,
  putPlace: undefined as unknown as (key: string, value: unknown) => Promise<void>,
}));

vi.mock('../data', () => ({
  data: () => h.state,
  applyPlaceChange: (key: string, value: unknown) => h.applyPlaceChange(key, value),
  putPlace: (key: string, value: unknown) => h.putPlace(key, value),
}));

import { cluePlaces, deletePlace, fetchPlaces, saveClues, saveCompass, saveDifficulty, type PlaceRow } from './places';

const cluesDoc = (overrides: Partial<CluesDoc> = {}): CluesDoc => ({
  positionInCountry: 'center',
  population: 100,
  climateEmoji: 'x',
  elevationMeters: 35,
  timezone: 'Europe/Paris',
  airportCode: 'CDG',
  emojis: ['a'],
  syllables: ['pa', 'ris'],
  ...overrides,
});

const place = (overrides: Partial<PlaceDoc> = {}): PlaceDoc => ({
  name: 'Paris',
  code: 'FR',
  latitude: 48.8,
  longitude: 2.3,
  difficulty: 'easy',
  ...overrides,
});

const row = (key: string): PlaceRow => ({
  key,
  name: '',
  code: '',
  coordinates: { latitude: 0, longitude: 0 },
  compass: null,
  clues: null,
});

beforeEach(() => {
  h.state.places = {};
  h.applyPlaceChange = vi.fn(async () => {});
  h.putPlace = vi.fn(async () => {});
});

describe('fetchPlaces', () => {
  it('lists the places sorted by name, with the data of each game when present', async () => {
    h.state.places = {
      zur: place({ name: 'Zurich' }),
      par: place({ compass: { category: 'capital' }, clues: cluesDoc() }),
      ams: place({ name: 'Amsterdam', compass: { category: 'cities', description: 'canals' } }),
    };

    const rows = await fetchPlaces();

    expect(rows.map((each) => each.key)).toEqual(['ams', 'par', 'zur']);
    expect(rows[0]).toMatchObject({
      name: 'Amsterdam',
      code: 'FR',
      coordinates: { latitude: 48.8, longitude: 2.3 },
      compass: { category: 'cities', description: 'canals' },
      clues: null,
    });
    expect(rows[1].compass).not.toBeNull();
    expect(rows[1].clues).toMatchObject({ key: 'par', syllables: ['pa', 'ris'] });
    expect(rows[2]).toMatchObject({ compass: null, clues: null });
  });
});

describe('cluePlaces', () => {
  it('lists only the places that have Clues data', () => {
    h.state.places = { par: place({ clues: cluesDoc() }), ams: place({ name: 'Amsterdam' }) };

    expect(cluePlaces().map((each) => each.key)).toEqual(['par']);
  });
});

describe('saveCompass', () => {
  it('applies the patch through applyPlaceChange and returns the new Compass data', async () => {
    h.state.places = { par: place({ compass: { category: 'capital', description: 'old' } }) };

    const compass = await saveCompass(row('par'), { category: 'cities', description: 'new' });

    expect(h.applyPlaceChange).toHaveBeenCalledWith(
      'par',
      place({ compass: { category: 'cities', description: 'new' } }),
    );
    expect(compass).toMatchObject({ category: 'cities', description: 'new' });
  });

  it('drops an empty description', async () => {
    h.state.places = { par: place({ compass: { category: 'capital', description: 'old' } }) };

    await saveCompass(row('par'), { description: '' });

    expect(h.applyPlaceChange).toHaveBeenCalledWith('par', place({ compass: { category: 'capital' } }));
  });
});

describe('saveClues', () => {
  it('writes the patched Clues data, copying the emojis', async () => {
    h.state.places = { par: place({ clues: cluesDoc() }) };
    const emojis: [string, string, string] = ['b', 'c', 'd'];

    const clues = await saveClues(row('par'), { population: 5, emojis });

    const written = (h.putPlace as ReturnType<typeof vi.fn>).mock.calls[0][1] as PlaceDoc;
    expect(written.clues).toMatchObject({ population: 5, emojis: ['b', 'c', 'd'] });
    expect(written.clues!.emojis).not.toBe(emojis);
    expect(clues).toMatchObject({ key: 'par', population: 5 });
  });

  it('keeps the existing emojis when the patch has none', async () => {
    h.state.places = { par: place({ clues: cluesDoc() }) };

    await saveClues(row('par'), { climateEmoji: 'y' });

    const written = (h.putPlace as ReturnType<typeof vi.fn>).mock.calls[0][1] as PlaceDoc;
    expect(written.clues).toMatchObject({ climateEmoji: 'y', emojis: ['a'] });
  });
});

describe('saveDifficulty', () => {
  it('changes the difficulty of the place and returns the data of both games', async () => {
    h.state.places = { par: place({ compass: { category: 'capital' } }) };

    const result = await saveDifficulty(row('par'), 'hard');

    expect(h.applyPlaceChange).toHaveBeenCalledWith(
      'par',
      place({ difficulty: 'hard', compass: { category: 'capital' } }),
    );
    expect(result.compass).not.toBeNull();
    expect(result.clues).toBeNull();
  });
});

describe('deletePlace', () => {
  it('asks applyPlaceChange to delete the place', async () => {
    await deletePlace(row('par'));

    expect(h.applyPlaceChange).toHaveBeenCalledWith('par', null);
  });
});
