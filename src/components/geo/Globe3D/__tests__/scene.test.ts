import {
  Line,
  LineDashedMaterial,
  Mesh,
  MeshBasicMaterial,
  type MeshLambertMaterial,
  type Object3D,
  type TorusGeometry,
  type TubeGeometry,
} from 'three';

import type { EarthMark } from '@/components/geo/EarthSection';
import { rhumbDestination } from '@/helpers/geo';

import { MARK_ALTITUDE, TRUTH_RING } from '../constants';
import { GLOBE_MASK } from '../globeMask';
import { scenePoint } from '../helpers';
import { buildGlobeScene, buildRoutes, disposeScene } from '../scene';
import type { GlobeSceneInput } from '../types';

const PARIS = { latitude: 48.8566, longitude: 2.3522 };
const ANSWER: EarthMark = { bearing: 261.4, distanceKm: 6079, color: '#EF4444' };

const COLORS = {
  globe: '#0B1220',
  land: '#93A0BC',
  fill: '#4ADE80',
  fillOpacity: 0.5,
  flat: false,
  guide: '#93A0BC',
  origin: '#F3F6FC',
  pole: '#F3F6FC',
};

const build = (overrides: Partial<GlobeSceneInput> = {}) =>
  buildGlobeScene({
    origin: PARIS,
    marks: [],
    colors: COLORS,
    ...overrides,
  });

/** Chaque objet de la scene, la scene elle-meme exclue. */
const objects = (root: Object3D): Object3D[] => {
  const found: Object3D[] = [];
  root.traverse((object) => {
    if (object !== root) found.push(object);
  });
  return found;
};

const meshes = (root: Object3D): Mesh[] => objects(root).filter((object): object is Mesh => object instanceof Mesh);
const lines = (root: Object3D): Line[] => objects(root).filter((object): object is Line => object instanceof Line);
/** Distance d'un maillage au centre du globe (la boule a un rayon de 1). */
const altitudeOf = (mesh: Mesh): number => mesh.position.length();

