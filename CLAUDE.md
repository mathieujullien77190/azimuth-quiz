@AGENTS.md

# Azimuth Quiz

Jeu de geographie : un lieu s'affiche, le joueur vise son cap a la boussole et estime
la distance depuis un point de depart (position GPS ou Paris par defaut). 1 a 6 joueurs
sur le meme telephone, jusqu'a 20 manches. Deploye en web statique sur GitHub Pages
(`https://mathieujullien77190.github.io/full-azimut/`) en plus des builds natifs.

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
  themes/              # night.ts (seul theme) / fonts.ts / ThemeContext
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

## `Screen` : header/footer fixes

`components/ui/Screen` accepte `header` et `footer`, rendus en dehors du `ScrollView`
(siblings dans la meme `SafeAreaView`) donc toujours visibles. `GameScreen` les utilise
pour : quitter + score + manche/pastilles + onglets joueurs (header), bouton Valider
(footer, seulement hors revelation — `RoundResult` a son propre bouton "suivant" inline).

**Piege connu** : un `ScrollView` horizontal place dans un `header` s'etire en hauteur
sur react-native-web s'il n'a pas de `style={{ flexGrow: 0, flexShrink: 0 }}` explicite
(pas seulement `contentContainerStyle`) — voir `PlayerTabs.tsx`.

## Theme

Deux themes, `night` (sombre, bleu nuit + ambre, ciel etoile) et `day` (clair, ciel
bleu + ambre, nuages qui derivent — meme `ThemeBackdrop`, branche sur `theme.isDark`).
Choix persiste (`ThemeProvider`/`ThemeSettingsContext`, cle `fullazimut:theme`),
selecteur dans `SettingsScreen`. `useTheme()` lit le theme courant via le contexte ;
`useThemeSettings()` donne `{ themeId, ready, setThemeId, resetThemeId }`. Police unique
partout, y compris dans le SVG (compas, `EarthSection`) :
`themes/fonts.ts` exporte `FONT_FAMILY` (stack `"JetBrains Mono", ui-monospace, ...`),
consomme par les 4 tokens de typographie du theme. Un composant SVG doit lire
`typography.<token>.fontFamily` et le passer explicitement a `fontFamily` sur
`<SvgText>` — `fontFamily` ne se propage pas depuis un `StyleSheet` React Native au SVG.

`useThemedStyles(createStyles)` est le pattern standard ; `createStyles` recoit `Theme`
et retourne un `StyleSheet.create(...)`.

## Build web / GitHub Pages

`app.json` : `web.output: "static"` + `experiments.baseUrl: "/full-azimut"` (site de
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
  `Compass.tsx`, `useHeading.ts`, `useGame.ts`, `SliderTrack.tsx`.
- `react-hooks/refs` se declenche aussi, de facon attendue et inevitable, partout ou
  l'API `Animated` de React Native est utilisee (`HomeScreen.tsx` : position/rotation de
  l'helicoptere ; `EarthSection.tsx` : orbite du satellite) — lire `.current` d'un
  `Animated.Value`/`ValueXY` cree via `useRef` puis l'utiliser dans le style au rendu est
  le pattern officiel de cette API, incompatible
  avec cette regle stricte. Meme categorie que les 4 fichiers ci-dessus, pas une erreur a
  corriger.
- Repo : `mathieujullien77190/full-azimut`, un seul contributeur, commits directs sur
  `master`.
