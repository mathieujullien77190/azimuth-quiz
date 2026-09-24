import type { Category, Difficulty, IndicesPlace, IndicesPositionInCountry, Place } from '@/types';

import { countryName, countryPhoneCode, countryCurrencySymbol } from './countries';

/**
 * `places.json` est la source commune des lieux de Boussole ET d'Indices : un tableau de lieux, et
 * chaque lieu est lui-meme `[commun, boussole, indices]`. `commun` existe toujours ; `boussole` est
 * `null` si ce lieu n'est pas dans le pool Boussole, `indices` est `null` s'il n'est pas dans le
 * pool Indices (un lieu peut n'etre que dans l'un des deux). Chaque jeu garde sa propre difficulte
 * (elles divergent volontairement). `decodeBoussolePlaces`/`decodeIndicesPlaces` sont le seul
 * endroit qui connait l'ordre des colonnes : `src/constants/places/index.ts`, `src/constants/
 * indices.ts` et `admin/vite.config.ts` importent tous d'ici plutot que de le recoder.
 */

export const CATEGORY_CODES: Record<Category, string> = {
  cities: 'C',
  mountains: 'M',
  landmarks: 'L',
  nature: 'N',
  kids: 'K',
};

export const DIFFICULTY_CODES: Record<Difficulty, string> = {
  easy: 'E',
  intermediate: 'I',
  hard: 'H',
  master: 'M',
};

/** Fuseau horaire IANA (ex. "Europe/Madrid") -> code 2 lettres, arbitraire mais stable (ordre
 * alphabetique des fusaux effectivement utilises). Repete sur 446 lieux Indices, une chaine
 * "Europe/Copenhagen" pese lourd pour rien face a "gh". */
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
};

export const CATEGORY_BY_CODE = Object.fromEntries(
  Object.entries(CATEGORY_CODES).map(([category, code]) => [code, category]),
) as Record<string, Category>;

export const DIFFICULTY_BY_CODE = Object.fromEntries(
  Object.entries(DIFFICULTY_CODES).map(([difficulty, code]) => [code, difficulty]),
) as Record<string, Difficulty>;

export const TIMEZONE_BY_CODE = Object.fromEntries(Object.entries(TIMEZONE_CODES).map(([tz, code]) => [code, tz])) as Record<string, string>;

export type CommonRow = readonly [name: string, code: string, latitude: number, longitude: number];

export type BoussoleRow = readonly [
  categoryCode: string,
  difficultyCode: string,
  description: string | null,
  wikiFr: string | null,
  wikiEn: string | null,
];

export type IndicesRow = readonly [
  difficultyCode: string,
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

/** Un lieu : commun + ses deux parts specifiques, l'une ou l'autre (jamais les deux) pouvant etre
 * `null` si ce lieu n'existe pas dans ce jeu. */
export type PlaceEntry = readonly [common: CommonRow, boussole: BoussoleRow | null, indices: IndicesRow | null];

export type MergedPlaces = readonly PlaceEntry[];

export const decodeBoussolePlace = (common: CommonRow, row: BoussoleRow): Place => {
  const [name, code, latitude, longitude] = common;
  const [categoryCode, difficultyCode, description, wikiFr, wikiEn] = row;
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

export const encodeBoussoleRow = (place: Pick<Place, 'category' | 'difficulty' | 'description' | 'wikiFr' | 'wikiEn'>): BoussoleRow => [
  CATEGORY_CODES[place.category],
  DIFFICULTY_CODES[place.difficulty],
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
  const [name, code, latitude, longitude] = common;
  const [difficultyCode, positionInCountry, population, climateEmoji, elevationMeters, timezoneCode, airportCode, emoji1, emoji2, emoji3] = row;
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
  place: Pick<IndicesPlace, 'difficulty' | 'positionInCountry' | 'population' | 'climateEmoji' | 'elevationMeters' | 'timezone' | 'airportCode' | 'emojis'>,
): IndicesRow => [
  DIFFICULTY_CODES[place.difficulty],
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

/** Un lieu par ligne (au lieu du multi-ligne par defaut de `JSON.stringify(_, null, 2)`) : un
 * `git diff` sur un seul champ modifie touche une seule ligne. */
export const serializeMergedPlaces = (entries: MergedPlaces): string =>
  '[\n' + entries.map((entry) => '  ' + JSON.stringify(entry)).join(',\n') + '\n]\n';
