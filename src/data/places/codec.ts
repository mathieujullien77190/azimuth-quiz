import type { Category, Difficulty, CluePlace, CluePositionInCountry, Place } from '@/types';

import charadePlacesData from './charadePlaces.json';
import { countryName, countryPhoneCode, countryCurrencySymbol } from './countries';
import cluesPlacesData from './cluesPlaces.json';
import compassPlacesData from './compassPlaces.json';
import personalityPlacesData from './personalityPlaces.json';
import placesData from './places.json';

/**
 * Every place lives across 5 small files, all objects keyed by the SAME short code (3 letters,
 * first-3-letters of the name by default — collisions resolved by priority: `capital` places
 * keep the natural prefix first, then `citiesFr`, then `cities`, then everything else; whoever
 * loses it falls back to the first free 3-letter combo in alphabetical order — assigned once,
 * permanently, never reassigned on a later regeneration, same append-only spirit as
 * `TIMEZONE_CODES` below):
 * - `places.json`: the common identity (name, code, coordinates, difficulty — shared by both
 *   games), `{ key: CommonRow }`. Every place has one.
 * - `compassPlaces.json` (`{ key: CompassRow }`) / `cluesPlaces.json` (`{ key: ClueRow }`):
 *   each game's own data, present only for a key that's actually in that game's pool (a place
 *   can be in only one of the two).
 * - `charadePlaces.json` (`{ key: readonly string[] }`): the charade clue's syllable split,
 *   MANDATORY for every key in `cluesPlaces.json` (see `decodeCluePlace`'s own doc comment) —
 *   never computed at runtime.
 * - `personalityPlaces.json` (`{ key: readonly [name, description] }`): OPTIONAL, only the
 *   places with a curated personality.
 *
 * `decodeAllPlaces`/`decodeCompassPlaces`/`decodeCluePlaces` are the only place that joins these
 * 5 files back together: `src/data/places/index.ts`, `src/data/clues.ts` and
 * `admin/src/api/places.ts` all import from here rather than re-joining it themselves. A key is
 * opaque (e.g. `"par"` for Paris) — every place-editing log message names both the key AND the
 * human identity (name + country code) so a hand edit never requires reverse-engineering one.
 */

const CATEGORY_CODES: Record<Category, string> = {
  cities: 'C',
  mountains: 'M',
  landmarks: 'L',
  nature: 'N',
  kids: 'K',
  // 'C' is already taken by cities, no clean mnemonic left: 'P' is arbitrary.
  capital: 'P',
  // 'F' for France.
  citiesFr: 'F',
};

const DIFFICULTY_CODES: Record<Difficulty, string> = {
  easy: 'E',
  intermediate: 'I',
  hard: 'H',
};

/** IANA timezone (e.g. "Europe/Madrid") -> 2-letter code, arbitrary but stable (alphabetical
 * order of the timezones actually used). Repeated across 446 Clues places, a string like
 * "Europe/Copenhagen" weighs a lot for nothing next to "gh". */
