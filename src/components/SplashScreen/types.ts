import type { Codename } from '@/helpers/version';

export type SplashScreenProps = {
  /** Vrai tant que le splash est voulu ; une fois faux, il s'efface et se retire de l'ecran. */
  visible: boolean;
  /** Ligne sous le titre (`t.app.tagline`, celle de l'accueil). */
  tagline: string;
  /** "Chargement…". */
  loadingLabel: string;
  /** Ligne de version en bas, « v2.65.0 - 🐦 - great-tit » (`VersionLine` : le nom de l'animal renvoie a Wikipedia). */
  version: string;
  codename: Codename | undefined;
  /** Temps minimum du splash (ms) : le calendrier de la barre finit alors, sous 100 %, jusqu'a la liberation. */
  fillMs: number;
  /** Source des blocages et sauts (`Math.random` par defaut) : un test passe la sienne pour un rendu fixe. */
  random?: () => number;
};

/** Une keyframe de la barre : demarre `at` ms apres l'apparition du splash et amene la barre a `to` pourcent. */
export type ProgressStep = { at: number; to: number; easeMs: number };
