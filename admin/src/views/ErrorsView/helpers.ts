import type { ErrorGroup, ErrorRow } from './types';

/** Maximum d'erreurs gardees a l'ecran : les 200 dernieres au depart, les nouvelles s'ajoutent dessus. */
export const MAX_ROWS = 500;

/** Regroupe par (action, code), plus frequent d'abord (une repetition retenue compte dans `repeats`). */
export const groupErrors = (rows: ErrorRow[]): ErrorGroup[] => {
  const groups = new Map<string, ErrorGroup>();
  for (const row of rows) {
    const key = `${row.action}|${row.code}`;
    const group = groups.get(key) ?? { action: row.action, code: row.code, count: 0, repeats: 0, lastAt: 0 };
    group.count += 1;
    group.repeats += row.repeats;
    group.lastAt = Math.max(group.lastAt, row.at);
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => b.count + b.repeats - (a.count + a.repeats) || b.lastAt - a.lastAt);
};

export const formatDate = (ms: number): string =>
  new Date(ms).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
