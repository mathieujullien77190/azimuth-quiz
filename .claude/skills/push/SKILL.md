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
   - **Admin** : `(cd admin && npx tsc --noEmit -p . && npm run test:coverage)` : les tests Vitest passent et la couverture de
     `admin/src` est aussi de **100 %** (même règle : sous 100 %, on n'avance pas). Puis `npm run build` dans `admin/`.
   - Pour un gros lot, proposer `/quality-check` (structure des composants, Storybook, code mort) avant de pousser.
3. **Règles et index Firestore : le push ne les déploie pas**, et c'est ce qui a déjà cassé le jeu (`hintPicks` ajouté au
   dépôt mais pas en ligne : l'indice du joueur non hôte « revenait »). Donc, à chaque push :
   - Repérer si `firestore.rules` ou `firestore.indexes.json` change dans le lot (`git diff --stat` + `git diff origin/master
     --stat -- firestore.rules firestore.indexes.json`). Si oui, **le dire à l'utilisateur avant de pousser** : « les règles
     changent, je les déploie après le push ».
   - **Que les règles aient changé ou non, comparer le dépôt à la production** : lire les règles déployées avec
     l'outil MCP `firebase_get_security_rules` (type `firestore`, à charger avec ToolSearch), puis les comparer à
     `firestore.rules` en ignorant les fins de ligne et les espaces de fin. Un écart = règles pas à jour en ligne.
   - En cas d'écart ou de changement : valider (`firebase_validate_security_rules` ou la compilation du déploiement),
     déployer avec `npx firebase-tools deploy --only firestore:rules --project azimuth-quiz` (et `firestore:indexes` si
     les index ont bougé), puis **relire les règles déployées et confirmer qu'elles sont identiques** au dépôt.
   - Ne jamais conclure « poussé » sans avoir dit où en sont les règles (identiques, déployées, ou écart à traiter).
     Un champ qu'un joueur non hôte écrit dans une room doit être dans la liste `turnFields` des règles correspondantes.
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

**Chaque version porte le nom d'un animal** : à chaque montée, choisir un **nouvel animal** (jamais celui de la version
précédente ni d'une version déjà publiée : `git log -p -S"codename" -- app.json` donne les anciens ; les premiers noms,
courts, étaient arcticTern, flamingo, greenTurtle, humpbackWhale, redFox, snowyOwl, beaver, hedgehog, otter, penguin,
koala, sloth : un nouvel animal ne reprend aucune de ces espèces) et l'écrire dans `app.json` → `expo.extra.codename`
sous la forme `{ "emoji": "🦥", "name": "brown-throated-sloth" }` : `emoji` = l'emoji de l'animal, plus un second
si l'animal en a un qui le précise (le harfang des neiges : `🦉❄️`), et `name` = le **nom complet de l'espèce, toujours en
anglais** (quelle que soit la langue de l'appli), pas le nom court, en **kebab-case ASCII** (minuscules, accents retirés,
espaces et apostrophes → `-`) : mésange charbonnière → `"great-tit"` ; paresseux à gorge brune → `"brown-throated-sloth"`.
C'est ce que montrent l'écran Réglages (« v2.64.1 🦥 brown-throated-sloth »), l'écran de démarrage
(« v2.64.1 - 🦥 - brown-throated-sloth ») et l'en-tête de l'admin (`versionLabel` de
`src/helpers/version.ts`). Le dire à l'utilisateur dans le compte rendu
(« 2.65.0, le great-tit 🐦 »). Le nom d'animal ne va ni dans `package.json` ni dans `package-lock.json`.

## Android (Play Console) : à garder en tête au moment de livrer

Le push ne construit ni ne publie l'app Android (c'est `eas build` puis Play Console, à la demande de l'utilisateur), mais
il doit en garder le code cohérent :

- **`expo.android.versionCode` est écrit par EAS** : le profil `production` a `autoIncrement` et `appVersionSource: local`,
  donc chaque `eas build -p android --profile production` incrémente `versionCode` **dans `app.json`**. Après un build, le
  fichier est modifié : le **commiter** (sinon le build suivant repart de l'ancien numéro et Play refuse l'import, un
  `versionCode` doit toujours croître). Il se range avec le commit de version, ou dans un `chore: bump android versionCode`.
- **Package Android** : `expo.android.package` = `com.azimuthquiz.app`, définitif (Play Console le fige au premier import) :
  ne jamais le modifier. Le keystore de signature est créé et gardé par EAS pour ce package.
- **Variables Firebase côté EAS** : `.env` est ignoré par Git, donc le build cloud ne le voit pas. Les 7 variables
  `EXPO_PUBLIC_FIREBASE_*` sont déclarées dans l'environnement EAS `production` (`npx eas-cli env:list production`) ; sans
  elles l'app **plante au démarrage** (`getAuth` sans clé API). Une nouvelle variable `EXPO_PUBLIC_*` se crée là aussi
  (`npx eas-cli env:create production --name … --value … --visibility plaintext`), pas seulement dans `.env`.
- **Release de test interne** : un `.aab` se dépose à la main dans « Tests internes → Créer une version » (l'outil d'envoi
  de fichier est limité à 10 Mo) ; ne pas inclure la release précédente si elle plantait ; les notes de version veulent
  chaque balise `<fr-FR>` sur sa propre ligne.

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
quelques lignes : la version poussée, les commits créés, que le déploiement GitHub Pages est lancé (l'état se suit dans
l'onglet *Actions* du dépôt), et **l'état des règles Firestore** (identiques à la production, déployées pendant ce push,
ou écart restant : voir l'étape 0.3). Rappeler, s'il y a lieu, le rechargement des sessions de jeu ouvertes après un
changement de données.
