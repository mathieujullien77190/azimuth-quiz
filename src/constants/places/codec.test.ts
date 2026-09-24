import {
  decodeBoussolePlace,
  decodeIndicesPlace,
  encodeBoussoleRow,
  encodeIndicesRow,
  type BoussoleRow,
  type CommonRow,
  type IndicesRow,
} from './codec';

describe('decodeBoussolePlace / encodeBoussoleRow', () => {
  const common: CommonRow = ['Testville', 'FR', 1.5, -2.5];
  const row: BoussoleRow = ['C', 'E', 'Une anecdote.', 'Testville_fr', 'Testville_en'];

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
    const bareRow: BoussoleRow = ['M', 'H', null, null, null];
    const place = decodeBoussolePlace(common, bareRow);
    expect(place.description).toBeUndefined();
    expect(place.wikiFr).toBeUndefined();
    expect(place.wikiEn).toBeUndefined();
  });
});

describe('decodeIndicesPlace / encodeIndicesRow', () => {
  const common: CommonRow = ['Testville', 'FR', 1.5, -2.5];
  const row: IndicesRow = ['E', 'ne', 12345, '☀️', 42, 'gw', 'TST', '🗼', '🎨', '🌳'];

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
    const unmappedRow: IndicesRow = [...row.slice(0, 5), 'Europe/Nowhere', ...row.slice(6)] as unknown as IndicesRow;
    const place = decodeIndicesPlace(common, unmappedRow);
    expect(place.timezone).toBe('Europe/Nowhere');
    expect(encodeIndicesRow(place)).toEqual(unmappedRow);
  });
});
