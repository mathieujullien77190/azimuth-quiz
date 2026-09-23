/** Nombre de lettres du nom, espaces/tirets/apostrophes exclus (ex. "Rio de Janeiro" -> 13). */
export const letterCount = (name: string): number => name.replace(/[^\p{L}]/gu, '').length;

/** Nombre de mots du nom (ex. "San Francisco" -> 2, "Rio de Janeiro" -> 3). */
export const wordCount = (name: string): number => name.trim().split(/\s+/).filter(Boolean).length;

/** Premiere lettre du nom, en majuscule (ex. "Rio de Janeiro" -> "R"). */
export const firstLetterOf = (name: string): string => name.trim().charAt(0).toUpperCase();

// Heure/minute locales via `formatToParts` plutot que `format()` : ce dernier peut inclure une
// lettre litterale ("18 h" en fr-FR pour l'heure seule), ce qui casse un `Number(...)` naif sur le
// texte — `formatToParts` isole la valeur numerique de chaque partie, fiable quel que soit le
// moteur (teste different entre Hermes/RN et Node/Jest).
const localHourMinute = (timezone: string): { hour: number; minute: number } => {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).formatToParts(new Date());
  const hourPart = parts.find((part) => part.type === 'hour')?.value ?? '0';
  const minutePart = parts.find((part) => part.type === 'minute')?.value ?? '0';
  // %24 : ce meme moteur peut aussi rendre minuit "24" plutot que "00".
  return { hour: Number(hourPart) % 24, minute: Number(minutePart) };
};

/** Heure locale du lieu (HHhmm), format fixe pour rester lisible quelle que soit la langue de l'app. */
export const localTimeFor = (timezone: string): string => {
  const { hour, minute } = localHourMinute(timezone);
  return `${String(hour).padStart(2, '0')}h${String(minute).padStart(2, '0')}`;
};

/** Emoji jour/nuit au 1er clic sur l'indice "Heure locale" (l'heure exacte n'arrive qu'au 2e, voir
 * IndicesGameScreen/`localTimeStage`) : jour de 6h a 20h (exclu), nuit sinon. */
export const dayNightEmoji = (timezone: string): string => {
  const { hour } = localHourMinute(timezone);
  return hour >= 6 && hour < 20 ? '☀️' : '🌙';
};

/** Emoji d'altitude par palier, au 1er clic sur l'indice (le chiffre exact n'arrive qu'au 2e,
 * voir IndicesGameScreen/`elevationStage`) : arbre en plaine, immeuble en ville basse, montagne en
 * moyenne altitude, avion tres haut (repartition verifiee sur les 446 lieux : ~200/135/70/40). */
export const elevationTierEmoji = (elevationMeters: number): string =>
  elevationMeters < 30 ? '🌳' : elevationMeters < 300 ? '🏢' : elevationMeters < 1000 ? '⛰️' : '✈️';

/** Palier de population (1 a 5) au 1er clic sur l'indice (le chiffre exact n'arrive qu'au 2e, voir
 * IndicesGameScreen/`populationStage`) : bornes choisies pour repartir a peu proche uniformement
 * les 446 lieux entre les 5 paliers. */
export const populationTier = (population: number): number =>
  population < 100_000 ? 1 : population < 500_000 ? 2 : population < 1_000_000 ? 3 : population < 5_000_000 ? 4 : 5;
