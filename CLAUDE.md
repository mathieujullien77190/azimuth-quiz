@AGENTS.md

# Azimuth Quiz

Jeu de geographie : un lieu s'affiche, le joueur vise son cap a la boussole et estime
la distance depuis un point de depart (position GPS ou Paris par defaut). Jusqu'a 10 joueurs,
un telephone par joueur, jusqu'a 20 manches — **toute partie est une room en ligne**, meme seul (voir
"Pas de partie locale" plus bas). Deploye en web statique sur GitHub Pages
(`https://mathieujullien77190.github.io/azimuth-quiz/`) en plus des builds natifs.

## Structure

Convention `react-structure` (skill du projet) : chaque composant est un dossier
auto-contenu `index.ts` + `<Name>.tsx` (export nomme) + `helpers.ts` + `constants.ts` +
`types.ts` + `styles.ts` (le `createStyles`/`StyleSheet.create` du composant, importe
depuis `<Name>.tsx` — extrait dans son propre fichier fin 2026-09 pour tous les
composants du projet ; jamais de logique dedans, uniquement le style). Dans les dossiers
`screens/<Screen>/` qui contiennent a la fois le container et sa vue (`OnlineGameScreen.tsx` +
`OnlineGameScreenView.tsx`), chacun a son
propre fichier de styles nomme d'apres lui (`OnlineGameScreenView.styles.ts`) plutot qu'un `styles.ts` partage, pour eviter toute ambiguite
sur lequel des deux createStyles il contient. Alias `@/` → `src/`.

Depuis la reorg par jeu (fin 2026-09) : plus un seul gros `components/`/`helpers/`
fourre-tout — ce qui est specifique a un jeu vit dans `src/games/<jeu>/`, ce qui est
partage par 2+ jeux (ou generique app-wide) reste a la racine.

Identifiants de code entierement en anglais (aussi fin 2026-09) : les dossiers/fichiers/
types/fonctions qui portaient les noms francais des jeux (`boussole`→`compass`,
`indices`→`clues`) ont ete renommes. Le nom produit affiche aux joueurs francais reste
"Boussole"/"Indices" (valeurs de traduction dans `fr.ts`, inchangees) — meme divergence
deliberee code/produit que Contour/Silhouette (voir plus bas) : les trois jeux ont
desormais chacun un nom de code anglais distinct de leur nom affiche francais.

`src/games/<jeu>/` separe aussi `screens/` (dossiers dont le composant principal finit
par `*Screen` — ce sont les seuls rendus par une route de `src/app/`) de `components/`
(tout le reste : sous-composants, cartes, providers de reglages...).

