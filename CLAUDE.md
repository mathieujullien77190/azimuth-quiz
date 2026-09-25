@AGENTS.md

# Azimuth Quiz

Jeu de geographie : un lieu s'affiche, le joueur vise son cap a la boussole et estime
la distance depuis un point de depart (position GPS ou Paris par defaut). 1 a 6 joueurs
sur le meme telephone, jusqu'a 20 manches. Deploye en web statique sur GitHub Pages
(`https://mathieujullien77190.github.io/azimuth-quiz/`) en plus des builds natifs.

## Structure

Convention `react-structure` (skill du projet) : chaque composant est un dossier
auto-contenu `index.ts` + `<Name>.tsx` (export nomme) + `helpers.ts` + `constants.ts` +
`types.ts`. Primitives partagees dans `components/ui/`. Alias `@/` → `src/`.

```
src/
  app/                 # Expo Router : _layout (providers + Stack), index/setup/game (re-exports minces)
  components/          # un dossier par composant/feature
    ui/                # primitives partagees : Button, Card, Chip, Screen, Section, Stat, Toggle
  constants/           # valeurs partagees (score, geo, stockage, palette...) + constants/places/
  helpers/             # geo.ts, scoring.ts, format.ts, storage.ts, location.ts, places.ts, random.ts, web.ts
  settings/            # contexte React des reglages de partie (GameSettings)
  themes/              # night.ts / day.ts / fonts.ts / ThemeContext
  types/                # types de domaine partages (Guess, GameSettings, Theme...)
```

`GameScreen/useGame.ts` est la machine a etats du jeu (`GamePhase = 'loading' | 'guess' |
'reveal' | 'end'`) ; tout le reste (composants) est pilote par ses valeurs de retour.

## Domaine : cap, distance, inclinaison

Deux modes de jeu (`GameSettings.straightLine`) :
- **Surface** (defaut) : on estime la distance parcourue a la surface du globe.
- **Ligne droite** (`straightLine: true`) : on choisit un cap + une inclinaison sous
  l'horizon (`InclinationSlider`) ; la corde (ligne droite a travers la Terre) et la
  distance de surface equivalente en sont deduites (`helpers/geo.ts` :
  `inclinationFromChordKm`, `arcKmFromInclination`, `arcKmFromChordKm`). Un seul champ
  `Guess.distanceKm` existe (pas de `distanceMode`) — c'est sa signification qui change
  selon `straightLine`.

Scoring (`helpers/scoring.ts`) : courbe logarithmique sur l'ecart de distance, ecart
angulaire 2D (mode surface) ou 3D via `directionAngle` (mode ligne droite). 500 points
max chacun pour la direction et la distance.

`EarthSection` dessine la Terre vue de profil (le joueur en haut, cap = gauche/ouest ou
droite/est seulement — pas de vrai nord/sud dans ce schema). Son zoom est **continu** :
recalcule a chaque rendu via `fitZoom` sur les `marks` actuels, pas seulement a la
revelation — plus la distance est courte, plus il zoome (jusqu'a `MAX_ZOOM`).

## Multijoueur : onglets fixes, pas de handoff

Pas d'ecran "passe le telephone" : `PlayerTabs` reste epingle en haut de `GameScreen`
(via le `header` de `Screen`) et laisse choisir n'importe quel joueur a tout moment.
`useGame.selectPlayer` recharge le brouillon existant si `GameSettings.allowRevision`
est actif (reglage optionnel), sinon un onglet deja valide se verrouille. `submit()`
avance automatiquement vers le premier joueur non repondu ; une fois tous repondus,
calcule les scores et passe en phase `reveal`.

## Silhouette (jeu "Contour" en interne) : devine un pays, place des lieux

Troisieme mode (nom affiche "Silhouette" ; identifiants de code restes `Contour`/
`ContourGameScreen`/`ContourView`...) : la silhouette d'un pays s'affiche remplie
(`colors.surfaceHigh`, pas juste un contour), les joueurs devinent lequel via 4 paliers
d'indices partages (n'importe qui peut reveler le palier suivant ou valider une reponse
— pas de tour par tour, `ContourPhase` `'guess'`), puis placent chacun 1/3/5 lieux connus
sur la silhouette revelee (`ContourPhase` `'city'`, tour par tour cette fois, via
`PlayerTabs`).

