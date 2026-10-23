@AGENTS.md

# Azimuth Quiz

Jeu de geographie **Boussole**, **toujours en ligne** (une room par partie, meme seul), jusqu'a 10 joueurs et 20 manches : un lieu
s'affiche, chacun vise un cap et estime la distance depuis un point de depart. Web statique sur GitHub Pages
(`https://mathieujullien77190.github.io/azimuth-quiz/`) + builds natifs. Repo `mathieujullien77190/azimuth-quiz`, un seul
contributeur, commits directs sur `master`.

Le nom affiche (Boussole) vit dans `fr.ts`. `compass` ne subsiste que comme nom de donnee Firestore (`places.compass`,
`meta/compassCounts`, `game: 'compass'`) et pour le composant qui dessine la boussole.

## Carte du depot

Chaque dossier principal a son propre `CLAUDE.md` (regles et pieges du dossier) : le lire avant d'y toucher.

```
src/
  app/          # Expo Router : _layout (providers + Stack), routes = re-exports minces
  screens/      # un dossier par ecran (Home, Settings, Setup, OnlineGame, End, RoomDeleted)        -> screens/CLAUDE.md
  components/   # ui/ providers/ home/ geo/ game/ setup/ : composants reutilisables                  -> components/CLAUDE.md
  helpers/      # fonctions et hooks sans Firebase, un fichier par theme                              -> helpers/CLAUDE.md
  firebase/     # TOUT ce qui touche Firebase/Firestore (client, room, lieux, tirage, types, regles)  -> firebase/CLAUDE.md
  store/        # un seul store Zustand, useRoomStore                                                  -> store/CLAUDE.md
  data/         # constantes partagees (index.ts), game.ts (categories, defauts, score), theme.ts
  settings/     # GameSettings (store Zustand), usePlayerName
  themes/       # night.ts, day.ts, fonts.ts, ThemeContext
  i18n/         # fr.ts, en.ts, types.ts, useTranslation
  types/        # types de domaine partages
admin/          # outil interne (app Vite + Storybook), importe `src/` via l'alias `@/`                -> admin/CLAUDE.md
```

## Regles transverses

- Alias `@/` → `src/` : tout import qui sort de son dossier d'un cran ou plus passe par `@/` (jamais `../..`). Un composant est un
  dossier `index.ts` + `<Name>.tsx` (export nomme) + `helpers.ts` + `constants.ts` + `types.ts` + `styles.ts` (seul `createStyles`).
- Identifiants de code en anglais ; commentaires de code en francais, sans accents, courts (le pourquoi seulement).
- Tests dans un dossier `__tests__/` a cote du fichier teste. Jest (`npx jest --coverage`, seuil **100 %**, ignore `admin/`) et
  Vitest dans l'admin (`cd admin && npm run test:coverage`, seuil **100 %**). Pas de `/* istanbul ignore */` : un code inatteignable
  se supprime ou se reecrit.
- Les stories et leurs exemples de code vivent dans le sous-dossier `doc/` du composant (voir `admin/CLAUDE.md`).
- Apres tout renommage ou deplacement dans `src/` : `(cd admin && npx tsc --noEmit -p . && npm run build)`.
- Commits : Conventional Commits en anglais, sans trailer de co-auteur ; un commit par mise a jour, sans push. Le push passe par
  le skill `push` (verifications completes, version, commit, push).
- Les **regles et index Firestore se deploient a part** (`npx firebase-tools deploy --only firestore:rules --project azimuth-quiz`) :
  un push ne les deploie pas.
- `expo-gl` (globe) est natif : un build EAS neuf est necessaire, un `eas update` (OTA) ne suffit pas ; il est aussi declare dans
  `admin/vite.shared.ts` (`dedupe` + `optimizeDeps`) pour Storybook.

## Build, deploiement, version

- **Web** : `app.json` `web.output: "static"` + `experiments.baseUrl: "/azimuth-quiz"` ; `@expo/metro-runtime` requis.
  `.github/workflows/deploy-pages.yml` publie jeu, admin (`dist/admin/`) et Storybook a chaque push sur `master`.
- **Version** : `app.json` `expo.version` + un animal par version (`expo.extra.codename` = `{ emoji, name, wiki }` ; `wiki` = article
  Wikipedia anglais de l'espece ; `name` = nom complet de l'espece en anglais, kebab-case ASCII, ex. `brown-throated-sloth`).
  Affichage `v2.64.1 - 🦥 - brown-throated-sloth` via `versionParts` / `versionLabel`. Le skill `push` choisit un animal jamais pris.
- **Android** : package `com.azimuthquiz.app` (definitif), `versionCode` incremente par EAS dans `app.json` (a commiter),
  `EXPO_PUBLIC_FIREBASE_*` dans l'environnement EAS `production` (sans elles l'app plante) ; details dans le skill `push`.
- **Skills du projet** (`.claude/skills/`) : `quality-check` (rapporte sans corriger), `push`, `firestore-data`. Skills personnels
  hors depot (`~/.claude/skills/`) : `react-structure`, `storybook-story`, `commit-push`.

## Etat connu

- `npx expo lint` : 12 erreurs `react-hooks/refs` / `set-state-in-effect` dans `Compass.tsx`, `Globe3D.tsx`, `EarthSection.tsx`,
  `SliderTrack.tsx` : idiomes voulus (ref mis a jour a chaque rendu pour le `PanResponder`, `Animated.Value` lu au rendu), a ne pas
  corriger une par une.
- Chaque document Firestore lu reste en memoire pour la session (pas de cache disque ni d'invalidation) : une donnee modifiee
  n'apparait qu'apres rechargement.