```
src/
  app/                 # Expo Router : _layout (providers + Stack), routes (re-exports minces)
  components/          # ce qui n'est PAS specifique a un jeu (plus de dossier `common/` a part
                       # depuis fin 2026-09 : fusionne ici) : ui/ (Button, Card, Chip, Screen,
                       # Section, Stat, Toggle), HomeScreen, SettingsScreen, LanguageProvider,
                       # ThemeProvider, MascotButton/HelicopterButton/UfoButton, GameCard,
                       # NoticeOverlay (splash plein ecran texte blanc sur fond noir a 0.8
                       # d'opacite - "l'hote a supprime la partie", "vous avez ete expulse" ;
                       # tappable, se ferme au clic), et les composants partages par 2+ jeux (pas
                       # des primitives UI generiques) : Compass, EarthSection (Compass + clue
                       # "Distance" de Clues), PlayerTabs (Compass + Clues), RoundProgress (les 3
                       # jeux)
  data/                # donnees/valeurs partagees par 2+ jeux (score/geo generiques, cles de
                       # stockage app-wide, options de partie, palette joueurs...) + data/places/
                       # (lieux Compass+Clues) + data/contours/ (codec geometrie Silhouette) +
                       # data/theme.ts (tokens UI). Les constantes de tuning propres a un seul
                       # jeu (score, sliders, ranks, valeurs par defaut...) vivent plutot dans
                       # `games/<jeu>/constants.ts` (voir plus bas)
  games/
    compass/
      screens/         # OnlineGameScreen, SetupScreen, EndScreen
      components/      # DistanceSlider, SliderTrack, RoundResult,
                       # PlaceCard
      helpers/         # places.ts, scoring.ts, distanceScale.ts, room.ts (Firestore, hors
                       # barrel `@/helpers` — voir plus bas)
      store/           # roomStore.ts (partie en ligne, hors barrel comme room.ts, meme raison)
      constants.ts     # tuning propre a Compass : score (MAX_ROUND_POINTS, courbe...), sliders
                       # de distance, RANKS, ROOM_PLAYER_COLORS, CATEGORIES, DEFAULT_SETTINGS —
                       # admin importe CATEGORIES directement d'ici (meme alias `@/`)
    clues/
      screens/         # OnlineClueGameScreen, ClueSetupScreen
      components/      # ClueCard
      helpers/         # clueHistory.ts, clueSkeleton.ts, clueGame.ts (score, tirage, saisie)
      constants.ts     # tuning propre a Clues : CLUE_ORDER, CLUE_CATEGORIES,
                       # CLUE_ANSWER_METHODS, DEFAULT_CLUE_SETTINGS, CLUE_HISTORY_STORAGE_KEY
    contour/
      screens/         # OnlineContourGameScreen, ContourSetupScreen
      components/      # ContourBoard, ContourFullBleedScreen, ContourGuessBar
      helpers/         # contourScoring.ts, contourCountry.ts, roundBoard.ts, useRoundBoard.ts, room.ts
      constants.ts     # tuning propre a Silhouette (anciennement `constants/contour.ts`) :
                       # MAX_CONTOUR_POINTS, CONTOUR_GUESS_POINTS_BY_HINTS,
                       # CONTOUR_WRONG_GUESS_PENALTY, DEFAULT_CONTOUR_SETTINGS
  helpers/             # commun aux 3 jeux : geo.ts, format.ts, storage.ts, location.ts, random.ts,
                       # web.ts, firebase.ts, settings.ts (sanitize GameSettings) — le barrel
                       # `index.ts` re-exporte aussi les fonctions des `helpers/` par-jeu
                       # ci-dessus (places/scoring/distanceScale/clueHistory/clueSkeleton/
                       # contourScoring), donc un simple `import { pickPlaces } from '@/helpers'`
                       # marche toujours sans savoir ou vit le fichier reel — room.ts/roomStore.ts
                       # (Compass) restent les seuls hors barrel (`firebase/firestore` plante
                       # Jest a l'import), importes directement via leur chemin `@/games/compass/...`
  settings/            # GameSettings (Compass), ClueSettings et ContourSettings : les 3 en
                       # stores Zustand (`useSettings`/`useClueSettings`/`useContourSettings`,
                       # fin 2026-09 pour ces deux derniers — plus de Provider React a monter
                       # dans `_layout.tsx`, un store est un singleton global). Seul `useSettings`
                       # (Compass) persiste sur disque (`hydrateSettings`) ; Clue/Contour
                       # repartent des defauts a chaque lancement, comme avant la migration
                       # (`src/games/compass/store/` n'a pas encore ete elargi a `useSettings`)
  themes/              # night.ts / day.ts / fonts.ts / ThemeContext
  types/                # types de domaine partages (Guess, GameSettings, Theme...)
```

`admin/` (outil interne, app Vite a part) importe directement certains fichiers de `src/`
via le meme alias `@/` (ex. `ContourEditor.tsx` → `@/games/contour/components/ContourBoard/helpers`,
`admin/src/constants.ts` → `@/games/compass/constants` pour `CATEGORIES`)
— penser a verifier `admin` (au moins `npm run build` dans `admin/`) apres tout renommage/
deplacement cote `src/`.

### Pas de partie locale

