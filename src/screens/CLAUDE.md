# screens/

Un dossier par ecran, rendu par une route de `app/` : `HomeScreen`, `SettingsScreen`, `SetupScreen`, `OnlineGameScreen`,
`EndScreen`, `RoomDeletedScreen`.

## Container / vue / hook

Les six ecrans se decoupent en container + vue ; `HomeScreen`, `SettingsScreen`, `RoomDeletedScreen` et `EndScreen` gardent leur
logique dans le container, et chaque vue a une story `Screens/<Name>View` (dans `doc/`). `SetupScreen` et `OnlineGameScreen`
ajoutent un hook colocalise (`useOnlineRoom.ts`, `useOnlineGame.ts`) qui porte l'etat, les effets et les actions deja resolues ; le container (`*Screen.tsx`) appelle le hook, calcule les libelles
(`useTranslation`, `useTheme`) et garde les early-returns d'ecran entier (chargement, fin, notice « room supprimee ») ; la vue
(`*View.tsx`) ne fait que du rendu (jamais d'effet ni de store metier ; `readOnly`, kick... sont decides dans le container).
`useTranslation`, `useTheme`, `useThemedStyles` et `useWindowDimensions` sont permis dans la vue. Chaque fichier de style porte
le nom de son fichier (`OnlineGameScreenView.styles.ts`). Les tests rendent le container.

## Accueil et demarrage (`HomeScreen`)

L'accueil est aussi l'ecran de demarrage. Il montre `AppTitle`, `SwayingCompass` (`HOME_COMPASS_SIZE`) et, dans un pied de hauteur
fixe (`HOME_FOOTER_HEIGHT`), la `LoadingBar` (barre simulee `buildProgressSteps`, finit a `SPLASH_MIN_MS` = 5 s sur 96-97,5 %, se
complete puis s'efface) qui laisse la place aux boutons « Jouer » et « Rejoindre » ; `/setup?join=1` ouvre directement la saisie du
code. La mascotte (reglages) est toujours en haut. `StartupSplash` (racine de `_layout.tsx`) attend que theme, langue, reglages et
nom soient lus (`useSplashGate`, plafond `SPLASH_MAX_MS` = 15 s) et ecrit `useStartup().loading` ; tant que le theme est inconnu il
ne peint que `BOOT_BACKGROUND` (pas de flash du mauvais theme). Fond natif = `expo.backgroundColor` (#0B1220).

## Preparation de partie (`SetupScreen`)

- **Nom du joueur** : un seul nom, `usePlayerName` (store persiste, hydrate dans `_layout.tsx`). `GameSettings` garde un
  `playerName` miroir (requis par `useSetupRoom`, jamais envoye dans la room) ; `onChangeName` ecrit dans les deux.
- **Pas de partie locale** : jouer seul = heberger une room *cachee* (`hostedSilently`), donc le reseau est requis.
  `startOnlineGame(run)` couvre les deux cas.
- **Rejoindre** : tant qu'aucune partie n'est rejointe, les reglages (categories, difficulte, manches, options) restent masques ;
  une fois la partie rejointe ils s'affichent en lecture seule (`SetupScreenShell`).
- **Rejouer** (`FinalStandings`) : l'hote fait `restartRoom` (`screen: 'options'`, rien d'autre) ; `useOnlineRoomSession` fait reculer
  chaque appareil (`router.back()`, jamais si le store est deconnecte) vers l'ecran de preparation reste monte dessous.
- **L'hote quitte** : `handleQuit` supprime la room ; les joiners voient « l'hote a quitte » puis retournent a l'accueil (clic ou 2 s).
  L'ecran de jeu rend `null` une fois deconnecte.

## Ecran de jeu (`OnlineGameScreen`)

`useOnlineRoomSession` (`helpers/roomHooks.ts`) donne l'etat de la room, l'hote, les joueurs dans l'ordre d'arrivee, la redirection
« room supprimee » et `handleQuit` ; `useGuessDraft` garde le brouillon de reponse.

**Mode voyage** (`travel`, reglage hote, defaut faux ; absent = faux) : le tour 1 part du depart habituel, chaque tour suivant part du
**lieu du tour precedent**. Le depart se lit en UN seul endroit : `originForRound(gameState, travel)` (`helpers/rounds.ts`).
`travelFromPlace` alimente `GameHeader` (`location`) et l'overlay `useTravelNotice` (une fois par tour, 3 s ou clic, jamais au tour 1).
`separateRepeats` evite deux fois le meme lieu de suite. Aucun champ de plus a ecrire pour un joueur non hote.