describe('buildGlobeScene', () => {
  it('is a ball with the world on it, lit from every side, with the starting point and the pole', () => {
    const { scene, headlight } = build();
    // La boule, les terres peintes, la pastille du point de depart et celle du pole.
    expect(meshes(scene)).toHaveLength(4);
    // Les cotes et l'equateur.
    expect(lines(scene)).toHaveLength(2);
    // La lampe est rendue a part plutot qu'ajoutee : la camera la porte (voir `useGlobeRenderer`).
    expect(headlight.parent).toBeNull();
    expect(scene.children).toContain(scene.children.find((child) => child.type === 'AmbientLight'));
  });

  it('puts the starting point where it belongs on the ball, just above the ground', () => {
    const { scene } = build();
    const dot = meshes(scene).find((mesh) => altitudeOf(mesh) > 0)!;
    const [x, y, z] = scenePoint(PARIS, MARK_ALTITUDE);
    expect(dot.position.x).toBeCloseTo(x, 6);
    expect(dot.position.y).toBeCloseTo(y, 6);
    expect(dot.position.z).toBeCloseTo(z, 6);
  });

  it('draws the sea and the continents with no light on them when flat (by day), so they keep exactly their colours', () => {
    const { scene } = build({ colors: { ...COLORS, flat: true, fillOpacity: 1 } });
    const all = meshes(scene);
    const sea = all.find((mesh) => mesh.geometry.type === 'SphereGeometry' && (mesh.material as MeshBasicMaterial).color.getHexString() === '0b1220')!;
    expect(sea.material).toBeInstanceOf(MeshBasicMaterial);
    const painted = all.find((mesh) => (mesh.material as MeshBasicMaterial).map != null)!;
    expect(painted.material).toBeInstanceOf(MeshBasicMaterial);
  });

  it('paints the continents in, from a picture of the world that falls on the world', () => {
    const { scene } = build();
    const painted = meshes(scene).find((mesh) => (mesh.material as MeshLambertMaterial).map !== null && (mesh.material as MeshLambertMaterial).map !== undefined)!;
    const picture = (painted.material as MeshLambertMaterial).map!.image as {
      width: number;
      height: number;
      data: Uint8Array;
    };
    expect(picture.width).toBe(GLOBE_MASK.width);
    expect(picture.height).toBe(GLOBE_MASK.height);
    // Transparent sur la mer, pour que la couleur de la boule y apparaisse.
    expect(painted.material).toMatchObject({ transparent: true, depthWrite: false });

    // Terre opaque, mer non : le milieu de l'Afrique contre le milieu du Pacifique, lus dans l'image comme la lit la
    // coque (u depuis la ligne de date vers l'est, v depuis le pole sud).
    const alphaAt = (latitude: number, longitude: number) => {
      const column = Math.floor(((longitude + 180) / 360) * GLOBE_MASK.width);
      const row = Math.floor(((latitude + 90) / 180) * GLOBE_MASK.height);
      return picture.data[(row * GLOBE_MASK.width + column) * 4 + 3];
    };
    expect(alphaAt(5, 20)).toBe(255);
    expect(alphaAt(48.8, 2.3)).toBe(255);
    expect(alphaAt(0, -140)).toBe(0);
    expect(alphaAt(-30, -15)).toBe(0);
  });

  it('puts every corner of the painted shell where the map says, all the way round', () => {
    const { scene } = build();
    const painted = meshes(scene).find((mesh) => (mesh.material as MeshLambertMaterial).map != null)!;
    const positions = painted.geometry.getAttribute('position');
    const uvs = painted.geometry.getAttribute('uv');
    expect(uvs.count).toBe(positions.count);
    for (let corner = 0; corner < positions.count; corner += 97) {
      const latitude = uvs.getY(corner) * 180 - 90;
      const longitude = uvs.getX(corner) * 360 - 180;
      const [x, y, z] = scenePoint({ latitude, longitude }, 1);
      const length = Math.hypot(positions.getX(corner), positions.getY(corner), positions.getZ(corner));
      expect(positions.getX(corner) / length).toBeCloseTo(x, 6);
      expect(positions.getY(corner) / length).toBeCloseTo(y, 6);
      expect(positions.getZ(corner) / length).toBeCloseTo(z, 6);
    }
  });

  it('keeps the painted shell clear of the sea, bellies of its flats included', () => {
    const { scene } = build();
    const painted = meshes(scene).find((mesh) => (mesh.material as MeshLambertMaterial).map != null)!;
    const positions = painted.geometry.getAttribute('position');
    const corners = painted.geometry.getIndex()!;
    // Une sphere a facettes passe sous son rayon au milieu de chaque facette. La coque peinte doit rester au-dessus,
    // sinon la mer cache les continents (c'est deja arrive).
    let lowest = Infinity;
    for (let corner = 0; corner < corners.count; corner += 3) {
      const triangle = [0, 1, 2].map((offset) => corners.getX(corner + offset));
      const middle = triangle.reduce(
        (total, index) => ({
          x: total.x + positions.getX(index) / 3,
          y: total.y + positions.getY(index) / 3,
          z: total.z + positions.getZ(index) / 3,
        }),
        { x: 0, y: 0, z: 0 },
      );
      lowest = Math.min(lowest, Math.hypot(middle.x, middle.y, middle.z));
    }
    expect(lowest).toBeGreaterThan(1);
  });

  it('draws the whole world as one object, above the ball', () => {
    const { scene } = build();
    const world = lines(scene).filter((line) => line.type === 'LineSegments');
    // Un seul objet pour toutes les cotes : un seul dessin pour la carte graphique, quel que soit le detail du contour.
    expect(world).toHaveLength(1);
    expect(world[0].type).toBe('LineSegments');
    const positions = world[0].geometry.getAttribute('position');
    // Des paires d'extremites, des milliers, toutes un poil au-dessus du sol.
    expect(positions.count).toBeGreaterThan(10000);
    expect(positions.count % 2).toBe(0);
    expect(Math.hypot(positions.getX(0), positions.getY(0), positions.getZ(0))).toBeGreaterThan(1);
  });

  it('works the world out once and keeps it for the next globe', () => {
    const first = lines(build().scene)[0].geometry.getAttribute('position');
    const second = lines(build().scene)[0].geometry.getAttribute('position');
    expect(second.count).toBe(first.count);
  });

  it('draws the equator closed and dashed', () => {
    const { scene } = build();
    const guides = lines(scene).filter((line) => line.type !== 'LineSegments');
    expect(guides.map((line) => line.type)).toEqual(['LineLoop']);
    expect(guides.every((line) => line.material instanceof LineDashedMaterial)).toBe(true);
    // Les pointilles se mesurent le long de la ligne : sans ses longueurs propres, elle serait pleine.
    expect(guides[0].geometry.getAttribute('lineDistance')).toBeTruthy();
  });

  it('gives a guess its end point and the true answer a circled one, the routes being built apart', () => {
    const guess = meshes(build({ marks: [ANSWER] }).scene);
    const truth = meshes(build({ marks: [{ ...ANSWER, isTruth: true }] }).scene);
    // La boule, les terres, le pole, le point de depart et le point d'arrivee.
    expect(guess).toHaveLength(5);
    // Pareil, plus l'anneau autour de la vraie reponse.
    expect(truth).toHaveLength(6);
    expect(truth.some((mesh) => mesh.geometry.type === 'TorusGeometry')).toBe(true);
    // Aucune route dans la scene : le zoom en gere l'epaisseur (voir `buildRoutes`).
    expect([...guess, ...truth].some((mesh) => mesh.geometry.type === 'TubeGeometry')).toBe(false);
  });

  it('ends the route exactly where the answer lands, and lays the ring flat on the ball there', () => {
    const { scene } = build({ marks: [{ ...ANSWER, isTruth: true }] });
    const ring = meshes(scene).find((mesh) => mesh.geometry.type === 'TorusGeometry')!;
    const [x, y, z] = scenePoint(rhumbDestination(PARIS, ANSWER.bearing, ANSWER.distanceKm), MARK_ALTITUDE);
    expect(ring.position.x).toBeCloseTo(x, 6);
    expect(ring.position.y).toBeCloseTo(y, 6);
    expect(ring.position.z).toBeCloseTo(z, 6);
    // Tourne vers le milieu du globe : l'anneau est couche sur le sol au lieu d'etre debout sur la tranche.
    expect((ring.geometry as TorusGeometry).parameters.radius).toBe(TRUTH_RING);
    expect(ring.getWorldDirection(ring.position.clone()).length()).toBeCloseTo(1, 6);
  });



  it('hands back the dots and the rings as what must keep its size on screen, and nothing else', () => {
    const { scene, screenSized } = build({ marks: [{ ...ANSWER, isTruth: true }] });
    // Le point de depart, la pastille de la reponse, son anneau et le pole — pas la boule, les terres peintes ni une route.
    expect(screenSized).toHaveLength(4);
    expect(screenSized.every((mark) => meshes(scene).includes(mark))).toBe(true);
    expect(screenSized.some((mark) => mark.geometry.type === 'TubeGeometry')).toBe(false);
    expect(screenSized.some((mark) => mark.geometry.type === 'SphereGeometry' && mark.position.length() === 0)).toBe(
      false,
    );
  });

  it('marks the north pole', () => {
    const marked = meshes(build().scene);
    expect(marked).toHaveLength(4);
    expect(marked.some((mesh) => mesh.position.y > 1 && Math.abs(mesh.position.x) < 1e-9)).toBe(true);
  });
});

