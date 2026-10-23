/** Toutes les voyelles du nom, dans l'ordre, sans accents, en majuscules, separees par des espaces
 * (ex. "Sao Paulo" -> "A O A U O"). */
export const vowelsOf = (name: string): string =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^AEIOU]/g, '')
    .split('')
    .join(' ');

// `formatToParts` plutot que `format()` : ce dernier peut ajouter une lettre ("18 h" en fr-FR),
// ce qui casse `Number(...)` ; le rendu differe entre Hermes/RN et Node/Jest.
const localHourMinute = (timezone: string): { hour: number; minute: number } => {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).formatToParts(new Date());
  const hourPart = parts.find((part) => part.type === 'hour')?.value ?? '0';
  const minutePart = parts.find((part) => part.type === 'minute')?.value ?? '0';
  // %24 : le moteur peut aussi rendre minuit "24" au lieu de "00".
  return { hour: Number(hourPart) % 24, minute: Number(minutePart) };
};

/** Heure locale du lieu (HHhmm), format fixe pour rester lisible quelle que soit la langue. */
export const localTimeFor = (timezone: string): string => {
  const { hour, minute } = localHourMinute(timezone);
  return `${String(hour).padStart(2, '0')}h${String(minute).padStart(2, '0')}`;
};

/** Emoji jour/nuit au 1er clic sur l'heure locale (l'heure exacte au 2e) : jour de 6 h a 20 h (exclu). */
export const dayNightEmoji = (timezone: string): string => {
  const { hour } = localHourMinute(timezone);
  return hour >= 6 && hour < 20 ? '☀️' : '🌙';
};

/** Emoji d'altitude par palier au 1er clic (le chiffre exact au 2e) : plaine, ville basse, montagne, avion.
 * Repartition mesuree sur les 446 lieux : ~200/135/70/40. */
export const elevationTierEmoji = (elevationMeters: number): string =>
  elevationMeters < 30 ? '🌳' : elevationMeters < 300 ? '🏢' : elevationMeters < 1000 ? '⛰️' : '✈️';

/** Palier de population (1 a 5) au 1er clic (le chiffre exact au 2e), bornes choisies pour repartir les 446 lieux a peu pres egalement. */
export const populationTier = (population: number): number =>
  population < 100_000 ? 1 : population < 500_000 ? 2 : population < 1_000_000 ? 3 : population < 5_000_000 ? 4 : 5;
