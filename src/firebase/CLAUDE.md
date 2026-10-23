# firebase/

Tout ce qui touche Firebase / Firestore. Le dossier importe `firebase/firestore` et reste **hors de tout barrel** (Jest plante a
l'import) : on importe toujours le fichier directement. `constants.ts`, `types.ts`, `read.ts`, `numbering.ts` et `journal.ts` sont purs et aussi
utilises par l'admin.

| Fichier | Role |
|---|---|
| `constants.ts` | constantes du dossier (collections, documents, rooms, code de room, tirage, erreurs), pures, aussi utilisees par l'admin |
| `client.ts` | app Firebase, `db`, `auth` (variables `EXPO_PUBLIC_FIREBASE_*`) |
| `room.ts` | creer / rejoindre / quitter une room, presence, couleurs, reglages, etat de manche, reactions |
| `places.ts` | `fetchRandomPlaces` : tire les lieux d'une partie |
| `groupedDraw.ts`, `groupCounts.ts` | moteur de tirage par groupes et tailles des groupes (`meta/compassCounts`) |
| `roomCode.ts` | code de room (4 syllabes consonne+voyelle), authentification anonyme |
| `errorSink.ts` | enregistre les erreurs dans la collection `errors` |
| `types.ts`, `read.ts`, `numbering.ts`, `journal.ts` | types des documents, lecteurs, numerotation, journal de l'admin |

## Donnees

Firestore est la **seule source** des lieux : aucun JSON embarque, **aucun repli** si Firestore echoue. Les donnees sont
**dupliquees expres** (un document par lieu porte tout ce dont une manche a besoin) et numerotees pour le tirage. Toute modification
de donnees (copies, numerotation, compteurs, `dataVersion`, journal) suit le skill `firestore-data` ; l'admin (`admin/src/data.ts`)
sait deja faire la plupart des cas.

Collections : `places/{cle}` (cle = code de 3 lettres, permanent, opaque ; porte aussi la copie `country` fr/en), `countries/{ISO}`
(nom fr/en, ni edite par l'admin ni lu par le jeu), `meta/*` (`compassCounts`, `dataVersion`), `journal/*` (admin), `errors`, `rooms/*`.
Le jeu lit `places`, `meta` et `rooms`.

## Tirage des manches

L'hote tire seul (`groupedDraw.ts` + `groupCounts.ts` + `helpers/groupCursors.ts`). Un groupe = `category` × `difficulty`, numerote
`n` = 1..taille (dense, ordre melange par hash de la cle, `numbering.ts`) ; les tailles sont dans `meta/compassCounts` (lues une fois
par lancement) ; l'appareil garde **un curseur par groupe** (AsyncStorage) : une partie prend les numeros suivants et avance le
curseur, en bouclant, donc un groupe est parcouru en entier avant qu'un element revienne. Plusieurs categories : repartition la plus
egale possible (`splitEvenly`). Lecture : UNE requete `or` par tranche de 30 numeros. L'anglais releve d'un cran les lieux
francais (`effectiveDifficulty`). Si Firestore echoue ou si le groupe a moins d'elements que de manches, le tirage rejette,
`useSetupRoom` remet `starting` a faux, la room reste au salon et la notice `startFailedNotice` s'affiche ; les curseurs ne bougent
pas. Les index composites sont dans `firestore.indexes.json`.

## Room en ligne

Une seule collection `rooms`, champ `game` (`'compass'`) immuable fixe a la creation ; un code d'un autre jeu est refuse a la jonction.

- **Regles** : `firestore.rules` (a la racine). **Tout champ qu'un joueur non hote ecrit doit figurer dans sa liste de champs**
  (`compassPlayer`), sinon l'ecriture est refusee et l'action « revient ». Les regles et les index se deploient a part.
- **Un joueur part** (quitte, expulse, coupure) : l'hote efface aussi ses donnees de manche (`useHostPruneLeavers`,
  `pruneRoomPlayerData`) ; s'il revient, c'est un nouveau joueur.
- **Coupure reseau** (`useRoomPresence`, monte une fois par `useSetupRoom`) : en partie a plusieurs, heartbeat `players.{uid}.lastSeen`
  toutes les 30 s ; qui perd la connexion quitte la partie (soi-meme apres 90 s sans ecriture acquittee, un joiner que l'hote ne
  voit plus est retire, l'hote perdu fait quitter les joiners).
- **Reactions** : champ unique `reaction` `{ uid, emoji, seq }` de la room (`sendReaction`, 1 s entre deux envois ;
  `useRoomReactions` ignore celle deja presente a l'ouverture). Regle `reactionOk` (uid = soi, emoji <= 8 caracteres, `seq` entier),
  acceptee seule ou avec les champs deja permis aux non-hotes ; **a deployer avec les regles**.

## Erreurs de jeu

Une ecriture Firestore qui echoue ne s'avale pas : `.catch(reporting('jeu.action', { room }))` (`helpers/errors.ts`), jamais
`.catch(() => {})`. `errorSink.ts` enregistre l'erreur dans `errors` (installe dans `app/_layout.tsx`) ; une meme erreur n'est
enregistree qu'une fois par 10 s (jeu) ou 60 s (fond), avec un compteur de repetitions. Les regles n'acceptent une erreur que
dans le meme lot que deux compteurs du jour (`errorQuota` : 30 par appareil, 1000 au total). `errors` et `errorQuota` ne passent ni
par le journal ni par `dataVersion`. Elles se lisent dans la page « Erreurs » de l'admin (nettoyage des plus de 30 jours : pas de
TTL, il exige la facturation Firebase).
