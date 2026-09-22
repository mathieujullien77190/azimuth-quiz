import type { Translations } from '../types';

export const en: Translations = {
  common: {
    yourPosition: 'your location',
    pts: 'pts',
    record: (score) => `Best: ${score}`,
  },
  cardinals: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
  compassWestLabel: 'W',
  compassAccessibilityLabel: 'Compass',
  home: {
    tagline: 'Guess where a place in the world is\ndirection, tilt, distance?',
    rules: [
      { emoji: '📍', text: 'A place appears.' },
      { emoji: '🧭', text: 'Aim the compass at it and estimate the distance.' },
      { emoji: '🎯', text: 'Compare with the real answer.' },
      { emoji: '👥', text: 'Solo or up to 6 players.' },
    ],
    play: 'Play',
    settingsButtonLabel: 'Settings',
  },
  setup: {
    screenTitle: 'New game',
    back: 'Back',
    start: 'Start game',
    playersSection: {
      title: 'Players',
      hint: 'Everyone plays on the same phone, taking turns.',
    },
    playerNameAccessibility: (index) => `Player ${index} name`,
    categoriesTitle: 'Categories',
    categories: {
      cities: 'Cities',
      mountains: 'Mountains',
      landmarks: 'Landmarks',
      nature: 'Nature',
      kids: 'Kids',
    },
    difficultyTitle: 'Difficulty',
    difficultyHint: 'How well-known the place is: the more obscure, the harder.',
    difficulties: {
      easy: 'Easy',
      intermediate: 'Intermediate',
      hard: 'Hard',
      master: 'Master',
    },
    zoneTitle: 'Zone',
    zones: {
      france: { label: 'France', description: 'Lyon yes, Cork no' },
      europe: { label: 'Europe', description: 'From Portugal to Moscow' },
      world: { label: 'World', description: 'The whole planet' },
    },
    roundsTitle: 'Number of rounds',
    modeTitle: 'Mode',
    distanceModes: {
      distance: {
        label: 'Distance',
        description: 'You estimate directly the distance travelled along the surface of the globe.',
      },
      inclination: {
        label: 'Tilt',
        description:
          'Harder: you choose the angle below the horizon, with no distance shown. The straight line through the Earth follows from it.',
      },
    },
    optionsTitle: 'Options',
    toggles: {
      liveCompass: {
        label: 'Real compass',
        description: 'The compass N points to true north (phone sensor).',
      },
      useGps: {
        label: 'Use my location',
        description: 'Otherwise, everything starts from Paris.',
      },
      showCountry: {
        label: 'Country hint',
        description: 'Shows the country under the place name.',
      },
      allowRevision: {
        label: 'Edit after submitting',
        description: 'Allows changing a player’s already-submitted answer, before the reveal.',
      },
      hideOtherAnswers: {
        label: 'Hide other answers',
        description:
          'During the round, each player only sees their own arrow and their own distance/tilt. Everything shows at the reveal.',
      },
    },
    availability: (available, rounds) =>
      available >= rounds
        ? `${available} places available`
        : `${available} places available: the game will be ${available} rounds`,
  },
  game: {
    loading: 'Preparing the game…',
    quit: '✕  Quit',
    validate: 'Submit',
    next: 'Next round',
    last: 'See the score',
    round: 'Round',
    roundOver: 'Round over',
    reality: 'Answer',
    yourAnswer: 'Your answer',
  },
  placeCard: {
    hintFrom: (originName) => `From ${originName}: what heading, what distance?`,
    showDescription: 'Learn more',
    hideDescription: 'Collapse',
  },
  sliders: {
    distance: 'Estimated distance',
    inclination: 'Tilt',
  },
  roundResult: {
    truth: 'Answer',
    direction: 'Direction',
    distance: 'Distance',
    inclination: 'Tilt',
    yourScore: 'Your score',
  },
  endScreen: {
    newBest: 'New best!',
    replay: 'Play again',
    menu: 'Home',
    winner: (name) => `${name} wins!`,
    tie: (names) => `Tie: ${names}`,
    and: 'and',
    roundBest: (name) => `Best: ${name}`,
    ranks: ['Master of the Winds', 'Captain', 'Navigator', 'Deckhand', 'Castaway'],
  },
  settings: {
    title: 'Settings',
    languageTitle: 'Language',
    languageOptions: { fr: 'Français', en: 'English' },
    aboutTitle: 'About',
    author: 'By Matou.',
    claudeMention: 'Built with help from Claude, who still has no internal compass but codes rather well.',
  },
};
