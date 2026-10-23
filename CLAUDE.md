@AGENTS.md

# Azimuth Quiz

Deux jeux de geographie, **toujours en ligne** (une room par partie, meme seul), jusqu'a 10 joueurs et 20 manches :

| Nom affiche | Dossier | Principe |
|---|---|---|
| Boussole | `compass` | un lieu s'affiche, chacun vise un cap et estime la distance depuis un point de depart |
| Indices | `clues` | un lieu cache, indices devoiles a tour de role, on devine son nom |

Nom de code et nom affiche different volontairement (traductions dans `fr.ts`). Web statique sur GitHub Pages
(`https://mathieujullien77190.github.io/azimuth-quiz/`) + builds natifs. Repo `mathieujullien77190/azimuth-quiz`, un seul
contributeur, commits directs sur `master`.

## Structure

Convention du skill personnel `react-structure` (hors depot) : un composant = un dossier `index.ts` + `<Name>.tsx` (export nomme) +
`helpers.ts` + `constants.ts` + `types.ts` + `styles.ts` (seul `createStyles`, aucune logique). Dans `screens/<Screen>/`
(container ET vue), chaque fichier a son style nomme d'apres lui (`OnlineGameScreenView.styles.ts`). Alias `@/` → `src/`.
Identifiants de code en anglais.

```
src/
  app/          # Expo Router : _layout (providers + Stack), routes = re-exports minces
  components/   # hors jeu : ui/, HomeScreen, SettingsScreen, Compass, EarthSection, PlayerTabs, GameHeader/GameFooter, setup/...
  data/         # valeurs partagees (score/geo, options, palette), theme.ts, data/firestore/ (types, read.ts, numbering.ts, journal.ts...)
  games/<jeu>/  # screens/, components/, helpers/, firebase/ (room.ts, places.ts), constants.ts
  firebase/     # TOUT ce qui touche Firebase/Firestore : client.ts (app, db, auth), roomApi.ts (createRoomApi), roomCode.ts, errorSink.ts, devFeedback.ts, groupCounts.ts, groupedDraw.ts
  store/        # stores Zustand de room : createRoomStore.ts (etat), actions.ts (actions), types.ts + compassRoomStore.ts, cluesRoomStore.ts
  helpers/      # commun aux 2 jeux, sans Firebase (geo, storage, useOnlineRoomSession...)
  settings/     # GameSettings, ClueSettings (stores Zustand singletons), usePlayerName
  themes/       # night.ts, day.ts, fonts.ts, ThemeContext
  types/
admin/          # outil interne (app Vite a part), importe `src/` via le meme alias `@/`
```

