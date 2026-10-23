@AGENTS.md

# Azimuth Quiz

Un seul jeu, **Boussole** (`compass`), **toujours en ligne** (une room par partie, meme seul), jusqu'a 10 joueurs et 20 manches : un lieu s'affiche, chacun vise un cap et estime la distance depuis un point de depart.

Nom de code (`compass`) et nom affiche (Boussole) different volontairement (traductions dans `fr.ts`). Web statique sur GitHub Pages
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
  components/   # hors jeu : ui/, HomeScreen, SettingsScreen, Compass, EarthSection, GameHeader/GameFooter, setup/...
  data/         # valeurs partagees (score/geo, options, palette), theme.ts, data/firestore/ (types, read.ts, numbering.ts, journal.ts...)
  games/<jeu>/  # screens/, components/, helpers/, firebase/ (room.ts, places.ts), constants.ts
  firebase/     # TOUT ce qui touche Firebase/Firestore : client.ts (app, db, auth), roomApi.ts (createRoomApi), roomCode.ts, errorSink.ts, groupCounts.ts, groupedDraw.ts
  store/        # stores Zustand de room : createRoomStore.ts (etat), actions.ts (actions), types.ts + compassRoomStore.ts
  helpers/      # sans Firebase (geo, storage, useOnlineRoomSession...)
  settings/     # GameSettings (store Zustand singleton), usePlayerName
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

Collection `rooms`, champ `game` (`'compass'`) immuable, fixe a la creation. Un code d'un autre jeu est refuse a la jonction.

- **Firestore** : `firebase/roomApi.ts` (`createRoomApi(game)`) ; chaque `games/<jeu>/firebase/room.ts` le lie et ajoute l'etat de
  manche. **Tout champ qu'un joueur non hote ecrit doit figurer dans sa liste de champs** de `firestore.rules`
  (`compassPlayer`), sinon l'ecriture est refusee et l'action « revient ».
- **Store** : `store/` (`createRoomStore.ts` = etat, `actions.ts` = connect/disconnect/drapeaux, store de Boussole : `compassRoomStore.ts`). **Setup** : `components/setup/useSetupRoom` + sections `*Section`.
- **Ecran de jeu** : `useOnlineRoomSession` (etat, hote, joueurs dans l'ordre d'arrivee, redirection « room supprimee », `handleQuit`), `useGuessDraft`.
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

Firestore est la **seule source** (lieux) : aucun JSON embarque, **aucun repli** si Firestore echoue. Donnees
**dupliquees expres** (un document par lieu porte tout ce dont une manche a besoin) et numerotees. **Toute modification de donnees
(copies, numerotation, compteurs, `dataVersion`, journal) : suivre le skill `firestore-data`** ; l'admin (`admin/src/data.ts`) le fait deja.

