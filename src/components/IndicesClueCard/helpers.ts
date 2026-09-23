/** Nombre de lettres du nom, espaces/tirets/apostrophes exclus (ex. "Rio de Janeiro" -> 13). */
export const letterCount = (name: string): number => name.replace(/[^\p{L}]/gu, '').length;

/** Nombre de mots du nom (ex. "San Francisco" -> 2, "Rio de Janeiro" -> 3). */
export const wordCount = (name: string): number => name.trim().split(/\s+/).filter(Boolean).length;

/** Premiere lettre du nom, en majuscule (ex. "Rio de Janeiro" -> "R"). */
export const firstLetterOf = (name: string): string => name.trim().charAt(0).toUpperCase();

/** Heure locale du lieu (HH:mm), format fixe pour rester lisible quelle que soit la langue de l'app. */
export const localTimeFor = (timezone: string): string =>
  new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', hour12: false, minute: '2-digit', timeZone: timezone }).format(
    new Date(),
  );
