import type { Category, Difficulty, IndicesPlace, IndicesPositionInCountry, Place } from '@/types';

import { countryName, countryPhoneCode, countryCurrencySymbol } from './countries';

/**
 * `places.json` is the shared source of places for BOTH Boussole and Indices: an array of places,
 * and each place is itself `[common, boussole, indices]`. `common` always exists (name, code,
 * coordinates, and difficulty — shared across both games); `boussole` is `null` if this place
 * isn't in the Boussole pool, `indices` is `null` if it isn't in the Indices pool (a place can be
 * in only one of the two). `decodeBoussolePlaces`/`decodeIndicesPlaces` are the only
 * place that knows the column order: `src/constants/places/index.ts`, `src/constants/
 * indices.ts` and `admin/src/api/places.ts` all import from here rather than re-encoding it.
 */

export const CATEGORY_CODES: Record<Category, string> = {
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

export const DIFFICULTY_CODES: Record<Difficulty, string> = {
  easy: 'E',
  intermediate: 'I',
  hard: 'H',
};

/** IANA timezone (e.g. "Europe/Madrid") -> 2-letter code, arbitrary but stable (alphabetical
 * order of the timezones actually used). Repeated across 446 Indices places, a string like
 * "Europe/Copenhagen" weighs a lot for nothing next to "gh". */
export const TIMEZONE_CODES: Record<string, string> = {
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
};

export const CATEGORY_BY_CODE = Object.fromEntries(
  Object.entries(CATEGORY_CODES).map(([category, code]) => [code, category]),
) as Record<string, Category>;

export const DIFFICULTY_BY_CODE = Object.fromEntries(
  Object.entries(DIFFICULTY_CODES).map(([difficulty, code]) => [code, difficulty]),
) as Record<string, Difficulty>;

export const TIMEZONE_BY_CODE = Object.fromEntries(Object.entries(TIMEZONE_CODES).map(([tz, code]) => [code, tz])) as Record<string, string>;

/** `difficultyCode` lives here, not per-game: the two games never actually disagreed on a
 * place's difficulty in practice, so tracking it twice was pure duplication (see git history
 * for the merge). */
export type CommonRow = readonly [name: string, code: string, latitude: number, longitude: number, difficultyCode: string];

export type BoussoleRow = readonly [categoryCode: string, description: string | null, wikiFr: string | null, wikiEn: string | null];

export type IndicesRow = readonly [
  positionInCountry: IndicesPositionInCountry,
  population: number,
  climateEmoji: string,
  elevationMeters: number,
  timezoneCode: string,
  airportCode: string,
  emoji1: string,
  emoji2: string,
  emoji3: string,
];

/** A place: common data (including difficulty) + its two game-specific parts, either one
 * (never both) can be `null` if this place doesn't exist in that game. */
export type PlaceEntry = readonly [common: CommonRow, boussole: BoussoleRow | null, indices: IndicesRow | null];

export type MergedPlaces = readonly PlaceEntry[];

export const encodeCommonRow = (common: CommonRow, difficulty: Difficulty): CommonRow => [
  common[0],
  common[1],
  common[2],
  common[3],
  DIFFICULTY_CODES[difficulty],
];

export const decodeBoussolePlace = (common: CommonRow, row: BoussoleRow): Place => {
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

export const encodeBoussoleRow = (place: Pick<Place, 'category' | 'description' | 'wikiFr' | 'wikiEn'>): BoussoleRow => [
  CATEGORY_CODES[place.category],
  place.description ?? null,
  place.wikiFr ?? null,
  place.wikiEn ?? null,
];

export const decodeBoussolePlaces = (entries: MergedPlaces): Place[] => {
  const places: Place[] = [];
  for (const [common, boussole] of entries) {
    if (boussole) places.push(decodeBoussolePlace(common, boussole));
  }
  return places;
};

export const decodeIndicesPlace = (common: CommonRow, row: IndicesRow): IndicesPlace => {
  const [name, code, latitude, longitude, difficultyCode] = common;
  const [positionInCountry, population, climateEmoji, elevationMeters, timezoneCode, airportCode, emoji1, emoji2, emoji3] = row;
  return {
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
  };
};

export const encodeIndicesRow = (
  place: Pick<IndicesPlace, 'positionInCountry' | 'population' | 'climateEmoji' | 'elevationMeters' | 'timezone' | 'airportCode' | 'emojis'>,
): IndicesRow => [
  place.positionInCountry,
  place.population,
  place.climateEmoji,
  place.elevationMeters,
  TIMEZONE_CODES[place.timezone] ?? place.timezone,
  place.airportCode,
  place.emojis[0],
  place.emojis[1],
  place.emojis[2],
];

export const decodeIndicesPlaces = (entries: MergedPlaces): IndicesPlace[] => {
  const places: IndicesPlace[] = [];
  for (const [common, , indices] of entries) {
    if (indices) places.push(decodeIndicesPlace(common, indices));
  }
  return places;
};

/** One place per line (instead of the multi-line default of `JSON.stringify(_, null, 2)`): a
 * `git diff` touching a single modified field only touches one line. */
export const serializeMergedPlaces = (entries: MergedPlaces): string =>
  '[\n' + entries.map((entry) => '  ' + JSON.stringify(entry)).join(',\n') + '\n]\n';
