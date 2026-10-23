import type { Category, Difficulty, ClueId } from '@/types';

export type Language = 'fr' | 'en';

/** Contenu d'une carte de jeu de l'accueil (`GameCard`). */
export type HomeGameCopy = {
  title: string;
  tagline: string;
  cta: string;
};

/** Les 8 points cardinaux dans l'ordre N, NE, E, SE, S, SO, O, NO. */
export type CardinalLabels = readonly [string, string, string, string, string, string, string, string];

export type Translations = {
  common: {
    /** Nom du point de depart quand la position de l'appareil est utilisee. */
    yourPosition: string;
    pts: string;
    /** Formulation commune de "personne n'a trouve" ; `NoOneFoundText` choisit selon le nombre de joueurs. */
    noOneFound: string;
    /** Solo : nomme l'unique joueur. */
    soloNotFound: (name: string) => string;
    /** Notice courte quand une action de jeu n'a pas atteint la room. */
    actionFailed: string;
  };
  /** Points cardinaux abreges pour `formatBearing` (ex. "S · 173°"). */
  cardinals: CardinalLabels;
  /** Lettre de l'ouest sur le cadran ("O" en fr, "W" en en). */
  compassWestLabel: string;
  compassAccessibilityLabel: string;
  /** Slogan sous le titre (accueil et splash, `AppTitle`). */
  app: { tagline: string };
  home: {
    settingsButtonLabel: string;
    /** Ligne du nombre de joueurs d'une carte de jeu. */
    playersRange: (max: number) => string;
    games: {
      compass: HomeGameCopy;
      clues: HomeGameCopy;
    };
  };
  setup: {
    back: string;
    /** Bouton du bas (et croix) des ecrans de preparation : quitte la preparation. */
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
    /** Solo (defaut), heberger (un code est genere) ou rejoindre (saisir un code). En rejoignant, les autres sections sont en lecture seule (`readOnlyNotice`). */
    online: {
      solo: string;
      host: string;
      join: string;
      /** Remplace le libelle de `join` une fois connecte : le code est verrouille, cette puce est la seule sortie. */
      leave: string;
      generating: string;
      codePlaceholder: string;
      invalidCode: string;
      /** Sous le champ nom : un autre joueur de la room a deja ce nom. */
      nameTaken: string;
      joined: (code: string) => string;
      hostBadge: (name: string) => string;
      /** Libelle d'accessibilite du bouton d'expulsion. */
      removePlayer: (name: string) => string;
      /** Libelle du mini bouton d'expulsion. */
      kick: string;
      /** Au joiner expulse par l'hote. */
      kickedNotice: string;
      /** Au joiner quand la room a disparu. */
      roomDeletedNotice: string;
      /** Qui perd la connexion en partie la quitte (`useRoomPresence`). */
      connectionLostNotice: string;
      /** A l'hote quand le lancement a echoue : rien n'a demarre, le bouton relance. */
      startFailedNotice: string;
    };
    /** Bref message quand un joiner touche une option en lecture seule (`notifyReadOnly`). */
    readOnlyNotice: string;
    optionsTitle: string;
    toggles: {
      liveCompass: { label: string; description: string };
      useGps: { label: string; description: string };
      showCountry: { label: string; description: string };
      travel: { label: string; description: string };
    };
    /** Latitude/longitude saisies a la main quand "Utiliser ma position" est desactive. */
    customOrigin: { latitude: string; longitude: string };
  };
  game: {
    loading: string;
    quit: string;
    round: string;
    validate: string;
    /** Jeux a tour de role : au detenteur du tour qui a deja propose, seul un indice reste possible. */
    alreadyGuessed: string;
    next: string;
    last: string;
    roundOver: string;
    /** Va a la section cap pendant la reponse, sans valider. */
    nextStep: string;
    /** Revient a la section distance, sans valider. */
    previousStep: string;
    /** Remplace les initiales sur l'onglet du joueur actif. */
    playerTurn: (name: string) => string;
    /** Mode voyage, des le tour 2 : ou se trouve le joueur (lieu precedent), dans le header. */
    youAreAt: (name: string) => string;
    /** Une fois soumis, en attendant les autres : remplace le bouton Valider du footer. */
    waitingForOthers: string;
  };
  placeCard: {
    /** Libelle d'accessibilite du badge "W" (page Wikipedia du lieu, reveal seulement). */
    wikiLabel: string;
  };
  sliders: {
    distance: string;
  };
  reactions: {
    /** Libelle d'accessibilite d'un bouton emoji du footer. */
    send: (emoji: string) => string;
    /** Libelle d'accessibilite du bouton rond qui ouvre/ferme les emojis. */
    toggle: string;
  };
  roundResult: {
    truth: string;
    direction: string;
    distance: string;
    yourScore: string;
    /** Libelle d'accessibilite du bouton ⓘ qui affiche l'explication du score. */
    scoringInfoLabel: string;
    /** Explication du score en trois parties : celle du milieu (loxodromie) est le lien Wikipedia. */
    scoringInfoBefore: string;
    rhumbLineLabel: string;
    scoringInfoAfter: string;
    rhumbLineUrl: string;
    /** Affiche a la place de "(+0°)" pour un cap exact, en anglais dans les deux langues volontairement. */
    perfect: string;
  };
  endScreen: {
    /** Titre de l'ecran de fin de chaque jeu. */
    title: string;
    /** Titre du recap manche par manche. */
    recapTitle: string;
    /** Boutons de fin : retour au salon avec tous / quitter. */
    replay: string;
    quit: string;
    winner: (name: string) => string;
    /** Comme `winner`, pour le joueur local (`FinalStandings`, `localName`). */
    youWin: string;
    tie: (names: string) => string;
    /** Mot de liaison entre deux noms a egalite ("et" / "and"). */
    and: string;
  };
  /** Question de difficulte du mode dev, posee apres une manche. */
  devFeedback: {
    placeQuestion: (name: string) => string;
    /** Fond : le toucher ferme la question sans repondre. */
    dismiss: string;
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
    devTitle: string;
    devLabel: string;
    dataTitle: string;
    /** Dit ce que contient le stockage local, juste avant le bouton qui l'efface. */
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
    /** Idem, chez le joueur qui l'a trouve. */
    youScored: (points: string) => string;
    missed: (name: string, points: string) => string;
    guessPlaceholder: string;
    submitGuess: string;
    wasPlace: string;
    continueLabel: string;
    /** En ligne : montre au joueur dont c'est le tour. */
    /** En ligne : ce que voit un joueur sans la main quand il touche un indice. */
    notYourTurn: (name: string) => string;
    clues: Record<ClueId, string>;
    isCapitalYes: string;
    isCapitalNo: string;
    populationUnit: string;
  };
  /** Ecran de demarrage : le libelle de chargement. */
  splash: {
    loading: string;
  };
};