const TIMEZONE_CODES: Record<string, string> = {
  'Africa/Abidjan': 'aa',
  'Africa/Accra': 'ab',
  'Africa/Addis_Ababa': 'ac',
  'Africa/Algiers': 'ad',
  'Africa/Asmara': 'ae',
  'Africa/Bamako': 'af',
  'Africa/Banjul': 'ag',
  'Africa/Bissau': 'ah',
  'Africa/Brazzaville': 'ai',
  'Africa/Bujumbura': 'aj',
  'Africa/Cairo': 'ak',
  'Africa/Casablanca': 'al',
  'Africa/Conakry': 'am',
  'Africa/Dakar': 'an',
  'Africa/Dar_es_Salaam': 'ao',
  'Africa/Djibouti': 'ap',
  'Africa/Douala': 'aq',
  'Africa/Freetown': 'ar',
  'Africa/Gaborone': 'as',
  'Africa/Harare': 'at',
  'Africa/Johannesburg': 'au',
  'Africa/Juba': 'av',
  'Africa/Kampala': 'aw',
  'Africa/Khartoum': 'ax',
  'Africa/Kigali': 'ay',
  'Africa/Kinshasa': 'az',
  'Africa/Lagos': 'ba',
  'Africa/Libreville': 'bb',
  'Africa/Lome': 'bc',
  'Africa/Luanda': 'bd',
  'Africa/Lusaka': 'be',
  'Africa/Malabo': 'bf',
  'Africa/Maputo': 'bg',
  'Africa/Maseru': 'bh',
  'Africa/Mbabane': 'bi',
  'Africa/Mogadishu': 'bj',
  'Africa/Monrovia': 'bk',
  'Africa/Nairobi': 'bl',
  'Africa/Ndjamena': 'bm',
  'Africa/Niamey': 'bn',
  'Africa/Nouakchott': 'bo',
  'Africa/Ouagadougou': 'bp',
  'Africa/Porto-Novo': 'bq',
  'Africa/Sao_Tome': 'br',
  'Africa/Tripoli': 'bs',
  'Africa/Tunis': 'bt',
  'Africa/Windhoek': 'bu',
  'America/Anchorage': 'bv',
  'America/Argentina/Buenos_Aires': 'bw',
  'America/Aruba': 'bx',
  'America/Asuncion': 'by',
  'America/Barbados': 'bz',
  'America/Belem': 'ca',
  'America/Belize': 'cb',
  'America/Bogota': 'cc',
  'America/Caracas': 'cd',
  'America/Cayenne': 'ce',
  'America/Cayman': 'cf',
  'America/Chicago': 'cg',
  'America/Costa_Rica': 'ch',
  'America/Curacao': 'ci',
  'America/Denver': 'cj',
  'America/Dominica': 'ck',
  'America/Edmonton': 'cl',
  'America/El_Salvador': 'cm',
  'America/Fortaleza': 'cn',
  'America/Grenada': 'co',
  'America/Guadeloupe': 'cp',
  'America/Guatemala': 'cq',
  'America/Guayaquil': 'cr',
  'America/Guyana': 'cs',
  'America/Halifax': 'ct',
  'America/Havana': 'cu',
  'America/Jamaica': 'cv',
  'America/La_Paz': 'cw',
  'America/Lima': 'cx',
  'America/Los_Angeles': 'cy',
  'America/Managua': 'cz',
  'America/Manaus': 'da',
  'America/Martinique': 'db',
  'America/Mexico_City': 'dc',
  'America/Montevideo': 'dd',
  'America/Nassau': 'de',
  'America/New_York': 'df',
  'America/Panama': 'dg',
  'America/Paramaribo': 'dh',
  'America/Port-au-Prince': 'di',
  'America/Puerto_Rico': 'dj',
  'America/Recife': 'dk',
  'America/Regina': 'dl',
  'America/Santiago': 'dm',
  'America/Santo_Domingo': 'dn',
  'America/Sao_Paulo': 'do',
  'America/St_Johns': 'dp',
  'America/St_Kitts': 'dq',
  'America/St_Lucia': 'dr',
  'America/Tegucigalpa': 'ds',
  'America/Tijuana': 'dt',
  'America/Toronto': 'du',
  'America/Vancouver': 'dv',
  'America/Winnipeg': 'dw',
  'Asia/Aden': 'dx',
  'Asia/Almaty': 'dy',
  'Asia/Amman': 'dz',
  'Asia/Ashgabat': 'ea',
  'Asia/Baghdad': 'eb',
  'Asia/Bahrain': 'ec',
  'Asia/Bangkok': 'ed',
  'Asia/Beirut': 'ee',
  'Asia/Bishkek': 'ef',
  'Asia/Colombo': 'eg',
  'Asia/Damascus': 'eh',
  'Asia/Dhaka': 'ei',
  'Asia/Dubai': 'ej',
  'Asia/Dushanbe': 'ek',
  'Asia/Ho_Chi_Minh': 'el',
  'Asia/Hong_Kong': 'em',
  'Asia/Jakarta': 'en',
  'Asia/Jerusalem': 'eo',
  'Asia/Kabul': 'ep',
  'Asia/Karachi': 'eq',
  'Asia/Kathmandu': 'er',
  'Asia/Kolkata': 'es',
  'Asia/Kuala_Lumpur': 'et',
  'Asia/Kuwait': 'eu',
  'Asia/Makassar': 'ev',
  'Asia/Manila': 'ew',
  'Asia/Muscat': 'ex',
  'Asia/Nicosia': 'ey',
  'Asia/Novosibirsk': 'ez',
  'Asia/Phnom_Penh': 'fa',
  'Asia/Pyongyang': 'fb',
  'Asia/Qatar': 'fc',
  'Asia/Riyadh': 'fd',
  'Asia/Seoul': 'fe',
  'Asia/Shanghai': 'ff',
  'Asia/Singapore': 'fg',
  'Asia/Taipei': 'fh',
  'Asia/Tehran': 'fi',
  'Asia/Thimphu': 'fj',
  'Asia/Tokyo': 'fk',
  'Asia/Vientiane': 'fl',
  'Asia/Vladivostok': 'fm',
  'Asia/Yangon': 'fn',
  'Atlantic/Cape_Verde': 'fo',
  'Atlantic/Reykjavik': 'fp',
  'Australia/Adelaide': 'fq',
  'Australia/Brisbane': 'fr',
  'Australia/Darwin': 'fs',
  'Australia/Hobart': 'ft',
  'Australia/Melbourne': 'fu',
  'Australia/Perth': 'fv',
  'Australia/Sydney': 'fw',
  'Europe/Amsterdam': 'fx',
  'Europe/Andorra': 'fy',
  'Europe/Athens': 'fz',
  'Europe/Belgrade': 'ga',
  'Europe/Berlin': 'gb',
  'Europe/Bratislava': 'gc',
  'Europe/Brussels': 'gd',
  'Europe/Bucharest': 'ge',
  'Europe/Budapest': 'gf',
  'Europe/Chisinau': 'gg',
  'Europe/Copenhagen': 'gh',
  'Europe/Dublin': 'gi',
  'Europe/Helsinki': 'gj',
  'Europe/Istanbul': 'gk',
  'Europe/Kyiv': 'gl',
  'Europe/Lisbon': 'gm',
  'Europe/Ljubljana': 'gn',
  'Europe/London': 'go',
  'Europe/Luxembourg': 'gp',
  'Europe/Madrid': 'gq',
  'Europe/Malta': 'gr',
  'Europe/Minsk': 'gs',
  'Europe/Monaco': 'gt',
  'Europe/Moscow': 'gu',
  'Europe/Oslo': 'gv',
  'Europe/Paris': 'gw',
  'Europe/Prague': 'gx',
  'Europe/Riga': 'gy',
  'Europe/Rome': 'gz',
  'Europe/San_Marino': 'ha',
  'Europe/Sarajevo': 'hb',
  'Europe/Skopje': 'hc',
  'Europe/Sofia': 'hd',
  'Europe/Stockholm': 'he',
  'Europe/Tallinn': 'hf',
  'Europe/Tirane': 'hg',
  'Europe/Vaduz': 'hh',
  'Europe/Vienna': 'hi',
  'Europe/Vilnius': 'hj',
  'Europe/Warsaw': 'hk',
  'Europe/Zagreb': 'hl',
  'Europe/Zurich': 'hm',
  'Indian/Antananarivo': 'hn',
  'Indian/Comoro': 'ho',
  'Indian/Mahe': 'hp',
  'Indian/Maldives': 'hq',
  'Indian/Mauritius': 'hr',
  'Pacific/Apia': 'hs',
  'Pacific/Auckland': 'ht',
  'Pacific/Efate': 'hu',
  'Pacific/Fiji': 'hv',
  'Pacific/Funafuti': 'hw',
  'Pacific/Guadalcanal': 'hx',
  'Pacific/Honolulu': 'hy',
  'Pacific/Majuro': 'hz',
  'Pacific/Noumea': 'ia',
  'Pacific/Pago_Pago': 'ib',
  'Pacific/Palau': 'ic',
  'Pacific/Pohnpei': 'id',
  'Pacific/Port_Moresby': 'ie',
  'Pacific/Tahiti': 'if',
  'Pacific/Tarawa': 'ig',
  'Pacific/Tongatapu': 'ih',
  // Appended out of alphabetical order (added later, for new capital-city entries): reusing an
  // existing zone's code would silently reassign it, corrupting every place already using it.
  'America/Antigua': 'ii',
  'America/Port_of_Spain': 'ij',
  'America/St_Vincent': 'ik',
  'Africa/Bangui': 'il',
  'Africa/Blantyre': 'im',
  'Asia/Baku': 'io',
  'Asia/Brunei': 'ip',
  'Asia/Dili': 'iq',
  'Asia/Tashkent': 'ir',
  'Asia/Tbilisi': 'is',
  'Asia/Ulaanbaatar': 'it',
  'Asia/Yerevan': 'iu',
  'Europe/Podgorica': 'iv',
  'Pacific/Nauru': 'iw',
  'America/Nuuk': 'ix',
};

