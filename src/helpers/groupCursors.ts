import AsyncStorage from '@react-native-async-storage/async-storage';

/** Position de l'appareil dans chaque groupe : `"cities|easy" -> 17` = prochain lieu a prendre = le 18e (0-based).
 * Le curseur avance et boucle, donc un groupe est parcouru en entier avant tout retour. */
export type GroupCursors = Record<string, number>;

/** Un store de curseurs par jeu, sous sa propre cle. Une lecture/ecriture ratee = repart d'un lieu aleatoire, jamais une erreur. */
export const createGroupCursors = (storageKey: string) => {
  let cached: GroupCursors | null = null;
  let loading: Promise<GroupCursors> | null = null;

  const store = (cursors: GroupCursors): void => {
    cached = cursors;
    AsyncStorage.setItem(storageKey, JSON.stringify(cursors)).catch(() => {
      // Non sauve : la prochaine session repart d'un lieu aleatoire, sans gravite.
    });
  };

  return {
    load: (): Promise<GroupCursors> => {
      if (cached) return Promise.resolve(cached);
      loading ??= AsyncStorage.getItem(storageKey)
        .then((raw) => (raw ? (JSON.parse(raw) as GroupCursors) : {}))
        .catch(() => ({}))
        .then((result) => {
          cached = result;
          return result;
        });
      return loading;
    },
    /** Avance les curseurs des groupes donnes (les autres restent). */
    save: (moved: GroupCursors): void => store({ ...(cached ?? {}), ...moved }),
    /** Efface les curseurs (fait partie de l'action « effacer les donnees »). */
    clear: (): void => store({}),
  };
};
