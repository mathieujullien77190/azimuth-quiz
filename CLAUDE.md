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
  (l'hote passe la main si le joueur actif est parti), `useGuessDraft`, `nextPlayerUid`, `useTransientFlag`. **L'ordre des
  joueurs tourne d'une manche a l'autre** (Indices et Silhouette) : `playersForRound(onlinePlayers, roundIndex)` =
  l'ordre d'arrivee decale du numero de manche, donc la manche 1 commence par le 1er arrive, la manche 2 par le 2e, etc.
  (rien de plus dans Firestore : chaque appareil le deduit de `roundIndex`). C'est le meme anneau dans le meme sens, seul le
  point d'entree change : `nextPlayerUid` reste sur l'ordre d'arrivee. Les hooks exposent `roundPlayers` (les onglets
  `PlayerTabs` et `turnIndex` suivent cet ordre) ; `useHostTurnRecovery` rend la main au 1er de la manche. Composants :
  `GameHeader`/`GameFooter`, `NoticeOverlay`, `RoomDeletedScreen`, `FinalStandings`.
- **Pas de partie locale** : jouer seul = heberger une room *cachee* (`hostedSilently` dans `useSetupRoom`), donc il faut du
  reseau. `startOnlineGame(run)` couvre les deux cas ; ce que `run` lit dans la room est lu *dans* `run`.
- **Un joueur part** (quitte, expulse, coupure) : l'hote efface aussi ses donnees de manche (`useHostPruneLeavers`,
  `pruneRoomPlayerData`) ; s'il revient, c'est un nouveau joueur.
- **Coupure reseau** (`useRoomPresence`, monte une fois par `useSetupRoom`) : en partie a plusieurs, heartbeat
  `players.{uid}.lastSeen` toutes les 30 s ; qui perd la connexion quitte la partie (soi-meme apres 90 s sans ecriture
  acquittee, un joiner que l'hote ne voit plus est retire, l'hote perdu fait quitter les joiners).
