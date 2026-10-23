import { reporting } from './reportError';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

import { useRoomStore } from '@/store/roomStore';

import { onlinePlayersFrom } from './roomPlayers';
import { useHostPruneLeavers } from './useHostPruneLeavers';
import { useRoomReactions } from './useRoomReactions';
import type { StaleRoomData } from './useHostPruneLeavers';

/**
 * Ce dont tout ecran de jeu en ligne a besoin sur sa room : etat du store de room (connexion geree par le setup,
 * voir `useSetupRoom`), hote, joueurs en ordre d'arrivee, redirection "room supprimee", `handleQuit`.
 */
export const useOnlineRoomSession = (
  roomApi: {
    deleteRoom: (code: string) => Promise<void>;
    restartRoom: (code: string) => Promise<void>;
    sendReaction: (code: string, emoji: string) => Promise<void>;
    removeRoomPlayer: (code: string, uid: string) => Promise<void>;
    pruneRoomPlayerData: (code: string, stale: StaleRoomData) => Promise<void>;
  },
  code: string,
  onQuit: () => void,
) => {
  const router = useRouter();

  const localUid = useRoomStore((s) => s.localUid);
  const players = useRoomStore((s) => s.players);
  const hostUid = useRoomStore((s) => s.hostUid);
  const roomExists = useRoomStore((s) => s.roomExists);
  const connectionLost = useRoomStore((s) => s.connectionLost);
  // Faux une fois l'appareil sorti du store (l'hote qui quitte : voir `handleQuit`).
  const connected = useRoomStore((s) => s.code !== null);
  const roomSettings = useRoomStore((s) => s.roomSettings);
  const gameState = useRoomStore((s) => s.gameState);
  const roomReaction = useRoomStore((s) => s.reaction);

  // Room disparue (l'hote l'a supprimee) : la notice "l'hote a quitte" est geree par `useSetupRoom` ; repli
  // direct vers l'accueil, pas un simple retour (le setup montrerait la room morte).
  useEffect(() => {
    if (roomExists && !connectionLost) return;
    const timeout = setTimeout(() => router.dismissTo('/'), 2000);
    return () => clearTimeout(timeout);
  }, [roomExists, connectionLost, router]);

  // Room revenue au salon ("Rejouer", `handleReplay`) : on recule vers le setup reste monte. Jamais deconnecte :
  // l'etat reinitialise du store est aussi `'options'`, et l'hote qui quitte rentre deja seul.
  const onQuitRef = useRef(onQuit);
  useEffect(() => {
    onQuitRef.current = onQuit;
  });
  const backInLobby = connected && roomExists && gameState.screen === 'options';
  useEffect(() => {
    if (backInLobby) onQuitRef.current();
  }, [backInLobby]);

  // Emojis du footer et reaction recue (toutes, la mienne comprise) affichee sur l'ecran.
  const reactions = useRoomReactions(roomReaction, players, roomApi.sendReaction, code);

  const onlinePlayers = onlinePlayersFrom(players);
  const isHost = localUid !== null && localUid === hostUid;

  // Qui part emporte sa reponse, son score et son total (voir `useHostPruneLeavers`).
  const { pruneRoomPlayerData } = roomApi;
  const prune = useCallback((stale: StaleRoomData) => pruneRoomPlayerData(code, stale), [pruneRoomPlayerData, code]);
  useHostPruneLeavers(isHost, localUid, players, gameState, prune);

  // Hote : quitter supprime la room ; retour direct a l'accueil avec `dismissTo`, qui depile jeu ET setup (un
  // `replace` laissait l'ancien setup monte, qui reagissait a la room suivante). Deconnecte aussi le store ici : sinon
  // son `code`/`screen` perime relance l'effet "aller au jeu" vers une room inexistante. Un joiner retire
  // seulement sa presence (pour ne pas bloquer la manche) et revient au setup, la room vivant toujours.
  const handleQuit = () => {
    if (isHost) {
      roomApi.deleteRoom(code).catch(reporting('room.deleteOnQuit', { kind: 'background', room: code }));
      useRoomStore.getState().disconnect();
      router.dismissTo('/');
      return;
    }
    if (localUid !== null) {
      // Marque AVANT l'ecriture : le setup ecoute le meme update et ne distinguerait pas "j'ai quitte" de "expulse".
      useRoomStore.getState().markVoluntaryLeave();
      roomApi.removeRoomPlayer(code, localUid).catch(reporting('room.leaveOnQuit', { kind: 'background', room: code }));
    }
    onQuit();
  };

  // "Rejouer" : l'hote remet la room au salon (l'effet ci-dessus y ramene chaque appareil) ; un joiner y retourne seul.
  const handleReplay = () => {
    if (isHost) roomApi.restartRoom(code).catch(reporting('room.restart', { room: code }));
    else onQuit();
  };

  return {
    localUid,
    players,
    hostUid,
    connectionLost,
    connected,
    roomSettings,
    gameState,
    onlinePlayers,
    isHost,
    handleQuit,
    handleReplay,
    reactions,
  };
};
