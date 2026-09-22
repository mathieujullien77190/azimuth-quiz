export const SCREEN_TITLE = 'Nouvelle partie';
export const START_LABEL = 'Lancer la partie';
export const BACK_LABEL = 'Retour';

/** Placeholders des champs de nom : un prenom au pif plutot que "Joueur 1", "Joueur 2"... */
export const NAME_PLACEHOLDERS = [
  'Zoé', 'Max', 'Léo', 'Nina', 'Théo', 'Mia', 'Noa', 'Iris', 'Timéo', 'Luna', 'Gaspard', 'Alba',
] as const;

export const TOGGLES = {
  straightLine: {
    label: 'Ligne droite à travers la Terre',
    description:
      'Ajoute un second curseur : l’inclinaison sous l’horizon, qui donne la distance en ligne droite. Le dernier curseur touché (distance ou inclinaison) compte pour le score.',
  },
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
