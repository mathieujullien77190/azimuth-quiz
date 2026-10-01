# Azimuth Quiz

🔗 **[Jouer dans le navigateur](https://mathieujullien77190.github.io/azimuth-quiz/)**
· 🗺️ **[Admin des données](https://mathieujullien77190.github.io/azimuth-quiz/admin/)**
· 🧩 **[Storybook](https://mathieujullien77190.github.io/azimuth-quiz/storybook/)**

Trois jeux de géographie, jusqu'à 10 joueurs (un téléphone par joueur) et 20 manches :

- **Boussole** : un lieu s'affiche, vise-le avec la boussole et estime la distance depuis ton point
  de départ (GPS, ou Paris par défaut). Tout le monde répond en même temps, puis révélation.
- **Indices** : devine une ville grâce à des indices qui se dévoilent (drapeau, population, monnaie,
  charade...). Chacun son tour : on dévoile un indice ou on tente une réponse.
- **Silhouette** : la silhouette d'un pays s'affiche, devine lequel avec des indices partagés
  (silhouette plus précise, voisins, villes, capitale). Chacun son tour, on choisit l'indice suivant.

## Jouer

Toute partie est une **room en ligne**, sans compte (identité anonyme Firebase). Solo : « Lancer la partie »
crée une room cachée dont tu es le seul joueur. À plusieurs : l'hôte règle et lance, les autres rejoignent avec
le code affiché dans l'en-tête. Qui perd la connexion quitte la partie. Thèmes nuit et jour, français et anglais.

## Lancer en local

```bash
npm install
npx expo start        # menu Expo (web / iOS / Android)
npx expo start --web  # directement le web
npm run admin         # l'admin des données
npm run storybook     # les composants
```

```bash
npx tsc --noEmit
npx expo lint
npm run test:coverage   # seuil de couverture : 100 %
```

Les rooms demandent la configuration Firebase (variables `EXPO_PUBLIC_FIREBASE_*`) et les règles de
`firestore.rules`, à déployer à part : `npx firebase-tools deploy --only firestore:rules`.

## Données

Lieux, pays, silhouettes, devinettes et métiers vivent dans **Firestore** (aucun fichier de données dans l'appli).
L'admin (React + Vite, une page par onglet : lieux, pays, syllabes, métiers, jeux de mots) se connecte avec un
compte Google déclaré dans `firestore.rules` et enregistre chaque modification directement. Les données étant
dupliquées, elles se modifient par l'admin ou en suivant le skill `.claude/skills/firestore-data`.

## Déploiement

Un push sur `master` publie le jeu web, l'admin (`/admin/`) et Storybook sur GitHub Pages
(`.github/workflows/deploy-pages.yml`). Règles et index Firestore ne sont pas déployés par ce push.

## Stack et structure

Expo (SDK 57) + Expo Router, React Native + react-native-web, TypeScript, Zustand, Firebase (Firestore + auth
anonyme), Jest + Testing Library, Storybook. Un composant = un dossier (`index.ts`, `<Nom>.tsx`, `helpers.ts`,
`constants.ts`, `types.ts`, `styles.ts`), alias `@/` → `src/`. L'architecture, les jeux et les pièges connus sont
dans [`CLAUDE.md`](CLAUDE.md).