Il n'existe plus de partie sur un seul telephone : jouer seul, c'est heberger une room dont personne
ne rejoint. Le setup garde le chip "Solo" ; "Lancer la partie" en solo cree une room *cachee*
(`hostedSilently` dans `useSetupRoom` : hebergee comme une room visible, mais sans code affiche) puis
lance la partie quand elle est connectee et que cet appareil y est liste — `startOnlineGame(run)` prend
donc en charge les deux cas, et ce que `run` lit dans la room (le premier joueur...) est lu *dans* `run`,
jamais avant. Consequence assumee : il faut du reseau, meme seul. Pas de `gameStore`/`useGame`/routes
`/game`, `/clues-game`, `/contour-game`.

### Smart/dumb (container/presentational) sur les ecrans Compass

`SetupScreen` et `OnlineGameScreen` suivent le meme decoupage : un hook "smart" colocalise
(`useOnlineRoom.ts`, `useOnlineGame.ts`) porte l'etat, les effets (Firestore/settings/scroll) et les actions
deja resolues (readOnly-gated, kick, submit...) ; le fichier principal du dossier
(`SetupScreen.tsx`, `OnlineGameScreen.tsx`) reste le container — il
appelle le hook, calcule les tableaux/labels derives qui ont besoin de `useTranslation`/
`useTheme` (`earthMarks`, `scoreLabel`...), et garde les early-returns
d'ecran entier (`loading`, `end`, notice "room supprimee") puisque ce ne sont pas des
"vues" du composant dumb — il mappe le reste vers un composant `*View.tsx` (`SetupScreenView`,
`OnlineGameScreenView`) qui ne
fait que du rendu : jamais de `@/settings`/`@/games/compass/helpers/room`/
`@/games/compass/store/roomStore`, jamais
d'effet — seulement des primitives UI, constantes pures et callbacks deja decides par le
smart (ex. `onToggleCategory(id)` decide deja du blocage `readOnly` cote container, le
dumb ne fait qu'appeler la prop). `useTranslation`/`useTheme`/`useThemedStyles`/
`useWindowDimensions` restent utilisables dans le dumb (lectures pures, pas d'effet de
bord) — seuls les hooks a etat/effet metier sont interdits. Les tests existants
(`SetupScreen.test.tsx`) rendent le container, pas la vue.
`OnlineGameScreen` n'a aucun test automatise — seul un retest manuel garantit qu'il n'a
pas regresse apres ce decoupage.

## Domaine : cap et distance

On choisit un cap et on estime la distance parcourue a la surface du globe (`Guess` = `bearing` +
`distanceKm`). L'ancien mode "ligne droite"/inclinaison (`straightLine`, `InclinationSlider`, corde a
travers la Terre) a ete retire de Compass : la distance de surface est le seul mode.

Scoring (`games/compass/helpers/scoring.ts`) : courbe logarithmique sur l'ecart de distance, ecart
angulaire 2D. 500 points max chacun pour la direction et la distance.

### Multijoueur en ligne : une couche commune, trois jeux

Compass (`rooms`), Indices (`clueRooms`) et Silhouette (`contourRooms`) partagent tout ce qui n'est pas
leur logique de jeu :

- **Firestore** : `helpers/roomBase.ts` (`createRoomApi(collection)` — creer/rejoindre/quitter, presence,
  couleurs, reglages ; hors barrel `@/helpers`, importe `firebase/firestore`) ; chaque
  `games/<jeu>/helpers/room.ts` le lie a sa collection et n'ajoute que l'etat de manche propre au jeu
  (via `roomRef(code)`). Les regles (`firestore.rules`) des deux jeux a tour de role partagent la
  fonction `canUpdateTurnRoom`.
- **Store** : `helpers/createRoomStore.ts` (connexion, joueurs, hote, reglages, `gameState`, depart
  volontaire) — chaque jeu fournit ses abonnements et son etat par defaut.
