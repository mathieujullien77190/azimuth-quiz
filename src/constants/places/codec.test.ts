import {
  decodeBoussolePlace,
  decodeBoussolePlaces,
  decodeIndicesPlace,
  decodeIndicesPlaces,
  encodeBoussoleRow,
  encodeCommonRow,
  encodeIndicesRow,
  serializeMergedPlaces,
  type BoussoleRow,
  type CommonRow,
  type IndicesRow,
  type MergedPlaces,
} from './codec';

describe('serializeMergedPlaces', () => {
  it('prints one entry per line, matching the source JSON shape', () => {
    const entries: MergedPlaces = [
      [['Testville', 'FR', 1.5, -2.5, 'E'], ['C', null, null, null], null],
      [['Otherville', 'DE', 3, 4, 'H'], null, ['n', 1000, '☀️', 10, 'gb', 'BER', '🏰', '🎡', '🍺']],
    ];
    expect(serializeMergedPlaces(entries)).toBe(
      '[\n' +
        '  ' +
        JSON.stringify(entries[0]) +
        ',\n' +
        '  ' +
        JSON.stringify(entries[1]) +
        '\n]\n',
    );
  });
});

describe('encodeCommonRow', () => {
  it('replaces only the difficulty code, keeping name/code/coordinates', () => {
    const common: CommonRow = ['Testville', 'FR', 1.5, -2.5, 'E'];
    expect(encodeCommonRow(common, 'hard')).toEqual(['Testville', 'FR', 1.5, -2.5, 'H']);
  });
});

describe('decodeBoussolePlace / encodeBoussoleRow', () => {
  const common: CommonRow = ['Testville', 'FR', 1.5, -2.5, 'E'];
  const row: BoussoleRow = ['C', 'Une anecdote.', 'Testville_fr', 'Testville_en'];

  it('maps a common row + boussole row to a Place', () => {
    expect(decodeBoussolePlace(common, row)).toEqual({
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

  it('round-trips through encodeBoussoleRow', () => {
    const place = decodeBoussolePlace(common, row);
    expect(encodeBoussoleRow(place)).toEqual(row);
  });

  it('omits optional fields when null', () => {
    const bareRow: BoussoleRow = ['M', null, null, null];
    const place = decodeBoussolePlace(common, bareRow);
    expect(place.description).toBeUndefined();
    expect(place.wikiFr).toBeUndefined();
    expect(place.wikiEn).toBeUndefined();
  });

  it('encodeBoussoleRow turns missing optional fields into null', () => {
    const place = decodeBoussolePlace(common, ['M', null, null, null]);
    expect(encodeBoussoleRow(place)).toEqual(['M', null, null, null]);
  });
});

describe('decodeBoussolePlaces / decodeIndicesPlaces', () => {
  const entries: MergedPlaces = [
    [['Testville', 'FR', 1.5, -2.5, 'E'], ['C', null, null, null], null],
    [['Otherville', 'DE', 3, 4, 'H'], null, ['n', 1000, '☀️', 10, 'gb', 'BER', '🏰', '🎡', '🍺']],
  ];

  it('decodeBoussolePlaces skips entries with no boussole row', () => {
    const places = decodeBoussolePlaces(entries);
    expect(places).toHaveLength(1);
    expect(places[0].name).toBe('Testville');
  });

  it('decodeIndicesPlaces skips entries with no indices row', () => {
    const places = decodeIndicesPlaces(entries);
    expect(places).toHaveLength(1);
    expect(places[0].name).toBe('Otherville');
  });
});

describe('decodeIndicesPlace / encodeIndicesRow', () => {
  const common: CommonRow = ['Testville', 'FR', 1.5, -2.5, 'E'];
  const row: IndicesRow = ['ne', 12345, '☀️', 42, 'gw', 'TST', '🗼', '🎨', '🌳'];

  it('maps a common row + indices row to an IndicesPlace, deriving the country name, timezone, phone code and currency from the country code', () => {
    expect(decodeIndicesPlace(common, row)).toEqual({
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

  it('round-trips through encodeIndicesRow', () => {
    const place = decodeIndicesPlace(common, row);
    expect(encodeIndicesRow(place)).toEqual(row);
  });

  it('passes an unmapped timezone through as-is, both ways', () => {
    const unmappedRow: IndicesRow = [...row.slice(0, 4), 'Europe/Nowhere', ...row.slice(5)] as unknown as IndicesRow;
    const place = decodeIndicesPlace(common, unmappedRow);
    expect(place.timezone).toBe('Europe/Nowhere');
    expect(encodeIndicesRow(place)).toEqual(unmappedRow);
  });

  it('falls back to an empty phone code and currency for an unknown country', () => {
    const unknownCommon: CommonRow = ['Testville', 'XX', 1.5, -2.5, 'E'];
    const place = decodeIndicesPlace(unknownCommon, row);
    expect(place.phoneCode).toBe('');
    expect(place.currency).toBe('');
  });
});
