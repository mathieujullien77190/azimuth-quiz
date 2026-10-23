/** Une erreur de la collection `errors` (ecrite par le jeu, voir `src/helpers/errors.ts`). */
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
  /** ms depuis l'epoch. */
  at: number;
  expireAt: number;
};

/** Erreurs d'une paire (action, code) : combien, et la derniere fois. */
export type ErrorGroup = { action: string; code: string; count: number; repeats: number; lastAt: number };
