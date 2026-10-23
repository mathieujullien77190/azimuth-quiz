import { compassFromDoc } from '../read';
import type { PlaceDoc } from '../types';

const paris: PlaceDoc = {
  name: 'Paris',
  code: 'FR',
  latitude: 48.8566,
  longitude: 2.3522,
  difficulty: 'easy',
  country: {
    fr: 'France',
    en: 'France',
  },
  compass: { category: 'capital', description: 'Ville lumière.', wikiFr: 'Paris', wikiEn: 'Paris' },
};

describe('compassFromDoc', () => {
  it('builds the place with the copy of its country, the description and the wiki links', () => {
    expect(compassFromDoc({ ...paris, compass: paris.compass! })).toEqual({
      name: 'Paris',
      code: 'FR',
      country: { fr: 'France', en: 'France' },
      category: 'capital',
      difficulty: 'easy',
      coordinates: { latitude: 48.8566, longitude: 2.3522 },
      description: 'Ville lumière.',
      wikiFr: 'Paris',
      wikiEn: 'Paris',
    });
  });

  it('carries the place key when it is given', () => {
    expect(compassFromDoc({ ...paris, compass: paris.compass! }, 'par')).toHaveProperty('key', 'par');
  });

  it('leaves out what the document does not have', () => {
    const bare = compassFromDoc({ ...paris, country: undefined, compass: { category: 'cities' } });

    expect(bare).not.toHaveProperty('key');
    expect(bare).not.toHaveProperty('country');
    expect(bare).not.toHaveProperty('description');
    expect(bare).not.toHaveProperty('wikiFr');
    expect(bare).not.toHaveProperty('wikiEn');
  });
});
