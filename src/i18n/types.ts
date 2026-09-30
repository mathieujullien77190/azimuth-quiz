import type { Category, ContourHintCategory, Difficulty, ClueId } from '@/types';

export type Language = 'fr' | 'en';

/** Content of a game card on the home screen (`HomeScreen` / `GameCard`). */
export type HomeGameCopy = {
  title: string;
  tagline: string;
  cta: string;
};

/** The 8 cardinal points, in order N, NE, E, SE, S, SO/SW, O/W, NO/NW (no "north" entry). */
export type CardinalLabels = readonly [string, string, string, string, string, string, string, string];

export type Translations = {
  common: {
    /** Name shown as the starting point when the device's position is used. */
    yourPosition: string;
    pts: string;
    /** Shared "nobody found it" wording (Clues' give-up, Contour's hint-tier-4 confirm) — see
     * `components/ui/NoOneFoundText`, which picks between these two depending on player count. */
    noOneFound: string;
    /** Solo play only: names the one player instead of the generic "nobody" (there's no one else
     * it could have been). */
    soloNotFound: (name: string) => string;
  };
  /** The 8 abbreviated cardinal points, for formatBearing (e.g. "S · 173°"). */
  cardinals: CardinalLabels;
  /** Single letter for west on the compass dial ("O" in French, "W" in English). */
  compassWestLabel: string;
  compassAccessibilityLabel: string;
  home: {
    tagline: string;
    settingsButtonLabel: string;
    /** Player-count line of a game card ("1 à 10 joueurs"). */
    playersRange: (max: number) => string;
    games: {
      compass: HomeGameCopy;
      clues: HomeGameCopy;
      contour: HomeGameCopy;
    };
  };
  setup: {
    back: string;
    /** The setup screens' bottom button (and close cross): leaves the game's setup. */
    quit: string;
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
    /** No player list/count picker any more — play solo (the default), host a room (a code gets
     * generated) or join one (type in a code someone else generated) instead. See
     * `helpers/room.ts`. Joining shows every other setup section read-only: the host's settings
     * apply, a joiner doesn't configure anything (see `readOnlyNotice`). */
    online: {
      solo: string;
      host: string;
      join: string;
      /** Replaces `join`'s label once actually connected (`joinStatus === 'valid'`) — the code
       * field locks at that point (see SetupScreenView), so this chip becomes the only way back
       * out of the room. */
      leave: string;
      generating: string;
      codePlaceholder: string;
      invalidCode: string;
      /** Under the name field: another player of the room already has that name. */
      nameTaken: string;
      joined: (code: string) => string;
      hostBadge: (name: string) => string;
      /** Accessibility label for the host's "kick this player" button. */
      removePlayer: (name: string) => string;
      /** Label of the host's "kick this player" mini button. */
      kick: string;
      /** Shown to a joiner (in the same splash as `readOnlyNotice`) once the host removes it. */
      kickedNotice: string;
      /** Shown to a joiner, same splash, once the room itself is gone (host started a new one). */
      roomDeletedNotice: string;
      /** Whoever loses the connection during a game leaves it (see `useRoomPresence`). */
      connectionLostNotice: string;
      /** Shown to the host when "Lancer la partie" failed (e.g. the places could not be fetched):
       * nothing was started, pressing the button again retries. */
      startFailedNotice: string;
    };
    /** Shown briefly (see SetupScreen's `notifyReadOnly`) when a joiner taps a read-only option. */
    readOnlyNotice: string;
    optionsTitle: string;
    toggles: {
      liveCompass: { label: string; description: string };
      useGps: { label: string; description: string };
      showCountry: { label: string; description: string };
    };
    /** Latitude/longitude entered by hand when "Use my position" is off. */
    customOrigin: { latitude: string; longitude: string };
  };
  game: {
    loading: string;
    quit: string;
    round: string;
    validate: string;
    next: string;
    last: string;
    roundOver: string;
    /** Navigates to the "heading" (compass) section while answering, without submitting. */
    nextStep: string;
    /** Goes back to the "distance" section while answering, without submitting. */
    previousStep: string;
    /** Replaces the initials on the active player's tab ("Matou's turn"). */
    playerTurn: (name: string) => string;
    /** Shown once this device has submitted, while other online players haven't yet
     * (`OnlineGameScreen`) — replaces the footer's Valider button. */
    waitingForOthers: string;
  };
  placeCard: {
    /** Accessibility label for the "W" badge that opens the place's Wikipedia page (reveal only). */
    wikiLabel: string;
  };
  sliders: {
    distance: string;
  };
  roundResult: {
    truth: string;
    direction: string;
    distance: string;
    yourScore: string;
    /** Accessibility label for the ⓘ button that shows/hides scoringInfo. */
    scoringInfoLabel: string;
    scoringInfo: string;
    /** Shown instead of "(+0°)" for an exact heading guess — kept in English in both
     * languages, on purpose (see git history). */
    perfect: string;
  };
  endScreen: {
    /** Title of every game's end screen. */
    title: string;
    /** Heading of the round-by-round recap (who was best at what). */
    recapTitle: string;
    menu: string;
    winner: (name: string) => string;
    /** Same as `winner`, but for the local device's own player — no need to name them to
     * themselves (see `FinalStandings`' `localName`). */
    youWin: string;
    tie: (names: string) => string;
    /** Connector word between two tied names ("et" / "and"). */
    and: string;
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
  cluesSetup: {
    screenTitle: string;
    start: string;
    difficultyTitle: string;
    difficultyHint: string;
    optionsTitle: string;
    toggles: {
      startWithFirstLetter: { label: string; description: string };
    };
  };
  cluesGame: {
    pointsAtStake: (points: string) => string;
    giveUp: string;
    scored: (name: string, points: string) => string;
    /** Same, on the device of the player who found it. */
    youScored: (points: string) => string;
    missed: (name: string, points: string) => string;
    guessPlaceholder: string;
    submitGuess: string;
    wasPlace: string;
    continueLabel: string;
    /** Online only: shown to the player whose turn it is right now. */
    /** Online only: what a player who isn't the turn-holder is told when they tap a clue. */
    notYourTurn: (name: string) => string;
    clues: Record<ClueId, string>;
    isCapitalYes: string;
    isCapitalNo: string;
    populationUnit: string;
  };
  contourSetup: {
    screenTitle: string;
    start: string;
    playersSection: { title: string; hint: string };
    playerNameAccessibility: (index: number) => string;
    difficultyTitle: string;
    difficultyHint: string;
    hintCategoriesTitle: string;
    hintCategoriesHint: string;
    hintCategories: Record<ContourHintCategory, string>;
  };
  contourGame: {
    /** Shown in the country-identity slot during the 'guess' phase, in place of the (not yet
     * known) country name/flag. */
    guessPrompt: string;
    /** The shared "reveal a hint" icon button, inline with the guess input, clickable by any
     * player — reveals the next hint of the round each click (a more precise outline, the neighbors,
     * the cities, the capital, depending on the categories picked in the setup), the last one
     * revealing the country itself. */
    hintButton: string;
    /** Online only: the turn-holder's banner, "Zoé's turn…" (everyone else waits). */
    waitingForTurn: (name: string) => string;
    /** Online only: round result when someone found the country ("Zoé scores 375 points!"). */
    found: (name: string, points: string) => string;
    /** Online only: what a correct guess would earn right now, dropping with each hint. */
    pointsAtStake: (points: string) => string;
    guessPlaceholder: string;
    /** A wrong guess, naming who it got attributed to — doesn't end anything, shown until the
     * next attempt. */
    wrongGuess: (name: string) => string;
    /** Moves on from a give-up (tier 4 confirmed) to the final reveal — single shared button, not
     * per-player. */
    continueLabel: string;
  };
};
