import type { Category, Difficulty, IndicesAnswerMethod, IndicesClueId } from '@/types';

export type Language = 'fr' | 'en';

/** Content of a game card on the home screen (`HomeScreen` / `GameCard`). */
export type HomeGameCopy = {
  title: string;
  tagline: string;
  meta: readonly string[];
  cta: string;
};

/** The 8 cardinal points, in order N, NE, E, SE, S, SO/SW, O/W, NO/NW (no "north" entry). */
export type CardinalLabels = readonly [string, string, string, string, string, string, string, string];

export type Translations = {
  common: {
    /** Name shown as the starting point when the device's position is used. */
    yourPosition: string;
    pts: string;
  };
  /** The 8 abbreviated cardinal points, for formatBearing (e.g. "S · 173°"). */
  cardinals: CardinalLabels;
  /** Single letter for west on the compass dial ("O" in French, "W" in English). */
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
    categoriesAvailability: (available: number) => string;
    categories: Record<Category, string>;
    difficultyTitle: string;
    difficultyHint: string;
    difficulties: Record<Difficulty, string>;
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
    /** Latitude/longitude entered by hand when "Use my position" is off. */
    customOrigin: { latitude: string; longitude: string };
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
    /** Navigates to the "heading" (compass) section while answering, without submitting. */
    nextStep: string;
    /** Goes back to the "distance"/"inclination" section while answering, without submitting. */
    previousStep: string;
    /** Replaces the initials on the active player's tab ("Matou's turn"). */
    playerTurn: (name: string) => string;
  };
  placeCard: {
    /** Accessibility label for the "W" badge that opens the place's Wikipedia page (reveal only). */
    wikiLabel: string;
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
    /** Accessibility label for the ⓘ button that shows/hides scoringInfo. */
    scoringInfoLabel: string;
    scoringInfo: string;
    /** Shown instead of "(+0°)" for an exact heading guess — kept in English in both
     * languages, on purpose (see git history). */
    perfect: string;
  };
  endScreen: {
    replay: string;
    menu: string;
    winner: (name: string) => string;
    tie: (names: string) => string;
    /** Connector word between two tied names ("et" / "and"). */
    and: string;
    roundBest: (name: string) => string;
    /** Rank titles (solo), same order as RANKS in constants/index.ts. */
    ranks: readonly [string, string, string, string, string];
  };
  settings: {
    title: string;
    languageTitle: string;
    languageOptions: { fr: string; en: string };
    appearanceTitle: string;
    appearanceOptions: { night: string; day: string };
    aboutTitle: string;
    author: string;
    claudeMention: string;
    dataTitle: string;
    /** Explains precisely what local storage contains, right before the button that clears it. */
    dataHint: string;
    clearData: string;
    dataCleared: string;
  };
  indicesSetup: {
    screenTitle: string;
    back: string;
    start: string;
    playersSection: { title: string; hint: string };
    playerNameAccessibility: (index: number) => string;
    difficultyTitle: string;
    difficultyHint: string;
    answerMethodTitle: string;
    answerMethods: Record<IndicesAnswerMethod, string>;
    optionsTitle: string;
    toggles: {
      startWithFirstLetter: { label: string; description: string };
    };
  };
  indicesGame: {
    roundOver: string;
    pointsAtStake: (points: string) => string;
    buzz: string;
    giveUp: string;
    noOneFound: string;
    buzzedPrompt: (name: string) => string;
    verify: string;
    cancel: string;
    correct: string;
    wrong: string;
    scored: (name: string, points: string) => string;
    missed: (name: string, points: string) => string;
    guessPlaceholder: string;
    submitGuess: string;
    wasPlace: string;
    continueLabel: string;
    home: string;
    clues: Record<IndicesClueId, string>;
    isCapitalYes: string;
    isCapitalNo: string;
    populationUnit: string;
    finalScoreTitle: string;
  };
};