describe('buildRoutes', () => {
  it('gives every answer a route, the true one included: that is the way one would really have gone', () => {
    const routes = buildRoutes(PARIS, [ANSWER, { ...ANSWER, isTruth: true, color: '#FACC15' }], 0.005);
    expect(routes.children).toHaveLength(2);
    expect(meshes(routes).every((mesh) => mesh.geometry.type === 'TubeGeometry')).toBe(true);
    expect(meshes(routes).map((mesh) => (mesh.material as MeshBasicMaterial).color.getHexString())).toEqual([
      'ef4444',
      'facc15',
    ]);
  });

  it('is as thick as it is told, so the zoom can keep it the same width on screen', () => {
    const thin = buildRoutes(PARIS, [ANSWER], 0.001);
    const thick = buildRoutes(PARIS, [ANSWER], 0.01);
    const radiusOf = (group: Object3D) =>
      (meshes(group)[0].geometry as TubeGeometry).parameters.radius;
    expect(radiusOf(thin)).toBe(0.001);
    expect(radiusOf(thick)).toBe(0.01);
  });

  it('fades a faded answer and keeps a plain one opaque', () => {
    const faded = meshes(buildRoutes(PARIS, [{ ...ANSWER, opacity: 0.4 }], 0.005))[0];
    const plain = meshes(buildRoutes(PARIS, [ANSWER], 0.005))[0];
    expect(faded.material).toMatchObject({ opacity: 0.4, transparent: true });
    expect(plain.material).toMatchObject({ opacity: 1, transparent: false });
  });

  it('hands its own geometries back like a scene does', () => {
    const routes = buildRoutes(PARIS, [ANSWER], 0.005);
    const disposed = jest.spyOn(meshes(routes)[0].geometry, 'dispose');
    disposeScene(routes);
    expect(disposed).toHaveBeenCalled();
    expect(routes.children).toHaveLength(0);
  });
});

describe('disposeScene', () => {
  it('hands back every geometry and material, and empties the scene', () => {
    const { scene } = build({ marks: [ANSWER] });
    const drawn = objects(scene).filter((object): object is Mesh => (object as Partial<Mesh>).geometry !== undefined);
    const geometries = drawn.map((object) => jest.spyOn(object.geometry, 'dispose'));
    const materials = drawn.map((object) => jest.spyOn(object.material as MeshBasicMaterial, 'dispose'));

    disposeScene(scene);
    expect(geometries.length).toBeGreaterThan(3);
    expect(geometries.every((spy) => spy.mock.calls.length > 0)).toBe(true);
    expect(materials.every((spy) => spy.mock.calls.length > 0)).toBe(true);
    // La lumiere n'a ni geometrie ni materiau, et ne doit pas empecher de rendre les autres.
    expect(scene.children).toHaveLength(0);
  });

  it('hands back each material of an object that has several', () => {
    const { scene } = build();
    const first = new MeshBasicMaterial();
    const second = new MeshBasicMaterial();
    meshes(scene)[0].material = [first, second];
    const spies = [jest.spyOn(first, 'dispose'), jest.spyOn(second, 'dispose')];

    disposeScene(scene);
    expect(spies.every((spy) => spy.mock.calls.length > 0)).toBe(true);
  });
});
