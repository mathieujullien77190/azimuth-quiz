# helpers/

Fonctions et hooks **sans Firebase** (ce qui touche Firestore vit dans `firebase/`), un fichier par theme. Le barrel `index.ts`
re-exporte `utils`, `platform` et `storage` ; les autres fichiers s'importent directement.

| Fichier | Contenu |
|---|---|
| `geo.ts` | cap et distance **loxodromiques** (un cap constant, celui d'une boussole), `rhumbDestination`, `angleDifference` |
| `scoring.ts` | score d'une manche, bonus du meilleur, echelle de distance (`roundDistance`, `distanceStepKm`) |
| `rounds.ts` | depart d'une manche (`originForRound`), mode voyage (`travelFromPlace`, `separateRepeats`), `effectiveDifficulty` |
| `utils.ts` | format, random, `splitEvenly` |
| `platform.ts` | web, drapeaux emoji, `goBack`, position GPS |
| `storage.ts` | AsyncStorage : reglages, langue, theme, nom, derniere room, `clearAppData` |
| `groupCursors.ts` | curseurs de tirage par groupe (voir `firebase/CLAUDE.md`) |
| `errors.ts` | `reportError` / `reporting`, notice d'erreur |
| `roomPlayers.ts` | joueurs de la room dans l'ordre d'arrivee, noms libres / pris |
| `roomHooks.ts` | `useOnlineRoomSession`, `useRoomPresence`, `useRoomReactions`, `useHostPruneLeavers` |
| `hooks.ts` | `useDebouncedValue`, `useSplashGate`, `useImmersiveNavigationBar` |
| `appInfo.ts` | version et animal de la version (`versionParts`, `versionLabel`) |
| `storyFixtures.ts` | donnees pour les stories (hors couverture) |

## Score (`scoring.ts`)

Deux axes de 500 points, plus l'ecart est petit plus il y a de points (courbe `SCORE_CURVE_EXPONENT`) :

- **Cap** : 500 points au cap exact, 0 point au pire ecart possible (180 degres).
- **Distance** : jugee par l'ecart entre le point devine et le vrai lieu (`targetGapKm`), 500 points sur le lieu, 0 point a
  `DISTANCE_TOLERANCE_KM` = 20 000 km.
- **Bonus** : +100 par axe quand c'est exact (cap au degre pres ; point devine a moins d'un demi-pas de curseur du lieu), et +1/5 du
  max (100) au meilleur de la manche par axe (`applyBestBonus`, plus petit ecart de cap, plus petit `targetGapKm`, egalites comprises,
  seulement a plusieurs).
- `scoring.test.ts` verifie par proprietes (mille manches tirees) que le plus petit ecart gagne le bonus et gagne le plus de points, et
  qu'un joueur au moins aussi bon sur les deux axes n'a jamais un total plus bas.
- `distanceKm` et `rhumbDestination` bornent la latitude juste avant le pole : un cap qui atteint un pole donne un point utilisable
  (longitude finie), jamais `NaN`.

## Erreurs

Toute ecriture Firestore qui echoue passe par `.catch(reporting('jeu.action', { room }))` ; `kind: 'game'` previent le joueur
(`ErrorNoticeHost`), `kind: 'background'` (presence, nettoyage) ne fait que `console.debug` (en dev, un `console.error` s'affiche en
toast rouge).