- **Setup** : `components/setup/useSetupRoom` (host/join, presence, couleurs, kick, notices, navigation
  vers l'ecran de jeu) — chaque jeu lui passe un `SetupRoomAdapter` (store + fonctions Firestore,
  couleurs `ROOM_PLAYER_COLORS` de `@/data`, route) et n'ecrit que ce que "Lancer la partie" ecrit dans la
  room (`useOnlineRoom`/`useOnlineClueRoom`/`useOnlineContourRoom`). Cote rendu, `SetupScreenShell`
  (overlay, titre, `PartySection`, boutons) est partage ; la vue de chaque jeu ne fournit que ses sections
  en `children`.
- **Ecran de jeu en ligne** : `helpers/useOnlineRoomSession.ts` (etat de la room, hote, joueurs dans
  l'ordre d'arrivee via `helpers/roomPlayers.ts`, redirection "room supprimee", `handleQuit`) et, pour les
  jeux a tour de role, `helpers/useHostTurnScoring.ts` (l'hote seul ecrit `totalScores` : gain sur
  `verdict: 'correct'`, penalite fixe a chaque `wrongGuessSeq`). Composants partages : `GameHeader`/`GameFooter` (le panneau translucide autour du pied de page, pose par chaque jeu ; `Screen` rend son `footer` tel quel), `NoticeOverlay` (avec `loading` pour l'attente),
  `RoomDeletedScreen`, `FinalStandings`.
- **Coupure reseau** : `helpers/useRoomPresence.ts`, monte une seule fois par `useSetupRoom` (qui reste
  vivant sous l'ecran de jeu). Pendant une partie a plusieurs (pas en solo, pas dans le lobby), chaque
  appareil ecrit un heartbeat `players.{uid}.lastSeen` toutes les 30 s (cout : chaque ecriture est relue
  par tous les joueurs) et surveille celui des autres (a-t-il change ? jamais compare a l'horloge locale).
  Rien n'est recupere : qui perd la connexion quitte la partie — soi-meme (ecriture jamais acquittee
  90 s : `connectionLost` dans le store, les ecrans affichent `RoomDeletedScreen` avec un message
  dedie), un joiner que l'hote ne voit plus (l'hote le retire, les autres continuent), l'hote que
  les joiners ne voient plus (ils quittent). Un appareil suspendu (arriere-plan, ecran verrouille) n'est
  pas pris pour une coupure : un controle en retard remet les references a zero.

Ecrans de setup : blocs partages dans `components/setup/` (`PartySection`, `CategorySection`,
`DifficultySection`, `RoundsSection`, `OptionsSection` — tableau d'options `{ id, title,
description, value, onChange, hidden? }` + bloc GPS optionnel via la prop `gps`, avec ses champs
lat/lon), tous documentes dans Storybook (`Common/Setup/*`).

`EarthSection` dessine la Terre vue de profil (le joueur en haut, cap = gauche/ouest ou
droite/est seulement — pas de vrai nord/sud dans ce schema). Son zoom est **continu** :
recalcule a chaque rendu via `fitZoom` sur les `marks` actuels, pas seulement a la
revelation — plus la distance est courte, plus il zoome (jusqu'a `MAX_ZOOM`).

## Onglets joueurs

`PlayerTabs` (header de l'ecran de jeu en ligne d'Indices et de Silhouette) est purement informatif :
statut seulement (a qui la main, via `activeLabel` qui affiche le nom complet du joueur actif) — on ne
peut rien y taper. Le joueur qui a la main change quand il revele un indice.

## Silhouette (jeu "Contour" en interne) : devine un pays

Troisieme mode (nom affiche "Silhouette" ; identifiants de code restes `Contour`/`OnlineContourGameScreen`...) :
la silhouette d'un pays s'affiche remplie (`colors.surfaceHigh`, pas juste un contour), les joueurs
devinent lequel via 4 paliers d'indices partages. Pas de second temps de placement de lieux (retire —
le jeu s'arrete a la reconnaissance du pays).

**Multijoueur (`contourRooms`), modele Indices** : un plateau partage, un joueur actif a la fois
(`turnUid`, l'ordre d'arrivee des joueurs). Son tour, il revele le palier suivant (`hintsRevealed` 0-4,
ce qui passe la main au joueur suivant) ou tente une reponse (bonne : `verdict: 'correct'`, gain
`CONTOUR_GUESS_POINTS_BY_HINTS[hintsRevealed]` ; mauvaise : `wrongGuessSeq` +1, penalite
`CONTOUR_WRONG_GUESS_PENALTY`, il garde la main) ; une fois le nom revele (palier 4) il confirme
l'abandon (`verdict: 'giveUp'`, personne ne marque). L'hote tire tous les pays d'avance (`countryCodes`,
`pickContourRoundCodes` — la room ne porte que les codes, chaque appareil reconstruit le plateau depuis
ses propres donnees) et seul l'hote ecrit les scores (`useHostTurnScoring`). Le setup local de

**Positions sur le plateau en fraction, pas en lon/lat.** `ContourNeighbor.x`/`y` et
`ContourCountry.centerLabel` sont une fraction (0-1) du canvas du plateau — pas des
coordonnees geographiques projetees, contrairement aux lieux Compass/Clues. Un ancien
design en lon/lat + clamp directionnel (`edgeLabelPosition`, supprime) ne retenait que
l'angle par rapport au centre, jamais la distance : deplacer un point dans l'admin ne
bougeait rien a l'ecran tant que l'angle ne changeait pas ("il ne bouge plus"). En
fraction du plateau, le point se pose exactement ou on le lache ; et comme le jeu et
l'apercu admin utilisent tous les deux `boardDimensionsFor(country.points, ...)` (meme
ratio, jamais la meme taille absolue), la position relative reste identique partout —
voir `BOARD_PADDING_RATIO`/`HINT_STACK_GAP_RATIO` (`games/contour/components/ContourBoard/constants.ts`),
en fraction de `Math.min(width, height)` plutot qu'en pixels fixes, meme raison.

Paliers d'indices (`buildHintLabels` dans `helpers/roundBoard.ts`, bouton "Indice", inline dans le footer a
cote de l'input) : 1) drapeau de chaque voisin, 2) drapeau du pays cible
a son propre point curee (`ContourCountry.centerLabel`), 3) nom de chaque voisin empile
juste sous son icone (les deux restent affiches ensemble, l'un ne remplace plus l'autre), 4) nom du pays cible empile sous son drapeau (= abandon). Toujours centre (`textAnchor="middle"` fixe dans
`ContourBoard.tsx`) : l'ancien alignement directionnel `start`/`end` n'avait plus de sens
des que chaque hint est devenu un point fixe plutot qu'une etiquette pointant vers le bord.

Filtre par difficulte, meme enum `Difficulty` que Compass/Clues mais choix unique
(`ContourSettings.difficulty`, pas de multi-select) : determine le pool dans lequel le
pays du tour est tire (`ContourCountry.difficulty`, curee a la main via le champ
optionnel `contour.difficulty` sur la ligne du pays dans `data/places/countries.json`
— France et Espagne en `easy`, seule la Norvege en `hard`, absent (= `intermediate` par
defaut, voir `codec.ts`) pour tous les autres, y compris tous les pays generes
automatiquement ; deliberement desequilibre, ne pas tenter de rectifier sans demande
explicite).

Donnees Contour (points/voisins/centerLabel/difficulty) : plus de fichiers a part dans
`data/contours/` (qui ne garde plus que `codec.ts` — decode uniquement, plus aucune
donnee) ; tout vit desormais comme un 7e element
optionnel `contour` sur la ligne du pays concerne dans `data/places/countries.json`
(type `ContourDataRow`, voir `src/types/index.ts` et `CountryRow`) — absent pour la
grande majorite des pays, qui restent un tableau a 6 elements sans padding. Les voisins
(`{ type: 'country', code, x, y }` — uniquement des pays, plus de voisin mer/ocean : ca
compliquait tout pour peu d'apport, retire) sont pour la plupart generes automatiquement
par `scripts/generateContours.mjs` (`npm run generate:contours`, outil dev uniquement,
hors `npm test`/CI/l'app livree — adjacence reelle + centroide via `world-countries`,
position projetee sur le plateau du pays puis ramenee au bord via un clamp directionnel,
voir le script pour le detail) ; seuls les 8 pays d'origine (DE/ES/FR/GR/IE/IT/NO/PT)
gardent des positions ajustees a la main. Un meme voisin peut avoir une position
differente selon le pays qui le cite (pas de table globale par code) : chaque
`ContourCountry.neighbors` est propre a son pays.

Admin : pas d'onglet a part — un bouton "🗺️ Silhouette" apparait dans la carte pays de
`admin/src/views/CountriesView` pour tout pays possedant deja des donnees Contour
(`CONTOURS.find` — desormais ~150 pays, pas seulement les 8 d'origine, sans aucun
changement d'UI necessaire puisque ce lookup a toujours ete dynamique), et deplie
`admin/src/views/ContourView/ContourEditor.tsx` juste en dessous, dans cette meme carte
(recherche/pagination/tri deja fournis par CountriesView, partages entre pays classiques
et Silhouette). `ContourEditor` prend un seul `initialCountry` en prop (pas de selecteur
de pays a lui, CountriesView fait deja ce role) : chaque voisin (et le point drapeau/nom
du pays cible, un seul point desormais) se glisse a la souris et se pose exactement ou on
le lache — rien n'est ecrit sur disque, chaque deplacement/suppression ajoute une ligne au
journal (`saveNeighborPosition`, `saveCenterLabelPosition`, `deleteNeighbor`,
`admin/src/api/contour.ts`). Plus de liste "Lieux possibles"/exclusion cote Silhouette
(retiree avec la phase de placement de lieux qu'elle servait a curer) : un lieu ne se
supprime plus que via `deletePlace` (`admin/src/api/places.ts`), partage avec
Compass/Clues.

## `Screen` : header/footer fixes

`components/ui/Screen` accepte `header` et `footer`, rendus en dehors du `ScrollView`
(siblings dans la meme `SafeAreaView`) donc toujours visibles. `OnlineGameScreen` (Compass) et
`OnlineClueGameScreen` les utilisent pour : quitter + score + manche/pastilles + onglets joueurs (header),
bouton Valider (footer, seulement hors revelation — `RoundResult` a son propre bouton "suivant" inline).

**Piege connu** : un `ScrollView` horizontal place dans un `header` s'etire en hauteur
sur react-native-web s'il n'a pas de `style={{ flexGrow: 0, flexShrink: 0 }}` explicite
(pas seulement `contentContainerStyle`) — voir `PlayerTabs.tsx`.

**Exception (Contour)** : tout l'ecran de
`OnlineContourGameScreen` n'utilise pas `Screen` du tout — `ContourFullBleedScreen`, un `SafeAreaView` +
`ThemeBackdrop` propres, avec la silhouette qui occupe tout l'ecran mesure (`useRoundBoard`, `onLayout`) et
les header/footer qui flottent par-dessus en `position: 'absolute'` (fond `${colors.surfaceHigh}F0`)
plutot que de reserver leur propre espace — pour que le contour du pays touche les bords de l'ecran.
La barre de reponse (indice + champ + Valider) est `ContourGuessBar`. La fin de manche garde ce meme
ecran : tous les paliers s'affichent et le pied de page montre le resultat.

## Storybook

Stories colocalisees (`src/**/<Name>.stories.tsx`, config dans `admin/.storybook`, `npm run storybook`). Chaque
story porte le code qu'un consommateur ecrirait (pas le JSX reconstruit depuis les `args`) :
`parameters: source(code)` (`@/storybook/source`) avec le snippet dans `<Story>.source.md` a cote (bloc
```tsx, importe en `?raw`, rien a echapper ; Prettier ne le reformate pas). `source()` va sur la story,
jamais sur le `meta`. Menu : `Common`, `Compass`, `Clues`, `Silhouette`, puis en bas `Setup` (sections de setup) et
`UI` (primitives), ordre fixe dans `admin/.storybook/preview.tsx` (`storySort`) — une nouvelle section de premier
niveau doit y etre ajoutee. Un composant sans store ni routeur (dumb) a sa story ; les containers smart, non.

