import type { ErrorGroup, ErrorRow } from './types';

/** The most errors kept on screen: the newest 200 are read at first, live ones are added on top. */
export const MAX_ROWS = 500;

/** Groups by (action, code), most frequent first (a held-back repeat counts as an occurrence in `repeats`). */
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
