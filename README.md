# Full Azimut

🔗 **[Jouer dans le navigateur](https://mathieujullien77190.github.io/full-azimut/)**

Un lieu du monde s'affiche (ville, montagne, monument ou site naturel) : oriente la
boussole vers lui et estime la distance depuis ton point de départ (ta position GPS,
ou Paris par défaut). De 1 à 6 joueurs sur le même téléphone, chacun son tour.

## Fonctionnalités

- **Catégories** : villes, montagnes, monuments, nature — combinables.
- **Zone** : France, Europe ou monde entier.
- **Mode ligne droite** : en plus du cap, choisis l'inclinaison sous l'horizon pour
  viser en ligne droite à travers la Terre ; la distance de surface reste affichée
  à titre indicatif.
- **Multijoueur (jusqu'à 6)** : un sélecteur de joueurs fixe en haut de l'écran
  permet de répondre dans l'ordre voulu, avec une option pour revenir modifier une
  réponse déjà validée avant la révélation.
- **Boussole réelle** (mobile) : le nord de la boussole suit le capteur du téléphone.
- Score basé sur l'écart de direction et de distance, historique de manches et
  meilleur score mémorisés.

## Stack technique

Expo (SDK 57) + Expo Router, React Native + react-native-web, TypeScript strict,
`react-native-svg` pour la boussole et le schéma de la Terre, AsyncStorage pour la
persistance locale (réglages, meilleur score).

## Lancer en local

```bash
npm install
npx expo start        # menu Expo (web / iOS / Android)
npx expo start --web  # directement le web
```

```bash
npx tsc --noEmit   # typecheck
npx expo lint       # lint
```

## Déploiement web

Le site est exporté en statique (`web.output: "static"`, `experiments.baseUrl:
"/full-azimut"` dans `app.json`) et publié sur GitHub Pages par
`.github/workflows/deploy-pages.yml` à chaque push sur `master`.

## Structure du projet

Un composant = un dossier auto-contenu (`index.ts` + `<Nom>.tsx` + `helpers.ts` +
`constants.ts` + `types.ts`), alias `@/` → `src/`. Détails de l'architecture, du
domaine (cap/distance/inclinaison, scoring) et des pièges connus : voir
[`CLAUDE.md`](CLAUDE.md).
