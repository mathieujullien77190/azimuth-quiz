import type { Codename } from '@/helpers/version';

export type LoadingBarProps = {
  /** Vrai tant que le chargement dure ; une fois faux, la barre se complete, s'efface et se retire. */
  loading: boolean;
  /** "Chargement…". */
  loadingLabel: string;
  /** Ligne de version en bas, « v2.65.0 - 🐦 - great-tit » (`VersionLine` : le nom de l'animal renvoie a Wikipedia). */
  version: string;
  codename: Codename | undefined;
  /** Temps minimum du chargement (ms) : le calendrier de la barre finit alors, sous 100 %, jusqu'a la liberation. */
  fillMs: number;
  /** Source des blocages et sauts (`Math.random` par defaut) : un test passe la sienne pour un rendu fixe. */
  random?: () => number;
};

/** Une keyframe de la barre : demarre `at` ms apres l'apparition de la barre et amene la barre a `to` pourcent. */
export type ProgressStep = { at: number; to: number; easeMs: number };
