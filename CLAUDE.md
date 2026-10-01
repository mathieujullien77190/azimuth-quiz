@AGENTS.md

# Azimuth Quiz

Trois jeux de geographie, **toujours en ligne** (une room par partie, meme seul), jusqu'a 10 joueurs et 20 manches :

| Nom affiche | Dossier de code | Principe |
|---|---|---|
| Boussole | `compass` | un lieu s'affiche, chacun vise son cap et estime la distance depuis un point de depart |
| Indices | `clues` | un lieu cache, on devoile des indices a tour de role et on devine son nom |
| Silhouette | `contour` | la silhouette d'un pays, on devine lequel avec des indices partages |

Le nom de code et le nom affiche different volontairement (les traductions restent dans `fr.ts`). Web statique sur GitHub
Pages (`https://mathieujullien77190.github.io/azimuth-quiz/`) en plus des builds natifs. Repo `mathieujullien77190/azimuth-quiz`,
un seul contributeur, commits directs sur `master`.

## Structure

Convention du skill personnel `react-structure` (hors depot) : chaque composant est un dossier `index.ts` + `<Name>.tsx` (export nomme) +
`helpers.ts` + `constants.ts` + `types.ts` + `styles.ts` (le seul `createStyles`, jamais de logique dedans). Dans un dossier
`screens/<Screen>/` qui contient le container ET sa vue (`OnlineGameScreen.tsx` + `OnlineGameScreenView.tsx`), chacun a son
fichier de styles nomme d'apres lui (`OnlineGameScreenView.styles.ts`). Alias `@/` → `src/`. Identifiants de code en anglais.

```
src/
  app/          # Expo Router : _layout (providers + Stack), routes = re-exports minces
  components/   # ce qui n'est pas propre a un jeu : ui/ (Button, Card, Chip, Screen...), HomeScreen, SettingsScreen,
                # Compass, EarthSection, PlayerTabs, RoundCounter, DifficultyBadge, GameHeader/GameFooter, setup/...
  data/         # valeurs partagees par 2+ jeux (score/geo, options, palette joueurs), theme.ts, et data/firestore/
                # (types des documents, lecteurs read.ts, numbering.ts, denormalize*.ts, polyline.ts, journal.ts)
  games/<jeu>/  # screens/ (dossiers `*Screen`, rendus par une route), components/, helpers/, store/, constants.ts
  helpers/      # commun aux 3 jeux (geo, format, storage, location, random, firebase, settings, roomBase,
                # createRoomStore, useOnlineRoomSession, groupedDraw...). Le barrel `index.ts` re-exporte aussi
                # les helpers par jeu ; seuls les fichiers qui importent `firebase/firestore` (room.ts, roomBase.ts,
                # roomStore.ts, firestorePlaces.ts...) restent HORS barrel (Jest plante a l'import) : import direct.
  settings/     # GameSettings, ClueSettings, ContourSettings en stores Zustand (singletons) ; `usePlayerName`
  themes/       # night.ts, day.ts, fonts.ts, ThemeContext
  types/        # types de domaine partages
admin/          # outil interne (app Vite a part), importe des fichiers de `src/` via le meme alias `@/`
```

Apres tout renommage ou deplacement dans `src/`, verifier l'admin : `(cd admin && npx tsc --noEmit -p . && npm run build)`.

### Smart / dumb
`SetupScreen` et `OnlineGameScreen` (Boussole) suivent le meme decoupage : un hook colocalise (`useOnlineRoom.ts`,
`useOnlineGame.ts`) porte l'etat, les effets et les actions deja resolues ; le container (`*Screen.tsx`) appelle le hook,
calcule les libelles qui ont besoin de `useTranslation`/`useTheme`, garde les early-returns d'ecran entier (chargement,
fin, notice « room supprimee ») ; la vue `*View.tsx` ne fait que du rendu : jamais d'effet ni de store metier, seulement
des primitives UI, des constantes et des callbacks deja decides (`readOnly`, kick... se decident dans le container).
`useTranslation`, `useTheme`, `useThemedStyles` et `useWindowDimensions` restent permis dans la vue. Les tests rendent le
container.

### Nom du joueur
Un seul nom pour les 3 jeux : `usePlayerName` (store persiste, hydrate dans `_layout.tsx`). Chaque jeu garde un
`playerName` dans ses reglages comme miroir (requis par `useSetupRoom`), qui ne part jamais dans la room ; `onChangeName`
ecrit dans les deux, et un effet a usage unique reconcilie au premier montage (le nom Compass deja sauve alimente le store
partage).

