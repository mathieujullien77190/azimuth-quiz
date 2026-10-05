import { useRef, useState } from 'react';

import { REACTION_COOLDOWN_MS, REACTIONS_PER_GAME } from '@/data';

import type { RoomPlayers, RoomReaction } from './roomBase';
import { reporting } from './reportError';

/** What the screen shows for a received reaction: the emoji and, under it, who sent it (null if they are gone). */
export type ShownReaction = { emoji: string; name: string | null; seq: number };

/**
 * The emoji reactions of a room, for its online game screen: `reaction` is the latest one anyone sent (the sender
 * included) once this screen is open — the overlay lets each one run its own course, so this keeps no timer — and
 * `send` puts one of the footer's emojis to everybody. A reaction already in the room when the screen opens is an old
 * one and is not shown; two sends from this device are at least `REACTION_COOLDOWN_MS` apart, so a held finger cannot
 * flood the room; a player sends at most `REACTIONS_PER_GAME` in a game; and `canReact` is false alone in the room (nobody
 * to send to) or once that many were sent, where the bar stays hidden.
 */
export const useRoomReactions = (
  reaction: RoomReaction | null,
  players: RoomPlayers,
  sendReaction: (code: string, emoji: string) => Promise<void>,
  code: string,
) => {
  // The one already there when the screen opens counts as seen.
  const [seenSeq, setSeenSeq] = useState<number | null>(reaction?.seq ?? null);
  const [latest, setLatest] = useState<RoomReaction | null>(null);
  // Derived while rendering (React's own pattern for state that follows a value), not in an effect: there is no frame
  // where the new reaction exists but is not yet shown.
  if (reaction !== null && reaction.seq !== seenSeq) {
    setSeenSeq(reaction.seq);
    setLatest(reaction);
  }

  const lastSentAt = useRef(0);
  // Counted on this device, for the life of the game screen: a new game opens a new screen, so it starts over.
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
