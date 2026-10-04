---
name: firestore-data
description: Comment modifier les données d'Azimuth Quiz dans Firestore (lieux, pays, silhouettes, devinettes, métiers, compteurs) sans casser les copies dupliquées, la numérotation ni le journal de l'admin. À utiliser dès qu'on ajoute, supprime ou modifie une donnée dans Firestore (par l'admin, le MCP firebase ou un script), qu'on change des villes/voisins/contours d'un pays, ou qu'on se demande "pourquoi mon changement n'apparaît pas".
---

# Modifier les données Firestore

Firestore est la **seule source** des données (aucun JSON dans l'appli). Elles sont **dupliquées exprès** : le jeu ne lit
qu'un document par lieu ou par pays, donc chaque document porte des copies de ce dont il a besoin. Modifier un document
**ne met pas les copies à jour** : c'est à celui qui écrit de le faire. S'ajoutent la **numérotation** des groupes, les
**compteurs**, la **version des données** et le **journal** que lit l'admin.

Règle d'or : **passe par l'admin quand une fonction existe** (`admin/src/data.ts`) : elle écrit tout dans un batch
atomique. N'écris à la main (MCP, script) que si aucune fonction ne couvre le cas, et alors refais à la main tout ce
qu'elle ferait (sections 1 à 4).

Projet Firebase : `azimuth-quiz`. Documents : `projects/azimuth-quiz/databases/(default)/documents/...`.

## 1. Qui copie quoi (à propager à chaque modification)

| Source | Copies à garder à jour |
|---|---|
| `countries/{ISO}` (noms fr/en, drapeau, devise, indicatif) | `places/{cle}.country` de **chaque lieu** du pays ; `neighbors[].fr/en` des **autres pays** qui le citent (fonction admin : `applyCountryChange`, tranches de 400 opérations) |
| `countries/{ISO}.ring` (contour Silhouette) | `neighbors[].ring` dans le document de **chaque pays voisin** qui cite ce code (copie telle quelle : les arêtes communes doivent garder exactement les mêmes sommets) |
| `personalityJobs/{code}` | `places/{cle}.personality.job` des personnalités étiquetées (`applyJobChange`) |
| `places/{cle}.compass.category` | `places/{cle}.clues.category` (`cluesCategory` : `capital` / `citiesFr` / `cities`) |
| numérotation d'un groupe | `places.n` (Boussole) **et** `places.clues.n` (Indices) + `meta/compassCounts` **et** `meta/cluesCounts` ; pour Silhouette `countries.n` + `meta/contourCounts` |

À savoir :
- **Villes et capitale de Silhouette** : `countries/{ISO}.cities` / `.capital` sont précalculées et ne servent qu'à
  Silhouette. Les modifier ne touche ni Boussole ni Indices (les lieux `places` sont indépendants).
- **Ne jamais retoucher le `ring` d'un seul pays sans propager** : tous les pays viennent d'une même topologie, une
  frontière commune a exactement les mêmes sommets des deux côtés. Si tu changes un contour, mets à jour les copies chez
  chaque voisin, et garde les sommets partagés avec les voisins tels quels.
- Pas de tableaux imbriqués ni de `undefined` dans Firestore : contours encodés en polyline (`data/firestore/polyline.ts`,
  3 décimales), drapeaux en objets, champ optionnel absent = omis.

## 2. Numérotation et compteurs

- Chaque groupe est numéroté `n` = 1..taille, **dense**, dans l'ordre mélangé d'un hash de la clé (`shuffleRank`,
  `data/firestore/numbering.ts`). Groupes : Boussole = `compass.category` × `difficulty`, Indices = `clues.category` ×
  `difficulty`, Silhouette = `difficulty`.
- Le jeu tire au hasard un `n` entre 1 et la taille lue dans `meta/*Counts` : **un compteur trop petit rend des lieux
  inatteignables, trop grand fait chercher des `n` sans document**.
- **Ajouter** un lieu : `n` = taille + 1 dans le groupe (les deux numérotations), puis les compteurs passent à la nouvelle
  taille. **Supprimer** ou **changer de groupe** : le dernier lieu du groupe quitté prend le `n` libéré
  (`planRegroup`, `applyPlaceChange`), sinon il y a un trou.
- Les compteurs gardent `shuffled: true`. Écris-les avec un masque ciblé (`counts.citiesFr`) pour ne pas toucher aux autres
  catégories.
- Clé d'un lieu : 3 lettres, **permanente**, jamais réattribuée, opaque. Vérifie qu'elle est libre avant d'écrire
  (`add_document` échoue si le document existe : c'est un bon garde-fou).

## 3. Version des données et journal (à ne pas oublier)

L'admin garde une copie locale (IndexedDB) et ne relit que ce que le **journal** lui dit avoir changé. **Une écriture
sans entrée de journal n'arrive jamais dans un admin déjà ouvert** (seul vider les données du site force une relecture
complète).

Pour chaque écriture, dans cet ordre (les données d'abord, le journal en dernier : une entrée n'est visible qu'une fois
toutes les données qu'elle nomme écrites) :

1. les documents de données ;
2. les compteurs (`meta/compassCounts`, `meta/cluesCounts`, `meta/contourCounts`) si un groupe a changé de taille ;
3. `meta/dataVersion` : `version` + 1 et `updatedAt` = maintenant en ms ;
4. une entrée `journal/{id aléatoire}` :
   ```
   { at: <timestamp>, changes: [ { c: 'places' | 'countries' | 'meta' | 'personalityJobs',
                                   id: '<id du document>', op: 'set' | 'delete' }, ... ] }
   ```
   Liste **tous** les documents touchés, y compris les compteurs (`{ c: 'meta', id: 'compassCounts', op: 'set' }`) et
   les lieux dont seul le `n` a bougé. Plus de 1000 documents changés : l'admin refait une lecture complète.

`at` est un `serverTimestamp()` dans l'admin. Depuis le MCP on ne peut pas le poser : on écrit l'heure de la machine
(`timestampValue`). Si l'horloge de la machine est **en avance** sur le serveur, un admin peut ignorer l'entrée. Prends
`Date.now()` au moment de l'écriture, jamais une heure inventée.

Le journal n'est jamais purgé. Il est lisible et inscriptible par les admins uniquement (`firestore.rules`).

## 4. Écrire avec le MCP `firebase` (quand l'admin ne suffit pas)

- Outils : `firestore_get_document`, `firestore_query_collection`, `firestore_list_documents`, `firestore_add_document`,
  `firestore_update_document` (à charger avec ToolSearch). **Passe les paramètres directement**
  (`document`, `updateMask`, `currentDocument`…), pas dans une enveloppe maison : un JSON mal formé est rejeté.
- Valeurs **typées** (REST) : `stringValue`, `integerValue` (**en chaîne**), `doubleValue`, `booleanValue`,
  `nullValue: "NULL_VALUE"`, `timestampValue` (ISO UTC), `arrayValue.values`, `mapValue.fields`.
- `update_document` avec `updateMask` : seuls les chemins listés changent (`counts.citiesFr`, `compass.description`). Un
  **tableau est remplacé en entier** : pour changer un élément, réécris tout le tableau. Mets
  `currentDocument: { exists: true }` pour ne pas créer un document par erreur.
- **Ne retape jamais à la main** une longue chaîne (contour polyline, tableau de voisins) : génère la valeur par script et
  recopie-la sans la modifier, ou mieux écris par script. Après écriture, **relis et compare** avec ce qui était attendu.
- Les lectures volumineuses sont sauvegardées dans un fichier (chemin affiché) : analyse-le avec `node`
  (`jq` et `python` n'existent pas sous Git Bash ici). Une requête `places` ou `countries` sans filtre dépasse la limite
  d'affichage : c'est normal, lis le fichier.
- Les écritures partent **directement en production** : relis le document avant, restreins le masque, vérifie après. Les
  écritures en lot (dizaines de documents) se font après accord de l'utilisateur et par ordre sûr (données → compteurs →
  version → journal).

## 5. Recettes

- **Villes / capitale d'un pays pour Silhouette** : `countries/{ISO}.cities` (tableau `{ name, lat, lon }`, au plus 5
  hors capitale) avec masque `cities` ; puis `dataVersion` + journal `{ c: 'countries', id: ISO, op: 'set' }`.
- **Nom, drapeau, devise, indicatif d'un pays** : admin (`saveCountry` → `applyCountryChange`). À la main : le pays, tous
  ses `places.country`, les `neighbors[].fr/en` des autres pays, journal pour **chacun**.
- **Contour ou voisins d'un pays** : le `ring` du pays **et** la copie `neighbors[].ring` dans chaque voisin ; garder les
  sommets communs identiques ; journal pour tous les pays touchés. Positions des voisins (`x`/`y`, fraction du plateau
  0-1) et ancre du label : seulement `countries/{ISO}`.
- **Ajouter des lieux** : document complet (identité, `country`, `compass`, `clues` avec `category`,
  `n` des deux numérotations), compteurs, version, journal.
- **Supprimer / changer de catégorie ou de difficulté un lieu** : `applyPlaceChange` dans l'admin (il garde les deux
  numérotations denses dans le même batch).