Les dossiers `firebase/` (`src/firebase/`, `games/<jeu>/firebase/`) importent `firebase/firestore` et restent HORS de tout barrel (Jest plante a l'import) : import direct. Les stores par jeu (`store/*RoomStore.ts`) en dependent aussi (via `room.ts`).

Apres tout renommage/deplacement dans `src/` : `(cd admin && npx tsc --noEmit -p . && npm run build)`.

### Smart / dumb
`SetupScreen` et `OnlineGameScreen` : un hook colocalise (`useOnlineRoom.ts`, `useOnlineGame.ts`) porte etat, effets et actions ;
le container (`*Screen.tsx`) appelle le hook, calcule les libelles (`useTranslation`/`useTheme`) et garde les early-returns d'ecran
entier ; la vue (`*View.tsx`) ne fait que du rendu (jamais d'effet ni de store metier ; `readOnly`, kick... decides dans le
container). `useTranslation`, `useTheme`, `useThemedStyles`, `useWindowDimensions` permis dans la vue. Les tests rendent le container.

### Nom du joueur
Un seul nom : `usePlayerName` (store persiste, hydrate dans `_layout.tsx`). Chaque jeu garde un `playerName` miroir dans ses
reglages (requis par `useSetupRoom`, jamais envoye dans la room) ; `onChangeName` ecrit dans les deux.

## Parties en ligne

Collection `rooms`, champ `game` (`'compass' | 'clues'`) immuable : il choisit les regles de `firestore.rules`. Un code d'un autre
jeu est refuse a la jonction.

- **Firestore** : `firebase/roomApi.ts` (`createRoomApi(game)`) ; chaque `games/<jeu>/firebase/room.ts` le lie et ajoute l'etat de
  manche. **Tout champ qu'un joueur non hote ecrit doit figurer dans sa liste de champs** de `firestore.rules`
  (`turnBasedPlayer`, `compassPlayer`), sinon l'ecriture est refusee et l'action « revient ».
- **Store** : `store/` (`createRoomStore.ts` = etat, `actions.ts` = connect/disconnect/drapeaux, un store par jeu : `compassRoomStore.ts`, `cluesRoomStore.ts`). **Setup** : `components/setup/useSetupRoom` + sections `*Section`.
- **Ecran de jeu** : `useOnlineRoomSession` ; jeux a tour de role : `useHostTurnScoring` (l'hote seul ecrit `totalScores`),
  `useHostTurnRecovery`, `useGuessDraft`, `nextPlayerUid`, `useTransientFlag`. **L'ordre des joueurs tourne par manche**
  (Indices) : `playersForRound(onlinePlayers, roundIndex)` = ordre d'arrivee decale du numero de manche, deduit par chaque
  appareil. Les hooks exposent `roundPlayers` (`PlayerTabs`, `turnIndex`) ; `nextPlayerUid` reste sur l'ordre d'arrivee.
- **Pas de partie locale** : seul = room *cachee* (`hostedSilently`), donc reseau requis. `startOnlineGame(run)` couvre les deux cas.
- **Un joueur part** (quitte, expulse, coupure) : l'hote efface ses donnees de manche (`useHostPruneLeavers`,
  `pruneRoomPlayerData`) ; s'il revient, c'est un nouveau joueur.
- **Coupure reseau** (`useRoomPresence`) : heartbeat `players.{uid}.lastSeen` toutes les 30 s ; qui perd la connexion quitte
  (soi-meme apres 90 s sans ecriture acquittee, un joiner invisible est retire, l'hote perdu fait quitter les joiners).
- **Rejouer** (`FinalStandings`) : l'hote fait `restartRoom` (`screen: 'options'`, rien d'autre) ; `useOnlineRoomSession` fait
  reculer chaque appareil (`router.back()`, jamais si le store est deconnecte) vers l'ecran de preparation reste monte dessous.
- **Reactions** : `ReactionBar` (bouton 😀 en `position: absolute; bottom: '100%'` dans `GameFooter`, colonne d'emojis
  `REACTION_EMOJIS` qui reste ouverte jusqu'au clic du bouton) ecrit le champ unique `reaction` `{ uid, emoji, seq }`
  (`sendReaction`, `useRoomReactions` : 1 s entre deux envois, reaction presente a l'ouverture ignoree) ; `ReactionOverlay` l'affiche
  chez tous (bulle montante 2,5 s + nom). Regle `reactionOk` (uid = soi, emoji <= 8 car., `seq` entier) : **a deployer avec les regles**.
- **L'hote quitte** : `handleQuit` supprime la room ; les joiners voient « l'hote a quitte » puis retournent a l'accueil (clic ou 2 s).

## Donnees Firestore

Firestore est la **seule source** (lieux, devinettes, metiers) : aucun JSON embarque, **aucun repli** si Firestore echoue. Donnees
**dupliquees expres** (un document par lieu porte tout ce dont une manche a besoin) et numerotees. **Toute modification de donnees
(copies, numerotation, compteurs, `dataVersion`, journal) : suivre le skill `firestore-data`** ; l'admin (`admin/src/data.ts`) le fait deja.

Collections : `places/{cle}` (3 lettres, permanente), `countries/{ISO}` (edites dans l'admin, recopies dans `places.country` via
`applyCountryChange` ; le jeu ne les lit pas ; portent encore les champs de l'ancien jeu Silhouette, non lus ni effaces),
`personalityJobs/{code}`, `meta/*` (`compassCounts`, `cluesCounts`, `dataVersion`), `journal/*` (admin), `devFeedback/*`, `errors`,
`rooms/*`. Le jeu ne lit que `places`, `meta`, `rooms`. Types : `data/firestore/types.ts`.

**Tirage** (`firebase/groupedDraw.ts` + `firebase/groupCounts.ts` + `helpers/groupCursors.ts`, commun aux 2 jeux) : l'hote tire seul. Groupe =
`category` × `difficulty`, numerote 1..taille (`numbering.ts`), tailles dans `meta/*Counts`, **un curseur par groupe** par appareil
(AsyncStorage, boucle). Plusieurs categories : `splitEvenly`. Lecture : UNE requete `or` par tranche de 30 numeros. L'anglais releve
d'un cran les lieux francais (`effectiveDifficulty`). Echec (Firestore ou trop peu d'elements) : le tirage rejette, `starting`
retombe a faux, notice `startFailedNotice`, curseurs inchanges. Index dans `firestore.indexes.json`.

**Regles et index se deploient a part** : `npx firebase-tools deploy --only firestore:rules --project azimuth-quiz` (un push ne
les deploie pas).

## Boussole

`Guess` = `bearing` + `distanceKm`, distance **de surface**. Cap et distance **loxodromiques** (`helpers/geo.ts`), donc un peu plus
longs que l'orthodromie (jusqu'a ~21 180 km, `MAX_SURFACE_DISTANCE_KM` = 22 000). Score (`games/compass/helpers/scoring.ts`) :
courbe logarithmique, 500 pts direction + 500 pts distance. Lieux : `fetchRandomPlaces` (`games/compass/firebase/places.ts`).

**Globe3D** (`components/Globe3D/`) : vraie boule **three.js** sur surface `expo-gl`, montree d'abord quand l'appelant donne
`origin` (bouton 2D/3D), rotation au doigt, zoom a deux doigts ou +/− (`MAX_ZOOM` = 14), bouton « N » pour recentrer.
- Gestes mesures sur la **position absolue** des doigts (`Fingers`), jamais sur le cumul d'un geste ; le geste reste au globe
  (`onShouldBlockNativeResponder`, `touchAction: 'none'`).
- `scene.ts` construit la scene ; `useGlobeRenderer.ts` dessine **a la demande** (pas en boucle), camera orthographique, nord en
  haut ; `renderer.ts` (isole pour les tests) branche `WebGLRenderer` sur `expo-gl` (faux canvas sur mobile). La prop
  `backgroundColor` peint ce qui entoure la boule.
- Decor : `globeLand.ts` (Natural Earth 50 m sans Antarctique, en un seul `LineSegments`) et `globeMask.ts` (masque terre/mer
  2048x1024, RLE base 36), tous deux generes par `node scripts/globe-land.mjs` (`--dry` donne les poids). `landFill` pose le masque
  sur une coque a part. **Piege des altitudes** : une sphere a facettes creuse sous son rayon (`1 - cos(180 / segments)`), donc la
  coque (`LAND_FILL_SEGMENTS`, `LAND_FILL_ALTITUDE`) doit depasser ce creux, et le trait de cote doit depasser la coque ; un test le verifie.
- Chaque reponse = trajet a cap constant en tube (`rhumbDestination`/`routePoints`), la vraie reponse aussi (jaune, `colors.truth`).
  `buildRoutes` reconstruit les tubes au zoom (`ROUTE_THICKNESS / zoom`) ; les pastilles se remettent a taille d'ecran (`markScale`).
- Pole nord (`north`), satellite de nuit sur l'**equateur** (`orbitPoint` ; sur le grand cercle du trajet il glissait en ligne
  droite), libelles/satellite en vues par-dessus la surface (`screenPoint`).
- `three` est **ESM seulement** : `transformIgnorePatterns` de Jest (`package.json`) l'autorise, liste recopiee de `jest-expo` ; la
  recopier si le preset change a une montee de SDK.

**Mode voyage** (`travel`, reglage hote, defaut faux, absent = faux) : tour 1 depuis le depart habituel, ensuite depuis le **lieu du
tour precedent**. Depart lu en UN seul endroit : `originForRound(gameState, travel)`. `travelFromPlace` alimente `GameHeader`
(`location`) et l'overlay `useTravelNotice` (une fois par tour, 3 s ou clic, jamais au tour 1). `separateRepeats` evite deux fois le
meme lieu de suite. Aucun champ de plus pour un non-hote.

## Indices

Lieux : `fetchClueRoundPlaces` (`games/clues/firebase/places.ts`), groupes par `clues.category` (`capital`/`citiesFr`/`cities`,
`cluesCategory`). **Une manche ne lit que le lieu tire** : `cluesFromDoc` construit le `CluePlace` depuis le seul document.

- **Quels indices** : `cluesFor(place)` filtre `CLUE_ORDER`. `citiesFr` perd 5 indices (heure locale, capitale, couleurs du
  drapeau, devise, indicatif). `personality` et `wordplay` seulement si le lieu les a. `vowelsUnlocked` attend que tous les indices offerts soient pioches.
- **Globe 3D** (`globe`, 2 clics) : `Globe3D` avec `gameState.origin` ; 1er clic = boule nue + equateur + Greenwich (`land={false}`),
  2e = terres. Pas de rotation (`draggable={false}`) ; `backgroundColor` = couleur de la carte.
- **Score** : `maxScoreForRound`/`remainingScore(revealedClueIds, place)` suivent la liste reellement offerte.
- **Personnalite** : nom + metier optionnel, faits Wikipedia, `places.personality`. **Jeu de mots** : `difficulty` informative
  seulement ; `wordplayFor(place)` rend `null` si vide.
- **Saisie en direct** : le detenteur du tour ecrit `typing` (debounce 500 ms, jamais en solo ni hors tour) ; les autres le voient
  en cases MAJUSCULES, seulement si `typing.uid === turnUid`.
- **Qui s'est trompe** : `wrongGuesserName` derive de `wrongGuessUid`/`wrongGuessSeq` (jamais remis a zero entre manches).
- **Une proposition par tour** : apres une erreur, plus de proposition avant qu'un indice sorte. `wrongGuessHints` (ecrit avec
  `wrongGuessUid`/`wrongGuessSeq`, `null` a chaque debut de manche) donne `hasGuessedThisTurn` (`helpers/turnGuess.ts`) ; champ
  de reponse et « Valider » disparaissent (brouillon garde), reste `t.game.alreadyGuessed` ; verrou local avant le retour de la
  room. Le message d'erreur disparait des qu'un indice sort : `missIsFresh`. Le champ est dans `turnFields` des regles des 2 jeux.