- **Rejouer** (bouton de `FinalStandings`, a cote de « Quitter ») : l'hote remet la room au salon (`restartRoom` = `screen: 'options'`, rien d'autre ; chaque `startRoomGame` reecrit toute la manche) et `useOnlineRoomSession` fait reculer l'ecran de jeu de chaque appareil (`onQuit` = `router.back()`, jamais quand le store est deconnecte) vers l'ecran de preparation reste monte dessous, qui montre tous les joueurs et repousse le jeu quand l'hote relance. Un joiner qui clique « Rejouer » retourne seulement au salon.
- **Reactions** : un petit bouton rond 😀 flottant juste AU-DESSUS du `GameFooter`, dans son coin bas droit (`ReactionBar`, enfant du footer en `position: absolute; bottom: '100%'` : hors de son flux, les boutons du footer gardent toute leur largeur ; `onReact`, absent seul dans la room) affiche vers le haut une colonne des emojis (sans animation : elle apparait et disparait d'un coup) (`REACTION_EMOJIS`) contre le bord droit de l'ecran ; un tap sur un emoji l'envoie et la colonne RESTE ouverte (plusieurs d'affilee) : seul le bouton la referme. Il ecrit le champ unique `reaction` de la room `{ uid, emoji, seq }` (`sendReaction` de `roomBase`, `useRoomReactions` : delai de 1 s entre deux envois, une reaction deja presente a l'ouverture de l'ecran est ignoree). Tous les appareils (l'envoyeur aussi) la voient dans `ReactionOverlay` : une bulle qui monte du bas (au-dessus du footer) vers le haut en 2,5 s, avec le nom de l'envoyeur dessous, une par `seq` (elles se chevauchent). Regles : `reactionOk` (uid = soi, emoji <= 8 caracteres, `seq` entier), accepte seul ou avec les champs deja permis aux non-hotes (`compassPlayer`, `turnBasedPlayer`) ; **a deployer avec les regles**.
- **L'hote quitte** : `handleQuit` supprime la room ; les joiners gardent la manche sous la notice « l'hote a quitte »
  puis retournent a l'accueil (clic ou 2 s). L'ecran de jeu rend `null` une fois deconnecte.

## Donnees Firestore

Firestore est la **seule source** des donnees (lieux, pays, silhouettes, devinettes, metiers) : aucun JSON embarque,
**aucun repli** si Firestore echoue. Les donnees sont **dupliquees expres** (un document par lieu ou par pays porte tout ce
dont une manche a besoin) et numerotees pour le tirage. **Pour toute modification de donnees (copies a propager,
numerotation, compteurs, `dataVersion`, journal de l'admin), suivre le skill `firestore-data`** ; l'admin
(`admin/src/data.ts`) sait deja le faire pour la plupart des cas.

Collections : `places/{cle}` (cle = code de 3 lettres, permanent, opaque), `countries/{ISO}` (nom, drapeau, devise,
indicatif, voisins ; plus tout ce que lit Silhouette), `personalityJobs/{code}`,
`meta/*` (`compassCounts`, `cluesCounts`, `contourCounts`, `dataVersion`), `journal/*` (admin seulement), `devFeedback/*` (avis de difficulte du mode dev, hors journal), `rooms/*`.
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
droite. Cap et distance sont **loxodromiques** (`helpers/geo.ts`, un seul cap tenu tout le long, celui d'une boussole), pas
orthodromiques : la distance est donc celle de cette route, un peu plus longue que le plus court chemin (jusqu'a ~21 180 km,
d'ou `MAX_SURFACE_DISTANCE_KM` = 22 000). Les 3 jeux partagent ces helpers (Indices donne les memes cap/distance en indices).
Score (`games/compass/helpers/scoring.ts`) : courbe logarithmique sur l'ecart de distance et ecart angulaire 2D,
500 points max pour la direction et 500 pour la distance. Lieux tires par `fetchRandomPlaces`
(`games/compass/helpers/firestorePlaces.ts`, hors barrel). `EarthSection` dessine la Terre de profil (le joueur en haut,
cap = gauche/ouest ou droite/est) ; son zoom est continu (`fitZoom` sur les marques actuelles, jusqu'a `MAX_ZOOM`). Quand
l'appelant donne `origin` (le point de depart, Boussole le fait, seulement a la solution), la vue `Globe3D` est celle montree d'abord, avec un bouton « 2D » (puis « 3D ») pour passer de l'une a l'autre : une vraie boule **three.js** sur une surface OpenGL (`expo-gl`), qu'on tourne au doigt, qu'on zoome a deux doigts (ou avec les boutons +/−, jusqu'a `MAX_ZOOM` = 14) et qu'on remet dans sa position de depart, nord en haut, avec le bouton « N » (`zoomedBy`, `fingersOf`, `dragCenter`, prop `controls`, vraie quand `draggable`). Les gestes se mesurent sur la **position absolue** des doigts, jamais sur le cumul d'un geste (`Fingers`) : sinon un nouveau geste repartait avec le cumul du precedent, et le dernier `move` que le web envoie apres le lache ramenait la boule a son point de depart. Le geste reste au globe (`onShouldBlockNativeResponder`, `touchAction: 'none'` sur le web) : la page ne defile pas sous le doigt qui tourne la boule ; decor `globeLand.ts` (contours Natural Earth **50 m** sans l'Antarctique : un asset decoratif, pas une donnee de jeu, regenere par `node scripts/globe-land.mjs` depuis `world-atlas` — `--dry` donne le poids de chaque tolerance ; 791 cotes, 20 092 points, 250 Ko) trace **en un seul `LineSegments`** sur la sphere (une seule passe pour la carte graphique, donc la finesse de l'asset ne coute rien en dessins ; la soupe de segments est calculee au premier globe avec terres, puis gardee). Les **continents sont colories** : le meme script rasterise l'interieur des contours en un masque terre/mer equirectangulaire 2048 x 1024 (`globeMask.ts`, RLE en base 36, 34 Ko, lignes du sud vers le nord comme un `DataTexture`), que `landFill` pose en image sur une coque a part juste au-dessus de la mer (grille et `uv` calcules a la main pour que la cote tombe sur la cote ; `colors.textMuted` (la couleur de la cote) a `LAND_FILL_OPACITY` — une couleur differente de la mer, qui est la boule elle-meme — et le trait de cote net par-dessus. **Piege des altitudes** : une sphere en facettes creuse sous son propre rayon au milieu de chaque facette (`1 - cos(180 / segments)`), donc la coque peinte doit depasser ce creux (`LAND_FILL_SEGMENTS` fin + `LAND_FILL_ALTITUDE`) sinon la mer la cache, et le trait de cote doit a son tour depasser le sommet de la coque, sinon la peinture cache le trait ; un test verifie que le ventre des facettes reste au-dessus de la mer), chaque reponse est son trajet a cap constant en tube (`rhumbDestination`/`routePoints` ; un cap tenu ne depasse jamais un pole, il s'y enroule) et ce qui passe derriere la boule est cache par la boule elle-meme (plus aucun decoupage a la main) ; **la vraie reponse a son trajet aussi** (en jaune, `colors.truth`), en plus de son point entoure — c'est le chemin qu'il fallait vraiment prendre. Les trajets sont construits a part (`buildRoutes`, un `Group` que le rendu ajoute a la scene) car l'epaisseur d'un tube ne se change pas en le mettant a l'echelle : le zoom les reconstruit (`ROUTE_THICKNESS / zoom`), eux seuls, pour qu'ils gardent leur largeur a l'ecran. A tout zoom. Au depart la boule montre le cote de la Terre ou sont le depart et les reponses (`centerOn`). Le pole nord (un point blanc avec un « N » a cote, tant qu'il est devant, prop `north`, vrai par defaut) montre l'inclinaison. Un satellite (la nuit seulement, pas d'avion le jour, et seulement sans zoom) tourne autour de la boule **sur l'equateur** (`orbitPoint`, vers l'est, un peu au-dessus du sol, vu par la meme camera que la boule : de profil sur l'equateur il est une ligne, il s'ouvre en ellipse quand on penche la boule) : il passe devant puis derriere, cache par la boule sauf au-dela du bord. Il suivait le grand cercle du trajet : vu depuis un globe centre sur le depart (ou presque, `centerOn`), un cercle qui passe par le point regarde est toujours vu par la tranche, donc il glissait le long d'une ligne droite — quelle que soit l'inclinaison. Cliquable (message). Les libelles (« toi », « N ») et le satellite sont des vues posees par-dessus la surface, placees par la meme projection que la camera (`screenPoint`), pour garder la police de l'app.

**Le globe en detail** (`components/Globe3D/`) : `scene.ts` construit la scene (sphere `MeshLambertMaterial` couleur `compass.faceInner`, lumiere ambiante + une lampe accrochee a la camera, cotes en `LineLoop`, equateur/Greenwich en pointille, tubes et pastilles des reponses) ; les pastilles (depart, reponses, anneau, pole) sont rendues dans `screenSized` et **remises a leur taille d'ecran** quand on zoome (`markScale` = 1 / zoom), sinon elles finiraient par cacher la carte qu'on zoomait pour lire ; `useGlobeRenderer.ts` dessine **a la demande, pas en boucle** (une image a l'arrivee de la surface, puis une par changement : tourner, zoomer, changer de reponse ou de theme) et cree une camera orthographique par image, nord en haut ; `renderer.ts` (isole pour que les tests remplacent la carte graphique) branche `WebGLRenderer` sur le contexte d'`expo-gl`, avec un faux canvas sur mobile (pas de DOM) et le vrai sur le web. Une surface OpenGL n'est pas transparente partout : la prop `backgroundColor` peint ce qui entoure la boule (Indices passe la couleur de sa carte). `three` est **ESM seulement**, donc le `transformIgnorePatterns` de Jest (dans `package.json`) l'autorise explicitement a etre transpile — la liste y est recopiee de `jest-expo` ; si le preset change de liste a une montee de SDK, la recopier.

**Mode voyage** (`travel`, reglage de la room, hote seulement, defaut faux ; une room d'avant l'option n'a pas le champ = faux) : le premier tour part du point de depart habituel (GPS ou coordonnees), chaque tour suivant part du **lieu du tour precedent**. Le depart d'un tour se lit en UN seul endroit, `originForRound(gameState, travel)` (`games/compass/helpers/originForRound.ts`) : notation de l'hote (`useOnlineGame`), cap/distance vrais et globe/Terre de `OnlineGameScreen` ; `travelFromPlace` donne le lieu ou l'on se trouve, dit **dans le header** (`GameHeader`, prop `location`, en blanc : « Vous etes a X », des le tour 2) et **dans un overlay** a l'ouverture de chaque tour (`useTravelNotice`, `NoticeOverlay` : une fois par tour, cle sur `roundIndex`, disparait seul apres `TRAVEL_NOTICE_MS` = 3 s ou au clic, jamais au tour 1, hors mode voyage, au chargement ni sur le classement final). Au lancement, `separateRepeats` evite deux fois le meme lieu de suite (distance 0). Aucun champ de plus a ecrire pour un joueur non hote : `travel` voyage avec les reglages.

## Indices

Lieux tires par `fetchClueRoundPlaces` (`firestoreCluePlaces.ts`, hors barrel), groupes par `clues.category`
(`capital` / `citiesFr` / `cities`, derivee de la categorie Compass par `cluesCategory`). **Une manche ne lit que le lieu
tire** : le document `places/{cle}` porte les copies (`country`, `personality.job`, `wordplay`,
`clues.category`) et `cluesFromDoc` construit le `CluePlace` depuis ce seul document.

- **Quels indices** : `cluesFor(place)` filtre `CLUE_ORDER` pour ce lieu. Une ville `citiesFr` perd 5 indices qui ne varient
  pas en France (heure locale, capitale ou non, couleurs du drapeau, devise, indicatif). `personality` et `wordplay`
  ne sont offerts que si le lieu les a cures.
  `ClueGrid` boucle sur `cluesFor`, et `vowelsUnlocked` attend que tous les indices offerts soient pioches.
- **Globe 3D** (`globe`, 2 clics, carte pleine largeur) : `Globe3D` avec le point de depart (`gameState.origin`, passe en prop `origin` jusqu'a `ClueCard`) et le lieu entoure ; 1er clic = boule nue + equateur + meridien de Greenwich (props `equator`/`greenwich`, `land={false}`), 2e clic = les terres s'ajoutent. Ici la boule ne tourne pas (`draggable={false}`, donc pas de boutons non plus) : les clics appartiennent a la carte d'indice, et `backgroundColor` prend la couleur de la carte.
- **Score** : `maxScoreForRound`/`remainingScore(revealedClueIds, place)` suivent la liste reellement offerte.
- **Personnalite** : nom + metier optionnel, uniquement des faits Wikipedia, `places.personality` (curation admin).
- **Jeu de mots** : une phrase revelee en un clic ; `difficulty` (informative, point colore dans l'en-tete, visible aussi
  carte verrouillee) ne conditionne jamais l'indice. `wordplayFor(place)` rend `null` si la phrase est vide.
- **Saisie en direct** : le detenteur du tour ecrit `typing` (texte debounce 500 ms, jamais en solo ni hors de son tour) ; les
  autres le voient en cases, en MAJUSCULE (`previewText`, `typedSkeleton`), seulement si `typing.uid === turnUid`.
- **Qui s'est trompe** : `wrongGuesserName` derive de `wrongGuessUid`/`wrongGuessSeq` (jamais remis a zero entre manches ;
  le score de l'hote s'appuie sur leur progression), garde par `turnUid` et une graine de manche.
- **Une proposition par tour** (Indices et Silhouette) : apres une erreur, le detenteur du tour ne peut plus proposer avant
  d'avoir devoile un indice (ce qui passe la main) ; `wrongGuessHints` (nombre d'indices au moment de l'erreur, ecrit avec
  `wrongGuessUid`/`wrongGuessSeq`, remis a `null` a chaque debut de manche, absent = pas de restriction) donne
  `hasGuessedThisTurn` (`helpers/turnGuess.ts`), qui retombe a faux des qu'un indice sort. le champ de reponse et « Valider » disparaissent
  (le brouillon est garde pour son prochain tour) et seule la ligne `t.game.alreadyGuessed` reste (l'hote garde « Je ne sais
  pas » dans Indices) ; un verrou local couvre l'instant avant le retour de la room. Le champ est dans la liste
  `turnFields` des regles des deux jeux.
- **« Je ne sais pas »** : reserve a l'hote (`giveUp`), meme hors de son tour, via `isHost()` des regles.

## Silhouette

Un plateau partage, un joueur actif a la fois (`turnUid`, ordre d'arrivee tourne par manche, voir `playersForRound`). A son tour il **choisit le prochain indice du
groupe qu'il veut** (ce qui passe la main) ou tente une reponse (bonne : `verdict: 'correct'`, gain
`contourGuessPoints(hintsRevealed, plan.length)` ; mauvaise : `wrongGuessSeq` +1, penalite `CONTOUR_WRONG_GUESS_PENALTY`, il
garde la main). Une fois le pays revele il confirme l'abandon (`verdict: 'giveUp'`, personne ne marque, message « Personne
n'a trouve — 0 point » pour tous). L'hote tire tous les pays d'avance (`countryCodes`, `fetchContourRoundCodes`) et seul
l'hote ecrit les scores. Pied de page (`ContourGuessBar`) : une ligne « Pays » au-dessus du champ ; « N pts » est dans le header, a droite sur la meme ligne que
« Quel est ce pays ? » (`GameHeader` `questionDetail`), plus de ligne « En jeu » ; le champ est ouvert a TOUS, a tout moment (chacun tape son brouillon local, `useGuessDraft`), mais seul le detenteur du
tour valide : « Valider » reste grise pour les autres et le « ok » du clavier dit que ce n'est pas leur tour (`canSubmit`,
`onNotYourTurn`). Au-dessus, le pays tape s'affiche en cases (composant partage `TypedAnswer`, comme Indices) : le brouillon
du detenteur sur son appareil, ce qu'il tape en direct (`typing`, ecrit par lui seul) sur les autres. Le bouton « Valider »
reste grise tant que le champ est vide.

- **Plan d'indices** : 4 categories (`silhouette`, `neighbors`, `cities` hors capitale, `capital`, toutes actives, champ
  `ContourSettings.hintCategories` conserve) donnent `buildHintPlan(categories, country)` (`helpers/hintPlan.ts`), la liste
  ordonnee des etapes (`silhouette1-3`, `neighborShapes`, `neighborFlagFirst` (UN drapeau : le 1er voisin dans l'ordre des donnees, fixe pour tous les appareils), `neighborFlags` (tous, dont celui-la), `neighborCodes`, `neighborNames`, `cityPositions`,
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
- **Quadrants** (`helpers/quadrants.ts`, `ContourQuadrantMask`) : le plateau (le rectangle du pays, `boardDimensionsFor`) est coupe en 2 × 2 cases egales
  (0 haut-gauche, 1 haut-droite, 2 bas-gauche, 3 bas-droite) et **tout est cache par un masque opaque sauf une case** ; ce que les indices
  revelent (silhouette, voisins, villes, capitale, drapeaux, noms) n'est donc visible que dans les cases ouvertes (le masque est pose par-dessus,
  `ContourFullBleedScreen` `boardOverlay`). La case de depart est tiree par la graine de la manche (`roundSimplifySeed`) parmi les cases que
  le contour traverse (`occupiedQuadrants`, calcule dans un cadre de reference fixe : meme resultat sur tous les appareils, rien a stocker). Le
  joueur dont c'est le tour peut toucher une case cachee pour l'ouvrir pour tout le monde : **ouvrir une case compte comme UN INDICE et passe la
  main** (comme un indice choisi dans la liste, pas de penalite a part). C'est un pick `'quadrant'` (`QUADRANT_PICK`) ajoute a `hintPicks` : il
  fait monter `hintsRevealed` (= `hintPicks.length`, donc le bareme et la regle « une proposition par tour » le voient) mais ne fait sortir
  AUCUNE etape du plan (`orderHintPlan` l'ignore ; `stepsOutOf`/`quadrantPicksOf` separent les deux ; les etapes a l'ecran =
  `hintsRevealed` moins les ouvertures de case, `stepsRevealed` du hook). Points : `contourPoints(stepsOut, quadrantPicks, planLength)` lit
  `stepsOut + quadrantPicks` sur le bareme normal, mais seul le pays revele (`stepsOut >= planLength`) donne 0 : ouvrir des cases ne descend
  jamais sous la derniere etape avant la revelation. Une case ne s'ouvre plus une fois le pays revele (`canOpenQuadrant`, rien a y gagner) ; le
  masque d'une case ouvrable affiche la perte reelle (`quadrantCost` = points actuels moins points avec un indice de plus, « −NN pts »).
  Etat de room : `quadrantsRevealed: number[]` (QUELLES cases sont ouvertes en plus de celle de depart, dans l'ordre ; remis a `[]` a chaque
  manche) ecrit avec `hintPicks`, `hintsRevealed` et `turnUid` en UN seul `updateDoc` (`revealContourRoomQuadrant`) ; tous ces champs sont deja
  dans la liste `turnFields` de Silhouette dans `firestore.rules`. A la fin de la manche les masques disparaissent. L'apercu admin (`ContourEditor`) ne masque rien : `ContourQuadrantGrid` (SVG) y trace seulement les
  deux lignes de coupe, le cadre, les numeros 0-3 et la case de depart (graine de l'apercu), a partir du meme `quadrantGridLines`/`quadrantRects`. Un **drapeau voisin** revele (`flagRects`, pur) dont le centre tombe dans une case cachee est marque PAR-DESSUS le masque par un rectangle couleur accent (opacite 0,5) de meme boite que le drapeau (prop `flagBoxes`, `markersInHiddenQuadrants`) : les joueurs savent qu'il y a quelque chose.
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

## Mode dev : avis de difficulte

Dans Reglages, la section « Mode dev » a un champ « dev » : taper `supermatou` (`DEV_CODE` dans `data/index.ts`, aussi dans
`firestore.rules`, la vraie barriere) n'active rien par lui-meme, le code est seulement garde (`useDevCode`, AsyncStorage,
hydrate dans `_layout.tsx` ; `useDevMode` dit s'il vaut exactement le secret). Un appareil en mode dev recoit, **une fois par
manche**, l'overlay `DifficultyFeedbackOverlay` « Le lieu X etait-il… Facile / Moyen / Difficile » (`useDevFeedback`, dans `helpers`)
**une fois l'hote passe a la manche suivante** (ou devant le classement final pour la derniere) : jamais par-dessus le
reveal/verdict lui-meme, et il porte sur le lieu/pays de la manche PRECEDENTE (le hook retient `{ roundIndex, cible }` tant que la
manche est finie ; si deux manches passent sans reponse seule la derniere est posee ; le compteur de manche qui recule = nouvelle
partie, tout est oublie) ; un tap a cote ferme sans rien ecrire, un des trois
boutons ecrit un document de `devFeedback` (`sendDevFeedback` : jeu, `targetType` lieu|pays, `targetKey` = cle du lieu (`Place.key`,
l'id du document, repli sur le nom pour une vieille room) ou ISO du pays, nom, difficulte actuelle, difficulte proposee, `devCode`,
`uid`, `at`). Chaque appareil decide seul (rien dans la room), la question ne bloque jamais le jeu (un tap a cote suffit) et disparait au rejeu. Une ecriture ratee est seulement loggee (`kind: 'background'`). Les regles n'acceptent la creation qu'avec le code dev
et des champs exacts ; seuls les admins lisent et suppriment. La page admin « Avis difficulte » (`/admin/feedback`) les met en
texte (une directive par lieu/pays dont les joueurs veulent changer la difficulte, majorite des votes, egalite = les deux, puis
les « deja corrects ») dans une zone en lecture seule, avec « Copier » et « Nettoyer » (confirmation dans la page, supprime
tout par lots de 500). Hors journal et `dataVersion`, comme `errors`.

## Ecrans et UI

- **`Screen`** accepte `header`/`footer` rendus hors du `ScrollView`. Piege : un `ScrollView` horizontal dans un `header`
  s'etire en hauteur sur react-native-web sans `style={{ flexGrow: 0, flexShrink: 0 }}` explicite (voir `PlayerTabs.tsx`).
- **`PlayerTabs`** (Indices, Silhouette) est purement informatif (statut seulement, a qui la main).
- **Theme** : `night` (bleu nuit + ambre) et `day` (sable + bleu), fond uni, choix persiste (`ThemeProvider`, cle
  `azimuthquiz:theme`). `useThemedStyles(createStyles)` est le pattern standard. Police unique `FONT_FAMILY` ; un composant
  SVG lit `typography.<token>.fontFamily` et la passe explicitement a `<SvgText>`.
- **Admin** (`admin/`, app Vite deployee sous `/azimuth-quiz/admin/`) : une page statique par onglet (`/admin/places`,
  `countries`, `globe`, `jobs`, `wordplay`, `errors`, `feedback` ; `/admin/` = lieux), declaree dans `admin/src/pageList.ts` ; l'admin lit les
  donnees dans une copie locale (IndexedDB) tenue a jour par le journal, voir le skill `firestore-data`.
- **Page Monde** (`/admin/globe`, `admin/src/views/GlobeView/`) : le monde en 3D avec three.js (`three` est une dependance de l'admin, son propre chunk Vite), fond etoile et rien d'autre dans le ciel. Tous les pays qui ont un contour (`countries/{ISO}.ring`, traits colores par difficulte Silhouette) et tous les lieux (points colores par categorie Compass, **ronds** pour les villes `cities`/`citiesFr`, **etoiles** pour les capitales, **carres** pour le reste), lus dans la copie locale comme les listes. **Niveau de detail selon la distance de la camera** (constantes de `constants.ts`) : sans inertie (`enableDamping` faux), les capitales n'apparaissent que sous `CAPITALS_MAX_DISTANCE`, les autres lieux sous `POINTS_MAX_DISTANCE` (au-dela un lieu n'est ni dessine ni cliquable), les noms de **pays** (`setCountryNames`, au centre de leur contour `centerOf`, en francais, en plus gros et gras, de `COUNTRY_LABELS_MAX_DISTANCE` jusqu'a `COUNTRY_LABELS_MIN_DISTANCE` : ils passent avant les villes quand on zoome puis leur laissent la place de tres pres, et gagnent leur place sur les noms de villes) et les noms de lieux (HTML par-dessus le canvas, au plus `MAX_LABELS`, capitales d'abord puis les plus proches du centre, sans chevauchement : `selectLabels`) sous `LABELS_MAX_DISTANCE`. Un clic ouvre dans un panneau lateral **la meme carte que les listes** (`PlacesView/PlaceCard` + `usePlaceEditing`, `CountriesView/CountryCard` + `useCountryEditing` : extraits des listes, qui s'en servent aussi, donc les ecritures passent par les memes `api/*`, journal et `dataVersion` inclus) ; le globe suit les modifications. Le rendu est mince (`GlobeScene.ts` possede les objets three.js, `GlobeCanvas.tsx` le pointeur), la logique est pure dans `helpers.ts` (lon/lat <-> vecteur, point dans un contour qui passe la ligne de date, lieu le plus proche a l'ecran, recherche) ; un lieu gagne sur le pays derriere lui. Les tests Vitest remplacent `three` (jsdom n'a pas de WebGL).
- **Storybook** : stories colocalisees (`src/**/<Name>.stories.tsx`, config dans `admin/.storybook`, `npm run stories`),
  code reel affiche via `source(code)` + `<Story>.source.md` (skill personnel `storybook-story`, hors depot). Menu : `Common`, `Compass`, `Clues`,
  `Silhouette`, `Setup`, `UI` (ordre dans `admin/.storybook/preview.tsx` : y ajouter toute nouvelle section). La barre
  d'outils propose theme et langue. Un composant dumb a sa story, pas les containers smart.

## Build, deploiement, qualite

- **Web / GitHub Pages** : `app.json` `web.output: "static"` + `experiments.baseUrl: "/azimuth-quiz"` ; `@expo/metro-runtime`
  est requis. `.github/workflows/deploy-pages.yml` exporte le jeu, l'admin (`dist/admin/`) et Storybook et les publie a chaque
  push sur `master` (Pages en source « GitHub Actions »).
- **Version** : `app.json` `expo.version` + un animal par version (`expo.extra.codename`, emoji + nom anglais en camelCase sans espace, ex. 🦉❄️ snowyOwl, affiche par Reglages et l'admin via `versionLabel`) ; le skill `push` en choisit un nouveau a chaque montee.
- **Android** : package `com.azimuthquiz.app` (definitif), `versionCode` incremente par EAS dans `app.json` a chaque build (a commiter), variables `EXPO_PUBLIC_FIREBASE_*` declarees dans l'environnement EAS `production` (sans elles l'app plante au demarrage) ; details dans le skill `push`.
- **Modules natifs** : `expo-gl` (la surface OpenGL du globe three.js) est autolinke, sans config plugin, mais c'est du **natif** : un build EAS neuf est necessaire, un `eas update` (OTA) ne suffit pas. `three` est une dependance JS pure (ESM seulement, voir la note Jest dans Boussole). `expo-gl` est aussi declare dans `admin/vite.shared.ts` (`dedupe` + `optimizeDeps`) pour que Storybook dessine le vrai globe dans le navigateur.
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