## Parties en ligne (couche commune)

Une seule collection `rooms`, un champ `game` (`'compass' | 'clues' | 'silhouette'`) fixe a la creation et immuable ; il dit
quelles regles de `firestore.rules` s'appliquent. Un code d'un autre jeu est refuse a la jonction.

- **Firestore** : `helpers/roomBase.ts` (`createRoomApi(game)` : creer/rejoindre/quitter, presence, couleurs, reglages) ;
  chaque `games/<jeu>/helpers/room.ts` le lie a sa collection et ajoute l'etat de manche. Indices et Silhouette partagent la
  fonction de regles `turnBasedPlayer` : **tout champ qu'un joueur non hote ecrit doit etre dans sa liste de champs** dans
  `firestore.rules` (sinon l'ecriture est refusee et l'action « revient »).
- **Store** : `helpers/createRoomStore.ts` (connexion, joueurs, hote, reglages, `gameState`).
- **Setup** : `components/setup/useSetupRoom` (host/join, presence, couleurs, kick, notices, navigation) +
  `SetupScreenShell`/`PartySection`/`CategorySection`/`DifficultySection`/`RoundsSection`/`OptionsSection`.
- **Ecran de jeu** : `useOnlineRoomSession` (etat, hote, joueurs dans l'ordre d'arrivee, redirection « room supprimee »,
  `handleQuit`) ; pour les jeux a tour de role `useHostTurnScoring` (l'hote seul ecrit `totalScores`), `useHostTurnRecovery`
  (l'hote passe la main si le joueur actif est parti), `useGuessDraft`, `nextPlayerUid`, `useTransientFlag`. Composants :
  `GameHeader`/`GameFooter`, `NoticeOverlay`, `RoomDeletedScreen`, `FinalStandings`.
- **Pas de partie locale** : jouer seul = heberger une room *cachee* (`hostedSilently` dans `useSetupRoom`), donc il faut du
  reseau. `startOnlineGame(run)` couvre les deux cas ; ce que `run` lit dans la room est lu *dans* `run`.
- **Un joueur part** (quitte, expulse, coupure) : l'hote efface aussi ses donnees de manche (`useHostPruneLeavers`,
  `pruneRoomPlayerData`) ; s'il revient, c'est un nouveau joueur.
- **Coupure reseau** (`useRoomPresence`, monte une fois par `useSetupRoom`) : en partie a plusieurs, heartbeat
  `players.{uid}.lastSeen` toutes les 30 s ; qui perd la connexion quitte la partie (soi-meme apres 90 s sans ecriture
  acquittee, un joiner que l'hote ne voit plus est retire, l'hote perdu fait quitter les joiners).
- **L'hote quitte** : `handleQuit` supprime la room ; les joiners gardent la manche sous la notice « l'hote a quitte »
  puis retournent a l'accueil (clic ou 2 s). L'ecran de jeu rend `null` une fois deconnecte.

## Donnees Firestore

Firestore est la **seule source** des donnees (lieux, pays, silhouettes, devinettes, metiers) : aucun JSON embarque,
**aucun repli** si Firestore echoue. Les donnees sont **dupliquees expres** (un document par lieu ou par pays porte tout ce
dont une manche a besoin) et numerotees pour le tirage. **Pour toute modification de donnees (copies a propager,
numerotation, compteurs, `dataVersion`, journal de l'admin), suivre le skill `firestore-data`** ; l'admin
(`admin/src/data.ts`) sait deja le faire pour la plupart des cas.

Collections : `places/{cle}` (cle = code de 3 lettres, permanent, opaque), `countries/{ISO}` (nom, drapeau, devise,
indicatif, voisins ; plus tout ce que lit Silhouette), `charadeRiddles/{syllabe normalisee}`, `personalityJobs/{code}`,
`meta/*` (`compassCounts`, `cluesCounts`, `contourCounts`, `dataVersion`), `journal/*` (admin seulement), `rooms/*`.
Le jeu ne lit que `places`, `countries` (Silhouette), `meta` et `rooms`. Types dans `data/firestore/types.ts`.

**Tirage des manches** (Boussole, Indices, Silhouette ont le meme moteur : `helpers/groupedDraw.ts` +
`groupCursors.ts`/`groupCounts.ts`) : l'hote tire seul. Chaque groupe (Boussole : `compass.category` × `difficulty` ;
Indices : `clues.category` × `difficulty` ; Silhouette : `difficulty`) est numerote `n` = 1..taille (dense, ordre melange
par hash de la cle, `numbering.ts`), les tailles sont dans `meta/*Counts` (lues une fois par lancement), et l'appareil garde
**un curseur par groupe** (AsyncStorage) : une partie prend les numeros suivants et avance le curseur, en bouclant, donc un
groupe est parcouru en entier avant qu'un element revienne. Plusieurs categories : repartition la plus egale possible
(`splitEvenly`). Lecture : UNE requete `or` par tranche de 30 numeros. L'anglais releve d'un cran les lieux francais
(`effectiveDifficulty`) et refiltre. Echec (Firestore ou moins d'elements que de manches) : la fonction de tirage rejette,
`useSetupRoom` remet `starting` a faux, la room reste au salon et la notice `startFailedNotice` s'affiche (le bouton relance) ;
les curseurs ne bougent pas. Index composites dans `firestore.indexes.json` (a deployer a part).

Les **regles** (`firestore.rules`) et les **index** se deploient a part (`npx firebase-tools deploy --only
firestore:rules --project azimuth-quiz`) : un push ne les deploie pas.

## Boussole

On choisit un cap et on estime la distance **de surface** (`Guess` = `bearing` + `distanceKm`) ; il n'y a plus de mode ligne
droite. Score (`games/compass/helpers/scoring.ts`) : courbe logarithmique sur l'ecart de distance et ecart angulaire 2D,
500 points max pour la direction et 500 pour la distance. Lieux tires par `fetchRandomPlaces`
(`games/compass/helpers/firestorePlaces.ts`, hors barrel). `EarthSection` dessine la Terre de profil (le joueur en haut,
cap = gauche/ouest ou droite/est) ; son zoom est continu (`fitZoom` sur les marques actuelles, jusqu'a `MAX_ZOOM`). Quand
l'appelant donne `origin` (le point de depart, Boussole le fait, seulement a la solution), la vue `Globe3D` est celle montree d'abord, avec un bouton « 2D » (puis « 3D ») pour passer de l'une a l'autre : une boule qu'on tourne au doigt (projection orthographique en SVG, decor `globeLand.ts`, contours Natural Earth 110 m simplifies sans l'Antarctique : un asset decoratif, pas une donnee de jeu) ou chaque reponse est son trajet de grand cercle (`destinationPoint`/`routePoints`, coupe au bord de la boule quand il passe derriere) ; la vraie reponse n'est qu'un point entoure. A tout zoom. Au depart la boule montre le cote de la Terre ou sont le depart et les reponses (`centerOn`). Le pole nord (un point blanc avec un « N » a cote, tant qu'il est devant, prop `north`, vrai par defaut) montre l'inclinaison. Un satellite (la nuit seulement, pas d'avion le jour) fait le tour de la Terre sur le grand cercle depart → lieu (`orbitPoint`, vu aussi derriere la boule au-dela du bord), cliquable (message). En vue 3D, pas de zoom +/−.

## Indices

Lieux tires par `fetchClueRoundPlaces` (`firestoreCluePlaces.ts`, hors barrel), groupes par `clues.category`
(`capital` / `citiesFr` / `cities`, derivee de la categorie Compass par `cluesCategory`). **Une manche ne lit que le lieu
tire** : le document `places/{cle}` porte les copies (`country`, `clues.riddles`, `personality.job`, `wordplay`,
`clues.category`) et `cluesFromDoc` construit le `CluePlace` depuis ce seul document.

- **Quels indices** : `cluesFor(place)` filtre `CLUE_ORDER` pour ce lieu. Une ville `citiesFr` perd 5 indices qui ne varient
  pas en France (heure locale, capitale ou non, couleurs du drapeau, devise, indicatif). `personality`, `wordplay` et
  `charade` ne sont offerts que si le lieu les a cures (charade : TOUTES les syllabes ont une devinette, `charadeReady`).
  `ClueGrid` boucle sur `cluesFor`, et `vowelsUnlocked` attend que tous les indices offerts soient pioches.
- **Globe 3D** (`globe`, 2 clics, carte pleine largeur) : `Globe3D` avec le point de depart (`gameState.origin`, passe en prop `origin` jusqu'a `ClueCard`) et le lieu entoure ; 1er clic = boule nue + equateur + meridien de Greenwich (props `equator`/`greenwich`, `land={false}`), 2e clic = les terres s'ajoutent.
- **Score** : `maxScoreForRound`/`remainingScore(revealedClueIds, place)` suivent la liste reellement offerte.
- **Charade** (`helpers/charade.ts`) : une devinette par syllabe du nom (`clues.syllables`, possiblement vide), dictionnaire
  global `charadeRiddles`, paliers plafonnes a `CHARADE_SYLLABLE_STAGE_CAP` (4) + un palier final. L'admin edite le
  decoupage et la devinette par lieu (`CharadeEditor`) et la devinette globale (onglet Syllabes).
- **Personnalite** : nom + metier optionnel, uniquement des faits Wikipedia, `places.personality` (curation admin).
- **Jeu de mots** : une phrase revelee en un clic ; `difficulty` (informative, point colore dans l'en-tete, visible aussi
  carte verrouillee) ne conditionne jamais l'indice. `wordplayFor(place)` rend `null` si la phrase est vide.
- **Saisie en direct** : le detenteur du tour ecrit `typing` (texte debounce 500 ms, jamais en solo ni hors de son tour) ; les
  autres le voient en cases, en MAJUSCULE (`previewText`, `typedSkeleton`), seulement si `typing.uid === turnUid`.
- **Qui s'est trompe** : `wrongGuesserName` derive de `wrongGuessUid`/`wrongGuessSeq` (jamais remis a zero entre manches ;
  le score de l'hote s'appuie sur leur progression), garde par `turnUid` et une graine de manche.
- **« Je ne sais pas »** : reserve a l'hote (`giveUp`), meme hors de son tour, via `isHost()` des regles.

## Silhouette

Un plateau partage, un joueur actif a la fois (`turnUid`, ordre d'arrivee). A son tour il **choisit le prochain indice du
groupe qu'il veut** (ce qui passe la main) ou tente une reponse (bonne : `verdict: 'correct'`, gain
`contourGuessPoints(hintsRevealed, plan.length)` ; mauvaise : `wrongGuessSeq` +1, penalite `CONTOUR_WRONG_GUESS_PENALTY`, il
garde la main). Une fois le pays revele il confirme l'abandon (`verdict: 'giveUp'`, personne ne marque, message « Personne
n'a trouve — 0 point » pour tous). L'hote tire tous les pays d'avance (`countryCodes`, `fetchContourRoundCodes`) et seul
l'hote ecrit les scores. Le bouton « Valider » reste affiche mais grise tant que cet appareil n'a rien tape ; hors de son
tour le champ est en lecture seule avec ce que tape le detenteur (`typing`, meme mecanique qu'Indices).

- **Plan d'indices** : 4 categories (`silhouette`, `neighbors`, `cities` hors capitale, `capital`, toutes actives, champ
  `ContourSettings.hintCategories` conserve) donnent `buildHintPlan(categories, country)` (`helpers/hintPlan.ts`), la liste
  ordonnee des etapes (`silhouette1-3`, `neighborShapes`, `neighborFlags`, `neighborCodes`, `neighborNames`, `cityPositions`,
  `cityNames`, `capitalPosition`, `capitalName`, puis toujours `reveal`) ; une etape que le pays ne peut pas offrir est
  omise. Le **choix** du joueur est l'etat de la room `hintPicks` (groupes pris depuis le debut de la manche ; `hintsRevealed`
  en est la longueur, pour le bareme) ; `orderHintPlan(plan, picks)` range le plan dans cet ordre pour que
  `buildHintLabels`/`boardShapeFor`/`contourGuessPoints` lisent « les N premieres etapes ». `ContourHintList` (dumb) affiche
  une carte par groupe (`silhouette`, `neighbors`, `cities` = villes + capitale, puis `reveal` une fois le reste sorti).
  Bareme : 500 × (1 − 0,85 × hints / (N − 1)) arrondi pour hints < N, 0 a N.
- **Donnees** (tout dans `countries/{ISO}`, une manche = UNE lecture, `useRoundData` precharge la suivante) : `ring`
  (contour, polyline), `difficulty`, `centerLabel`, `n`, `capital`, `cities` (precalculees, au plus `MAX_CITY_HINTS` = 5 hors
  capitale, un nom sans traduction), `neighbors` (`{code, fr, en, ring?, x?, y?}` : `ring` = decor et decoupage
  cote/frontiere, `x`/`y` = voisin place en indice ; deux roles independants). `roundCountryFromDoc` construit
  `ContourRoundCountry` ; la reponse se verifie sur ses noms ; la silhouette et ses voisins sont dessines depuis ces seuls
  documents. Les listes `cities`/`capital` sont editables a la main dans Firestore sans toucher aux lieux Boussole.
- **Difficulte** : meme enum que les autres jeux, groupes par `countries.difficulty`, modifiable dans l'admin sur la carte du
  pays (`applyContourDifficultyChange` renumerote). Repartition voulue : France et Espagne `easy` (2 pays), Europe
  `intermediate` (33), reste du monde `hard` (118) ; ne pas la « reequilibrer » sans demande.
- **Positions en fraction du plateau** : `ContourNeighbor.x/y` et `ContourCountry.centerLabel` sont des fractions 0-1 du
  canvas, pas des lon/lat ; jeu et apercu admin utilisent `boardDimensionsFor(country.points, ...)` (meme ratio), et
  `BOARD_PADDING_RATIO`/`HINT_STACK_GAP_RATIO` sont des fractions de `min(width, height)`.
- **Silhouette progressive** (`helpers/simplify.ts`, niveaux 0-3 puis anneau complet) : Visvalingam-Whyatt avec aire × facteur
  aleatoire seede, niveaux emboites, calcule a la volee par (pays, graine) (`roundGeometry`). La graine est tiree par l'hote
  (`simplifySeed`) et derivee par manche (`roundSimplifySeed`) pour que tous voient la meme forme ; le cadrage reste celui de
  l'anneau complet.
- **Voisins en jeu** (`neighborShapes`) : jamais remplis ; la frontiere commune est le trait fin du pays et le reste du
  contour des voisins est en pointille (`neighborBorders`, `neighborRuns` de `computeBorders`). Tant que le trait n'est pas
  l'anneau complet, seule la silhouette est dessinee (`boardShapeFor`). `ContourBoard` sait encore remplir des voisins
  (`neighborOutlines`) : seul l'apercu admin s'en sert.
- **Frontieres** (`helpers/borders.ts`) : deduites par egalite exacte d'arete entre `points` (anneau principal seulement :
  une frontiere portee par un autre polygone n'est pas detectee). **Ne jamais retoucher le `ring` d'un seul pays** : les
  sommets partages avec les voisins ne coincideraient plus (si un contour change, propager les copies, voir le skill
  `firestore-data`). Les contours viennent d'une seule topologie mondiale simplifiee une fois ; ils ne se regenerent pas.
- **Ecran** : `OnlineContourGameScreen` n'utilise pas `Screen` mais `ContourFullBleedScreen` (la silhouette occupe tout l'ecran
  mesure, header/footer flottent par-dessus). Barre de reponse : `ContourGuessBar`.
- **Admin** : un bouton « Silhouette » sur la carte pays deplie `ContourEditor` (voisins et point drapeau/nom glissables,
  chaque deplacement/suppression ecrit directement `countries/{ISO}`, « supprimer un voisin » ne retire que son role
  d'indice) ; la carte porte aussi le choix de difficulte.

## Erreurs de jeu

Une ecriture Firestore qui echoue ne doit plus etre avalee : on met `.catch(reporting('jeu.action', { room }))`
(`helpers/reportError.ts`), jamais `.catch(() => {})`. `reportError` log en console, previent le joueur quand c'etait
une de ses actions (`kind: 'game'`, notice `ErrorNoticeHost`) et enregistre l'erreur dans la collection `errors`
(`helpers/errorSink.ts`, installe dans `app/_layout.tsx`) ; `kind: 'background'` (presence, saisie en direct, nettoyage)
n'affiche rien (`console.debug` : en dev, un `console.error` s'affiche en toast rouge). Une meme erreur n'est enregistree qu'une fois par 10 s (jeu) ou 60 s (fond), avec un compteur de
repetitions. Les regles n'acceptent une erreur que dans le meme lot que deux compteurs du jour (`errorQuota`) : 30 par
appareil et 1000 au total par jour ; ni `errors` ni `errorQuota` ne passent par le journal ni par `dataVersion`. Elles se
lisent dans la page « Erreurs » de l'admin (nouvelles erreurs en direct, nettoyage des plus de 30 jours : pas de TTL, il
exige la facturation Firebase).

## Ecrans et UI

- **`Screen`** accepte `header`/`footer` rendus hors du `ScrollView`. Piege : un `ScrollView` horizontal dans un `header`
  s'etire en hauteur sur react-native-web sans `style={{ flexGrow: 0, flexShrink: 0 }}` explicite (voir `PlayerTabs.tsx`).
- **`PlayerTabs`** (Indices, Silhouette) est purement informatif (statut seulement, a qui la main).
- **Theme** : `night` (bleu nuit + ambre) et `day` (sable + bleu), fond uni, choix persiste (`ThemeProvider`, cle
  `azimuthquiz:theme`). `useThemedStyles(createStyles)` est le pattern standard. Police unique `FONT_FAMILY` ; un composant
  SVG lit `typography.<token>.fontFamily` et la passe explicitement a `<SvgText>`.
- **Admin** (`admin/`, app Vite deployee sous `/azimuth-quiz/admin/`) : une page statique par onglet (`/admin/places`,
  `countries`, `syllables`, `jobs`, `wordplay`, `errors` ; `/admin/` = lieux), declaree dans `admin/src/pageList.ts` ; l'admin lit les
  donnees dans une copie locale (IndexedDB) tenue a jour par le journal, voir le skill `firestore-data`.
- **Storybook** : stories colocalisees (`src/**/<Name>.stories.tsx`, config dans `admin/.storybook`, `npm run storybook`),
  code reel affiche via `source(code)` + `<Story>.source.md` (skill personnel `storybook-story`, hors depot). Menu : `Common`, `Compass`, `Clues`,
  `Silhouette`, `Setup`, `UI` (ordre dans `admin/.storybook/preview.tsx` : y ajouter toute nouvelle section). La barre
  d'outils propose theme et langue. Un composant dumb a sa story, pas les containers smart.

## Build, deploiement, qualite

- **Web / GitHub Pages** : `app.json` `web.output: "static"` + `experiments.baseUrl: "/azimuth-quiz"` ; `@expo/metro-runtime`
  est requis. `.github/workflows/deploy-pages.yml` exporte le jeu, l'admin (`dist/admin/`) et Storybook et les publie a chaque
  push sur `master` (Pages en source « GitHub Actions »).
- **Version** : `app.json` `expo.version` + un animal par version (`expo.extra.codename`, emoji + nom anglais en camelCase sans espace, ex. 🦉❄️ snowyOwl, affiche par Reglages et l'admin via `versionLabel`) ; le skill `push` en choisit un nouveau a chaque montee.
- **Skills du projet** (dans le depot, `.claude/skills/`) : `quality-check` (couverture 100 %, structure, Storybook, code
  mort : rapporte sans corriger), `push` (verifier, versionner, committer, pousser), `firestore-data` (modifier les donnees
  Firestore). Les skills `react-structure`, `storybook-story` et `commit-push` sont des skills **personnels** (dossier
  utilisateur `~/.claude/skills/`, hors depot) : le projet s'y refere mais ne les contient pas.
- **Tests** : le jeu avec Jest (`npx jest --coverage`, seuil **100 %**, ignore `admin/`) et l'admin avec **Vitest**
  (`cd admin && npm run test:coverage`, seuil **100 %** sur `admin/src`, jsdom + Testing Library ; `main.tsx` seul est exclu).
  Pas de `/* istanbul ignore */` : un morceau inatteignable se supprime ou se reecrit plutot que de se contourner.
- **Avant de pousser** : `npx tsc --noEmit`, `npx expo lint`, `npx jest --coverage` et `npm run test:coverage` dans `admin/`
  (les deux a **100 %**), build de l'admin si du code partage a bouge. Ne jamais committer sans demande.

## Etat connu

- `npx expo lint` : 15 erreurs, toutes `react-hooks/refs` ou `react-hooks/set-state-in-effect`, dans `Compass.tsx`, `Globe3D.tsx`,
  `useHeading.ts`, `EarthSection.tsx` et `SliderTrack.tsx`. Elles viennent d'idiomes voulus (un ref mis a jour a chaque rendu
  pour rester lisible depuis le `PanResponder`, `Animated.Value` lu au rendu pour l'orbite) : pas des erreurs a corriger une
  par une.
- Le jeu garde chaque document Firestore lu en memoire pour la session (pas de cache disque, pas d'invalidation) : une donnee
  modifiee n'apparait qu'apres rechargement.