- **« Je ne sais pas »** : hote seul (`giveUp`), meme hors tour, via `isHost()` des regles.

## Erreurs de jeu

Une ecriture Firestore qui echoue ne s'avale pas : `.catch(reporting('jeu.action', { room }))` (`helpers/reportError.ts`), jamais
`.catch(() => {})`. `kind: 'game'` prevent le joueur (`ErrorNoticeHost`) ; `kind: 'background'` (presence, saisie, nettoyage) ne
fait que `console.debug` (en dev, `console.error` = toast rouge). Toutes vont dans la collection `errors` (`firebase/errorSink.ts`,
installe dans `_layout.tsx`), dedupliquees (10 s jeu, 60 s fond). Les regles exigent le meme lot que deux compteurs du jour
(`errorQuota` : 30 par appareil, 1000 au total). Hors journal et `dataVersion`. Lues dans la page admin « Erreurs » (nettoyage des
plus de 30 jours, pas de TTL : exige la facturation Firebase).

## Mode dev : avis de difficulte

Reglages > « Mode dev » : taper `supermatou` (`DEV_CODE` dans `data/index.ts` et `firestore.rules`, la vraie barriere) garde
seulement le code (`useDevCode`, hydrate dans `_layout.tsx` ; `useDevMode` = vaut exactement le secret). Un appareil en mode dev
recoit, **une fois par manche**, `DifficultyFeedbackOverlay` (Facile / Moyen / Difficile) **apres le passage de l'hote a la manche
suivante** (ou devant le classement final), sur le lieu de la manche PRECEDENTE (`useDevFeedback`). Un tap a cote ferme sans
ecrire ; un bouton ecrit un document `devFeedback` (`sendDevFeedback`). Chaque appareil decide seul, jamais bloquant ; echec =
log `background`. Regles : creation avec le code dev et champs exacts, lecture/suppression admins. Page admin `/admin/feedback` :
directives par lieu (majorite, egalite = les deux), « Copier », « Nettoyer ». Hors journal et `dataVersion`.

