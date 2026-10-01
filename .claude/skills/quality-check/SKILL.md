---
name: quality-check
description: Audit d'Azimuth Quiz avant un commit ou une release — couverture de tests (seuil 100 %), règles d'implémentation des fichiers (structure des composants, styles, exports, stories), affichage dans Storybook (stories, sources, build) et code mort (knip). À utiliser quand l'utilisateur demande de "vérifier", "auditer", "faire un check qualité", avant de pousser un gros lot de changements, ou après avoir créé/déplacé/supprimé des composants.
---

# Contrôle qualité d'Azimuth Quiz

Quatre volets, toujours dans cet ordre (du moins cher au plus cher). Chaque volet a une commande, un critère de
réussite et une façon d'agir sur ce qu'il trouve. **Lecture seule par défaut** : on rapporte d'abord, on ne corrige que
si l'utilisateur l'a demandé (ou s'il a demandé un "check et corrige"). Ne commit jamais de soi-même.

Prérequis : à la racine du repo (`C:\projet\manu`). Sous Git Bash, n'écris pas de scripts avec des heredocs
contenant apostrophes/antislash : utilise les outils Write/Edit.

## 0. Base : types et lint

```
npx tsc --noEmit
npx expo lint
```

- `tsc` : **0 erreur**. Ajoute `(cd admin && npx tsc --noEmit -p .)` si tu as touché un fichier importé par `admin/`.
- Lint : la base connue est **14 erreurs** (`react-hooks/refs` et `set-state-in-effect`, listées dans CLAUDE.md,
  "Etat connu"), **0 warning**. Plus = régression : trouve la règle et le fichier (`npx expo lint | grep -B3 error`).

## 1. Couverture de tests (seuil 100 %)

```
npx jest --coverage --coverageReporters=json --coverageReporters=json-summary
node .claude/skills/quality-check/scripts/coverage-gaps.cjs
```

L'admin a ses propres tests (Vitest, hors Jest) et son propre seuil de **100 %** : `cd admin && npm run test:coverage`
(statements, branches, functions, lines ; seul `src/main.tsx` est exclu). Même règle que pour le jeu : un trou = un cas de
test qui manque, ou du code inatteignable a supprimer, jamais un commentaire d'exclusion.

- Critère : tous les tests passent ET `coverage-gaps.cjs` répond "Nothing uncovered" (le `coverageThreshold` de
  `package.json` fait aussi échouer jest sous 100 %). Les fichiers `*.stories.tsx`, `storyFixtures.ts` et
  `src/storybook/**` sont exclus du calcul (`collectCoverageFrom`) — ne les ajoute pas au périmètre.
- Le script liste, par fichier, les statements / branches / fonctions non couverts avec leur ligne. Un trou =
  un cas de test qui manque, **pas** un `/* istanbul ignore */`. Un `??` ou un paramètre par défaut jamais
  atteint est souvent du code superflu : supprime-le plutôt que de le tester.
- Conventions de test du repo :
  - `@testing-library/react-native` est **asynchrone** : `await render(...)`, `await renderHook(...)`,
    `await act(async () => ...)`, `await fireEvent.press(...)`, `await rerender(...)`, `await unmount()`.
  - Deux hooks montés dans un même test se re-rendent hors `act` quand le store change : `await unmount()` le
    premier avant de monter le second.
  - `firebase/firestore` plante Jest : on mocke `@/games/<jeu>/helpers/room` (ou `@/helpers/roomBase`), on ne
    l'importe jamais en vrai. Les stores de room se testent en posant l'état avec `store.setState(...)`.
  - Timers : `jest.useFakeTimers()` en `beforeEach`, `jest.useRealTimers()` en `afterEach`.
  - Les hex de deux thèmes peuvent coïncider : préfère `getAllByText(...)` quand une valeur peut apparaître deux fois.

## 2. Règles d'implémentation des fichiers

```
node .claude/skills/quality-check/scripts/audit-structure.cjs
```

Le script vérifie chaque dossier de composant/écran (`src/components`, `src/games/*/components`,
`src/games/*/screens`) et chaque story. Critère : **0 problème**. Règles appliquées (CLAUDE.md, "Structure") :

- un composant = un dossier auto-contenu : `index.ts` + `<Nom>.tsx` + `styles.ts` (+ `types.ts`, `helpers.ts`,
  `constants.ts` si besoin) ; `<Nom>.tsx` a un **export nommé** `<Nom>`, jamais de `export default` ; `index.ts` le
  ré-exporte en default (`export { Nom as default } from './Nom'`) ;
- jamais de `StyleSheet.create` dans le `.tsx` : c'est `styles.ts` (`createStyles(theme)`), branché par
  `useThemedStyles(createStyles)` avec un `createStyles` de niveau module ;
- alias `@/` (pas de `../../../`) ; identifiants de code en anglais ; un test colocalisé par composant ;
- pas d'import de `firebase/*` dans un barrel (`index.ts`) ni dans un composant "dumb".

Ce que le script **ne** vérifie **pas** et que tu dois relire à la main sur les fichiers modifiés (`git diff --stat`) :

- **smart/dumb** : un `*View.tsx` ou un composant partagé n'importe ni `@/settings`, ni store, ni `room.ts`, et n'a
  pas d'effet ; les containers `*Screen.tsx` gardent hooks et early-returns ;
- **une ligne = une responsabilité** : pas de logique métier dans `styles.ts`, pas de JSX dans `helpers.ts` ;
- **texte** : aucune chaîne française/anglaise en dur dans un composant, tout passe par `useTranslation()` (fr.ts
  ET en.ts ET `i18n/types.ts` ensemble) ; les clés i18n ajoutées sont utilisées, celles retirées ne traînent plus ;
- **commentaires** : rares, sur le *pourquoi* ; pas de doc qui décrit du code supprimé ;
- **CLAUDE.md** à jour quand la structure, un flux ou une convention change (pas de journal historique).

Une entrée de `NO_STORY_OK` dans le script justifie qu'un dossier n'ait pas de story (container smart, provider,
hook) : ajoute-y un dossier seulement avec la raison à côté.

## 3. Affichage dans Storybook

```
node .claude/skills/quality-check/scripts/audit-structure.cjs      # (déjà couvre les stories, voir ci-dessous)
cd admin && npx storybook build -o "$TMPDIR/sb" --quiet            # puis supprimer le dossier de sortie
```

Critère : le build se termine par "Storybook build completed successfully". Le script d'audit contrôle en plus :

- chaque composant dumb a un `*.stories.tsx` ; le `title` commence par une racine du `storySort`
  (`admin/.storybook/preview.tsx` : Common, Compass, Clues, Silhouette, Setup, UI) — une nouvelle racine s'y ajoute ;
- **`source()` sur chaque story, jamais sur le `meta`** ; le snippet vit dans un `<Story>.source.md` importé en
  `?raw`, commence par un bloc ```` ```tsx ````, est écrit du point de vue du *consommateur* (imports `@/…`) et
  n'est pas orphelin ;
- les stories ne sont pas des vitrines de props : un cas d'usage par story.

À relire à la main (le build ne le voit pas) :

- **thème et langue** : la barre d'outils fournit Night/Day et fr/en. Un `args` qui porte du texte doit passer par
  `localizedArgs(build)` (`@/storybook/localized`) avec le même `build` pour `args` et le décorateur, sinon il reste
  en français quand on passe en anglais ;
- un état interactif (Toggle, SliderTrack, sections de setup) utilise un composant `render` nommé (majuscule, pour
  la règle des hooks) qui garde la valeur, et **la valeur affichée est dérivée de l'état** (pas d'arg figé) ;
- un décorateur inline dans une fabrique doit être nommé (règle `react/display-name`) ;
- si un composant a changé de props, ses `.source.md` disent la même chose que ses `args`.

Tu ne peux pas ouvrir Storybook ici : dis-le et liste ce que l'utilisateur doit regarder à l'écran (thème jour,
langue anglaise, états vides/longs) au lieu d'affirmer que le rendu est bon.

## 4. Code mort

```
npx --yes knip --no-progress --config .claude/skills/quality-check/knip.dev.json
npx --yes knip --no-progress --production --config .claude/skills/quality-check/knip.prod.json --include files,exports
```

- **dev** (tests et stories comptent comme des usages) : "Unused files", "Unused dependencies", "Unlisted
  dependencies" sont à traiter ; les "Unused exported types" des `index.ts` (`XxxProps`) sont **la convention**
  du projet, ignore-les.
- **prod** (seul le code réellement livré compte) : révèle ce qui n'est plus utilisé que par des tests/stories.
  Pour chaque ligne, `grep -rn "<nom>" src admin/src scripts` puis décide :
  - jamais utilisé *dans son propre fichier non plus* → **code mort** : supprime la fonction/le fichier ET ses
    tests/stories/clés i18n, puis relance tsc/lint/jest ;
  - utilisé seulement dans son fichier → l'export est superflu (dé-exporte, sauf si un test l'importe) ;
  - `admin/` et `scripts/*.mjs` comptent comme des consommateurs (vérifie avant de supprimer) ;
  - une page de documentation qui n'existe que dans Storybook (`ColorPalette`) sort toujours en "Unused files" en mode
  prod : c'est voulu, ne la supprime pas.
- Cherche aussi à la main ce que knip ne voit pas : props d'un composant que plus aucun appelant ne passe,
  réglages jamais lus, clés de traduction sans usage (`grep -rn "t\.<section>\.<clé>" src`), styles morts dans un
  `styles.ts`.

## Rapport final

Réponds en français, court, par volet, avec des chiffres :

```
Base       tsc 0 · lint 21 (base) · admin tsc OK
Couverture 100/100/100/100 · N tests · trous : aucun | <fichier:ligne …>
Structure  N dossiers, M stories : 0 problème | <liste>
Storybook  build OK | KO · à regarder à l'écran : <2-3 points>
Code mort  dev : … · prod : <ce qui a été supprimé / ce qui reste et pourquoi>
```

Termine par **ce qui reste à décider par l'utilisateur** et propose (sans le faire) le commit. Pas de trailer
co-auteur dans les commits de ce repo.
