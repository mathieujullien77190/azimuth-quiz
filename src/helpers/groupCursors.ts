import AsyncStorage from '@react-native-async-storage/async-storage';

import { CURSORS_STORAGE_KEY } from '@/data/game';

/** Position de l'appareil dans chaque groupe : `"cities|easy" -> 17` = prochain lieu a prendre = le 18e (0-based).
 * Le curseur avance et boucle, donc un groupe est parcouru en entier avant tout retour. */
export type Cursors = Record<string, number>;

let cached: Cursors | null = null;
let loading: Promise<Cursors> | null = null;

// Une lecture/ecriture ratee = repart d'un lieu aleatoire, jamais une erreur.
const store = (cursors: Cursors): void => {
  cached = cursors;
  AsyncStorage.setItem(CURSORS_STORAGE_KEY, JSON.stringify(cursors)).catch(() => {
    // Non sauve : la prochaine session repart d'un lieu aleatoire, sans gravite.
  });
};

export const loadCursors = (): Promise<Cursors> => {
  if (cached) return Promise.resolve(cached);
  loading ??= AsyncStorage.getItem(CURSORS_STORAGE_KEY)
    .then((raw) => (raw ? (JSON.parse(raw) as Cursors) : {}))
    .catch(() => ({}))
    .then((result) => {
      cached = result;
      return result;
    });
  return loading;
};

/** Avance les curseurs des groupes donnes (les autres restent). */
export const saveCursors = (moved: Cursors): void => store({ ...(cached ?? {}), ...moved });

/** Efface les curseurs (fait partie de l'action « effacer les donnees »). */
export const clearCursors = (): void => store({});
