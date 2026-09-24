import { decodeIndicesPlaces, type MergedPlaces } from '@/constants/places/codec';
import placesData from '@/constants/places/places.json';
import type { IndicesAnswerMethod, IndicesClueId, IndicesPlace, IndicesSettings } from '@/types';

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

export const INDICES_ANSWER_METHODS: { id: IndicesAnswerMethod }[] = [{ id: 'spoken' }, { id: 'typed' }];

export const DEFAULT_INDICES_SETTINGS: IndicesSettings = {
  playerNames: [''],
  difficulty: 'easy',
  answerMethod: 'spoken',
  rounds: 5,
  startWithFirstLetter: false,
};