**Positions sur le plateau en fraction, pas en lon/lat.** `ContourNeighbor.x`/`y` et
`ContourCountry.centerLabel` sont une fraction (0-1) du canvas du plateau — pas des
coordonnees geographiques projetees, contrairement aux lieux Boussole/Indices. Un ancien
design en lon/lat + clamp directionnel (`edgeLabelPosition`, supprime) ne retenait que
l'angle par rapport au centre, jamais la distance : deplacer un point dans l'admin ne
bougeait rien a l'ecran tant que l'angle ne changeait pas ("il ne bouge plus"). En
fraction du plateau, le point se pose exactement ou on le lache ; et comme le jeu et
l'apercu admin utilisent tous les deux `boardDimensionsFor(country.points, ...)` (meme
ratio, jamais la meme taille absolue), la position relative reste identique partout —
voir `BOARD_PADDING_RATIO`/`HINT_STACK_GAP_RATIO` (`components/ContourBoard/constants.ts`),
en fraction de `Math.min(width, height)` plutot qu'en pixels fixes, meme raison.

Paliers d'indices (`ContourGameScreen.tsx`, bouton "Indice", inline dans le footer a
cote de l'input) : 1) icone (drapeau ou 🐟/🐳) de chaque voisin, 2) son nom empile juste
en dessous (les deux restent affiches ensemble, l'un ne remplace plus l'autre), 3)
drapeau du pays cible a son propre point curee (`ContourCountry.centerLabel`), 4) son
nom empile sous le drapeau (= abandon). Toujours centre (`textAnchor="middle"` fixe dans
`ContourBoard.tsx`) : l'ancien alignement directionnel `start`/`end` n'avait plus de sens
des que chaque hint est devenu un point fixe plutot qu'une etiquette pointant vers le bord.

Flux de reponse (footer toujours visible en phase `'guess'`, pas de "buzz" prealable) :
input + bouton Valider ; valider vérifie le texte, affiche "Bonne/Mauvaise reponse" puis
demande d'attribuer la reponse a un joueur via `PlayerTabs` (meme ligne que le texte) —
bonne reponse marque des points degressifs selon le palier
(`CONTOUR_GUESS_POINTS_BY_HINTS = [500, 375, 250, 125]`, `constants/contour.ts`),
mauvaise reponse deduit `CONTOUR_WRONG_GUESS_PENALTY` (50 points fixes) au joueur designe
et rouvre l'input au meme palier. Un abandon (palier 4 confirme) ne rapporte ni ne
penalise personne.

Deux filtres par difficulte, meme enum `Difficulty` que Boussole/Indices mais choix
unique (`ContourSettings.difficulty`, pas de multi-select) : le pays du tour
(`ContourCountry.difficulty`, curee a la main dans `constants/contours/codec.ts` —
seule la France est `easy`, seule la Norvege est `hard`, le reste `intermediate` ;
deliberement desequilibre, ne pas tenter de rectifier) et les lieux de la phase 'city'
(`Place.difficulty`, filtre en plus du `code` pays et de la categorie dans
`randomPlacesFor` — categorie `kids` toujours exclue, et `CONTOUR_EXCLUDED_PLACES`,
`constants/contours/excludedPlaces.ts`, exclut a la main certains lieux de Silhouette
uniquement sans toucher a Boussole/Indices ; un pays peut n'avoir aucun lieu a un palier
donne, la phase 'city' se raccourcit ou saute alors silencieusement). Sur la revelation,
un lieu de categorie capital/mountains/landmarks/nature affiche l'emoji de sa categorie
a la place du point jaune uni (`placeEmoji`, `ContourGameScreen/helpers.ts`) ;
cities/citiesFr gardent le point jaune classique.

