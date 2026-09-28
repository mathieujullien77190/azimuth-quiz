import {
  decodeCompassPlace,
  decodeCompassPlaces,
  decodeCluePlace,
  decodeCluePlaces,
  type CompassRow,
  type CommonRow,
  type ClueRow,
  type MergedPlaces,
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

describe('decodeCompassPlaces / decodeCluePlaces', () => {
  const entries: MergedPlaces = [
    [['Testville', 'FR', 1.5, -2.5, 'E'], ['C', null, null, null], null],
    [['Otherville', 'DE', 3, 4, 'H'], null, ['n', 1000, '☀️', 10, 'gb', 'BER', '🏰', '🎡', '🍺']],
  ];

  it('decodeCompassPlaces skips entries with no compass row', () => {
    const places = decodeCompassPlaces(entries);
    expect(places).toHaveLength(1);
    expect(places[0].name).toBe('Testville');
  });

  it('decodeCluePlaces skips entries with no clues row', () => {
    const places = decodeCluePlaces(entries);
    expect(places).toHaveLength(1);
    expect(places[0].name).toBe('Otherville');
  });
});

describe('decodeCluePlace', () => {
  const common: CommonRow = ['Testville', 'FR', 1.5, -2.5, 'E'];
  const row: ClueRow = ['ne', 12345, '☀️', 42, 'gw', 'TST', '🗼', '🎨', '🌳'];

  it('maps a common row + clues row to an CluePlace, deriving the country name, timezone, phone code and currency from the country code', () => {
    expect(decodeCluePlace(common, row)).toEqual({
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
    });
  });

  it('passes an unmapped timezone through as-is', () => {
    const unmappedRow: ClueRow = [...row.slice(0, 4), 'Europe/Nowhere', ...row.slice(5)] as unknown as ClueRow;
    const place = decodeCluePlace(common, unmappedRow);
    expect(place.timezone).toBe('Europe/Nowhere');
  });

  it('falls back to an empty phone code and currency for an unknown country', () => {
    const unknownCommon: CommonRow = ['Testville', 'XX', 1.5, -2.5, 'E'];
    const place = decodeCluePlace(unknownCommon, row);
    expect(place.phoneCode).toBe('');
    expect(place.currency).toBe('');
  });
});
