import type { DirectionalLight, Group, Mesh, Scene } from 'three';

import type { EarthMark } from '@/components/EarthSection';
import type { Coordinates } from '@/types';

export type Globe3DProps = {
  /** Cote du dessin (carre) : le globe le remplit. */
  size: number;
  /** Le point de depart : chaque reponse est un cap et une distance depuis ici. */
  origin: Coordinates;
  /** Les memes reponses que la Terre de profil : chacune est sa route a cap constant (loxodromie), la vraie
   * (`isTruth`) seulement son point d'arrivee entoure. */
  marks: EarthMark[];
  /** Dessine les terres (contour du monde). Sans, le globe est une boule nue que l'equateur et Greenwich peuvent
   * encore marquer. Vrai par defaut. */
  land?: boolean;
  /** Marque le pole nord d'un point et d'un "N" tant qu'il est devant, pour voir l'inclinaison du globe. Vrai par defaut. */
  north?: boolean;
  /** Dessine l'equateur (pointille) pour lire ou est la reponse. */
  equator?: boolean;
  /** Dessine le meridien de Greenwich (pointille). */
  greenwich?: boolean;
  /** Un satellite (la nuit seulement, et sans zoom) fait le tour de la Terre sur son equateur, cliquable pour une
   * blague. Vrai par defaut. */
  satellite?: boolean;
  /** Tourne au doigt et zoome au pincement. Vrai par defaut ; faux garde le globe comme il est apparu. */
  draggable?: boolean;
  /** Boutons de zoom et "retour au nord", dans les coins du dessin. Suit `draggable` par defaut : un globe qu'on
   * ne peut pas tourner n'a rien a remettre. */
  controls?: boolean;
  /** Ce qui entoure la boule. Le dessin est une vraie surface OpenGL, pas transparente partout : on la peint de
   * cette couleur au lieu de laisser voir ce qui est derriere. Par defaut le fond du theme. */
  backgroundColor?: string;
};

/** Les couleurs de la scene, prises du theme par le composant. */
export type GlobeColors = {
  /** La mer : la boule elle-meme. */
  globe: string;
  /** Les cotes, tracees en lignes. */
  land: string;
  /** Les continents, peints dans ces lignes — une autre couleur que la mer, sinon on ne les distingue pas. */
  fill: string;
  /** Force de la peinture des continents (0-1) : un voile sur la mer sombre la nuit, la couleur pleine le jour. */
  fillOpacity: number;
  /** Dessine sans lumiere (le jour) : mer et continents sortent exactement dans les couleurs donnees, la ou une
   * boule eclairee les assombrirait du cote que la lampe n'atteint pas. */
  flat: boolean;
  guide: string;
  origin: string;
  pole: string;
};

export type GlobeSceneInput = {
  origin: Coordinates;
  marks: EarthMark[];
  land: boolean;
  equator: boolean;
  greenwich: boolean;
  north: boolean;
  colors: GlobeColors;
};

/** Une scene construite, la lampe que l'appelant accroche a la camera, et les pastilles qu'il remet a leur taille
 * d'ecran quand on zoome (voir `buildGlobeScene`). */
export type GlobeScene = {
  scene: Scene;
  headlight: DirectionalLight;
  screenSized: Mesh[];
};

/** Les routes des reponses, construites a part de la scene car le zoom change leur epaisseur (`buildRoutes`). */
export type GlobeRoutes = Group;

/** Les doigts sur le dessin a un instant : ou est celui qui a bouge, et l'ecartement de deux
 * (`null` avec un seul doigt : rien a pincer). */
export type Fingers = {
  x: number;
  y: number;
  gap: number | null;
};

/** Un point du globe vu du spectateur : `x` a droite, `y` en haut, `z` vers le spectateur (< 0 = face cachee). */
export type ViewPoint = {
  x: number;
  y: number;
  z: number;
};

/** Un point du dessin ; `visible` est faux sur la face cachee, ou il est repousse au contour. */
export type ScreenPoint = {
  x: number;
  y: number;
  visible: boolean;
};
