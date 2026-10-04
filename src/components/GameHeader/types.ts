import type { Difficulty, Player } from '@/types';

export type GameHeaderProps = {
  onQuit: () => void;
  /** The room code, next to the quit cross (every game is an online room). */
  code: string;
  /** This device's player and running total, top right ("Zoé · 350 pts"). */
  name: string;
  points: number;
  /** Shown as "Manche 3 / 10 · difficulty", aligned left under the top row. */
  roundNumber: number;
  totalRounds: number;
  difficulty: Difficulty;
  /** Given: shows who's playing and whose turn it is (`PlayerTabs`, status only). Omitted: no tabs,
   * for a game with no turns (Compass: everyone answers at once). */
  players?: Player[];
  /** Index into `players` of whoever has the turn; -1 (the default) when nobody does, e.g. once
   * the round is over. Only meaningful with `players`. */
  turnIndex?: number;
  /** Travel mode: where the player stands ("Vous êtes à Cusco"), already translated; a white line under the round row. */
  location?: string;
  /** The round's question, centered at the bottom of the header ("Quel est ce pays ?"). */
  question?: string;
};