## Ecrans et UI

- **`Screen`** : `header`/`footer` hors du `ScrollView`. Piege : un `ScrollView` horizontal dans un `header` s'etire sur
  react-native-web sans `style={{ flexGrow: 0, flexShrink: 0 }}` (voir `PlayerTabs.tsx`).
- **Theme** : `night` et `day`, fond uni, persiste (`ThemeProvider`, cle `azimuthquiz:theme`). `useThemedStyles(createStyles)` est
  le pattern. Police unique `FONT_FAMILY` ; un composant SVG lit `typography.<token>.fontFamily` et la passe a `<SvgText>`.
- **Admin** (`admin/`, Vite, `/azimuth-quiz/admin/`) : une page statique par onglet (`places`, `countries`, `globe`, `jobs`,
  `wordplay`, `errors`, `feedback`), declaree dans `admin/src/pageList.ts` ; lit une copie locale (IndexedDB) tenue par le journal
  (skill `firestore-data`).
  - **Pays** : `saveCountry` -> `applyCountryChange` ecrit `countries/{ISO}` et la copie `places.country` de chaque lieu dans le
    meme lot (plan pur `data/firestore/denormalize.ts`), avec journal et version. Les champs Silhouette sont reecrits tels quels.
  - **Monde** (`GlobeView/`) : three.js (chunk Vite propre), lieux lus dans la copie locale (ronds = villes, etoiles = capitales,
    carres = reste), niveau de detail selon la distance camera (constantes de `constants.ts`), clic = la meme carte que la liste
    (`PlacesView/PlaceCard` + `usePlaceEditing`). `GlobeScene.ts` possede three.js, logique pure dans `helpers.ts`. Vitest remplace `three`.
