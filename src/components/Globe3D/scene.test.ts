import { Line, LineDashedMaterial, Mesh, MeshBasicMaterial, type Object3D, type TorusGeometry } from 'three';

import type { EarthMark } from '@/components/EarthSection';
import { rhumbDestination } from '@/helpers/geo';

import { MARK_ALTITUDE, TRUTH_RING } from './constants';
import { scenePoint } from './helpers';
import { buildGlobeScene, disposeScene } from './scene';
import type { GlobeSceneInput } from './types';

const PARIS = { latitude: 48.8566, longitude: 2.3522 };
const ANSWER: EarthMark = { bearing: 261.4, distanceKm: 6079, color: '#EF4444' };

const COLORS = { globe: '#0B1220', land: '#93A0BC', guide: '#93A0BC', origin: '#F3F6FC', pole: '#F3F6FC' };

const build = (overrides: Partial<GlobeSceneInput> = {}) =>
  buildGlobeScene({
    origin: PARIS,
    marks: [],
    land: false,
    equator: false,
    greenwich: false,
    north: false,
    colors: COLORS,
    ...overrides,
  });

/** Every object of the scene, the scene itself left out. */
const objects = (root: Object3D): Object3D[] => {
  const found: Object3D[] = [];
  root.traverse((object) => {
    if (object !== root) found.push(object);
  });
  return found;
};

const meshes = (root: Object3D): Mesh[] => objects(root).filter((object): object is Mesh => object instanceof Mesh);
const lines = (root: Object3D): Line[] => objects(root).filter((object): object is Line => object instanceof Line);
/** How far a mesh sits from the middle of the globe (the ball has radius 1). */
const altitudeOf = (mesh: Mesh): number => mesh.position.length();

describe('buildGlobeScene', () => {
  it('is a bare ball, lit from every side, with the starting point on it', () => {
    const { scene, headlight } = build();
    // The ball, and the dot of the starting point.
    expect(meshes(scene)).toHaveLength(2);
    expect(lines(scene)).toHaveLength(0);
    // The lamp is handed back rather than added: the camera carries it (see `useGlobeRenderer`).
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

  it('draws the whole world as one object, above the ball', () => {
    const { scene } = build({ land: true });
    const world = lines(scene);
    // One object for every coast: what the graphics card gets is a single draw, however detailed the outline is.
    expect(world).toHaveLength(1);
    expect(world[0].type).toBe('LineSegments');
    const positions = world[0].geometry.getAttribute('position');
    // Pairs of ends, thousands of them, all sitting a hair above the ground.
    expect(positions.count).toBeGreaterThan(10000);
    expect(positions.count % 2).toBe(0);
    expect(Math.hypot(positions.getX(0), positions.getY(0), positions.getZ(0))).toBeGreaterThan(1);
  });

  it('works the world out once and keeps it for the next globe', () => {
    const first = lines(build({ land: true }).scene)[0].geometry.getAttribute('position');
    const second = lines(build({ land: true }).scene)[0].geometry.getAttribute('position');
    expect(second.count).toBe(first.count);
  });

  it('draws the equator closed and the Greenwich meridian open, both dashed', () => {
    const { scene } = build({ equator: true, greenwich: true });
    const guides = lines(scene);
    expect(guides.map((line) => line.type)).toEqual(['LineLoop', 'Line']);
    expect(guides.every((line) => line.material instanceof LineDashedMaterial)).toBe(true);
    // Dashes are measured along the line: without its own lengths it would come out solid.
    expect(guides[0].geometry.getAttribute('lineDistance')).toBeTruthy();
  });

  it('gives a guess its route and its end point, and the true answer a circled point with no route', () => {
    const guess = meshes(build({ marks: [ANSWER] }).scene);
    const truth = meshes(build({ marks: [{ ...ANSWER, isTruth: true }] }).scene);
    // The ball, the starting point, the end point, and (guess only) the route.
    expect(guess).toHaveLength(4);
    // The ball, the starting point, the end point and its ring.
    expect(truth).toHaveLength(4);
    expect(truth.some((mesh) => mesh.geometry.type === 'TubeGeometry')).toBe(false);
    expect(guess.some((mesh) => mesh.geometry.type === 'TubeGeometry')).toBe(true);
    expect(truth.some((mesh) => mesh.geometry.type === 'TorusGeometry')).toBe(true);
  });

  it('ends the route exactly where the answer lands, and lays the ring flat on the ball there', () => {
    const { scene } = build({ marks: [{ ...ANSWER, isTruth: true }] });
    const ring = meshes(scene).find((mesh) => mesh.geometry.type === 'TorusGeometry')!;
    const [x, y, z] = scenePoint(rhumbDestination(PARIS, ANSWER.bearing, ANSWER.distanceKm), MARK_ALTITUDE);
    expect(ring.position.x).toBeCloseTo(x, 6);
    expect(ring.position.y).toBeCloseTo(y, 6);
    expect(ring.position.z).toBeCloseTo(z, 6);
    // Turned to face the middle of the globe: the ring lies on the ground instead of standing up on its edge.
    expect((ring.geometry as TorusGeometry).parameters.radius).toBe(TRUTH_RING);
    expect(ring.getWorldDirection(ring.position.clone()).length()).toBeCloseTo(1, 6);
  });

  it('fades a faded answer and keeps a plain one opaque', () => {
    const faded = meshes(build({ marks: [{ ...ANSWER, opacity: 0.4 }] }).scene).find(
      (mesh) => mesh.geometry.type === 'TubeGeometry',
    )!;
    const plain = meshes(build({ marks: [ANSWER] }).scene).find((mesh) => mesh.geometry.type === 'TubeGeometry')!;
    expect(faded.material).toMatchObject({ opacity: 0.4, transparent: true });
    expect(plain.material).toMatchObject({ opacity: 1, transparent: false });
  });

  it('marks the north pole when asked', () => {
    const marked = meshes(build({ north: true }).scene);
    expect(marked).toHaveLength(3);
    expect(marked.some((mesh) => mesh.position.y > 1 && Math.abs(mesh.position.x) < 1e-9)).toBe(true);
  });
});

describe('disposeScene', () => {
  it('hands back every geometry and material, and empties the scene', () => {
    const { scene } = build({ land: true, equator: true, marks: [ANSWER] });
    const drawn = objects(scene).filter((object): object is Mesh => (object as Partial<Mesh>).geometry !== undefined);
    const geometries = drawn.map((object) => jest.spyOn(object.geometry, 'dispose'));
    const materials = drawn.map((object) => jest.spyOn(object.material as MeshBasicMaterial, 'dispose'));

    disposeScene(scene);
    expect(geometries.length).toBeGreaterThan(3);
    expect(geometries.every((spy) => spy.mock.calls.length > 0)).toBe(true);
    expect(materials.every((spy) => spy.mock.calls.length > 0)).toBe(true);
    // The light has neither, and must not stop the others from being handed back.
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
