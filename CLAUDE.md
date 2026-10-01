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
                       # Section, SliderTrack, Toggle...), HomeScreen, SettingsScreen, LanguageProvider,
                       # ThemeProvider, MascotButton/HelicopterButton/UfoButton, GameCard,
                       # NoticeOverlay (splash plein ecran texte blanc sur fond noir a 0.8
                       # d'opacite - "l'hote a supprime la partie", "vous avez ete expulse" ;
                       # tappable, se ferme au clic), et les composants partages par 2+ jeux (pas
                       # des primitives UI generiques) : Compass, EarthSection (Compass + clue
                       # "Distance" de Clues), PlayerTabs (Compass + Clues), RoundCounter et DifficultyBadge
                       # (en-tete des 3 jeux)
  data/                # plus aucun fichier de donnees dans l'appli : lieux, pays, contours, devinettes... vivent
                       # dans Firestore (voir "Modele Firestore" plus bas). Ici : les valeurs partagees par 2+ jeux
                       # (score/geo generiques, cles de stockage app-wide, options de partie, palette joueurs...),
                       # data/theme.ts (tokens UI) et data/firestore/ (forme des documents Firestore : types.ts,
                       # lecteurs read.ts document -> types du jeu, numbering.ts, denormalize*.ts... partages
                       # entre le jeu et l'admin). Les constantes de tuning propres a un seul jeu (score,
                       # sliders, valeurs par defaut...) vivent plutot dans `games/<jeu>/constants.ts`
  games/
    compass/
      screens/         # OnlineGameScreen, SetupScreen, EndScreen
      components/      # RoundResult,
                       # PlaceCard
      helpers/         # places.ts (effectiveDifficulty), scoring.ts, distanceScale.ts, firestorePlaces.ts,
                       # compassCounts.ts, compassCursors.ts, room.ts (Firestore, hors barrel `@/helpers` — voir
                       # plus bas)
      store/           # roomStore.ts (partie en ligne, hors barrel comme room.ts, meme raison)
      constants.ts     # tuning propre a Compass : score (courbe, points max...), sliders
                       # de distance, ROOM_PLAYER_COLORS, CATEGORIES, DEFAULT_SETTINGS —
                       # admin importe CATEGORIES directement d'ici (meme alias `@/`)
    clues/
      screens/         # OnlineClueGameScreen, ClueSetupScreen
      components/      # ClueCard, ClueGrid
      helpers/         # clueCursors.ts, clueCounts.ts, firestoreCluePlaces.ts (tirage Firestore, voir plus bas),
                       # clueSkeleton.ts, clueGame.ts (score, saisie, cluesFor/placeCategory), charade.ts,
                       # personality.ts, wordplay.ts
      constants.ts     # tuning propre a Clues : CLUE_ORDER, CLUE_CATEGORIES,
                       # CLUE_ANSWER_METHODS, DEFAULT_CLUE_SETTINGS, CLUE_CURSORS_STORAGE_KEY
    contour/
      screens/         # OnlineContourGameScreen, ContourSetupScreen
      components/      # ContourBoard, ContourFullBleedScreen, ContourGuessBar
      helpers/         # contourCountry.ts, hintPlan.ts, simplify.ts, borders.ts, roundBoard.ts,
                       # useRoundData.ts, firestoreContours.ts, room.ts
      constants.ts     # tuning propre a Silhouette (anciennement `constants/contour.ts`) :
                       # MAX_CONTOUR_POINTS, CONTOUR_HINT_CATEGORIES, MAX_CITY_HINTS,
                       # CONTOUR_WRONG_GUESS_PENALTY, DEFAULT_CONTOUR_SETTINGS
  helpers/             # commun aux 3 jeux : geo.ts, format.ts, storage.ts, location.ts, random.ts,
                       # web.ts, firebase.ts, settings.ts (sanitize GameSettings) — le barrel
                       # `index.ts` re-exporte aussi les fonctions des `helpers/` par-jeu
                       # ci-dessus (scoring/distanceScale/clueSkeleton), donc un simple `import { scoreRound } from '@/helpers'`
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

### Nom du joueur partage entre les 3 jeux

Un seul nom pour les 3 jeux, toujours le meme : `usePlayerName` (`settings/index.ts`, store Zustand
persiste, hydrate au demarrage comme `useSettings` — `hydratePlayerName` dans `_layout.tsx`) en est
l'unique source. Chaque jeu garde quand meme un `playerName` dans ses propres reglages (`GameSettings`/
`ClueSettings`/`ContourSettings`, requis par `useSetupRoom<S extends { playerName: string }>` et par
`roomSettingsFrom`, meme si ce dernier l'exclut toujours de ce qui part dans la room), mais seulement
comme miroir : `useSetupRoom` (commun aux 3 setups) affiche `usePlayerName` des qu'il est hydrate (avant,
celui du jeu courant, pour eviter un champ vide le temps de la lecture disque), et `onChangeName` ecrit
dans les deux a la fois. Un effet a usage unique reconcilie les deux au premier montage suivant
l'hydratation : si le store partage a deja un nom, ce jeu l'adopte ; sinon, si CE jeu en a deja un (seul
Compass persiste sur disque, donc c'est le seul cas possible), c'est lui qui alimente le store partage —
migration pour les joueurs qui avaient deja un nom Compass avant que ce store existe. Concretement :
changer son nom dans Indices le change aussi dans Boussole et Silhouette, y compris apres avoir deja
ouvert ces ecrans.

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
`OnlineGameScreen` a depuis gagne un `OnlineGameScreen.test.tsx` (comme les deux autres jeux) —
cette phrase datait d'avant.

### Boussole : les lieux sont tires dans Firestore (pas de repli sur les JSON)

Au lancement, l'hote tire les lieux de la partie avec `fetchRandomPlaces`
(`games/compass/helpers/firestorePlaces.ts`, hors barrel comme `room.ts`), depuis la collection `places`
(documents de `data/firestore/`, edites par l'admin). Firestore n'a pas de requete "N documents au hasard" :
les lieux Compass sont donc **numerotes `n` = 1..taille dans leur groupe (`compass.category` x `difficulty`)**
et les tailles vivent dans `meta/compassCounts` (`{ counts: { categorie: { difficulte: taille } } }`). L'hote
lit ce document (1 lecture, chargee des le lancement de l'appli, `compassCounts.ts`), forme le pool des groupes
choisis (en anglais les lieux FR sont remontes d'un cran par `effectiveDifficulty`, donc le palier du dessous
en fait partie et est refiltre ensuite). **Un curseur par groupe sur l'appareil** (`compassCursors.ts`,
AsyncStorage donc mobile et web : `"cities|easy" -> 17` = prochaine place = la 18e) : une partie prend les
places suivantes de chaque groupe a partir de son curseur et le fait avancer, en revenant au debut au bout de la
liste ; le 1er tirage d'un groupe part d'une place au hasard. Un groupe est donc parcouru en entier avant qu'une
place revienne. Avec plusieurs categories, les places sont reparties le plus egalement possible entre elles
(`splitEvenly`, `helpers/splitEvenly.ts` : 5 manches sur 6 categories = 1 chacune pour 5 tirees au hasard,
5 sur 2 = 3+2 ou 2+3 ; une categorie trop petite est remplie et les autres se partagent le reste), puis
entre les paliers d'une categorie (deux en anglais) ; chaque place est la suivante de son groupe
(`Walk`, `takeSlots`). Les positions sont lues en UNE requete par tranche de 30, tous groupes
confondus : un `or` de clauses `and(compass.category == c, difficulty == d, n in [...])`, une par groupe
(Firestore plafonne a 30 valeurs au total) ; la reponse est une seule liste de documents, un `n` sans document
(tailles lues une fois par lancement) manque simplement. La difficulte est filtree par la requete elle-meme
(elle choisit les groupes) : la 1re passe lit donc exactement `rounds` positions (1 lecture par lieu) ; seul
l'anglais, ou le palier du dessous est refiltre, en lit 3 x `rounds`. Une passe suivante (double) ne part que
s'il manque des lieux. Toute place prise compte comme parcourue (le curseur avance aussi pour celles lues puis
ecartees) ; une partie qui echoue ne touche pas aux curseurs. Plus de filtre de distance a l'origine :
`MIN_PLACE_DISTANCE_KM` ne sert plus qu'a l'ancien `pickPlaces`.
**Aucun repli sur les JSON** : si Firestore echoue ou si
moins de `rounds` lieux existent, `fetchRandomPlaces` rejette, `useSetupRoom` remet `starting` a faux, rien
n'est ecrit dans la room (elle reste dans son salon) et une notice `startFailedNotice` s'affiche (tap ou
4 s) ; le bouton "Lancer la partie" relance. Seul l'hote interroge (les lieux partent ensuite dans le
document de la room). Index compose de `firestore.indexes.json` (`npx firebase-tools deploy --only
firestore:indexes`).