## Theme

Deux themes, `night` (sombre, bleu nuit + ambre, ciel etoile) et `day` (clair, ciel
bleu + orange, nuages qui derivent — meme `ThemeBackdrop`, branche sur `theme.isDark`).
Choix persiste (`ThemeProvider`/`ThemeSettingsContext`, cle `azimuthquiz:theme`),
selecteur dans `SettingsScreen`. `useTheme()` lit le theme courant via le contexte ;
`useThemeSettings()` donne `{ themeId, ready, setThemeId, resetThemeId }`. Quelques
elements suivent `isDark` directement plutot qu'un token de couleur : la mascotte du
`HomeScreen` (`MascotButton` : soucoupe la nuit, helicoptere le jour) et l'objet en
orbite d'`EarthSection` (satellite la nuit, avion le jour). Police unique
partout, y compris dans le SVG (compas, `EarthSection`) :
`themes/fonts.ts` exporte `FONT_FAMILY` (stack `"JetBrains Mono", ui-monospace, ...`),
consomme par les 4 tokens de typographie du theme. Un composant SVG doit lire
`typography.<token>.fontFamily` et le passer explicitement a `fontFamily` sur
`<SvgText>` — `fontFamily` ne se propage pas depuis un `StyleSheet` React Native au SVG.

`useThemedStyles(createStyles)` est le pattern standard ; `createStyles` recoit `Theme`
et retourne un `StyleSheet.create(...)`.

