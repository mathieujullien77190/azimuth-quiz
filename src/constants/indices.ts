import { decodeBoussolePlaces, decodeIndicesPlaces, type MergedPlaces } from '@/constants/places/codec';
import placesData from '@/constants/places/places.json';
import type { IndicesAnswerMethod, IndicesCategory, IndicesClueId, IndicesPlace, IndicesSettings } from '@/types';

// Indices game: dedicated places, unrelated to constants/places/ (Boussole) except that the
// starting data (name/country/coordinates/difficulty) was imported from CITIES over there, then
// augmented here with fields specific to Indices (position, population, climate, elevation,
// timezone). Flag colors, country name and the currency's generic name are shared
// with Boussole (see constants/places/countries.ts): a country has only one flag and one
// currency, that's nothing Indices-specific.

/**
 * Each Indices place is rebuilt from `places.json`, the source shared with Boussole (see
 * `src/constants/places/codec.ts`): `decodeIndicesPlaces` pairs each common place with its
 * Indices-specific fields (population, climate, elevation...). The two place pools stay
 * independent (different curation, size and criteria), only the identity (name/country/coordinates)
 * and — for places present in both games — the raw fields are shared.
 */
export const INDICES_PLACES: IndicesPlace[] = decodeIndicesPlaces(placesData as unknown as MergedPlaces);

// Display order in the grid: from easiest (highest cost, at the top) to hardest (cost
// 1, purple, at the bottom). Every round now shows all clues (no more subset):
// so this order is the full display order, not just a visual sort of a partial draw.
export const INDICES_CLUE_ORDER: IndicesClueId[] = [
  'population',
  'localTime',
  'firstLetter',
  'isCapital',
  'bearing',
  'distance',
  'letterCount',
  'wordCount',
  'climate',
  'emoji',
  'flagColors',
  'position',
  'elevation',
  'airportCode',
  'currency',
  'phoneCode',
];

// "Is this a capital?" isn't Indices' own data: it's Boussole's "capital" category (see
// constants/places/codec.ts), which only exists on places in the Boussole pool. Cross-referenced
// here by (name, country code) rather than duplicated as its own field on every Indices place.
const CAPITAL_KEYS = new Set(
  decodeBoussolePlaces(placesData as unknown as MergedPlaces)
    .filter((place) => place.category === 'capital')
    .map((place) => `${place.name}|${place.code}`),
);

export const isCapitalPlace = (place: Pick<IndicesPlace, 'name' | 'code'>): boolean => CAPITAL_KEYS.has(`${place.name}|${place.code}`);

// Reuses Boussole's category id/emoji/label conventions (see constants/index.ts and
// i18n's setup.categories) rather than duplicating them — only these 2 of the 6 Boussole
// categories apply to Indices, since its whole pool is cities.
export const INDICES_CATEGORIES: { id: IndicesCategory; emoji: string }[] = [
  { id: 'cities', emoji: '🏙️' },
  { id: 'capital', emoji: '⭐' },
];

export const INDICES_ANSWER_METHODS: { id: IndicesAnswerMethod }[] = [{ id: 'spoken' }, { id: 'typed' }];

export const DEFAULT_INDICES_SETTINGS: IndicesSettings = {
  playerNames: [''],
  difficulty: 'easy',
  categories: ['cities', 'capital'],
  answerMethod: 'spoken',
  rounds: 5,
  startWithFirstLetter: true,
};