**La numerotation reste dense et MELANGEE** (helpers purs de `data/firestore/numbering.ts` :
`computeNumbering`, `shuffleRank`, `planRegroup`, `slotAt`). Les `n` d'un groupe sont
attribues dans l'ordre d'un hash stable de la cle (`shuffleRank`), pas dans l'ordre d'import : des `n`
consecutifs (ce que prend un curseur) ne sont ni du meme coin ni du meme type. L'import
(`buildPlaceDocs`/`buildCompassCounts`, qui pose `shuffled: true` dans `meta/compassCounts`) la pose ;
l'admin la maintient : supprimer un lieu, changer sa categorie ou sa difficulte passe par `applyPlaceChange`
(`admin/src/data.ts`), qui ecrit dans UN seul batch le lieu, le dernier lieu de l'ancien groupe (il prend le
`n` libere), les tailles (en gardant le marqueur `shuffled`) et `dataVersion`. Un lieu sans `compass` n'est
jamais numerote. Les donnees de production sont au bon format :
il n'y a plus d'ecran ni de code de migration. Pas de fonction "ajouter un
lieu" dans l'admin pour l'instant : la creer devra passer par `applyPlaceChange` (ajout en fin de groupe).
Les JSON embarques, `pickPlaces`/`filterPlaces` et les scripts de generation ont ete supprimes : Firestore est
la seule source des donnees.

### Modele Firestore denormalise (les 3 jeux le lisent ; plus aucun fichier de donnees dans l'appli)

On duplique pour ne rien lire en plus au runtime ; l'admin propage les modifications (`admin/src/data.ts`).
Types dans `src/data/firestore/types.ts`, lecteurs document -> types du jeu dans `read.ts`, helpers purs
testes dans `denormalize.ts`, `denormalizeClues.ts`, `numbering.ts`.

