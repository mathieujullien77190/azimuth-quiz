/** Number of letters in the name, spaces/dashes/apostrophes excluded (e.g. "Rio de Janeiro" -> 13). */
export const letterCount = (name: string): number => name.replace(/[^\p{L}]/gu, '').length;

/** Number of words in the name (e.g. "San Francisco" -> 2, "Rio de Janeiro" -> 3). */
export const wordCount = (name: string): number => name.trim().split(/\s+/).filter(Boolean).length;

/** First letter of the name, uppercase (e.g. "Rio de Janeiro" -> "R"). */
export const firstLetterOf = (name: string): string => name.trim().charAt(0).toUpperCase();

/** Every vowel in the name, in order, accents stripped and uppercased, space-separated (e.g.
 * "São Paulo" -> "A O A U O"). */
export const vowelsOf = (name: string): string =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^AEIOU]/g, '')
    .split('')
    .join(' ');

// Local hour/minute via `formatToParts` rather than `format()`: the latter can include a
// literal letter ("18 h" in fr-FR for hour-only), which breaks a naive `Number(...)` on the
// text — `formatToParts` isolates the numeric value of each part, reliable regardless of the
// engine (tested to differ between Hermes/RN and Node/Jest).
const localHourMinute = (timezone: string): { hour: number; minute: number } => {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).formatToParts(new Date());
  const hourPart = parts.find((part) => part.type === 'hour')?.value ?? '0';
  const minutePart = parts.find((part) => part.type === 'minute')?.value ?? '0';
  // %24: this same engine can also render midnight as "24" instead of "00".
  return { hour: Number(hourPart) % 24, minute: Number(minutePart) };
};

/** Local time of the place (HHhmm), fixed format to stay readable regardless of the app's language. */
export const localTimeFor = (timezone: string): string => {
  const { hour, minute } = localHourMinute(timezone);
  return `${String(hour).padStart(2, '0')}h${String(minute).padStart(2, '0')}`;
};

/** Day/night emoji on the 1st click on the "Local time" clue (the exact time only comes on the
 * 2nd, see IndicesGameScreen/`localTimeStage`): day from 6h to 20h (exclusive), night otherwise. */
export const dayNightEmoji = (timezone: string): string => {
  const { hour } = localHourMinute(timezone);
  return hour >= 6 && hour < 20 ? '☀️' : '🌙';
};

/** Tiered elevation emoji, on the 1st click on the clue (the exact figure only comes on the 2nd,
 * see IndicesGameScreen/`elevationStage`): tree for lowland, building for low-altitude city, mountain
 * for mid altitude, plane for very high (distribution checked across the 446 places: ~200/135/70/40). */
export const elevationTierEmoji = (elevationMeters: number): string =>
  elevationMeters < 30 ? '🌳' : elevationMeters < 300 ? '🏢' : elevationMeters < 1000 ? '⛰️' : '✈️';

/** Population tier (1 to 5) on the 1st click on the clue (the exact figure only comes on the 2nd,
 * see IndicesGameScreen/`populationStage`): bounds chosen to spread the 446 places roughly evenly
 * across the 5 tiers. */
export const populationTier = (population: number): number =>
  population < 100_000 ? 1 : population < 500_000 ? 2 : population < 1_000_000 ? 3 : population < 5_000_000 ? 4 : 5;
