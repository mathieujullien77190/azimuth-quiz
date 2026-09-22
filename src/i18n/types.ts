import type { Category, Difficulty, IndicesAnswerMethod, IndicesBuzzerMode, IndicesClueId, Zone } from '@/types';

export type Language = 'fr' | 'en';

/** Contenu d'une carte jeu sur l'accueil (`HomeScreen` / `GameCard`). */
export type HomeGameCopy = {
  title: string;
  tagline: string;
  meta: readonly string[];
  cta: string;
};

/** Les 8 points cardinaux, dans l'ordre N, NE, E, SE, S, SO/SW, O/W, NO/NW (pas de nord). */
export type CardinalLabels = readonly [string, string, string, string, string, string, string, string];

export type Translations = {
  common: {
    /** Nom affiche comme point de depart quand la position de l'appareil est utilisee. */
    yourPosition: string;
    pts: string;
    record: (score: string) => string;
  };
  /** Les 8 points cardinaux abreges, pour formatBearing (ex. "S · 173°"). */
  cardinals: CardinalLabels;
  /** Lettre unique pour l'ouest sur le cadran de la boussole ("O" en francais, "W" en anglais). */
  compassWestLabel: string;
  compassAccessibilityLabel: string;
  home: {
    tagline: string;
    settingsButtonLabel: string;
    games: {
      compass: HomeGameCopy;
      clues: HomeGameCopy;
    };
  };
  setup: {
    screenTitle: string;
    back: string;
    start: string;
    playersSection: { title: string; hint: string };
    playerNameAccessibility: (index: number) => string;
    categoriesTitle: string;
    categories: Record<Category, string>;
    difficultyTitle: string;
    difficultyHint: string;
    difficulties: Record<Difficulty, string>;
    zoneTitle: string;
    zones: Record<Zone, { label: string; description: string }>;
    roundsTitle: string;
    modeTitle: string;
    distanceModes: {
      distance: { label: string; description: string };
      inclination: { label: string; description: string };
    };
    optionsTitle: string;
    toggles: {
      liveCompass: { label: string; description: string };
      useGps: { label: string; description: string };
      showCountry: { label: string; description: string };
      allowRevision: { label: string; description: string };
      hideOtherAnswers: { label: string; description: string };
    };
    availability: (available: number, rounds: number) => string;
  };
  game: {
    loading: string;
    quit: string;
    validate: string;
    next: string;
    last: string;
    round: string;
    roundOver: string;
    reality: string;
    yourAnswer: string;
  };
  placeCard: {
    hintFrom: (originName: string) => string;
    showDescription: string;
    hideDescription: string;
  };
  sliders: {
    distance: string;
    inclination: string;
  };
  roundResult: {
    truth: string;
    direction: string;
    distance: string;
    inclination: string;
    yourScore: string;
  };
  endScreen: {
    newBest: string;
    replay: string;
    menu: string;
    winner: (name: string) => string;
    tie: (names: string) => string;
    /** Mot de liaison entre deux noms a egalite ("et" / "and"). */
    and: string;
    roundBest: (name: string) => string;
    /** Titres des rangs (solo), meme ordre que RANKS dans constants/index.ts. */
    ranks: readonly [string, string, string, string, string];
  };
  settings: {
    title: string;
    languageTitle: string;
    languageOptions: { fr: string; en: string };
    aboutTitle: string;
    author: string;
    claudeMention: string;
  };
  indicesSetup: {
    screenTitle: string;
    back: string;
    start: string;
    playersSection: { title: string; hint: string };
    playerNameAccessibility: (index: number) => string;
    difficultyTitle: string;
    difficultyHint: string;
    buzzerModeTitle: string;
    buzzerModeHint: string;
    buzzerModes: Record<IndicesBuzzerMode, string>;
    answerMethodTitle: string;
    answerMethodHint: string;
    answerMethods: Record<IndicesAnswerMethod, string>;
    note: string;
  };
  indicesGame: {
    turnHint: (name: string) => string;
    roundOver: string;
    buzz: string;
    giveUp: string;
    noOneFound: (points: string) => string;
    whoBuzzes: string;
    buzzedPrompt: (name: string) => string;
    buzzedPromptTyped: (name: string) => string;
    verify: string;
    correct: string;
    wrong: string;
    scored: (name: string, points: string) => string;
    missed: (name: string, points: string) => string;
    guessPlaceholder: string;
    submitGuess: string;
    wasPlace: string;
    replay: string;
    home: string;
    clues: Record<IndicesClueId, string>;
    populationUnit: string;
    letterUnit: string;
  };
};
