# Azimuth Quiz

🔗 **[Jouer dans le navigateur](https://mathieujullien77190.github.io/azimuth-quiz/)**
· 🗺️ **[Données (éditeur de lieux)](https://mathieujullien77190.github.io/azimuth-quiz/admin/)**
· 🧩 **[Storybook](https://mathieujullien77190.github.io/azimuth-quiz/storybook/)**

Trois jeux de géographie, choisis depuis l'écran d'accueil :

- **Boussole** : un lieu du monde s'affiche (ville, montagne, monument ou site
  naturel) — oriente la boussole vers lui et estime la distance depuis ton point de
  départ (ta position GPS, ou Paris par défaut). Tout le monde répond en même temps,
  puis c'est la révélation.
- **Indices** : devine une ville à partir d'indices qui se révèlent progressivement
  (drapeau, population, monnaie, description...). Chacun son tour, on choisit un
  indice à dévoiler ou on tente une réponse.
- **Silhouette** : la silhouette d'un pays s'affiche — devine lequel grâce à des
  indices partagés en 4 paliers (drapeaux puis noms des pays voisins, drapeau puis
  nom du pays). Chacun son tour, on révèle l'indice suivant ou on tente une réponse.

Jusqu'à 10 joueurs, **un téléphone par joueur**, jusqu'à 20 manches.

## Jouer à plusieurs (ou seul)

Toute partie est une **room en ligne** :

- **Solo** : « Lancer la partie » crée une room cachée dont tu es le seul joueur (il faut
  donc du réseau, même seul).
- **Héberger** : un code de partie est généré (ex. `tabofuna`) — les autres le tapent
  pour rejoindre. Seul l'hôte règle les options et lance la partie ; les invités voient
  les réglages en lecture seule.
- **Rejoindre** : tape le code de l'hôte. Le code reste affiché dans l'en-tête de jeu,
  à côté de la croix pour quitter.
- **Connexion perdue** : celui qui perd la connexion quitte la partie. L'hôte retire un
  joueur silencieux depuis plus de 90 s (la main passe au suivant) ; si c'est l'hôte qui
  disparaît, les invités quittent aussi.

Pas de compte à créer : une identité anonyme Firebase est utilisée en coulisses.

## Fonctionnalités

- **Catégories** (Boussole, Indices) : villes, capitales, montagnes, monuments, nature,
  enfants — combinables — et difficulté facile / moyen / difficile.
- **Indices progressifs** : drapeau, position, population, monnaie, indicatif
  téléphonique et description se dévoilent au fil de la manche ; les points en jeu
  baissent à chaque indice, et une mauvaise réponse coûte des points.
- **Silhouette** : ~150 pays disponibles, points dégressifs selon le nombre d'indices
  révélés avant la bonne réponse, pénalité de 50 points par mauvaise réponse.
- **Boussole réelle** (mobile) : le nord de la boussole suit le capteur du téléphone.
- **Thèmes** nuit et jour, **français / anglais** (langue du système par défaut,
  modifiable dans les réglages).
- Score basé sur l'écart de direction et de distance (Boussole), classement final à
  la fin de la partie.

## Stack technique

Expo (SDK 57) + Expo Router, React Native + react-native-web, TypeScript strict,
`react-native-svg` pour la boussole et le schéma de la Terre, Zustand pour l'état,
AsyncStorage pour la persistance locale (réglages), Firebase (Firestore + authentification
anonyme) pour les rooms en ligne, i18n maison (FR/EN). Tests unitaires avec Jest + Testing
Library, composants documentés dans Storybook.

## Lancer en local

```bash
npm install
npx expo start        # menu Expo (web / iOS / Android)
npx expo start --web  # directement le web
```

```bash
npx tsc --noEmit    # typecheck
npx expo lint        # lint
npm test             # tests unitaires
npm run test:coverage
npm run storybook    # Storybook (composants + code d'utilisation)
```

Les rooms en ligne demandent la configuration Firebase (variables d'environnement) et les
règles Firestore de `firestore.rules`, à déployer avec
`npx firebase-tools deploy --only firestore:rules`.

## Déploiement web

Le site est exporté en statique (`web.output: "static"`, `experiments.baseUrl:
"/azimuth-quiz"` dans `app.json`) et publié sur GitHub Pages par
`.github/workflows/deploy-pages.yml` à chaque push sur `master`. Le même workflow
build l'app d'admin (`admin/`, base path `/azimuth-quiz/admin`) et Storybook, et les
place dans `dist/admin/` et `dist/storybook/` avant publication, pour qu'ils finissent
sur le même site.

## Storybook

Chaque composant sans store ni routeur a sa story, avec **le code qu'on écrirait pour
l'utiliser** (onglet « Show code ») plutôt que le JSX reconstruit depuis les `args` :

🔗 **[Storybook](https://mathieujullien77190.github.io/azimuth-quiz/storybook/)**

## Données des lieux

Les lieux de Boussole et Indices partagent un même pool (`places.json` +
`countries.json`, tuples positionnels pour rester compacts). Pour les parcourir/éditer
sans toucher le JSON à la main, une petite app d'admin (React + Vite) est déployée sur
GitHub Pages, à côté du jeu :

🔗 **[Éditeur de lieux](https://mathieujullien77190.github.io/azimuth-quiz/admin/)**

Les données vivent dans **Firestore** (collections `places`, `countries`, `charadeRiddles`,
`personalityJobs`, `meta`). L'admin se connecte avec un compte Google (seul l'administrateur
déclaré dans `firestore.rules` peut écrire) et **enregistre directement** chaque modification dans
Firestore ; le journal en haut de l'app n'est plus qu'une trace des éditions faites. Le jeu, lui,
lit encore les JSON embarqués (migration à venir). Import initial des JSON :
`npm run seed:firestore -- --dry-run` puis `npm run seed:firestore` (clé de compte de service dans
`scripts/serviceAccount.json`, jamais commitée). Règles : `npx firebase-tools deploy --only firestore:rules`.
En local :

```bash
npm run admin   # installe ses dépendances au premier lancement, puis lance le serveur dev
```

## Structure du projet

Un composant = un dossier auto-contenu (`index.ts` + `<Nom>.tsx` + `helpers.ts` +
`constants.ts` + `types.ts` + `styles.ts`), alias `@/` → `src/`. Détails de
l'architecture (couche multijoueur commune aux trois jeux, détection de coupure),
du domaine (cap/distance, scoring) et des pièges connus : voir
[`CLAUDE.md`](CLAUDE.md).
