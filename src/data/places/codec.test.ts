jest.mock('./places.json', () => ({
  tv1: ['Testville', 'FR', 1.5, -2.5, 'E'],
  ov1: ['Otherville', 'DE', 3, 4, 'H'],
  nc1: ['Nocharadeville', 'BE', 5, 6, 'I'],
}));
jest.mock('./compassPlaces.json', () => ({
  tv1: ['C', null, null, null],
}));
jest.mock('./cluesPlaces.json', () => ({
  ov1: ['n', 1000, '☀️', 10, 'gb', 'BER', '🏰', '🎡', '🍺'],
  nc1: ['n', 1000, '☀️', 10, 'gb', 'BER', '🏰', '🎡', '🍺'],
}));
jest.mock('./charadePlaces.json', () => ({
  ov1: ['o', 'ther', 'ville'],
}));
jest.mock('./personalityPlaces.json', () => ({
  ov1: ['Quelqu’un', 'foo'],
}));
jest.mock('../personalityJobs.json', () => ({
  foo: ['footballeur', 'footballer'],
}));

// eslint-disable-next-line import/first
import {
  decodeAllPlaces,
  decodeCompassPlace,
  decodeCompassPlaces,
  decodeCluePlace,
  decodeCluePlaces,
  type CompassRow,
  type CommonRow,
  type ClueRow,
} from './codec';

describe('decodeCompassPlace', () => {
  const common: CommonRow = ['Testville', 'FR', 1.5, -2.5, 'E'];
  const row: CompassRow = ['C', 'Une anecdote.', 'Testville_fr', 'Testville_en'];

  it('maps a common row + compass row to a Place', () => {
    expect(decodeCompassPlace(common, row)).toEqual({
      name: 'Testville',
      code: 'FR',
      category: 'cities',
      difficulty: 'easy',
      coordinates: { latitude: 1.5, longitude: -2.5 },
      description: 'Une anecdote.',
      wikiFr: 'Testville_fr',
      wikiEn: 'Testville_en',
    });
  });

  it('omits optional fields when null', () => {
    const bareRow: CompassRow = ['M', null, null, null];
    const place = decodeCompassPlace(common, bareRow);
    expect(place.description).toBeUndefined();
    expect(place.wikiFr).toBeUndefined();
    expect(place.wikiEn).toBeUndefined();
  });
});

describe('decodeCluePlace', () => {
  const common: CommonRow = ['Testville', 'FR', 1.5, -2.5, 'E'];
  const row: ClueRow = ['ne', 12345, '☀️', 42, 'gw', 'TST', '🗼', '🎨', '🌳'];

  it('maps a common row + clues row + syllables to an CluePlace, deriving the country name, timezone, phone code and currency from the country code', () => {
    expect(decodeCluePlace('tst', common, row, ['test', 'ville'])).toEqual({
      key: 'tst',
      name: 'Testville',
      code: 'FR',
      country: 'France',
      coordinates: { latitude: 1.5, longitude: -2.5 },
      difficulty: 'easy',
      positionInCountry: 'ne',
      population: 12345,
      climateEmoji: '☀️',
      elevationMeters: 42,
      timezone: 'Europe/Paris',
      phoneCode: '+33',
      currency: '€',
      airportCode: 'TST',
      emojis: ['🗼', '🎨', '🌳'],
      syllables: ['test', 'ville'],
    });
  });

  it('passes an unmapped timezone through as-is', () => {
    const unmappedRow: ClueRow = [...row.slice(0, 4), 'Europe/Nowhere', ...row.slice(5)] as unknown as ClueRow;
    const place = decodeCluePlace('tst', common, unmappedRow, []);
    expect(place.timezone).toBe('Europe/Nowhere');
  });

  it('falls back to an empty phone code and currency for an unknown country', () => {
    const unknownCommon: CommonRow = ['Testville', 'XX', 1.5, -2.5, 'E'];
    const place = decodeCluePlace('tst', unknownCommon, row, []);
    expect(place.phoneCode).toBe('');
    expect(place.currency).toBe('');
  });

  it('includes the curated personality when one is passed, resolving the job code to its French text', () => {
    const place = decodeCluePlace('tst', common, row, [], ['Quelqu’un', 'foo']);
    expect(place.personality).toEqual({ name: 'Quelqu’un', description: 'footballeur' });
  });

  it('keeps a null job code as a null description', () => {
    const place = decodeCluePlace('tst', common, row, [], ['Quelqu’un', null]);
    expect(place.personality).toEqual({ name: 'Quelqu’un', description: null });
  });

  it('omits personality when none is passed', () => {
    const place = decodeCluePlace('tst', common, row, []);
    expect(place.personality).toBeUndefined();
  });
});

describe('decodeAllPlaces / decodeCompassPlaces / decodeCluePlaces', () => {
  // Joins the 5 mocked files above by key: "tv1" (Testville) has a common+compass row only, "ov1"
  // (Otherville) has common+clues+charade+personality but no compass row, "nc1"
  // (Nocharadeville) has common+clues but no charade/personality entry at all.
  it('decodeAllPlaces joins every file by key, compass/clues null when the place has no row there', () => {
    const rows = decodeAllPlaces();
    expect(rows[0]).toEqual({
      key: 'tv1',
      common: ['Testville', 'FR', 1.5, -2.5, 'E'],
      compass: expect.objectContaining({ name: 'Testville' }),
      clues: null,
    });
    expect(rows[1]).toEqual({
      key: 'ov1',
      common: ['Otherville', 'DE', 3, 4, 'H'],
      compass: null,
      clues: expect.objectContaining({ key: 'ov1', name: 'Otherville' }),
    });
  });

  it('defaults to no syllables when a clue place has no entry in charadePlaces.json', () => {
    const rows = decodeAllPlaces();
    const nocharade = rows.find((row) => row.key === 'nc1');
    expect(nocharade?.clues?.syllables).toEqual([]);
  });

  it('decodeCompassPlaces skips keys with no compass row', () => {
    const places = decodeCompassPlaces();
    expect(places).toHaveLength(1);
    expect(places[0].name).toBe('Testville');
  });

  it('decodeCluePlaces skips keys with no clues row, and joins in charade/personality by the same key', () => {
    const places = decodeCluePlaces();
    expect(places).toHaveLength(2);
    // "footballeur" is the resolved French text, not the raw "foo" job code from personalityPlaces.json.
    expect(places.find((p) => p.name === 'Otherville')).toMatchObject({
      syllables: ['o', 'ther', 'ville'],
      personality: { name: 'Quelqu’un', description: 'footballeur' },
    });
  });
});