## Build web / GitHub Pages

`app.json` : `web.output: "static"` + `experiments.baseUrl: "/azimuth-quiz"` (site de
projet GitHub Pages, pas a la racine du domaine). Necessite `@expo/metro-runtime` en
dependance (sinon `expo export --platform web` echoue). `.github/workflows/deploy-pages.yml`
exporte et publie `dist/` sur push vers `master` via les actions GitHub Pages officielles
(pas de Jekyll). Le Pages du repo doit etre configure en source "GitHub Actions" (fait
une fois via le dashboard GitHub, pas automatisable sans `gh` CLI/token dans cet
environnement).

## Etat connu

- `npx expo lint` vient d'etre configure (ESLint + eslint-config-expo, premier lancement
  fin 2026-09). Erreurs preexistantes non corrigees (hors scope au moment ou elles ont
  ete trouvees) : regles `react-hooks/set-state-in-effect` et `react-hooks/refs` dans
  `Compass.tsx`, `useHeading.ts`, `SliderTrack.tsx` (meme idiome : un ref mis a jour a
  chaque rendu pour rester lisible depuis le `PanResponder`, cree une seule fois).
  `ContourBoard.tsx` avait le
  meme idiome mais a perdu tout son `PanResponder`/sa logique de placement en meme temps
  que la phase de placement de lieux (voir la section Silhouette) — pur composant
  d'affichage desormais, plus concerne.
- `react-hooks/refs` se declenche aussi, de facon attendue et inevitable, partout ou
  l'API `Animated` de React Native est utilisee (`HomeScreen.tsx` : position/rotation de
  la mascotte, soucoupe la nuit ou helicoptere le jour — voir `MascotButton` ;
  `EarthSection.tsx` : orbite du satellite/avion) — lire `.current` d'un
  `Animated.Value`/`ValueXY` cree via `useRef` puis l'utiliser dans le style au rendu est
  le pattern officiel de cette API, incompatible
  avec cette regle stricte. Meme categorie que les 4 fichiers ci-dessus, pas une erreur a
  corriger.
- Repo : `mathieujullien77190/azimuth-quiz`, un seul contributeur, commits directs sur
  `master`.
