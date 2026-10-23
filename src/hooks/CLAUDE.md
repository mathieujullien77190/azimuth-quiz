# hooks/

Hooks React partages entre plusieurs ecrans ou composants. Les fonctions simples (sans React) vivent dans `helpers/`, les hooks
propres a un seul ecran restent colocalises avec lui (`screens/<Screen>/use*.ts`).

| Fichier | Contenu |
|---|---|
| `room.ts` | `useOnlineRoomSession` (etat de la room, hote, joueurs dans l'ordre d'arrivee, `handleQuit`, rejouer), `useRoomPresence` (heartbeat, coupure reseau), `useRoomReactions` (envoi et reception des emojis), `useHostPruneLeavers` (l'hote purge les donnees d'un joueur parti) |
| `app.ts` | `useDebouncedValue`, `useSplashGate` (attente du chargement de depart), `useImmersiveNavigationBar` |

`room.ts` lit le store de la room (`@/store/roomStore`) et appelle l'API Firestore injectee (`@/firebase/room`) : il reste hors de tout
barrel et ses tests mockent `@/firebase/room`.
