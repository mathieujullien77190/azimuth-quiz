/** Choix du type de curseur de distance : deux modes du meme reglage `straightLine`. Label/description
 * viennent de translations.setup.distanceModes (meme id). */
export const DISTANCE_MODES = [
  { id: 'distance', straightLine: false },
  { id: 'inclination', straightLine: true },
] as const;
