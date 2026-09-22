import type { Translations } from '../types';

export const fr: Translations = {
  common: {
    yourPosition: 'ta position',
    pts: 'pts',
    record: (score) => `Record : ${score}`,
  },
  cardinals: ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'],
  compassWestLabel: 'O',
  compassAccessibilityLabel: 'Boussole',
  home: {
    tagline: 'Devine où se trouve un lieu du monde\ndirection, inclinaison, distance ?',
    rules: [
      { emoji: '📍', text: 'Un lieu s’affiche.' },
      { emoji: '🧭', text: 'Oriente la boussole vers lui et estime la distance.' },
      { emoji: '🎯', text: 'Compare avec la vraie réponse.' },
      { emoji: '👥', text: 'Seul ou à 6 joueurs.' },
    ],
    play: 'Jouer',
    settingsButtonLabel: 'Réglages',
  },
  setup: {
    screenTitle: 'Nouvelle partie',
    back: 'Retour',
    start: 'Lancer la partie',
    playersSection: {
      title: 'Joueurs',
      hint: 'Tout le monde joue sur le même téléphone, chacun son tour.',
    },
    playerNameAccessibility: (index) => `Nom du joueur ${index}`,
    categoriesTitle: 'Catégories',
    categories: {
      cities: 'Villes',
      mountains: 'Montagnes',
      landmarks: 'Monuments',
      nature: 'Nature',
      kids: 'Enfants',
    },
    difficultyTitle: 'Difficulté',
    difficultyHint: 'Notoriété du lieu : plus c’est pointu, plus c’est dur.',
    difficulties: {
      easy: 'Facile',
      intermediate: 'Intermédiaire',
      hard: 'Difficile',
      master: 'Maître',
    },
    zoneTitle: 'Zone',
    zones: {
      france: { label: 'France', description: 'Lyon oui, Cork non' },
      europe: { label: 'Europe', description: 'Du Portugal à Moscou' },
      world: { label: 'Monde', description: 'Toute la planète' },
    },
    roundsTitle: 'Nombre de manches',
    modeTitle: 'Mode',
    distanceModes: {
      distance: {
        label: 'Distance',
        description: 'Tu estimes directement la distance parcourue à la surface du globe.',
      },
      inclination: {
        label: 'Inclinaison',
        description:
          'Plus dur : tu choisis l’inclinaison sous l’horizon, sans indication de distance. La ligne droite à travers la Terre en découle.',
      },
    },
    optionsTitle: 'Options',
    toggles: {
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
      hideOtherAnswers: {
        label: 'Cacher les réponses des autres',
        description:
          'Pendant la manche, chacun ne voit que sa propre flèche et sa propre distance/inclinaison. Tout s’affiche à la révélation.',
      },
    },
    availability: (available, rounds) =>
      available >= rounds
        ? `${available} lieux possibles`
        : `${available} lieux possibles : la partie sera de ${available} manches`,
  },
  game: {
    loading: 'Préparation de la partie…',
    quit: '✕  Quitter',
    validate: 'Valider',
    next: 'Manche suivante',
    last: 'Voir le score',
    round: 'Manche',
    roundOver: 'Manche terminée',
    reality: 'Réponse',
    yourAnswer: 'Ta réponse',
  },
  placeCard: {
    hintFrom: (originName) => `Depuis ${originName} : quel cap, quelle distance ?`,
    showDescription: 'En savoir plus',
    hideDescription: 'Réduire',
  },
  sliders: {
    distance: 'Distance estimée',
    inclination: 'Inclinaison',
  },
  roundResult: {
    truth: 'Réponse',
    direction: 'Direction',
    distance: 'Distance',
    inclination: 'Inclinaison',
    yourScore: 'Ton score',
  },
  endScreen: {
    newBest: 'Nouveau record !',
    replay: 'Rejouer',
    menu: 'Accueil',
    winner: (name) => `${name} gagne !`,
    tie: (names) => `Égalité : ${names}`,
    and: 'et',
    roundBest: (name) => `Meilleur : ${name}`,
    ranks: ['Maître des vents', 'Capitaine', 'Navigateur', 'Mousse', 'Naufragé'],
  },
  settings: {
    title: 'Réglages',
    languageTitle: 'Langue',
    languageOptions: { fr: 'Français', en: 'English' },
    aboutTitle: 'À propos',
    author: 'Par mathieu.',
    funnyLine:
      'Aucun pigeon voyageur n’a été consulté pour le développement de ce jeu — leur sens de l’orientation étant jugé trop insultant pour le nôtre.',
    claudeMention:
      'Développé avec l’aide de Claude (Anthropic), qui n’a toujours pas de boussole interne mais code plutôt bien.',
  },
};
