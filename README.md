# Full Azimut

🔗 **[Jouer dans le navigateur](https://mathieujullien77190.github.io/full-azimut/)**

Deux jeux de géographie, choisis depuis l'écran d'accueil :

- **Boussole** : un lieu du monde s'affiche (ville, montagne, monument ou site
  naturel) — oriente la boussole vers lui et estime la distance depuis ton point de
  départ (ta position GPS, ou Paris par défaut).
- **Indices** : devine une ville à partir d'indices qui se révèlent progressivement
  (drapeau, population, monnaie, description...).

De 1 à 6 joueurs sur le même téléphone, chacun son tour, jusqu'à 20 manches.

## Fonctionnalités

- **Catégories** (Boussole) : villes, montagnes, monuments, nature — combinables.
- **Zone** : France, Europe ou monde entier.
- **Mode ligne droite** (Boussole) : en plus du cap, choisis l'inclinaison sous
  l'horizon pour viser en ligne droite à travers la Terre ; la distance de surface
  reste affichée à titre indicatif.
- **Indices progressifs** : drapeau, position, population, monnaie, indicatif
  téléphonique et description se dévoilent au fil des manches, avec pénalité
  partagée en cas d'erreur.
- **Multijoueur (jusqu'à 6)** : un sélecteur de joueurs fixe en haut de l'écran
  permet de répondre dans l'ordre voulu, avec une option pour revenir modifier une
  réponse déjà validée avant la révélation.
- **Boussole réelle** (mobile) : le nord de la boussole suit le capteur du téléphone.
- **Français / anglais** : langue par défaut = celle du système, changeable dans les
  réglages.
- Score basé sur l'écart de direction et de distance (ou sur la rapidité de
  réponse pour Indices), historique de manches et meilleur score mémorisés.

## Stack technique

Expo (SDK 57) + Expo Router, React Native + react-native-web, TypeScript strict,
`react-native-svg` pour la boussole et le schéma de la Terre, AsyncStorage pour la
persistance locale (réglages, meilleur score), i18n maison (FR/EN). Tests unitaires
avec Jest + Testing Library (couverture 100 % exigée sur `src/`, hors `src/app`).

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
```

## Déploiement web

Le site est exporté en statique (`web.output: "static"`, `experiments.baseUrl:
"/full-azimut"` dans `app.json`) et publié sur GitHub Pages par
`.github/workflows/deploy-pages.yml` à chaque push sur `master`. Le même workflow
build l'app d'admin (`admin/`, base path `/full-azimut/admin`) et la place dans
`dist/admin/` avant publication, pour qu'elle finisse sur le même site.

## Données des lieux

Les lieux de Boussole et Indices partagent un même pool (`places.json` +
`countries.json`, tuples positionnels pour rester compacts). Pour les parcourir/éditer
sans toucher le JSON à la main, une petite app d'admin (React + Vite) est déployée sur
GitHub Pages, à côté du jeu :

🔗 **[Éditeur de lieux](https://mathieujullien77190.github.io/full-azimut/admin/)**

Elle n'a **aucun backend** : les données sont lues depuis le JSON figé au moment du
build (donc en lecture, pas forcément à jour avec les tout derniers changements), et
aucune modification n'est jamais écrite sur disque directement — pas d'API, pas
d'auth à gérer. Chaque édition ajoute une ligne dans un journal texte affiché en haut
de l'app ; on copie ce journal et on le colle à Claude, qui applique les changements
décrits aux fichiers du dépôt. Ça marche pareil en local :

```bash
npm run admin   # installe ses dépendances au premier lancement, puis lance le serveur dev
```

## Structure du projet

Un composant = un dossier auto-contenu (`index.ts` + `<Nom>.tsx` + `helpers.ts` +
`constants.ts` + `types.ts`), alias `@/` → `src/`. Détails de l'architecture, du
domaine (cap/distance/inclinaison, scoring) et des pièges connus : voir
[`CLAUDE.md`](CLAUDE.md).
