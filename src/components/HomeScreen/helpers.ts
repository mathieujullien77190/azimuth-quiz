import { UFO_FOOTPRINT, UFO_PAUSE_OPTIONS_S } from './constants';

export type UfoPosition = { top: number; left: number };

/** Position aleatoire pour la soucoupe, entierement contenue dans une zone de zoneWidth x zoneHeight. */
export const randomUfoPosition = (zoneWidth: number, zoneHeight: number): UfoPosition => {
  const maxLeft = Math.max(0, zoneWidth - UFO_FOOTPRINT.width);
  const maxTop = Math.max(0, zoneHeight - UFO_FOOTPRINT.height);
  return {
    top: Math.round(Math.random() * maxTop),
    left: Math.round(Math.random() * maxLeft),
  };
};

/** Duree de pause (en secondes) a l'arret entre deux deplacements : 3, 4, 5 ou 6 au hasard. */
export const randomUfoPauseSeconds = (): (typeof UFO_PAUSE_OPTIONS_S)[number] =>
  UFO_PAUSE_OPTIONS_S[Math.floor(Math.random() * UFO_PAUSE_OPTIONS_S.length)];
