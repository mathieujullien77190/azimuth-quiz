# store/

Un seul store Zustand concret, `useRoomStore` (`roomStore.ts`), partage par tous les ecrans de la room en ligne. Etat : `code`,
`players`, `hostUid`, `roomExists`, `roomSettings`, `gameState`, `reaction`, `localUid`, `connectionLost`. Actions : `connect(code)`,
`disconnect()`, `markConnectionLost()`, `markVoluntaryLeave()`, `consumeVoluntaryLeave()`. Les types sont dans `types.ts`.

- **Proprietaire du cycle de vie** : `useSetupRoom` (`components/setup/`) appelle `connect` / `disconnect` ; l'ecran de jeu ne fait que
  lire. `connect(code)` est idempotent et ouvre trois abonnements Firestore (joueurs, reglages, jeu) partages par tous les ecrans.
- `roomExists` passe a `false` seulement quand la room a ete vue puis a disparu (l'hote l'a supprimee) ; il reste `true` tant qu'elle
  n'a jamais charge, ce qui distingue « supprimee » de « connexion en cours ».
- `markVoluntaryLeave` evite qu'un joiner qui quitte de lui-meme soit pris pour un joueur expulse (sa presence disparait dans les deux cas).
- Les fermetures non reactives (`unsubscribers`, `hasSeenRoom`, `leftVoluntarily`) vivent hors de l'etat.
- `localUid` n'est pas resolu ici : `joinRoomPresence` le pousse par `setState`.
- Le store depend de `firebase/room.ts` (donc de `firebase/firestore`) : il reste hors de tout barrel. Les tests le remplissent par
  `setState` et mockent `@/firebase/room`.