- **Storybook** : stories colocalisees (`src/**/<Name>.stories.tsx`, config `admin/.storybook`, `npm run stories`), code reel via
  `source(code)` + `<Story>.source.md` (skill personnel `storybook-story`). Menu : `Common`, `Compass`, `Clues`, `Setup`, `UI`
  (ordre dans `admin/.storybook/preview.tsx` : y ajouter toute nouvelle section). Un composant dumb a sa story, pas les containers.

## Build, deploiement, qualite

- **Web** : `app.json` `web.output: "static"` + `experiments.baseUrl: "/azimuth-quiz"` ; `@expo/metro-runtime` requis.
  `.github/workflows/deploy-pages.yml` publie jeu, admin (`dist/admin/`) et Storybook a chaque push sur `master`.
- **Splash** : `StartupSplash` (racine de `_layout.tsx`) affiche `SplashScreen` au moins `SPLASH_MIN_MS` = 5 s, jusqu'a ce que
  theme, langue, reglages, nom et code dev soient lus (`useSplashGate`), au plus `SPLASH_MAX_MS` = 15 s. Barre de chargement
  simulee (`buildProgressSteps`, finit EXACTEMENT a `SPLASH_MIN_MS` sur 96-97,5 %, complete pendant le fondu). `AppTitle` partage
  avec l'accueil (le titre ne bouge pas a la transition). Ligne de version entiere, jamais coupee. Fond `BOOT_BACKGROUND` tant que
  le theme n'est pas lu ; fond natif = `expo.backgroundColor` (#0B1220).
- **Version** : `app.json` `expo.version` + un animal par version (`expo.extra.codename` = `{ emoji, name, wiki }` ; `wiki` = article
  Wikipedia ANGLAIS de l'espece, a renseigner a chaque version ; `name` = nom complet de l'espece en ANGLAIS, kebab-case ASCII, ex.
  🦥 brown-throated-sloth). Affichage `v2.64.1 - 🦥 - brown-throated-sloth` via `versionParts`/`versionLabel`. Le skill `push` en
  choisit un nouveau a chaque montee, jamais un deja pris.
- **Android** : package `com.azimuthquiz.app` (definitif), `versionCode` incremente par EAS dans `app.json` (a commiter),
  `EXPO_PUBLIC_FIREBASE_*` dans l'environnement EAS `production` (sans elles l'app plante) ; details dans le skill `push`.
- **Natif** : `expo-gl` (globe) est autolinke mais **natif** : build EAS neuf necessaire, un `eas update` (OTA) ne suffit pas.
  Declare aussi dans `admin/vite.shared.ts` (`dedupe` + `optimizeDeps`) pour Storybook.
- **Skills du projet** (`.claude/skills/`) : `quality-check` (rapporte sans corriger), `push`, `firestore-data`. Skills
  **personnels** hors depot (`~/.claude/skills/`) : `react-structure`, `storybook-story`, `commit-push`.
- **Tests** : toujours dans un dossier `__tests__/` a cote du fichier teste (`Foo/__tests__/Foo.test.tsx`). Jest (`npx jest --coverage`, seuil **100 %**, ignore `admin/`) et Vitest dans l'admin (`cd admin && npm run
  test:coverage`, seuil **100 %** sur `admin/src`, `main.tsx` exclu). Pas de `/* istanbul ignore */` : supprimer ou reecrire le code inatteignable.
- **Avant de pousser** : `npx tsc --noEmit`, `npx expo lint`, `npx jest --coverage`, `npm run test:coverage` dans `admin/`, build
  de l'admin si du code partage a bouge. Ne jamais committer sans demande.

## Etat connu

- `npx expo lint` : 15 erreurs `react-hooks/refs` / `set-state-in-effect` dans `Compass.tsx`, `Globe3D.tsx`, `useHeading.ts`,
  `EarthSection.tsx`, `SliderTrack.tsx` : idiomes voulus (ref mis a jour a chaque rendu pour le `PanResponder`, `Animated.Value` lu
  au rendu), a ne pas corriger une par une.
- Chaque document Firestore lu reste en memoire pour la session (pas de cache disque ni d'invalidation) : une donnee modifiee
  n'apparait qu'apres rechargement.