const CATEGORY_BY_CODE = Object.fromEntries(
  Object.entries(CATEGORY_CODES).map(([category, code]) => [code, category]),
) as Record<string, Category>;

const DIFFICULTY_BY_CODE = Object.fromEntries(
  Object.entries(DIFFICULTY_CODES).map(([difficulty, code]) => [code, difficulty]),
) as Record<string, Difficulty>;

const TIMEZONE_BY_CODE = Object.fromEntries(Object.entries(TIMEZONE_CODES).map(([tz, code]) => [code, tz])) as Record<
  string,
  string
>;

/** `difficultyCode` lives here, not per-game: the two games never actually disagreed on a
 * place's difficulty in practice, so tracking it twice was pure duplication (see git history
 * for the merge). */
export type CommonRow = readonly [
  name: string,
  code: string,
  latitude: number,
  longitude: number,
  difficultyCode: string,
];

export type CompassRow = readonly [
  categoryCode: string,
  description: string | null,
  wikiFr: string | null,
  wikiEn: string | null,
];

export type ClueRow = readonly [
  positionInCountry: CluePositionInCountry,
  population: number,
  climateEmoji: string,
  elevationMeters: number,
  timezoneCode: string,
  airportCode: string,
  emoji1: string,
  emoji2: string,
  emoji3: string,
];

