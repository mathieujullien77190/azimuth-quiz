import type { Codename } from '@/helpers/appInfo';

export type LoadingBarProps = {
  /** "Chargement…". */
  loadingLabel: string;
  /** Ligne de version en bas, « v2.65.0 - 🐦 - great-tit » (`VersionLine` : le nom de l'animal renvoie a Wikipedia). */
  version: string;
  codename: Codename | undefined;
  /** Temps minimum du chargement (ms) : le calendrier de la barre finit alors, sous 100 %. */
  fillMs: number;
  /** Source des blocages et sauts (`Math.random` par defaut) : un test passe la sienne pour un rendu fixe. */
  random?: () => number;
};

/** Une keyframe de la barre : demarre `at` ms apres l'apparition de la barre et amene la barre a `to` pourcent. */
export type ProgressStep = { at: number; to: number; easeMs: number };
