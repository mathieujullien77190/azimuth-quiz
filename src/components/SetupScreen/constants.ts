export const SCREEN_TITLE = 'Nouvelle partie';
export const START_LABEL = 'Lancer la partie';
export const BACK_LABEL = 'Retour';

/** Choix du type de curseur de distance : deux modes du meme reglage `straightLine`. */
export const DISTANCE_MODES = [
  {
    id: 'distance',
    label: 'Distance',
    straightLine: false,
    description: 'Tu estimes directement la distance parcourue à la surface du globe.',
  },
  {
    id: 'inclination',
    label: 'Inclinaison',
    straightLine: true,
    description:
      'Plus dur : tu choisis l’inclinaison sous l’horizon, sans indication de distance. La ligne droite à travers la Terre en découle.',
  },
] as const;

export const TOGGLES = {
  liveCompass: {
    label: 'Boussole réelle',
    description: 'Le N de la boussole pointe vers le vrai nord (capteur du téléphone).',
  },
  useGps: {
    label: 'Utiliser ma position',
    description: 'Sinon, tout part de Paris.',
  },
  showCountry: {
    label: 'Aide pays',
    description: 'Affiche le pays sous le nom du lieu.',
  },
  allowRevision: {
    label: 'Modifier après validation',
    description: 'Autorise à revenir sur la réponse déjà validée d’un joueur, avant la révélation.',
  },
} as const;
