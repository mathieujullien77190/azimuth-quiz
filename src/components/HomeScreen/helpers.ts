import { spacing } from '@/constants';

import { MAX_COMPASS_SIZE } from './constants';

/**
 * Au premier rendu de l'export web statique, `useWindowDimensions` renvoie parfois 0 (valeur
 * figee au rendu serveur, jamais corrigee sans redimensionnement reel de la fenetre) : sans
 * garde-fou, la boussole se retrouverait avec une taille negative, donc invisible. On retombe
 * alors sur la taille max plutot que de la faire disparaitre.
 */
export const compassSizeFor = (windowWidth: number): number => {
  const size = Math.min(MAX_COMPASS_SIZE, windowWidth - spacing.xl * 2);
  return size > 0 ? size : MAX_COMPASS_SIZE;
};
