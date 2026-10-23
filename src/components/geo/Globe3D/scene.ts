import {
  AmbientLight,
  BufferGeometry,
  CatmullRomCurve3,
  DataTexture,
  DirectionalLight,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineDashedMaterial,
  LineLoop,
  LineSegments,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  RepeatWrapping,
  RGBAFormat,
  Scene,
  SphereGeometry,
  type Object3D,
  type Texture,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from 'three';

import { rhumbDestination } from '@/helpers/geo';
import type { Coordinates } from '@/types';

import {
  AMBIENT_LIGHT,
  DOT_SEGMENTS,
  LAND_FILL_ALTITUDE,
  LAND_FILL_SEGMENTS,
  GUIDE_ALTITUDE,
  GUIDE_DASH,
  GUIDE_GAP,
  GUIDE_STEP,
  HEADLIGHT,
  HEADLIGHT_POSITION,
  LAND_ALTITUDE,
  MARK_ALTITUDE,
  MARK_DOT,
  ORIGIN_DOT,
  POLE_DOT,
  ROUTE_ALTITUDE,
  ROUTE_SIDES,
  ROUTE_STEPS,
  SPHERE_SEGMENTS,
  TRUTH_RING,
  TRUTH_RING_THICKNESS,
} from './constants';
import { GLOBE_LAND_PATH } from './globeLand';
import { GLOBE_MASK } from './globeMask';
import { equatorPoints, parseRings, polylinePositions, routePoints, scenePoint } from './helpers';
import type { EarthMark } from '@/components/geo/EarthSection';

import type { GlobeScene, GlobeSceneInput } from './types';

/**
 * Les cotes du monde en une liste plate d'extremites de segments, calculee au premier globe dessine avec les terres
 * (lire 800 cotes de l'asset n'est pas du travail d'import, pour une boule qui ne les montrera peut-etre jamais).
 * Le contour ne change jamais, seule sa couleur : gardee pour le globe suivant.
 */
let landSegments: number[] | null = null;

const worldSegments = (): number[] => {
  if (landSegments !== null) return landSegments;
  const built: number[] = [];
  parseRings(GLOBE_LAND_PATH).forEach((coastline) => {
    coastline.forEach((point, index) => {
      // Anneau ferme : le dernier point revient au premier.
      built.push(
        ...scenePoint(point, LAND_ALTITUDE),
        ...scenePoint(coastline[(index + 1) % coastline.length], LAND_ALTITUDE),
      );
    });
  });
  landSegments = built;
  return built;
};

/**
 * Le masque terre/mer en image dont est peinte la coque : un pixel par pixel de `GLOBE_MASK`, blanc opaque sur la
 * terre, rien sur la mer. Le masque est encode en RLE (longueurs de mer et de terre, mer d'abord), decode en une
 * passe ; garde pour le globe suivant, comme les cotes.
 */
let landPicture: Texture | null = null;

const landMask = (): Texture => {
  if (landPicture !== null) return landPicture;
  const { width, height, runs } = GLOBE_MASK;
  const pixels = new Uint8Array(width * height * 4);
  let pixel = 0;
  let land = false;
  for (const run of runs.split('.')) {
    const length = parseInt(run, 36);
    if (land) pixels.fill(255, pixel * 4, (pixel + length) * 4);
    pixel += length;
    land = !land;
  }
  const texture = new DataTexture(pixels, width, height, RGBAFormat);
  // La carte se rejoint a la ligne de date : sans ca, la derniere colonne serait etalee contre la premiere.
  texture.wrapS = RepeatWrapping;
  texture.needsUpdate = true;
  landPicture = texture;
  return texture;
};

/**
 * La coque ou sont peints les continents : une boule a part, un poil au-dessus de la mer, portant le masque en
 * image. Grille a part aussi, pour que chaque sommet connaisse sa place sur la carte (`uv`) — ceux de la boule sont
 * ranges par three.js dans un autre ordre, et il faut etre sur qu'une cote tombe sur sa cote.
 */
const landFill = (color: string, opacity: number, flat: boolean): Mesh => {
  const columns = LAND_FILL_SEGMENTS;
  const rows = LAND_FILL_SEGMENTS / 2;
  const positions: number[] = [];
  const uvs: number[] = [];
  const corners: number[] = [];
  for (let row = 0; row <= rows; row += 1) {
    const latitude = -90 + (row / rows) * 180;
    for (let column = 0; column <= columns; column += 1) {
      const longitude = -180 + (column / columns) * 360;
      positions.push(...scenePoint({ latitude, longitude }, LAND_FILL_ALTITUDE));
      uvs.push((longitude + 180) / 360, (latitude + 90) / 180);
    }
  }
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const corner = row * (columns + 1) + column;
      const above = corner + columns + 1;
      corners.push(corner, corner + 1, above, above, corner + 1, above + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(corners);
  geometry.computeVertexNormals();
  const paint = {
    color,
    map: landMask(),
    transparent: true,
    opacity,
    // La mer dessous est opaque de toute facon, et la cote au-dessus ne doit pas etre decoupee par une coque transparente.
    depthWrite: false,
  };
  return new Mesh(geometry, flat ? new MeshBasicMaterial(paint) : new MeshLambertMaterial(paint));
};

/** Une ligne fermee a travers des lieux, a `altitude` au-dessus de la boule. */
const polyline = (points: Coordinates[], altitude: number, material: Material): LineLoop => {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(polylinePositions(points, altitude), 3));
  const line = new LineLoop(geometry, material);
  // Les pointilles se mesurent le long de la ligne : elle doit connaitre sa longueur.
  line.computeLineDistances();
  return line;
};

/** Une pastille posee sur la boule en `point`. */
const dot = (point: Coordinates, radius: number, altitude: number, color: string): Mesh => {
  const mesh = new Mesh(new SphereGeometry(radius, DOT_SEGMENTS, DOT_SEGMENTS / 2), new MeshBasicMaterial({ color }));
  mesh.position.set(...scenePoint(point, altitude));
  return mesh;
};

/** L'anneau autour de la vraie reponse : un cercle plat couche sur la boule, face au spectateur comme une cible. */
const ring = (point: Coordinates, color: string): Mesh => {
  const mesh = new Mesh(
    new TorusGeometry(TRUTH_RING, TRUTH_RING_THICKNESS, 8, DOT_SEGMENTS * 2),
    new MeshBasicMaterial({ color }),
  );
  mesh.position.set(...scenePoint(point, MARK_ALTITUDE));
  // Un tore est dans son plan x/y, autour de son axe z : pointer cet axe vers le milieu du globe couche l'anneau sur le sol.
  mesh.lookAt(0, 0, 0);
  return mesh;
};

/** La route d'une reponse, en tube assez epais pour se voir (une ligne ferait un pixel sur la plupart des appareils). */
const routeTube = (
  origin: Coordinates,
  bearing: number,
  distanceKm: number,
  color: string,
  opacity: number,
  thickness: number,
): Mesh => {
  const curve = new CatmullRomCurve3(
    routePoints(origin, bearing, distanceKm, ROUTE_STEPS).map(
      (point) => new Vector3(...scenePoint(point, ROUTE_ALTITUDE)),
    ),
  );
  return new Mesh(
    new TubeGeometry(curve, ROUTE_STEPS, thickness, ROUTE_SIDES, false),
    new MeshBasicMaterial({ color, opacity, transparent: opacity < 1 }),
  );
};

/**
 * Les routes des reponses, a part du reste du globe : l'epaisseur d'un tube ne se change pas par mise a l'echelle
 * (il raccourcirait aussi), donc on les reconstruit quand `thickness` change — ce que fait le zoom, pour garder la
 * route a la meme largeur a l'ecran que les pastilles. Le reste (boule, monde, pastilles) ne bouge pas.
 *
 * La vraie reponse a aussi la sienne — le chemin qu'il fallait vraiment prendre —, par-dessus son point entoure.
 */
export const buildRoutes = (origin: Coordinates, marks: EarthMark[], thickness: number): Group => {
  const routes = new Group();
  marks.forEach((mark) =>
    routes.add(routeTube(origin, mark.bearing, mark.distanceKm, mark.color, mark.opacity ?? 1, thickness)),
  );
  return routes;
};

/**
 * Tout le globe en objets three.js : la boule, contour et couleur du monde, les reperes, le point de depart et la fin
 * de chaque reponse (la vraie entouree). Les routes sont construites a part (`buildRoutes`) car le zoom change leur
 * epaisseur. Rien ici ne connait l'ecran : devant/derriere la boule, c'est l'affaire du depth buffer.
 *
 * La lampe sort avec la scene (`headlight`) au lieu d'y etre ajoutee : l'appelant l'accroche a la camera, pour que
 * le meme cote prenne toujours la lumiere. Les pastilles (`screenSized`) aussi : zoomees, elles sont remises a leur
 * taille d'ecran non zoomee, sinon elles cacheraient la carte qu'on zoome pour lire (`markScale` dans
 * `useGlobeRenderer`).
 */
export const buildGlobeScene = ({ origin, marks, colors }: GlobeSceneInput): GlobeScene => {
  const scene = new Scene();

  scene.add(
    new Mesh(
      new SphereGeometry(1, SPHERE_SEGMENTS, SPHERE_SEGMENTS / 2),
      colors.flat ? new MeshBasicMaterial({ color: colors.globe }) : new MeshLambertMaterial({ color: colors.globe }),
    ),
  );
  scene.add(new AmbientLight(0xffffff, AMBIENT_LIGHT));
  const headlight = new DirectionalLight(0xffffff, HEADLIGHT);
  headlight.position.set(...HEADLIGHT_POSITION);

  // Les continents peints, puis leur cote par-dessus : la couleur vient d'une image du monde, le trait net du contour.
  scene.add(landFill(colors.fill, colors.fillOpacity, colors.flat));
  // Toutes les cotes en un objet : 800 cotes distinctes feraient 800 dessins pour la carte graphique, alors que le
  // detail de l'asset n'y change rien.
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(worldSegments(), 3));
  scene.add(new LineSegments(geometry, new LineBasicMaterial({ color: colors.land })));

  const guide = new LineDashedMaterial({ color: colors.guide, dashSize: GUIDE_DASH, gapSize: GUIDE_GAP });
  scene.add(polyline(equatorPoints(GUIDE_STEP), GUIDE_ALTITUDE, guide));

  // Ce que le zoom ne doit pas gonfler : les pastilles et l'anneau, pas la boule ni les routes.
  const screenSized: Mesh[] = [];
  const addMark = (mesh: Mesh) => {
    screenSized.push(mesh);
    scene.add(mesh);
  };

  marks.forEach((mark) => {
    const end = rhumbDestination(origin, mark.bearing, mark.distanceKm);
    addMark(dot(end, MARK_DOT, MARK_ALTITUDE, mark.color));
    if (mark.isTruth === true) addMark(ring(end, mark.color));
  });

  addMark(dot(origin, ORIGIN_DOT, MARK_ALTITUDE, colors.origin));
  addMark(dot({ latitude: 90, longitude: 0 }, POLE_DOT, MARK_ALTITUDE, colors.pole));

  return { scene, headlight, screenSized };
};

/** Rend a la carte graphique les geometries et materiaux d'une scene — ou d'une partie, comme un groupe de routes :
 * on en construit une nouvelle a chaque changement (reponse, zoom, theme) et l'ancienne
 * resterait sinon en memoire. */
export const disposeScene = (scene: Object3D): void => {
  scene.traverse((object) => {
    const drawn = object as Partial<Mesh>;
    drawn.geometry?.dispose();
    const material = drawn.material;
    if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
    else material?.dispose();
  });
  scene.clear();
};
