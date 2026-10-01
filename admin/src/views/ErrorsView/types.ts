/** One error of the `errors` collection (written by the game, see `src/helpers/reportError.ts`). */
export type ErrorRow = {
  id: string;
  action: string;
  code: string;
  message: string;
  room: string | null;
  kind: 'game' | 'background';
  repeats: number;
  platform: string;
  version: string;
  /** ms since epoch. */
  at: number;
  expireAt: number;
};

/** The errors of one (action, code) pair: how many, and the last time. */
export type ErrorGroup = { action: string; code: string; count: number; repeats: number; lastAt: number };
