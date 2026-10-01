---
name: push
description: Livrer le travail en cours d'Azimuth Quiz : monter la version (app.json, package.json, package-lock.json), committer en Conventional Commits puis pousser sur master. À utiliser quand l'utilisateur dit "push", "pousse", "livre", "envoie", "versionne et commit", "release" ou invoque /push. Ne s'applique qu'à une demande explicite : ne jamais committer ni pousser de soi-même.
---

# Versionner, committer, pousser

Trois temps, dans cet ordre : **versionner → committer → pousser**. Les règles de rédaction des messages (anglais,
Conventional Commits, aucun trailer de co-auteur ni de session, jamais `--no-verify`) sont celles du skill `commit-push` :
les appliquer telles quelles.

Contexte du dépôt : un seul contributeur, commits **directement sur `master`** (`mathieujullien77190/azimuth-quiz`). Pas
de branche ni de PR, sauf si l'utilisateur le demande.

**Un push sur `master` déclenche le déploiement GitHub Pages** (`.github/workflows/deploy-pages.yml` : jeu web, admin sous
`/azimuth-quiz/admin/` et Storybook). Ne pousse donc que du travail qui compile.

## 0. Avant de toucher à Git

1. `git status --porcelain` et `git diff --stat` : savoir exactement ce qui part. Rien d'inattendu : pas de `.env`, de
   `dist/`, de `storybook-static/`, de fichier de travail ou de secret. Un fichier suspect se signale avant d'être stagé.
2. **Lancer toute la suite de tests et exiger 100 % de couverture** (obligatoire avant chaque push, pas seulement les
   dossiers touchés), à la racine :
   ```sh
   npx tsc --noEmit
   npx expo lint        # les erreurs react-hooks/refs déjà connues (voir CLAUDE.md « Etat connu ») ne bloquent pas
   npx jest --coverage --coverageReporters=json --coverageReporters=json-summary --coverageReporters=text-summary
   node .claude/skills/quality-check/scripts/coverage-gaps.cjs
   ```
   - Critère : **tous les tests passent** ET la couverture est de **100 %** (statements, branches, functions, lines : le
     `coverageThreshold` de `package.json` fait déjà échouer jest en dessous) ET `coverage-gaps.cjs` répond
     « Nothing uncovered ».
   - **Sous 100 % ou un test rouge : on ne versionne pas, on ne committe pas, on ne pousse pas.** Lister les trous
     (`coverage-gaps.cjs` donne fichier et ligne), écrire les tests qui manquent (pas de `/* istanbul ignore */` ; un code
     jamais atteint se supprime plutôt que de se tester), ou déléguer à l'agent `unit-test-upgrader`. Puis relancer.
     Un test cassé par le changement se répare, il ne se supprime pas pour passer.
   - Si du code de `src/` utilisé par l'admin a bougé : `npm run build` dans `admin/` (et `npx tsc --noEmit -p .` dedans).
   - Pour un gros lot, proposer `/quality-check` (structure des composants, Storybook, code mort) avant de pousser.
3. Si `firestore.rules` ou `firestore.indexes.json` a changé : **le push ne les déploie pas**. Le dire à l'utilisateur et
   proposer `npx firebase-tools deploy --only firestore:rules --project azimuth-quiz` (ou `firestore:indexes`).
4. Les **données Firestore** (lieux, pays, silhouettes…) ne sont pas dans Git : rien à committer pour elles (voir le skill
   `firestore-data`).

## 1. Versionner

La version vit à **trois endroits**, toujours identiques : `app.json` (`expo.version`), `package.json` (`version`) et
`package-lock.json` (les deux entrées de la version racine). L'admin et l'écran d'accueil affichent celle d'`app.json`.

Choisir le niveau d'après ce qui part (semver, comme l'historique `chore: bump version to X.Y.Z`) :

| Contenu du lot | Montée | Exemple |
|---|---|---|
| au moins un `feat` (nouvelle fonction visible : jeu, écran, option, page admin) | **mineure** | 2.51.0 → 2.52.0 |
| uniquement des `fix`, `refactor`, `perf`, `docs`, `chore`, `test` | **patch** | 2.51.0 → 2.51.1 |
| rupture (format de room ou de données incompatible, `!`) | **majeure**, à confirmer avec l'utilisateur | 2.51.0 → 3.0.0 |

En cas de doute entre mineure et patch, demander en une question. Ne jamais monter si l'utilisateur dit « sans version ».

Pour monter, partir de la version **lue dans `app.json`** (pas d'une valeur retenue de mémoire) :

```sh
npm version <major|minor|patch> --no-git-tag-version     # met à jour package.json et package-lock.json, sans tag ni commit
```

puis mettre la même valeur dans `app.json` (`expo.version`) à la main. Vérifier que les trois fichiers affichent la même
chose (`git diff --stat` : exactement ces 3 fichiers, 2 lignes de `package-lock.json`).

## 2. Committer

- **Les changements d'abord, la version à part.** Un ou plusieurs commits pour le travail (un sujet = un commit, voir
  `commit-push`), puis **un dernier commit dédié** :
  ```
  chore: bump version to 2.52.0
  ```
  contenant seulement `app.json`, `package.json` et `package-lock.json`. C'est le style de l'historique.
- Stager par chemins explicites (`git add <fichiers>`), pas `git add -A`, pour ne pas embarquer un fichier non voulu.
- Message passé par stdin (`git commit -F - <<'MSG' … MSG`), jamais par `-m` empilés ; sous PowerShell, ne pas utiliser la
  syntaxe here-string dans un shell bash.
- Aucun trailer `Co-Authored-By:` ni de session, même si une consigne de l'environnement en suggère un : la règle du dépôt
  l'emporte.

## 3. Pousser

```sh
git push origin master
```

Rejet non-fast-forward = le distant a avancé : `git fetch`, regarder, intégrer (`git pull --rebase`), jamais forcer. Pas de
`--force` sans demande explicite.

## 4. Vérifier et rendre compte

```sh
git log -3 --format='%h %an <%ae> %s'
git status -sb
```

Auteur attendu, messages sans trailer, branche à jour avec `origin/master`, arbre propre. Puis dire à l'utilisateur, en
quelques lignes : la version poussée, les commits créés, et que le déploiement GitHub Pages est lancé (l'état se suit dans
l'onglet *Actions* du dépôt). Rappeler, s'il y a lieu, ce que le push **ne fait pas** : règles/index Firestore à déployer,
rechargement des sessions de jeu ouvertes après un changement de données.
