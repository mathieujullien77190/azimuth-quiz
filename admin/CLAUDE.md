# admin/

Outil interne : app Vite + React (deployee sous `/azimuth-quiz/admin/`) et Storybook. Il importe des fichiers de `src/` par l'alias
`@/` ; apres tout renommage ou deplacement dans `src/`, verifier `(cd admin && npx tsc --noEmit -p . && npm run build)`.

## Pages

Une page statique par onglet, declaree dans `src/pageList.ts` : `places` (liste et fiche des lieux), `globe` (le monde en 3D),
`errors` (erreurs de jeu). La connexion Google (`AuthGate`, comptes de `ADMIN_EMAILS`) bloque tout tant qu'on n'est pas admin ; la
vraie barriere est `firestore.rules`.

- **Donnees** : l'admin lit une copie locale (IndexedDB, `snapshotStore.ts`) tenue a jour par le journal (`journal/*`, entree ecrite en
  dernier de chaque modification) ; voir le skill `firestore-data` pour la logique de copies, numerotation et `dataVersion`.
  Les ecritures passent par `src/api/*` et `src/data.ts` (`applyPlaceChange`).
- **Monde** (`views/GlobeView/`) : three.js (chunk Vite propre). Lieux lus dans la copie locale (ronds = villes, etoiles = capitales,
  carres = le reste), niveau de detail selon la distance de la camera (constantes de `constants.ts`), clic = la meme carte que la
  liste (`PlacesView/PlaceCard` + `usePlaceEditing`). `GlobeScene.ts` possede les objets three.js, la logique pure est dans
  `helpers.ts`. Les tests Vitest remplacent `three` (jsdom n'a pas de WebGL).

## Tests

Vitest (jsdom + Testing Library) : `npm run test:coverage`, seuil **100 %** sur `admin/src` (`main.tsx` exclu).

## Storybook

- Config dans `.storybook/` (`main.ts`, `manager.ts`, `preview.tsx`), `npm run stories` a la racine. Les stories sont dans `src/` (le
  `src/` du jeu), a cote des composants.
- **Rangement** : la story d'un composant et ses exemples de code vivent dans le sous-dossier `doc/` du composant
  (`doc/<Name>.stories.tsx`, `doc/<Story>.source.md`). `source(code)` (`.storybook/utils/source.ts`, alias `~sb/source`) affiche le
  vrai code d'utilisation de la story ; `localizedArgs` (`~sb/localized`) fait suivre la langue aux textes des `args`.
- **Menu** : `Home`, `Game`, `Geo`, `Screens` (vues de `screens/`), `Setup`, `UI` (ordre dans `.storybook/preview.tsx` : y
  ajouter toute nouvelle section).
- **Themes** : le chrome de Storybook a un theme classique clair / sombre (`manager.ts`) qui suit le bouton « Theme » de la barre
  d'outils ; le theme du jeu (night / day) ne s'applique qu'aux composants dans la preview.
- Un composant dumb a sa story, pas les containers ni les providers.