Donnees des voisins (`constants/contours/neighbors.ts`, `CONTOUR_NEIGHBORS`) : liste
curee a la main, par pays (pas de table globale par code — un meme voisin peut avoir une
position differente selon le pays qui le cite). Deux constructeurs, `country(...)` et
`sea(...)`/`ocean(...)` — ces deux derniers partagent `type: 'sea'` mais un champ
`kind: 'sea' | 'ocean'` choisit l'icone (🐟 ou 🐳, `neighborIcon` dans
`ContourGameScreen/helpers.ts`).

La phase `'reveal'` fige la geometrie du round dans son propre `ContourRoundRecord`
(`width`/`height`/`outline`, en plus des positions deja en pixels) et la reaffiche telle
quelle plutot que de la recalculer contre la mise en page de reveal (differente de celle
de `'guess'`/`'city'`) — sinon les points places par les joueurs (figes a l'ancienne
taille) se retrouvaient decales par rapport a un contour redessine a une nouvelle taille.

Admin (`admin/src/views/ContourView`) : recherche + selection parmi les 8 pays (meme
filtre nom/code que `admin/src/views/CountriesView`), plus recherche/pagination sur la
liste "Lieux possibles" (`Pagination`) avec surbrillance jaune sur la carte au clic sur
un lieu. Chaque voisin (et le point drapeau/nom du pays cible, un seul point desormais,
plus deux) se glisse a la souris et se pose exactement ou on le lache — rien n'est ecrit
sur disque, chaque deplacement/suppression ajoute une ligne au journal
(`saveNeighborPosition`, `saveCenterLabelPosition`, `deleteNeighbor`,
`admin/src/api/contour.ts`). Supprimer un lieu depuis cette vue ne le supprime jamais de
Boussole/Indices : `excludePlaceFromContour` l'ajoute seulement au set
`CONTOUR_EXCLUDED_PLACES` (mis a jour a la main d'apres le journal), jamais au
`deletePlace` partage de `admin/src/api/places.ts`.

## `Screen` : header/footer fixes

`components/ui/Screen` accepte `header` et `footer`, rendus en dehors du `ScrollView`
(siblings dans la meme `SafeAreaView`) donc toujours visibles. `GameScreen` les utilise
pour : quitter + score + manche/pastilles + onglets joueurs (header), bouton Valider
(footer, seulement hors revelation — `RoundResult` a son propre bouton "suivant" inline).

**Piege connu** : un `ScrollView` horizontal place dans un `header` s'etire en hauteur
sur react-native-web s'il n'a pas de `style={{ flexGrow: 0, flexShrink: 0 }}` explicite
(pas seulement `contentContainerStyle`) — voir `PlayerTabs.tsx`.

**Exception (Contour)** : les phases `'guess'`/`'city'` de `ContourGameScreen`
n'utilisent pas `Screen` du tout — un `SafeAreaView` + `ThemeBackdrop` propres, avec
la silhouette qui occupe tout l'ecran mesure (`onLayout`) et les anciens header/footer
qui flottent par-dessus en `position: 'absolute'` (`overlayTop`/`overlayBottom`, fond
`${colors.surfaceHigh}F0`) plutot que de reserver leur propre espace — pour que le
contour du pays touche les bords de l'ecran. La phase `'reveal'` repasse par `Screen`
classique (elle affiche un tableau de resultats sous le plateau).

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
  `Compass.tsx`, `useHeading.ts`, `useGame.ts`, `SliderTrack.tsx`, `ContourBoard.tsx`
  (meme idiome que `SliderTrack.tsx` : un ref mis a jour a chaque rendu pour rester lisible
  depuis le `PanResponder`, cree une seule fois).
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