Collections : `places/{cle}` (3 lettres, permanente), `countries/{ISO}` (laisse en base, plus edite par l'admin ni lu par le jeu ; le nom fr/en reste copie dans `places.country`, lu par le jeu),
`meta/*` (`compassCounts`, `dataVersion`), `journal/*` (admin), `errors`,
`rooms/*`. Le jeu ne lit que `places`, `meta`, `rooms`. Types : `data/firestore/types.ts`. Restes de l'ancien mode Indices toujours en base mais ignores du code : champs `clues`/`personality`/`wordplay` des lieux, `personalityJobs`, `meta/cluesCounts`, `devFeedback`.

**Tirage** (`firebase/groupedDraw.ts` + `firebase/groupCounts.ts` + `helpers/groupCursors.ts`, pour Boussole) : l'hote tire seul. Groupe =
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

## Erreurs de jeu

Une ecriture Firestore qui echoue ne s'avale pas : `.catch(reporting('jeu.action', { room }))` (`helpers/reportError.ts`), jamais
`.catch(() => {})`. `kind: 'game'` prevent le joueur (`ErrorNoticeHost`) ; `kind: 'background'` (presence, saisie, nettoyage) ne
fait que `console.debug` (en dev, `console.error` = toast rouge). Toutes vont dans la collection `errors` (`firebase/errorSink.ts`,
installe dans `_layout.tsx`), dedupliquees (10 s jeu, 60 s fond). Les regles exigent le meme lot que deux compteurs du jour
(`errorQuota` : 30 par appareil, 1000 au total). Hors journal et `dataVersion`. Lues dans la page admin « Erreurs » (nettoyage des
plus de 30 jours, pas de TTL : exige la facturation Firebase).

## Ecrans et UI

- **`Screen`** : `header`/`footer` hors du `ScrollView`. Piege : un `ScrollView` horizontal dans un `header` s'etire sur
  react-native-web sans `style={{ flexGrow: 0, flexShrink: 0 }}` .
- **Theme** : `night` et `day`, fond uni, persiste (`ThemeProvider`, cle `azimuthquiz:theme`). `useThemedStyles(createStyles)` est
  le pattern. Police unique `FONT_FAMILY` ; un composant SVG lit `typography.<token>.fontFamily` et la passe a `<SvgText>`.
- **Admin** (`admin/`, Vite, `/azimuth-quiz/admin/`) : une page statique par onglet (`places`, `globe`, `errors`), declaree dans `admin/src/pageList.ts` ; lit une copie locale (IndexedDB) tenue par le journal
  (skill `firestore-data`).
  - **Monde** (`GlobeView/`) : three.js (chunk Vite propre), lieux lus dans la copie locale (ronds = villes, etoiles = capitales,
    carres = reste), niveau de detail selon la distance camera (constantes de `constants.ts`), clic = la meme carte que la liste
    (`PlacesView/PlaceCard` + `usePlaceEditing`). `GlobeScene.ts` possede three.js, logique pure dans `helpers.ts`. Vitest remplace `three`.
- **Storybook** : stories colocalisees (`src/**/<Name>.stories.tsx`, config `admin/.storybook`, `npm run stories`), code reel via
  `source(code)` + `<Story>.source.md` (skill personnel `storybook-story`). Menu : `Common`, `Compass`, `Setup`, `UI`
  (ordre dans `admin/.storybook/preview.tsx` : y ajouter toute nouvelle section). Un composant dumb a sa story, pas les containers. Le chrome de Storybook a un theme classique clair/sombre (`admin/.storybook/manager.ts`, suit le bouton « Theme ») ; le theme du jeu (night/day) ne sert qu'aux composants de la preview.

## Build, deploiement, qualite

- **Web** : `app.json` `web.output: "static"` + `experiments.baseUrl: "/azimuth-quiz"` ; `@expo/metro-runtime` requis.
  `.github/workflows/deploy-pages.yml` publie jeu, admin (`dist/admin/`) et Storybook a chaque push sur `master`.
- **Accueil = ecran de demarrage** : plus de splash a part. `HomeScreen` montre `AppTitle`, `SwayingCompass` (aiguille qui oscille, `HOME_COMPASS_SIZE`) et, dans un pied de hauteur fixe (`HOME_FOOTER_HEIGHT`), la `LoadingBar` (barre simulee `buildProgressSteps`, finit a `SPLASH_MIN_MS` = 5 s sur 96-97,5 %, se complete puis s'efface) qui laisse la place aux boutons « Jouer » / « Rejoindre » (`/setup?join=1` ouvre directement la saisie du code). La mascotte (reglages) est toujours en haut. `StartupSplash` (racine de `_layout.tsx`) attend que theme, langue, reglages et nom soient lus (`useSplashGate`, plafond `SPLASH_MAX_MS` = 15 s) et ecrit `useStartup().loading` ; tant que le theme est inconnu il ne peint que `BOOT_BACKGROUND` (pas de flash du mauvais theme) ; fond natif = `expo.backgroundColor` (#0B1220).
- **Rejoindre une partie** : en mode rejoindre, les reglages (categories, difficulte, manches, options) restent masques tant qu'aucune partie n'est rejointe, puis s'affichent en lecture seule (`SetupScreenShell`).
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