/** This place's syllable split for the charade clue (`helpers/charade.ts`), lowercase, MANDATORY
 * for every key present in `cluesPlaces.json` — decomposed once for all 922 places by
 * `scripts/generateCharades.mjs` (live French-syllabifier heuristic, or a hand-corrected override
 * where it gets a name wrong — foreign diacritics, mostly), nothing ever computed at runtime. Can
 * be an empty array on purpose: some names have no usable syllable at all (e.g. "Bălți", whose
 * "ă" the heuristic doesn't recognize) — `cluesFor` then drops the charade clue entirely rather
 * than showing an empty card. */
export type CharadeRow = readonly string[];

/** A real, Wikipedia-documented person tied to this place — present only for the places that
 * have one (curated by hand, see `helpers/personality.ts`'s own doc comment). `[name,
 * description]`, `description` itself `null` when there's nothing short and safe to add. */
export type PersonalityRow = readonly [name: string, description: string | null];

const PLACES = placesData as unknown as Record<string, CommonRow>;
const COMPASS_PLACES = compassPlacesData as unknown as Record<string, CompassRow>;
const CLUES_PLACES = cluesPlacesData as unknown as Record<string, ClueRow>;
const CHARADE_PLACES = charadePlacesData as unknown as Record<string, CharadeRow>;
const PERSONALITY_PLACES = personalityPlacesData as unknown as Record<string, PersonalityRow>;

export const decodeCompassPlace = (common: CommonRow, row: CompassRow): Place => {
  const [name, code, latitude, longitude, difficultyCode] = common;
  const [categoryCode, description, wikiFr, wikiEn] = row;
  return {
    name,
    code,
    category: CATEGORY_BY_CODE[categoryCode],
    difficulty: DIFFICULTY_BY_CODE[difficultyCode],
    coordinates: { latitude, longitude },
    ...(description !== null && { description }),
    ...(wikiFr !== null && { wikiFr }),
    ...(wikiEn !== null && { wikiEn }),
  };
};

export const decodeCluePlace = (
  key: string,
  common: CommonRow,
  row: ClueRow,
  syllables: CharadeRow,
  personality?: PersonalityRow,
): CluePlace => {
  const [name, code, latitude, longitude, difficultyCode] = common;
  const [positionInCountry, population, climateEmoji, elevationMeters, timezoneCode, airportCode, emoji1, emoji2, emoji3] = row;
  return {
    key,
    name,
    code,
    country: countryName(code, 'fr'),
    coordinates: { latitude, longitude },
    difficulty: DIFFICULTY_BY_CODE[difficultyCode],
    positionInCountry,
    population,
    climateEmoji,
    elevationMeters,
    timezone: TIMEZONE_BY_CODE[timezoneCode] ?? timezoneCode,
    phoneCode: countryPhoneCode(code) ?? '',
    currency: countryCurrencySymbol(code) ?? '',
    airportCode,
    emojis: [emoji1, emoji2, emoji3] as const,
    syllables: [...syllables],
    ...(personality !== undefined && { personality: { name: personality[0], description: personality[1] } }),
  };
};

/** One place, joined back from its key across the 5 files — `key` is also baked directly onto
 * `compass`/`clues` themselves (`GeoPlace.key`), so any per-place lookup keyed the same way
 * (`wordplayFor`, the admin's own edits — both log the key alongside the human identity, see this
 * module's own doc comment) can read it straight off the place object it already has. */
export type PlaceKeyRow = { key: string; common: CommonRow; compass: Place | null; clues: CluePlace | null };

export const decodeAllPlaces = (): PlaceKeyRow[] =>
  Object.keys(PLACES).map((key) => {
    const common = PLACES[key];
    const compassRow = COMPASS_PLACES[key];
    const clueRow = CLUES_PLACES[key];
    return {
      key,
      common,
      compass: compassRow ? decodeCompassPlace(common, compassRow) : null,
      clues: clueRow ? decodeCluePlace(key, common, clueRow, CHARADE_PLACES[key] ?? [], PERSONALITY_PLACES[key]) : null,
    };
  });

export const decodeCompassPlaces = (): Place[] =>
  decodeAllPlaces().flatMap((row) => (row.compass ? [row.compass] : []));

export const decodeCluePlaces = (): CluePlace[] => decodeAllPlaces().flatMap((row) => (row.clues ? [row.clues] : []));