**Collections** : `places/{cle}` (cle = code court de 3 lettres, permanent, ex. `par` ; identite + `compass` +
`clues` + `country` + `personality` + `wordplay`), `countries/{ISO}` (nom fr/en, drapeau, devise, indicatif,
pays frontaliers ; la source que l'admin edite ET, pour un pays avec silhouette, tout ce que lit Silhouette), `charadeRiddles/{syllabe normalisee}`
(devinette globale ou `null`), `personalityJobs/{code}` (`{ fr, en }`), `meta/*` (`compassCounts`, `cluesCounts`,
`contourCounts`, `dataVersion`). Firestore refuse les tableaux imbriques et `undefined` : contours a plat
(`[lon, lat, lon, lat...]`), couleurs de drapeau en objets, champ optionnel absent = omis. Le jeu ne lit que
`places`, `countries` (Silhouette seulement) et `meta` ; `charadeRiddles` et `personalityJobs` sont la source des
copies (l'admin les recopie dans les lieux qui les utilisent).

- **`places/{cle}.country`** (`CountrySnapshot`) : copie du pays (`fr`, `en`, `flag`, `currency`, `currencySymbol`,
  `phoneCode`) dans CHAQUE lieu de ce pays (Compass et Clues) : pas de `countryName()` ni de lecture de pays au
  runtime (`Place.country` cote Compass, `CluePlace.country/flagColors/...` cote Indices).
  `applyCountryChange` (admin) ecrit le pays ET tous ses lieux ET les autres pays qui le citent comme voisin (`planCountryChange`)
  par tranches de 400 operations (chaque tranche atomique) ; `saveCountry` passe par la.
- **Numerotation Indices**, meme mecanique que Compass avec `CLUES_NUMBERING` : `places/{cle}.clues.category`
  (`capital` / `citiesFr` / `cities`, derivee de la categorie Compass par `cluesCategory`, stockee parce qu'on
  requete dessus) et `clues.n` (1..taille dans `clues.category` x `difficulty`, ordre melange), tailles dans
  `meta/cluesCounts` (`shuffled: true`). `applyPlaceChange` garde les DEUX numerotations denses dans le meme batch
  (un changement de categorie Compass peut regrouper la categorie Indices).
- **Silhouette dans `countries/{code}`** (`CountryDoc`, champs de silhouette ; présents seulement sur un pays qui en a
  une, `hasSilhouette`) : `ring` (contour en polyline encodee, `data/firestore/polyline.ts`, 3 decimales, ~3 Ko
  au lieu de ~12), `difficulty`, `centerLabel`, `n` (1..taille dans la difficulte, ordre melange ; tailles dans
  `meta/contourCounts`), `capital` et `cities` precalcules comme le faisait `contourPlacesFor` a chaque manche, et
  UNE liste `neighbors: [{ code, fr, en, ring?, x?, y? }]` : `ring` (le contour du voisin, copie tel quel pour que
  les aretes communes gardent les memes sommets) = un pays qui partage une frontiere, dessine en decor et dans le
  decoupage cote/frontiere ; `x`/`y` (fraction du plateau) = un voisin place en indice. Les deux roles sont
  independants (un decor n'est pas forcement un indice et inversement). Une manche = UNE lecture. Les edits de
  voisins / ancre du label ecrivent `countries/{code}` ; "supprimer un voisin" ne retire que son role d'indice
  (`x`/`y`), pas son decor. `applyCountryChange` reecrit aussi `fr`/`en` des entrees qui citent un pays renomme.
- `firestore.rules` : `countries` (lecture publique, ecriture admin) porte tout.
  `firestore.indexes.json` : index (`clues.category`, `difficulty`, `clues.n`) sur `places` et (`difficulty`, `n`)
  sur `countries` (Silhouette) — a deployer.

### Indices : les lieux sont tires dans Firestore, et tout ce qu'une manche lit est dans le lieu

Meme mecanique que Boussole (voir plus haut), sans repli sur les JSON. L'hote tire les lieux avec
`fetchClueRoundPlaces` (`games/clues/helpers/firestoreCluePlaces.ts`, hors barrel) : groupes = `clues.category`
(`capital` / `citiesFr` / `cities`, derivee de la categorie Compass) x `difficulty`, position `clues.n`, tailles
dans `meta/cluesCounts` (`helpers/clueCounts.ts`, lu au lancement avec `preloadCluesCounts` dans
`app/_layout.tsx`), curseurs par groupe sur l'appareil (`helpers/clueCursors.ts`, cle
`CLUE_CURSORS_STORAGE_KEY`). Le moteur est commun aux deux jeux : `helpers/groupedDraw.ts` (`drawFromGroups` :
curseurs avec bouclage, `splitEvenly` entre categories, UNE requete `or` par tranche de 30 positions, passes
supplementaires si des lieux manquent ou sont refiltres) + `helpers/groupCursors.ts` / `helpers/groupCounts.ts`
(fabriques du stockage des curseurs et du chargement des tailles). Chaque jeu ne fournit que ses champs, sa
numerotation (`COMPASS_NUMBERING` / `CLUES_NUMBERING`), la conversion document -> lieu et son filtre (le
relevement d'un cran des lieux FR en anglais, `effectiveDifficulty`). L'ancien historique de tirage
(`clueHistory`, compteur par lieu) est supprime : les curseurs le remplacent. Echec (Firestore, ou moins de
`rounds` lieux) : `fetchClueRoundPlaces` rejette, meme notice `startFailedNotice` que Boussole, la room n'est pas
touchee. Le compte "N lieux possibles" du setup vient de `meta/cluesCounts` (`null` tant qu'il n'est pas charge :
pas d'indication, le bouton n'est pas bloque).

**Une manche ne lit que le lieu tire** (l'hote l'ecrit tel quel dans la room, les joueurs le lisent la) : le
document `places/{id}` porte des COPIES de tout ce dont l'indice a besoin, maintenues par l'admin comme
`country` :
- `country` (`CountrySnapshot`) -> `CluePlace.country/phoneCode/currency/currencyName/flagColors` (drapeau en
  objets `{id, hex, percent}` et non en tuples : un lieu part dans le document de la room, Firestore refuse les
  tableaux imbriques) ;
- `clues.riddles` : la devinette de chaque syllabe, dans l'ordre de `clues.syllables` (`null` = aucune) ->
  `CluePlace.riddles`, lu par `charadeFor`/`charadeReady`/`charadeLines` (plus de dictionnaire global a
  l'execution) ;
- `personality.job` : le libelle du metier (`{fr, en}`) -> `CluePlace.personality.description` ;
- `wordplay` -> `CluePlace.wordplay` (`wordplayFor(place)` lit le lieu, plus une table par cle) ;
- `clues.category` -> `CluePlace.category` (`placeCategory(place)`, `isCapital` = `category === 'capital'`).
`cluesFromDoc(id, doc)` (`data/firestore/read.ts`) construit le `CluePlace` depuis le seul document (les
"lookups" pays/metiers ne servent qu'a un lieu que l'admin n'a pas encore migre). `normalizeSyllable` vit dans
`data/firestore/riddles.ts`.

**Admin (propagation)** : `data/firestore/denormalizeClues.ts` (pur : `withRiddles`, `withJobLabel`,
`planRiddleChange`, `planJobChange`) ; `admin/src/data.ts` l'ecrit :
`applyRiddleChange` (modifier une devinette de syllabe reecrit `clues.riddles` de tous les lieux qui ont cette
syllabe, accents replies), `applyJobChange` (renommer un metier recopie le libelle dans les personnalites
etiquetees), `saveCharadeSyllables` / `savePersonalityName` / `savePersonalityJob` recalculent la copie du
lieu edite. Les comparaisons de copies utilisent
`sameJson` (`data/firestore/same.ts`, insensible a l'ordre des cles : Firestore rend les maps triees).
Toute modification doit passer par l'admin (une edition directe dans la console ne se propage pas).

**Journal et synchronisation automatique** : chaque ecriture de l'admin ajoute une entree `journal/{id}` (`{ at: serverTimestamp,
changes: [{ c, id, op: 'set' | 'delete' }] }`, `c` = collection dont `meta`) dans le DERNIER batch de l'ecriture
(`commitInBatches`, et le batch de `applyPlaceChange`) : une entree n'est visible qu'une fois toutes ses donnees
ecrites. Plus de bouton de synchro : a l'ouverture, `loadData` lit le snapshot IndexedDB (un snapshot sans `journalAt`,
anterieur au journal, declenche UNE lecture complete, `syncData`), puis `startJournalSync` (`admin/src/data.ts`, lance
par `App`) ecoute les entrees plus recentes que `journalAt` (`onSnapshot`) : une entree recue, `collapseJournal`
(`data/firestore/journal.ts`, pur) garde la derniere operation par document, seuls ceux-la sont relus, le curseur avance
et est sauve dans le snapshot. Les entrees ecrites par cet admin sont ignorees (`ownEntryIds`, deja dans sa copie) ; un
changement venu d'ailleurs incremente `dataRevision` (`useSyncExternalStore`) et `App` remonte les vues (un brouillon en
cours est perdu). Plus de 1000 documents changes : lecture complete. Une edition directe dans la console n'ecrit pas de
journal : elle n'arrive pas (vider les donnees du site dans le navigateur force une relecture complete). Le journal n'est
jamais purge. `firestore.rules` : `journal` lisible et ecrivable par les admins seulement.

### Lieux : une cle courte et permanente

Un lieu est le document `places/{cle}`, ou la cle est un code de 3 lettres (ex. `par` pour Paris), attribue
une fois pour toutes a l'import initial (3 premieres lettres du nom, capitale prioritaire en cas de collision)
et JAMAIS reassigne. Elle est opaque : elle ne sert qu'a identifier le document (`CluePlace.key`, les edits de
l'admin) ; ce que voit un joueur (nom, pays) vient du document. Les pays ont pour cle leur code ISO a 2 lettres.

## Domaine : cap et distance

On choisit un cap et on estime la distance parcourue a la surface du globe (`Guess` = `bearing` +
`distanceKm`). L'ancien mode "ligne droite"/inclinaison (`straightLine`, `InclinationSlider`, corde a
travers la Terre) a ete retire de Compass : la distance de surface est le seul mode.

Scoring (`games/compass/helpers/scoring.ts`) : courbe logarithmique sur l'ecart de distance, ecart
angulaire 2D. 500 points max chacun pour la direction et la distance.

### Multijoueur en ligne : une couche commune, trois jeux

Compass, Indices et Silhouette partagent tout ce qui n'est pas leur logique de jeu — et **une seule collection
Firestore, `rooms`** : chaque room porte un champ `game` (`'compass'` | `'clues'` | `'silhouette'`), fixe a la
creation et immuable (les regles le refusent), qui dit quelles regles de mise a jour s'appliquent. Un code de room
d'un autre jeu est refuse a la jonction (`roomExists` verifie `game`). Les regles de `firestore.rules` sont
commentees en francais :

- **Firestore** : `helpers/roomBase.ts` (`createRoomApi(game)` — creer/rejoindre/quitter, presence,
  couleurs, reglages ; hors barrel `@/helpers`, importe `firebase/firestore`) ; chaque
  `games/<jeu>/helpers/room.ts` le lie a sa collection et n'ajoute que l'etat de manche propre au jeu
  (via `roomRef(code)`). Les regles (`firestore.rules`) des deux jeux a tour de role partagent la
  fonction `turnBasedPlayer`.
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
  `verdict: 'correct'`, penalite fixe a chaque `wrongGuessSeq`), `helpers/useHostTurnRecovery.ts` (l'hote passe la main si le joueur actif est parti), `helpers/useGuessDraft.ts` (texte saisi + banniere « rate » du joueur, remis a zero a chaque manche/changement de tour), `nextPlayerUid` (`helpers/roomPlayers.ts`, qui joue apres qui) et `helpers/useTransientFlag.ts` (un drapeau qui retombe seul, pour les notices). Composants partages : `GameHeader`/`GameFooter` (le panneau translucide autour du pied de page, pose par chaque jeu ; `Screen` rend son `footer` tel quel), `NoticeOverlay` (avec `loading` pour l'attente : un tap n'y fait rien, pas de `onDismiss`),
- **Indices : la saisie en direct** (`ClueRoomGameState.typing`) — les autres joueurs voient, en temps reel, ce que le
  detenteur du tour est en train de taper. Seul lui ecrit (`setClueRoomTyping`, cote `useOnlineClueGame` : texte
  debounce a 500 ms via `useDebouncedValue`, une seule ecriture par valeur stabilisee grace a un ref, jamais en solo
  ni hors de son tour ni manche terminee — meme souci de cout qu'un heartbeat de presence, chaque ecriture est relue
  par tous), remis a `''` quand le champ se vide ou apres envoi. Cote lecture, un spectateur ne lit le texte que si
  `typing.uid === turnUid` (evite un texte perime d'un tour precedent) et la manche est en cours. `previewText`
  (`OnlineClueGameScreenView`) unifie ce texte (le detenteur : son propre `guessText` ; les autres : `typedByActivePlayer`)
  et l'affiche pareil pour tout le monde, toujours en cases (jamais de simple texte) et toujours en MAJUSCULE.
  Une fois le 2e clic de l'indice "Lettre" fait (`skeletonLengthKnown`, la vraie longueur par mot connue), les
  cases sont celles du vrai squelette, remplies au fil de la frappe (`overlayTypedLetters`). Avant ca (0 ou 1er
  clic), la vraie forme n'est pas connue — la case unique du 1er clic n'aurait jamais pu suivre au-dela de son
  seul emplacement (on tape "Dijon", elle reste bloquee sur "D") — donc `typedSkeleton` (`helpers/clueGame.ts`,
  pur) fabrique les memes cases directement depuis ce qui est tape (un groupe par mot separe par un espace, un
  tiret reste hors case comme dans le vrai squelette) : rien tant que rien n'est tape, la lettre de l'indice des
  qu'elle existe, puis le mot tape en entier des la premiere frappe. Silhouette a la meme chose (`ContourRoomGameState.typing`, `setContourRoomTyping`, meme debounce de 500 ms,
`typedByActivePlayer` dans `useOnlineContourGame`) : hors de son tour, le champ de reponse reste affiche, en lecture seule
(`ContourGuessBar` `readOnly`, sans « Valider »), avec ce que le detenteur du tour tape. Taper un indice ou ce champ
hors de son tour ouvre l'avis « c'est au tour de X » (`contourGame.notYourTurn`, `useTransientFlag`, comme Indices) :
`ContourHintList` reste touchable et rapporte le tap meme `disabled`. `firestore.rules` : `typing` fait partie des champs du
detenteur du tour (`silhouette`).
- **Indices : qui vient de se tromper, vu de tout le monde** — `wrongGuesserName` (`useOnlineClueGame`), derive
  de `wrongGuessUid`/`wrongGuessSeq` (deja partages par la room, jamais remis a zero entre manches : le score
  de l'hote s'appuie sur leur progression strictement croissante, voir `useHostTurnScoring`) plutot que de
  l'ancien `lastWrong` local a l'appareil du joueur qui s'est trompe (donc invisible des autres). Deux gardes,
  memes idiomes que `typedByActivePlayer` : `wrongGuessUid === turnUid` (une erreur cesse d'etre "en cours" des
  que son propre tour se termine, meme si le joueur suivant hesite) et une graine de manche captee au premier
  rendu de chaque `roundIndex` (`wrongSeqAtRoundStart`, meme pattern "reset state when a prop changes" que
  `useGuessDraft`) pour ne pas reafficher une erreur d'une manche precedente au joueur qui rejoue en premier.
- **Indices : "Je ne sais pas" reserve a l'hote** — `giveUp` (`useOnlineClueGame`) coupe court a la manche
  (`verdict: 'giveUp'`) pour n'importe quel hote, meme hors de son propre tour, jamais pour un joueur non-hote
  meme quand c'est le sien (le detenteur du tour ne voit plus ce bouton s'il n'est pas l'hote, `OnlineClueGameScreenView`).
  Ne demande aucune regle Firestore a part : `isHost()` autorise deja l'hote a ecrire n'importe quel champ,
  avant meme la clause `turnBasedPlayer` qui, elle, reste liee a `turnUid`.
- **Indices : quels indices pour quel lieu (`cluesFor`), et le score de depart qui suit** —
  `helpers/clueGame.ts` expose `placeCategory(place)` (capital/citiesFr/cities, deplace ici depuis
  l'ancien `clueCategoryOf` prive) et `cluesFor(place)` : `CLUE_ORDER` filtre pour ce lieu precis,
  jamais un tableau fixe. Une ville `citiesFr` perd 5 indices qui ne varient jamais pour une ville
  francaise (`localTime`, `isCapital`, `flagColors`, `currency`, `phoneCode` — meme fuseau, presque
  jamais la capitale, meme drapeau/devise/indicatif que la France entiere ; `capital` et `cities`
  gardent les 14). Un lieu sans `personality`/`wordplay` curee (voir plus bas) perd l'indice
  correspondant ; `charade` n'est offerte que si TOUTES les syllabes du lieu ont une devinette curee
  (`charadeReady`, voir plus bas) — jamais une carte partiellement curee. `ClueGrid`
  boucle sur `cluesFor(place)`, pas sur `CLUE_ORDER` — `vowelsUnlocked` attend que tous les indices
  reellement offerts (pas la liste complete) soient piques. **Score ajuste en consequence** :
  `totalRevealCount(place)`/`remainingScore(revealedClueIds, place)` prennent desormais le lieu (au
  lieu d'un calcul global fixe) : `maxScoreForRound` (toujours generique, un simple nombre) descend
  mecaniquement pour une ville `citiesFr` (moins d'indices a piocher) ou un lieu sans `personality`/
  `wordplay` curee. Le seul appelant reel (`useOnlineClueGame`) attend que `place` soit connu avant d'appeler
  `remainingScore` (0 tant que ce n'est pas le cas — jamais montre au joueur, l'ecran affiche encore
  le splash de chargement a ce moment-la).
- **Indices : la charade** (`ClueId` `'charade'`, `helpers/charade.ts`) — une devinette par syllabe du
  nom du lieu, style jeu de societe ("mon premier est...", "mon deuxieme est..."), sans jamais epeler le nom en
  clair (cette derniere etape a ete retiree : l'indice coute un clic par groupe de syllabes). Le decoupage en syllabes est stocke dans le lieu
  (`places/{cle}.clues.syllables`, `CluePlace.syllables`, un tableau eventuellement vide : certains noms n'ont
  aucune syllabe utilisable, ex. "Bălți", et l'indice est alors retire) ; les devinettes le sont aussi, une par
  syllabe, dans `clues.riddles` (`CluePlace.riddles`, `null` quand il n'y en a pas). Rien n'est calcule ni lu
  ailleurs pendant une manche. **La devinette reste GLOBALE** : le dictionnaire est la collection
  `charadeRiddles/{syllabe normalisee}` (`normalizeSyllable` : minuscule, et "a"/"à"/"â" confondus — vrais
  homophones en francais, contrairement a la famille du "e"), valeur = devinette ou `null` ; curer "pa" une fois
  vaut pour Paris, Palerme et tout lieu qui a un "pa". **La charade n'est offerte que si TOUTES les syllabes du
  lieu ont une devinette non-nulle** (`charadeReady(place)`, verifie par `cluesFor`) — jamais de carte a moitie
  curee. Paliers plafonnes a `CHARADE_SYLLABLE_STAGE_CAP` (4) + 1 palier final : au-dela de 4 syllabes, les
  syllabes en trop sont regroupees dans le dernier palier (voir `charadeSyllableGroups`). Admin :
  `PlacesView`'s `CharadeEditor` (par lieu) edite le decoupage ET la devinette (chaque syllabe se renomme sur
  place ou se supprime, "+ Ajouter une syllabe", "Vider") et l'onglet "Syllabes" (`SyllablesView`, une ligne
  par syllabe DISTINCTE) n'edite que la devinette globale. Tout part directement dans Firestore : editer une
  devinette reecrit `charadeRiddles/{syllabe}` ET le `clues.riddles` de chaque lieu qui contient cette syllabe
  (`applyRiddleChange`) ; editer le decoupage recalcule les devinettes du lieu (et cree l'entree du dictionnaire
  pour une syllabe nouvelle).
- **Indices : une personnalite liee au lieu** (`ClueId` `'personality'`, `helpers/personality.ts`) — un seul
  palier (nom + description courte optionnelle, ex. "footballeur"), jamais invente : uniquement des faits
  Wikipedia (nee/tres fortement identifiee au lieu). Dans `places/{cle}.personality` (`{ name, jobCode, job }`,
  absent pour la quasi-totalite des lieux, cure et edite dans l'admin). `jobCode` pointe dans la collection
  `personalityJobs/{code}` (`{ fr, en }`, ex. `"cha"` -> "chanteuse"/"singer"), un vocabulaire de metiers
  partage ; le libelle est recopie dans le lieu (`personality.job`) pour que la manche ne lise rien d'autre
  (`applyJobChange` garde les copies a jour quand on renomme ou supprime un metier). Seul `fr` est affiche
  aujourd'hui (`en` cure en prevision d'une traduction du contenu). Un lieu sans personnalite n'offre jamais cet
  indice (`cluesFor` le retire, jamais de case vide). 41 lieux en ont une (23 capitales + 18 villes `citiesFr`).
- **Indices : un jeu de mots sur le nom du lieu** (`ClueId` `'wordplay'`, `helpers/wordplay.ts`) — un seul
  palier : `sentence`, revelee en un clic. `difficulty` (`Difficulty`, curee a la main, defaut `intermediate`)
  est purement informative — n'influence jamais si l'indice est propose — affichee dans l'en-tete de la carte
  comme un simple point colore (`difficultyEmoji`/`DIFFICULTIES` de `@/data`), uniquement une fois la carte
  revelee. Aucune heuristique possible (trouver un vrai jeu de mots n'est pas automatisable) : stocke dans
  `places/{cle}.wordplay` (`{ sentence, difficulty }`), curation 100% manuelle dans l'admin
  (`WordplayEditor`, la phrase en `EditableValue`, la difficulte dans un `<select>`). `wordplayFor(place)` rend
  `null` tant que `sentence` est vide, et un lieu sans jeu de mots n'offre jamais cet indice (`cluesFor`).
  `RoomDeletedScreen`, `FinalStandings` (ecran de fin commun aux trois jeux : classement, medailles, egalites ;
  Compass y ajoute en `children` son propre `RoundsRecap`, qui dit qui a ete le meilleur en direction et en distance
  a chaque manche). La banniere de victoire dit "Vous gagnez !" plutot que le nom du gagnant quand c'est cet
  appareil (prop `localName`, les noms sont uniques dans une room donc une simple egalite de chaine suffit) —
  jamais pour une egalite, qui reste une liste de noms.
- **Un joueur part** (quitte, expulse, coupure) : il n'est pas seulement retire de `players` — l'hote efface aussi ce
  qu'il a laisse dans les donnees de manche (`guesses`, `scores`, `totalScores` : `helpers/useHostPruneLeavers.ts`,
  `pruneRoomPlayerData` de `roomBase`). S'il revient, c'est un nouveau joueur : ni points ni reponse, dernier dans
  l'ordre d'arrivee. L'ecran de resultats de Compass relit `guesses`/`scores` dans la room (par uid) plutot qu'un
  enregistrement fige a l'arrivee de la revelation, indexe par les joueurs de l'epoque.
- **Coupure reseau** : `helpers/useRoomPresence.ts`, monte une seule fois par `useSetupRoom` (qui reste
  vivant sous l'ecran de jeu). Pendant une partie a plusieurs (pas en solo, pas dans le lobby), chaque
  appareil ecrit un heartbeat `players.{uid}.lastSeen` toutes les 30 s (cout : chaque ecriture est relue
  par tous les joueurs) et surveille celui des autres (a-t-il change ? jamais compare a l'horloge locale).
  Rien n'est recupere : qui perd la connexion quitte la partie — soi-meme (ecriture jamais acquittee
  90 s : `connectionLost` dans le store, les ecrans affichent `RoomDeletedScreen` avec un message
  dedie), un joiner que l'hote ne voit plus (l'hote le retire, les autres continuent), l'hote que
  les joiners ne voient plus (ils quittent). Un appareil suspendu (arriere-plan, ecran verrouille) n'est
  pas pris pour une coupure : un controle en retard remet les references a zero.
- **L'hote quitte** : `handleQuit` supprime le document de la room (`deleteDoc`, seul l'hote peut). Les
  joiners ne sont pas envoyes sur un ecran a part : ils gardent la manche en cours (dernier etat recu
  encore dans le store) sous la notice « l'hote a quitte » que `useSetupRoom` affiche, puis retournent a
  l'accueil au clic ou apres 2 s (`dismissDisconnectNotice` fait `router.dismissTo('/')` des que l'ecran
  de jeu est ouvert — sinon le reset du setup vide le store sous le jeu). L'ecran de jeu rend `null` une
  fois le store deconnecte (`connected`), jamais le splash « preparation » (reserve a une room qui n'a
  pas encore livre son etat).

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
devinent lequel via des indices partages, dont les TYPES sont choisis au setup (voir "Indices par categories"). Pas de second temps de placement de lieux (retire —
le jeu s'arrete a la reconnaissance du pays).

**Multijoueur (rooms `game: 'silhouette'`), modele Indices** : un plateau partage, un joueur actif a la fois
(`turnUid`, l'ordre d'arrivee des joueurs). Son tour, il revele le palier suivant (`hintsRevealed` 0 a N, N = nombre d'etapes du plan d'indices,
ce qui passe la main au joueur suivant) ou tente une reponse (bonne : `verdict: 'correct'`, gain
`contourGuessPoints(hintsRevealed, plan.length)` ; mauvaise : `wrongGuessSeq` +1, penalite
`CONTOUR_WRONG_GUESS_PENALTY`, il garde la main) ; une fois le pays revele (derniere etape du plan) il confirme
l'abandon (`verdict: 'giveUp'`, personne ne marque). L'hote tire tous les pays d'avance (`countryCodes`,
`fetchContourRoundCodes` — la room ne porte que les codes, voir "Silhouette : tout vient de Firestore" plus bas)
et seul l'hote ecrit les scores (`useHostTurnScoring`).

**Silhouette : tout vient de Firestore (pas de repli sur les JSON).** *Tirage* (`games/contour/helpers/firestoreContours.ts`,
hors barrel comme `room.ts`) : meme methode que Boussole/Indices, avec UN seul groupe par difficulte. Les silhouettes
sont numerotees `n` = 1..taille dans leur difficulte (ordre melange une fois, voir "Modele Firestore denormalise"),
les tailles sont dans `meta/contourCounts` (lu une fois par lancement, `preloadContourCounts` dans `_layout.tsx`),
et l'appareil a UN curseur par difficulte (`contourCursors.ts`, AsyncStorage) : une partie prend les pays suivants
et avance le curseur, en bouclant, donc un groupe est parcouru en entier avant qu'un pays revienne ; le 1er tirage
part d'un pays au hasard. Une requete par tranche de 30 numeros (`difficulty == d`, `n in [...]`, 1 lecture par
pays) ; un numero sans document (l'admin l'a retire) en redemande d'autres. Si Firestore echoue ou s'il y a moins
de `rounds` pays, `fetchContourRoundCodes` rejette : `useSetupRoom` affiche `startFailedNotice`, la room reste dans
son salon, "Lancer la partie" relance. *Manche* (tous les appareils, hote compris) : `useRoundData` lit le document du
pays de la manche (`countries/{code}`), qui porte son contour, ses voisins (indices et decor) et ses villes : UNE
lecture par manche (`loadRoundData`, gardee en memoire pour la session ; les documents ramenes par le tirage de
l'hote y sont deja, donc aucune lecture de plus) — et charge deja la
manche SUIVANTE pendant qu'on joue (changement de manche sans attente). Le plateau se construit a partir de ces
documents seuls (`ContourRoundCountry`, `roundCountryFromDoc` : noms fr/en du pays et des voisins, capitale et villes
precalculees) : plus de `CONTOURS`, de `countryName` ni de `contourPlacesFor(PLACES)` a l'execution ;
`computeBorders` recoit les anneaux des voisins lus avec la manche (`RoundData.neighborCountries`,
`roundGeometry(country, seed, neighborCountries)`). La reponse se verifie sur les noms du document
(`roundCountryName`). Pendant la lecture de la 1re manche : le splash de chargement ; si elle echoue, une notice
`contourGame.loadFailed` (un tap relit). `flagEmoji` est maintenant dans `helpers/flagEmoji.ts` (pur, sans JSON).

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

**Liste d'indices a choisir (Silhouette).** Sous le pays, `ContourHintList` (`components/ContourHintList`, dumb) montre les
indices en petites cartes cote a cote (titre + « sortis/total » + UN seul bouton, le prochain indice du groupe ; un ✓ quand
le groupe est epuise), une par GROUPE : `silhouette` (contour), `neighbors` (voisins), `cities` (villes ET
capitale : `cityPositions`, `cityNames`, `capitalPosition`, `capitalName`), puis `reveal` (le pays) seulement une fois tout le
reste sorti. Le joueur qui a la main touche le PROCHAIN indice du groupe de son choix : il n'y a plus de bouton « Indice » qui revele l'etape suivante d'un ordre fixe, ni de choix des types au setup.
Etat de la room : `hintPicks` (les groupes choisis depuis le debut de la manche, dans l'ordre ; `hintsRevealed` en est la
longueur, gardee pour le bareme et les regles), remis a `[]` a chaque manche ; `firestore.rules` l'autorise dans les champs
du detenteur du tour. `orderHintPlan(plan, picks)` (`helpers/hintPlan.ts`, pur) range le plan dans l'ordre des choix : les
`picks.length` premieres etapes sont celles sorties, donc `buildHintLabels`/`boardShapeFor`/`contourGuessPoints` continuent de
lire « les N premieres etapes » sans rien savoir du choix ; `hintGroupsView` (pur) donne la liste a afficher. Chaque indice
pris coute autant que dans l'ancien plan (bareme inchange) et passe la main au joueur suivant.

**Indices par categories (plan d'indices).** Il y a 4 categories (`ContourSettings.hintCategories`, toujours les 4 par defaut ; le setup
ne les propose plus en option, l'ancienne `HintCategorySection` est supprimee mais le champ de la room reste) : `silhouette` (le trait
se precise), `neighbors` (voisins), `cities` (villes hors capitale), `capital`. Le reglage est un champ des
reglages de la room (l'hote le fixe, les joiners le lisent comme `difficulty`/`rounds` ; `firestore.rules` ne
contraint pas la forme des reglages, seulement qui les ecrit) ; une room ou un reglage sans le champ = les 4
(`normalizeHintCategories`). `buildHintPlan(categories, country)` (`helpers/hintPlan.ts`, pur) donne la liste
ordonnee des etapes, ordre fixe des categories : silhouette (`silhouette1-3`), neighbors (`neighborShapes` =
formes + frontieres en decor, `neighborFlags`, `neighborCodes` = le code pays « IT » sous le drapeau, `neighborNames` = le nom en entier, a sa place), cities (`cityPositions`, `cityNames`),
capital (`capitalPosition`, `capitalName`), puis toujours `reveal` (drapeau + nom du pays = abandon). Une etape
que le pays ne peut pas offrir est omise (pas de voisins curees, pas de capitale/villes dans les donnees) : le
plan s'adapte. `hintsRevealed` (0..N, N = `plan.length`) indexe ce plan ; chaque appareil le recalcule depuis les
reglages de la room + le pays, rien de plus n'est stocke par manche. Le niveau de precision du trait
(`silhouetteLevel`) est 0 au depart si `silhouette` est active, sinon l'anneau complet d'emblee ; les voisins en decor
n'apparaissent qu'a `neighborShapes` (jamais sans, meme categorie `neighbors` desactivee). Les etiquettes sont
`buildHintLabels(board, plan, hints, language)` ; la forme `boardShapeFor(board, plan, hints)`. Bareme
`contourGuessPoints(hints, N)` : 500 x (1 - 0.85 * hints / (N - 1)) arrondi pour hints < N, 0 a N (un plan reduit
au seul `reveal` donne 500 puis 0). Villes et capitale sont precalculees dans le document du pays (`capital`, `cities` de `countries/{code}`) : categories
`capital`, `cities`, `citiesFr` du pays, limitees a l'emprise (bbox) de l'anneau principal (exclut l'outre-mer), au plus
`MAX_CITY_HINTS` (5) villes hors capitale, les plus faciles d'abord ; elles n'ont qu'un nom (pas de traduction). Elles sont projetees avec le MEME
projecteur que le contour (`RoundBoard.cityMarks`/`capitalMark`) : un point `●` par ville, une etoile pour la
capitale, puis le nom empile dessous comme les voisins (pas d'anti-collision). Pas de fleuves (pas de donnees).
Toujours centre (`textAnchor="middle"` fixe dans
`ContourBoard.tsx`) : l'ancien alignement directionnel `start`/`end` n'avait plus de sens
des que chaque hint est devenu un point fixe plutot qu'une etiquette pointant vers le bord.

Filtre par difficulte, meme enum `Difficulty` que Compass/Clues, choix unique dans les trois jeux
(`GameSettings.difficulty`, `ClueSettings.difficulty`, `ContourSettings.difficulty`) : determine le groupe dans lequel
les pays sont tires (`difficulty` du document `countries/{code}`, curee a la main dans l'admin — France et Espagne
en `easy`, seule la Norvege en `hard`, `intermediate` pour tous les autres ; deliberement desequilibre, ne pas
tenter de rectifier sans demande explicite). Un groupe plus petit que le nombre de manches (2 pays en `easy`) est
reparcouru, sans jamais le meme pays deux fois de suite quand il y a le choix.

**Pays et contours dans Firestore, cle = code ISO.** `countries/{ISO}` (nom fr/en, drapeau, devise, indicatif,
`borders` = pays frontaliers) est la source que l'admin edite ET ce que lit Silhouette (voir "Modele Firestore
denormalise"), avec les noms des voisins deja copies. Les voisins positionnes sur le plateau
(`{ type: 'country', code, x, y, fr, en }` — uniquement des pays, plus de voisin mer/ocean) sont propres a chaque pays :
un meme voisin peut avoir une position differente selon le pays qui le cite. Les `points` de TOUS les pays viennent
d'une seule topologie du monde entier simplifiee une fois (world-atlas 50m) : un arc partage entre deux pays reste
un seul arc, donc une frontiere commune a **exactement les memes sommets** des deux cotes. **Ne jamais retoucher les
`points` d'un seul pays** (ni par l'admin ni a la main) : les sommets partages ne correspondraient plus. Seul
l'anneau principal de chaque pays est garde, donc une frontiere portee par un autre polygone (Thrace turque, Cabinda,
enclaves) n'est pas detectee. Les scripts qui generaient ces donnees (`generate:contours`...) ont ete supprimes avec
les JSON : les contours ne se regenerent plus, ils s'editent (positions des voisins, ancre du label) dans l'admin.

**Voisins bruts de chaque pays** (`countries/{ISO}.borders`) : codes ISO tries des pays
qui partagent une frontiere terrestre, ex. `"MC": ["FR"]`, symetriques (A voisin de B <=> B voisin de A). Un pays sans
voisin (iles) n'a pas de champ. Rien a voir avec `neighbors` (les quelques voisins POSITIONNES sur le plateau pour les
indices) ; les frontieres dessinees, elles, sont deduites de la geometrie (ci-dessous), donc n'incluent pas les
frontieres d'un autre polygone que l'anneau principal. Dans l'admin, la carte pays a un bouton "Afficher les voisins"
(liste drapeau + nom + code) qui, si l'editeur Silhouette du pays est deplie, dessine aussi les voisins en decor avec
la frontiere en un seul trait (`computeBorders`, comme le jeu).

**Silhouette progressive (categorie `silhouette`, niveaux 0 a 3).** Avant tout indice le pays est dessine avec quelques
sommets ; chaque appui sur "Indice" precise le trait (niveaux 0-3, un par etape `silhouetteN` du plan), le niveau 3 etant l'anneau complet. `helpers/simplify.ts` (pur, aussi utilise par l'admin) :
Visvalingam-Whyatt sur l'anneau, aire de chaque sommet multipliee par un facteur aleatoire seede
(mulberry32, 0.6-1.4) pour que les versions grossieres varient un peu d'une graine a l'autre ; l'ordre de
suppression donne des niveaux EMBOITES (jamais de saut de forme), le premier sommet et le sens sont
conserves, taille des niveaux `k * n^p` (LEVEL_SCALES, sous-lineaire : Autriche 29 sommets = 6 / 10 / 16, Australie 245 = 10 / 20 / 39) puis tout (au moins 3 sommets de plus par niveau tant qu'il en
reste, anneau entier si < 10 sommets). Calcule A LA VOLEE, une fois par (pays, graine) (`roundGeometry`,
memoise dans `useRoundBoard`, O(n^2) sur n <= ~700), rien dans Firestore. **Graine partagee** :
l'hote tire `simplifySeed` (`newSimplifySeed`) a `startContourRoomGame` (champ de la room, 0 par defaut
pour une ancienne room) ; la graine d'une manche est `roundSimplifySeed(simplifySeed, roundIndex, code)`
(FNV-1a), donc tous les appareils dessinent exactement la meme silhouette. Le cadrage du plateau (ratio,
projecteur) reste celui de l'anneau COMPLET : la forme ne bouge ni ne change d'echelle en se precisant. **Voisins
en decor a leur propre etape (`neighborShapes`)** : tant que le trait n'est pas l'anneau complet, ou que cette etape n'est pas
sortie (`boardShapeFor`), on ne dessine que la silhouette, en un seul trait et sans voisins (leurs aretes communes ne
coincident qu'avec l'anneau complet) ; ensuite anneau complet + voisins + frontieres ; fin de manche = tout. Admin : dans l'editeur Silhouette, plus de bouton Editer/Apercu : les niveaux de simplification sont toujours la
(niveaux 0-3 avec leur nombre de sommets, puis niveau 4 = voisins comme dans le jeu, leurs lignes en pointillé sans fond,
"Autre variante" tire une nouvelle graine), le niveau 4 (voisins) est celui par defaut, et les villes (point) et la capitale (etoile)
que le jeu propose en indice y sont affichees a leur place, avec leur nom dessous ; les drapeaux des voisins et
du pays se deplacent (et les voisins se suppriment) a tous les niveaux.

**Voisins : jamais remplis, leurs lignes en pointillé (jeu).** Dans la partie, l'etape `neighborShapes` ne remplit plus les
voisins (plus de fond colore) : la frontiere commune reste le trait fin du pays (`borders`), et le reste du contour des
voisins — leur cote lointaine et leurs frontieres avec les pays d'apres, c'est-a-dire leurs aretes NON communes avec le pays —
est trace en pointillé (`neighborBorders`, `BORDER_DASH`), a leur precision complete. `computeBorders` les donne dans
`neighborRuns` (l'anneau de chaque voisin decoupe par `splitRing`, aretes communes retirees). Les voisins se proposent a tout moment : si l'etape sort avant que le trait soit net, leurs
lignes et la frontiere commune se posent sur le contour grossier, sans decoupage cote/frontiere (les aretes ne coincident
qu'avec l'anneau complet, `boardShapeFor`, `helpers/roundBoard.ts`). `ContourBoard` sait encore remplir des voisins
(`neighborOutlines`) : l'apercu de l'admin s'en sert.

**Frontieres dessinees une seule fois.** `helpers/borders.ts` (`computeBorders`, appele par
`useRoundBoard` une fois par pays puis passe a `projectRound`) trouve les pays voisins par
egalite exacte d'arete (memes deux sommets, dans un sens ou dans l'autre — pas d'intersection
geometrique) et coupe l'anneau du pays cible en tronçons `coastlines` (aucune arete partagee) et
`borders` (arete partagee). `ContourBoard` empile : voisins remplis (`colors.border` a
`NEIGHBOR_FILL_OPACITY`) **sans contour**, pays cible rempli sans contour, puis ses deux traits
par-dessus — cote, frontiere et lignes des voisins, tous a la meme epaisseur (`VISIBLE_STROKE_WIDTH`). Comme
seul le pays cible trace un trait, une frontiere n'est jamais doublee. Les voisins ne sont qu'un
decor : les indices (drapeaux/noms) restent ceux de `ContourCountry.neighbors`/`buildHintLabels`.
Aucune donnee de frontiere n'est stockee : les voisins se deduisent des `points` des autres pays.

Admin : pas d'onglet a part — un bouton "🗺️ Silhouette" apparait dans la carte pays de
`admin/src/views/CountriesView` pour tout pays possedant une silhouette (`allContours().find`), et deplie
`admin/src/views/ContourView/ContourEditor.tsx` juste en dessous, dans cette meme carte (recherche/pagination/tri deja
fournis par CountriesView, partages entre pays classiques et Silhouette). `ContourEditor` prend un seul
`initialCountry` en prop (pas de selecteur de pays a lui, CountriesView fait deja ce role) : chaque voisin (et le
point drapeau/nom du pays cible, un seul point) se glisse a la souris et se pose exactement ou on le lache — chaque
deplacement/suppression est ecrit directement dans `countries/{ISO}` (`saveNeighborPosition`,
`saveCenterLabelPosition`, `deleteNeighbor`, `admin/src/api/contour.ts`). Un lieu ne se supprime que via
`deletePlace` (`admin/src/api/places.ts`), partage avec Compass/Clues.

## `Screen` : header/footer fixes

`components/ui/Screen` accepte `header` et `footer`, rendus en dehors du `ScrollView`
(siblings dans la meme `SafeAreaView`) donc toujours visibles. `OnlineGameScreen` (Compass) et
`OnlineClueGameScreen` les utilisent pour : quitter + score + manche/pastilles + onglets joueurs (header),
bouton Valider (footer, seulement hors revelation — `RoundResult` a son propre bouton "suivant" inline).

**Piege connu** : un `ScrollView` horizontal place dans un `header` s'etire en hauteur
sur react-native-web s'il n'a pas de `style={{ flexGrow: 0, flexShrink: 0 }}` explicite
(pas seulement `contentContainerStyle`) — voir `PlayerTabs.tsx`.

**Exception (Contour)** : tout l'ecran de
`OnlineContourGameScreen` n'utilise pas `Screen` du tout — `ContourFullBleedScreen`, un `SafeAreaView`
propre (fond `colors.background`), avec la silhouette qui occupe tout l'ecran mesure (`useRoundBoard`, `onLayout`) et
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

La barre d'outils propose le theme (Night / Day) et la langue (Francais / English) : `preview.tsx` fournit
`ThemeSettingsContext` et `LanguageContext` a chaque story (une story qui fige un theme s'entoure de son propre
Provider, qui l'emporte). `admin/.storybook/manager.ts` fait suivre le meme interrupteur de theme a l'interface de Storybook elle-meme
(sidebar, barre d'outils, panneaux : theme Storybook construit depuis `night`/`day`, applique via `api.setOptions`). Les `args` qui portent du texte sont calcules au chargement du fichier : pour qu'ils
suivent la langue, une story les construit avec une fonction `(t) => ({...})` utilisee deux fois — dans `args`
(avec `translations.fr`) et dans `decorators: [localizedArgs(build)]` (`@/storybook/localized`), qui les refait
avec la langue courante. Du JSX de story qui contient du texte passe par le meme `build` (voir `SetupScreenShell`).

## Contrôle qualité

Le skill projet `quality-check` (`.claude/skills/quality-check/`, appelable avec `/quality-check`) enchaine les
quatre controles avant un commit ou une release : couverture (seuil 100 %, `coverage-gaps.cjs` liste les trous),
regles d'implementation des dossiers de composants et des stories (`audit-structure.cjs`), build Storybook, et code
mort (knip, modes dev et prod). Il rapporte, il ne corrige ni ne commit sans demande.

## Theme

Deux themes, `night` (sombre, bleu nuit + ambre) et `day` (clair, bleu + orange). Fond uni
(`colors.background`) : il n'y a plus ni ciel etoile ni nuages, ni reglage d'animations ni mascotte qui se
balade sur l'accueil (retires) ; la mascotte reste fixe en haut a droite et n'a que ses animations sur
place (flottement, feux, rotor, engrenage).
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
  l'API `Animated` de React Native est utilisee (`EarthSection.tsx` : orbite du satellite/avion) — lire `.current` d'un
  `Animated.Value`/`ValueXY` cree via `useRef` puis l'utiliser dans le style au rendu est
  le pattern officiel de cette API, incompatible
  avec cette regle stricte. Meme categorie que les 4 fichiers ci-dessus, pas une erreur a
  corriger.
- Repo : `mathieujullien77190/azimuth-quiz`, un seul contributeur, commits directs sur
  `master`.