- **Métier** : `applyJobChange` ou les éditeurs de l'admin.

## 6. Après l'écriture : pourquoi ça n'apparaît pas

- **Le jeu** garde chaque document lu **en mémoire pour toute la session** (pas de cache disque) : recharge la page ou
  relance l'appli. Les compteurs (`meta/*Counts`) sont aussi lus une fois par lancement.
- **L'admin** ne voit le changement que par le journal (section 3).
- **Les règles Firestore** (`firestore.rules`) sont déployées à part : un champ ajouté dans le code mais pas dans les règles
  est refusé pour les joueurs non hôtes (écriture « qui revient »). Déploiement :
  `npx firebase-tools deploy --only firestore:rules --project azimuth-quiz` (index :
  `--only firestore:indexes`). Compare avec `firebase_get_security_rules` si un doute subsiste.

## 7. Checklist

Avant : lire le document, repérer **toutes** ses copies (section 1), savoir si une fonction de l'admin fait déjà le travail.
Après : relire les documents écrits ; compter les groupes si la numérotation a bougé (`n` dense de 1 à la taille dans chaque groupe,
pour Boussole **et** pour Indices) ; `dataVersion` incrémentée ; journal écrit **en dernier** avec tous les documents ;
rappeler à l'utilisateur de recharger le jeu et, si besoin, l'admin. Ne commit rien sans demande.
