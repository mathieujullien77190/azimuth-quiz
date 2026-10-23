import { reporting } from './reportError';
import { useEffect, useRef } from 'react';

import { useRoomStore } from '@/store/roomStore';

// Lent et peu couteux expres : chaque heartbeat est une ecriture lue par tous (N joueurs = N lectures). 30 s / seuil
// 90 s donnent ~500 ecritures et 2000 lectures pour 4 joueurs en 1 h, et rien seul ou au salon (voir `active`).
const HEARTBEAT_MS = 30_000;
const LOST_AFTER_MS = 90_000;
const CHECK_MS = 10_000;
/** Un controle en retard de cet ordre = appareil suspendu (arriere-plan, ecran verrouille), pas une coupure : reinitialiser. */
const SUSPENDED_GAP_MS = CHECK_MS * 3;

type PresenceApi = {
  sendHeartbeat: (code: string, uid: string) => Promise<void>;
  deleteRoom: (code: string) => Promise<void>;
  removeRoomPlayer: (code: string, uid: string) => Promise<void>;
};

/**
 * Detection de coupure, commune aux jeux, montee une fois par `useSetupRoom`. En partie a plusieurs, chaque appareil
 * ecrit `lastSeen` et surveille celui des autres (changement, jamais compare a l'horloge locale). Qui perd la
 * connexion quitte la partie :
 * - son propre heartbeat sans accuse trop longtemps : `connectionLost` et sortie (hote supprime la room, joiner part) ;
 * - l'hote ne voit plus un joiner : il le retire (voir `useHostPruneLeavers`) ;
 * - un joiner ne voit plus l'hote : il part (sans hote, plus de manches ni de scores).
 */
export const useRoomPresence = (api: PresenceApi, code: string | null) => {
  const localUid = useRoomStore((s) => s.localUid);
  const screen = useRoomStore((s) => s.gameState.screen);
  const playerCount = useRoomStore((s) => Object.keys(s.players).length);
  const active = code !== null && localUid !== null && screen === 'game' && playerCount > 1;

  const lastAckRef = useRef(0);
  const lastCheckRef = useRef(0);
  const seenRef = useRef(new Map<string, { value: number | null; at: number }>());

  // Seul signal "en ligne" : l'ecriture est acquittee par le serveur (un rejet, ex. room disparue, ne compte pas).
  useEffect(() => {
    if (!active || code === null || localUid === null) return;
    const beat = () =>
      api
        .sendHeartbeat(code, localUid)
        .then(() => {
          lastAckRef.current = Date.now();
        })
        .catch(reporting('room.heartbeat', { kind: 'background', room: code }));
    lastAckRef.current = Date.now();
    beat();
    const interval = setInterval(beat, HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, [active, code, localUid, api]);

  useEffect(() => {
    if (!active || code === null || localUid === null) return;
    const seen = seenRef.current;
    seen.clear();
    lastCheckRef.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastCheckRef.current > SUSPENDED_GAP_MS) {
        lastCheckRef.current = now;
        lastAckRef.current = now;
        seen.clear();
        return;
      }
      lastCheckRef.current = now;

      const state = useRoomStore.getState();
      const isHost = localUid === state.hostUid;
      let hostSilent = false;
      const silentJoiners: string[] = [];
      for (const [uid, player] of Object.entries(state.players)) {
        if (uid === localUid) continue;
        const value = player.lastSeen?.toMillis() ?? null;
        const previous = seen.get(uid);
        if (!previous || previous.value !== value) {
          seen.set(uid, { value, at: now });
        } else if (now - previous.at > LOST_AFTER_MS) {
          if (uid === state.hostUid) hostSilent = true;
          else silentJoiners.push(uid);
        }
      }
      for (const uid of seen.keys()) if (!(uid in state.players)) seen.delete(uid);

      if (now - lastAckRef.current > LOST_AFTER_MS || (!isHost && hostSilent)) {
        state.markConnectionLost();
        if (isHost) api.deleteRoom(code).catch(reporting('room.deleteOnLoss', { kind: 'background', room: code }));
        else
          api.removeRoomPlayer(code, localUid).catch(reporting('room.leaveOnLoss', { kind: 'background', room: code }));
        return;
      }
      if (isHost) {
        silentJoiners.forEach((uid) => {
          seen.delete(uid);
          api.removeRoomPlayer(code, uid).catch(reporting('room.removeSilent', { kind: 'background', room: code }));
        });
      }
    }, CHECK_MS);
    return () => clearInterval(interval);
  }, [active, code, localUid, api]);
};
