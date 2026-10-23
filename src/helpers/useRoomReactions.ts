import { useRef, useState } from 'react';

import { REACTION_COOLDOWN_MS, REACTIONS_PER_GAME } from '@/data';

import type { RoomPlayers, RoomReaction } from '../firebase/roomApi';
import { reporting } from './reportError';

/** Reaction recue a afficher : l'emoji et l'expediteur dessous (null s'il est parti). */
export type ShownReaction = { emoji: string; name: string | null; seq: number };

/**
 * Reactions emoji d'une room : `reaction` = la derniere envoyee (la mienne comprise) depuis l'ouverture de l'ecran
 * (une deja presente est ignoree) ; `send` l'envoie. Delai `REACTION_COOLDOWN_MS` entre deux envois, au plus
 * `REACTIONS_PER_GAME` par partie ; `canReact` faux seul dans la room ou quota atteint.
 */
export const useRoomReactions = (
  reaction: RoomReaction | null,
  players: RoomPlayers,
  sendReaction: (code: string, emoji: string) => Promise<void>,
  code: string,
) => {
  // Celle deja presente a l'ouverture compte comme vue.
  const [seenSeq, setSeenSeq] = useState<number | null>(reaction?.seq ?? null);
  const [latest, setLatest] = useState<RoomReaction | null>(null);
  // Derive au rendu (pattern React), pas en effet : pas d'image ou la reaction existe sans etre affichee.
  if (reaction !== null && reaction.seq !== seenSeq) {
    setSeenSeq(reaction.seq);
    setLatest(reaction);
  }

  const lastSentAt = useRef(0);
  // Compte sur cet appareil pour la vie de l'ecran : une nouvelle partie le remet a zero.
  const [sent, setSent] = useState(0);
  const send = (emoji: string) => {
    const now = Date.now();
    if (sent >= REACTIONS_PER_GAME || now - lastSentAt.current < REACTION_COOLDOWN_MS) return;
    lastSentAt.current = now;
    setSent((count) => count + 1);
    sendReaction(code, emoji).catch(reporting('room.reaction', { kind: 'background', room: code }));
  };

  return {
    reaction:
      latest === null
        ? null
        : ({ emoji: latest.emoji, name: players[latest.uid]?.name ?? null, seq: latest.seq } satisfies ShownReaction),
    send,
    canReact: Object.keys(players).length > 1 && sent < REACTIONS_PER_GAME,
  };
};
