import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlaceDoc } from '@/data/firestore/types';

const h = vi.hoisted(() => ({
  state: { places: {} as Record<string, unknown> },
  applyPlaceChange: undefined as unknown as (key: string, value: unknown) => Promise<void>,
}));

vi.mock('../../data', () => ({
  data: () => h.state,
  applyPlaceChange: (key: string, value: unknown) => h.applyPlaceChange(key, value),
}));

import { deletePlace, fetchPlaces, saveCompass, saveDifficulty, type PlaceRow } from '../places';

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
  country: '',
  coordinates: { latitude: 0, longitude: 0 },
  compass: null,
});

beforeEach(() => {
  h.state.places = {};
  h.applyPlaceChange = vi.fn(async () => {});
});

describe('fetchPlaces', () => {
  it('lists the places sorted by name, with the Compass data when present', async () => {
    h.state.places = {
      zur: place({ name: 'Zurich' }),
      par: place({ compass: { category: 'capital' }, country: { fr: 'France' } as PlaceDoc['country'] }),
      ams: place({ name: 'Amsterdam', compass: { category: 'cities', description: 'canals' } }),
    };

    const rows = await fetchPlaces();

    expect(rows.map((each) => each.key)).toEqual(['ams', 'par', 'zur']);
    expect(rows[0]).toMatchObject({
      name: 'Amsterdam',
      code: 'FR',
      // Sans copie du pays : le code tient lieu de nom.
      country: 'FR',
      coordinates: { latitude: 48.8, longitude: 2.3 },
      compass: { category: 'cities', description: 'canals' },
        });
    expect(rows[1].country).toBe('France');
    expect(rows[1].compass).not.toBeNull();
    expect(rows[2]).toMatchObject({ compass: null });
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

describe('saveDifficulty', () => {
  it('changes the difficulty of the place and returns the new Compass data', async () => {
    h.state.places = { par: place({ compass: { category: 'capital' } }) };

    const result = await saveDifficulty(row('par'), 'hard');

    expect(h.applyPlaceChange).toHaveBeenCalledWith(
      'par',
      place({ difficulty: 'hard', compass: { category: 'capital' } }),
    );
    expect(result).toMatchObject({ category: 'capital', difficulty: 'hard' });
  });
});

describe('deletePlace', () => {
  it('asks applyPlaceChange to delete the place', async () => {
    await deletePlace(row('par'));

    expect(h.applyPlaceChange).toHaveBeenCalledWith('par', null);
  });
});
