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
      contour: HomeGameCopy;
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
    animationsToggle: { label: string; description: string };
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
    pointsAtStake: (points: string) => string;
    buzz: string;
    giveUp: string;
    /** Solo play only: names the one player instead of the generic "nobody" (there's no one
     * else it could have been). */
    soloNotFound: (name: string) => string;
    noOneFound: string;
    buzzedPrompt: (name: string) => string;
    verify: string;
    cancel: string;
    correct: string;
    wrong: string;
    /** Shown on the full-screen attribution overlay right after "Valider" (typed mode only),
     * before picking who answered — only on a correct guess, nothing shown for a wrong one. */
    resultOk: string;
    /** Prompt above the player buttons on that same overlay. */
    whoAnswered: string;
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
  contourSetup: {
    screenTitle: string;
    back: string;
    start: string;
    playersSection: { title: string; hint: string };
    playerNameAccessibility: (index: number) => string;
    placesCountTitle: string;
    placesCountHint: string;
    difficultyTitle: string;
    difficultyHint: string;
  };
  contourGame: {
    /** Shown in the country-identity slot during the 'guess' phase, in place of the (not yet
     * known) country name/flag. */
    guessPrompt: string;
    /** The shared "reveal a hint" icon button, inline with the guess input, clickable by any
     * player — reveals one more of the 4 on-board hint tiers each click (every neighbor's icon,
     * then its name, then the target country's own flag, then its name) and disappears once all
     * 4 are out. */
    hintButton: string;
    guessPlaceholder: string;
    /** Shown right after "Valider", before attribution — whether the typed text matched. */
    resultOk: string;
    resultNotOk: string;
    /** Prompt above the player tabs used to attribute the just-validated guess to whoever typed
     * it — scores them if correct, deducts CONTOUR_WRONG_GUESS_PENALTY if not. */
    whoAnswered: string;
    /** A wrong guess, naming who it got attributed to — doesn't end anything, shown until the
     * next attempt. */
    wrongGuess: (name: string) => string;
    /** Shown alongside the "Continuer" button once the 4th hint tier (the country's own name) is
     * revealed: nobody scores for this part, same as the old give-up — an explicit confirm
     * before moving on to the city phase, consistent with the rest of the app's button style. */
    noOneGuessed: string;
    /** Instruction shown just above the Valider/Continuer button during a city step, naming the
     * place to mark and which one it is out of how many this round (1-indexed). Split around the
     * place name (rather than one interpolated string) so the component can render that name in
     * its own bigger/bolder Text — see ContourGameScreen.tsx's own render. */
    cityHint: { prefix: (placeNumber: number, totalPlaces: number) => string; suffix: string };
    /** Short labels for the results card's guess/city point breakdown. */
    guessLabel: string;
    cityLabel: string;
    /** Advances from one place's guess-vs-solution comparison to the next place (or the final
     * reveal, on the last one) — single shared button, not per-player. */
    continueLabel: string;
    finalScoreTitle: string;
    home: string;
  };
};
