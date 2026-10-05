import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// jsdom has no WebGL: three.js is replaced by small stand-ins that remember what they were given. What is under test is
// what the scene asks of three.js (which objects, which settings, when they are handed back), not the drawing itself.
const mocks = vi.hoisted(() => {
  class FakeVector3 {
    constructor(
      public x = 0,
      public y = 0,
      public z = 0,
    ) {}
    set(x: number, y: number, z: number) {
      this.x = x;
      this.y = y;
      this.z = z;
      return this;
    }
    project() {
      return mocks.project(this);
    }
    unproject() {
      return mocks.unproject(this);
    }
  }
  class FakeObject {
    visible = true;
    constructor(
      public geometry: unknown,
      public material: unknown,
    ) {}
  }
  class FakeMaterial {
    dispose = vi.fn();
    constructor(public options: Record<string, unknown> = {}) {}
  }
  class FakeGeometry {
    attributes: Record<string, unknown> = {};
    dispose = vi.fn();
    setAttribute(name: string, value: unknown) {
      this.attributes[name] = value;
    }
  }
  const mocks = {
    FakeVector3,
    FakeObject,
    FakeMaterial,
    FakeGeometry,
    project: (vector: FakeVector3) => vector,
    unproject: (vector: FakeVector3) => vector,
    scenes: [] as { add: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> }[],
    renderers: [] as Record<string, ReturnType<typeof vi.fn>>[],
    cameras: [] as { position: FakeVector3; aspect: number; near: number; updateProjectionMatrix: ReturnType<typeof vi.fn> }[],
    controls: [] as Record<string, unknown>[],
    textures: [] as { dispose: ReturnType<typeof vi.fn> }[],
  };
  return mocks;
});

vi.mock('three', () => ({
  Scene: class {
    add = vi.fn();
    remove = vi.fn();
    constructor() {
      mocks.scenes.push(this);
    }
  },
  PerspectiveCamera: class {
    position = new mocks.FakeVector3();
    aspect = 1;
    near = 0;
    updateProjectionMatrix = vi.fn();
    constructor(_fov: number, _aspect: number, near: number) {
      this.near = near;
      mocks.cameras.push(this);
    }
  },
  WebGLRenderer: class {
    setPixelRatio = vi.fn();
    setClearColor = vi.fn();
    setSize = vi.fn();
    render = vi.fn();
    dispose = vi.fn();
    constructor(public options: unknown) {
      mocks.renderers.push(this as never);
    }
  },
  Vector3: mocks.FakeVector3,
  BufferGeometry: mocks.FakeGeometry,
  SphereGeometry: mocks.FakeGeometry,
  Float32BufferAttribute: class {
    constructor(
      public array: readonly number[],
      public itemSize: number,
    ) {}
  },
  CanvasTexture: class {
    dispose = vi.fn();
    constructor(public picture: unknown) {
      mocks.textures.push(this as never);
    }
  },
  LineSegments: mocks.FakeObject,
  Points: mocks.FakeObject,
  Mesh: mocks.FakeObject,
  LineBasicMaterial: mocks.FakeMaterial,
  PointsMaterial: mocks.FakeMaterial,
  MeshBasicMaterial: mocks.FakeMaterial,
}));
vi.mock('three/examples/jsm/controls/OrbitControls.js', () => ({
  OrbitControls: class {
    update = vi.fn();
    dispose = vi.fn();
    enableDamping = false;
    enablePan = true;
    minDistance = 0;
    maxDistance = 0;
    rotateSpeed = 1;
    constructor() {
      mocks.controls.push(this as never);
    }
  },
}));

import { CAMERA_DISTANCE, CAMERA_NEAR, FLY_DISTANCE, FLY_MS, HOME_VIEW, MAX_DISTANCE, MIN_DISTANCE } from './constants';
import { createGlobeScene, type GlobeScene } from './GlobeScene';
import { toVector } from './helpers';
import type { PlaceBuffers } from './types';

/** The dots of a few places: `round`, `star` and `square` positions, as `setPlaces` takes them. */
const buffersOf = (round: number[] = [], star: number[] = [], square: number[] = []): PlaceBuffers => ({
  positions: [...round, ...star, ...square],
  kinds: [
    ...Array.from({ length: round.length / 3 }, () => 'round' as const),
    ...Array.from({ length: star.length / 3 }, () => 'star' as const),
    ...Array.from({ length: square.length / 3 }, () => 'square' as const),
  ],
  shapes: {
    round: { positions: round, colors: round.map(() => 1) },
    star: { positions: star, colors: star.map(() => 1) },
    square: { positions: square, colors: square.map(() => 1) },
  },
});

type Frame = (time: number) => void;
let frames: Frame[] = [];
let canvas: HTMLCanvasElement;
let scene: GlobeScene;

/** Runs the animation frame that is waiting, at `time` ms. */
const tick = (time: number) => {
  const next = frames.shift()!;
  next(time);
};

const sceneOf = () => mocks.scenes[0];
const added = () => sceneOf().add.mock.calls.flat() as InstanceType<typeof mocks.FakeObject>[];
const cameraPosition = () => {
  const { x, y, z } = mocks.cameras[0].position;
  return [x, y, z];
};

beforeEach(() => {
  frames = [];
  mocks.scenes.length = 0;
  mocks.renderers.length = 0;
  mocks.cameras.length = 0;
  mocks.controls.length = 0;
  mocks.textures.length = 0;
  mocks.project = (vector) => vector;
  mocks.unproject = (vector) => vector;
  vi.stubGlobal('requestAnimationFrame', (callback: Frame) => frames.push(callback));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  // jsdom has no 2d context: a stand-in that takes any drawing call.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    new Proxy({}, { get: () => () => undefined, set: () => true }) as never,
  );
  canvas = document.createElement('canvas');
  canvas.getBoundingClientRect = () => ({ left: 10, top: 20, width: 200, height: 100 }) as DOMRect;
  scene = createGlobeScene(canvas);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('createGlobeScene', () => {
  it('draws on the canvas, with controls that rotate and zoom within limits but never pan', () => {
    expect(mocks.renderers[0].setClearColor).toHaveBeenCalled();
    expect(mocks.controls[0]).toMatchObject({
      enableDamping: false,
      enablePan: false,
      minDistance: MIN_DISTANCE,
      maxDistance: MAX_DISTANCE,
    });
  });

  it('keeps the near plane closer than the ground, and slows the drag down as the camera nears it', () => {
    expect(mocks.cameras[0].near).toBe(CAMERA_NEAR);
    tick(0);
    const far = mocks.controls[0].rotateSpeed as number;
    mocks.cameras[0].position.set(0, 0, 1.1);
    tick(16);
    expect(mocks.controls[0].rotateSpeed as number).toBeLessThan(far);
  });

  it('starts the camera on the home view, at its usual distance', () => {
    const [x, y, z] = toVector(HOME_VIEW.lon, HOME_VIEW.lat, CAMERA_DISTANCE);
    expect(cameraPosition()).toEqual([x, y, z]);
  });

  it('puts only the sea, the land outline and the stars in the scene', () => {
    expect(added()).toHaveLength(3);
  });

  it('draws a frame at every animation frame, and asks for the next one', () => {
    tick(0);
    expect(mocks.controls[0].update).toHaveBeenCalledTimes(1);
    expect(mocks.renderers[0].render).toHaveBeenCalledTimes(1);
    expect(frames).toHaveLength(1);
  });
});

describe('places', () => {
  it('draws the places as one object of dots per shape, with a colour each', () => {
    scene.setPlaces(buffersOf([0, 0, 1], [1, 0, 0], [0, 1, 0]));
    const [round, star, square] = added().slice(-3);
    for (const dots of [round, star, square]) {
      expect((dots.material as InstanceType<typeof mocks.FakeMaterial>).options).toMatchObject({ vertexColors: true });
      expect((dots.geometry as InstanceType<typeof mocks.FakeGeometry>).attributes).toHaveProperty('color');
    }
    // The cities are round, the capitals star-shaped (a bit bigger), the rest square: only the first two use a picture.
    const options = [round, star, square].map((dots) => (dots.material as InstanceType<typeof mocks.FakeMaterial>).options);
    expect(options.map((entry) => entry.size)).toEqual([7, 13, 6]);
    expect(options.map((entry) => 'map' in entry)).toEqual([true, true, false]);
    expect(options[0]).toMatchObject({ transparent: true, alphaTest: 0.5, sizeAttenuation: false });
    expect(mocks.textures).toHaveLength(2);
  });

  it('draws the shapes only once, and hands the pictures back at the end', () => {
    scene.setPlaces(buffersOf([0, 0, 1]));
    scene.setPlaces(buffersOf([0, 0, 1]));
    expect(mocks.textures).toHaveLength(2);
    scene.dispose();
    expect(mocks.textures.every((texture) => texture.dispose.mock.calls.length === 1)).toBe(true);
  });

  it('falls back to plain dots when there is no canvas to draw the shapes on', () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);
    scene.setPlaces(buffersOf([0, 0, 1], [1, 0, 0]));
    const dots = added().slice(-3);
    expect(dots.every((entry) => !('map' in (entry.material as InstanceType<typeof mocks.FakeMaterial>).options))).toBe(true);
    expect(mocks.textures).toHaveLength(0);
  });
});

describe('marks', () => {
  it('draws the selected and the hovered thing, an outline and/or a dot each', () => {
    scene.setMarks({ segments: [0, 0, 1, 0, 1, 0], point: null }, { segments: [], point: [0, 0, 1] });
    expect(added().slice(3)).toHaveLength(2);
  });

  it('hands the previous marks back when they change or go away', () => {
    scene.setMarks({ segments: [0, 0, 1, 0, 1, 0], point: [0, 0, 1] }, null);
    const [line, point] = added().slice(3);
    scene.setMarks(null, null);
    expect(sceneOf().remove).toHaveBeenCalledWith(line);
    expect(sceneOf().remove).toHaveBeenCalledWith(point);
  });
});

describe('level of detail', () => {
  const draw = () => {
    scene.setPlaces(buffersOf([0, 0, 1], [1, 0, 0], [0, 1, 0]));
    return added().slice(-3);
  };
  const shown = (objects: { visible: boolean }[]) => objects.map((object) => object.visible);

  it('draws the places only once the camera is close enough, the capitals from further away', () => {
    const dots = draw();
    // The camera opens at ~3.2: only the capitals are there.
    expect(shown(dots)).toEqual([false, true, false]);
    mocks.cameras[0].position.set(0, 0, 2.2);
    tick(0);
    expect(shown(dots)).toEqual([true, true, true]);
    mocks.cameras[0].position.set(0, 0, 5);
    tick(16);
    expect(shown(dots)).toEqual([false, false, false]);
  });

  it('does not pick a place whose dots are not drawn at this distance', () => {
    scene.setPlaces(buffersOf([0, 0, 1.006]));
    mocks.cameras[0].position.set(0, 0, 3);
    mocks.project = () => new mocks.FakeVector3(0, 0, 0);
    mocks.unproject = () => new mocks.FakeVector3(0, 0, 0);
    expect(scene.pick(110, 70).place).toBeNull();
    mocks.cameras[0].position.set(0, 0, 2.2);
    expect(scene.pick(110, 70).place).toBe(0);
  });
});

describe('names', () => {
  const listener = vi.fn();
  beforeEach(() => {
    listener.mockClear();
    scene.resize(200, 100);
    scene.setPlaces(buffersOf([0, 0, 1.006]));
    scene.setLabels(['Paris'], listener);
    mocks.project = () => new mocks.FakeVector3(0, 0, 0);
  });

  it('are given once the camera is close enough, once while nothing moves, and withdrawn when it moves away', () => {
    mocks.cameras[0].position.set(0, 0, 1.8);
    tick(0);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith([{ index: 0, x: 100, y: 50 }]);
    tick(16);
    expect(listener).toHaveBeenCalledTimes(1);
    mocks.cameras[0].position.set(0, 0, 3);
    tick(32);
    expect(listener).toHaveBeenLastCalledWith([]);
  });

  it('are allowed in greater number the closer the camera is', () => {
    const many = Array.from({ length: 200 }, (_, index) => index);
    scene.setPlaces(buffersOf(many.flatMap((index) => [0, 0, 1.006 + index * 0.00001])));
    scene.setLabels(
      many.map(() => 'X'),
      listener,
    );
    scene.resize(2000, 1000);
    let slot = 0;
    mocks.project = () => {
      const spot = slot++ % 200;
      return new mocks.FakeVector3(((spot * 37) % 97) / 97 * 2 - 1, ((spot * 53) % 89) / 89 * 2 - 1, 0);
    };
    mocks.cameras[0].position.set(0, 0, 2.3);
    tick(0);
    const far = listener.mock.calls.at(-1)![0].length;
    mocks.cameras[0].position.set(0, 0, 1.06);
    tick(16);
    const close = listener.mock.calls.at(-1)![0].length;
    expect(close).toBeGreaterThan(far);
  });

  it('cost nothing when nobody listens', () => {
    scene.setLabels([], undefined as never);
    mocks.cameras[0].position.set(0, 0, 1.8);
    expect(() => tick(0)).not.toThrow();
  });
});

describe('pick', () => {
  it('finds the nearest visible place under the pointer', () => {
    // Two places: one right under the pointer (client 110, 70 = canvas 100, 50 = the middle), one far away.
    scene.setPlaces(buffersOf([0, 0, 1.006, 0, 1, 0]));
    mocks.cameras[0].position.set(0, 0, 2.2);
    mocks.project = (vector) => (vector.z > 0.5 ? new mocks.FakeVector3(0, 0, 0) : new mocks.FakeVector3(0.9, 0.9, 0));
    mocks.unproject = () => new mocks.FakeVector3(0, 0, 0);
    const picked = scene.pick(110, 70);
    expect(picked.place).toBe(0);
    expect(picked.x).toBe(100);
    expect(picked.y).toBe(50);
  });

  it('does not pick a place on the far side of the globe', () => {
    scene.setPlaces(buffersOf([0, 0, -1.006]));
    mocks.cameras[0].position.set(0, 0, 2.2);
    mocks.project = () => new mocks.FakeVector3(0, 0, 0);
    expect(scene.pick(110, 70)).toEqual({ place: null, x: 100, y: 50 });
  });

  it('works before any place was drawn', () => {
    mocks.cameras[0].position.set(0, 0, 2.2);
    mocks.unproject = () => new mocks.FakeVector3(0, 0, 0);
    expect(scene.pick(110, 70).place).toBeNull();
  });
});

describe('flying', () => {
  it('flies the camera to a spot, closer, in FLY_MS, then stops moving it', () => {
    scene.flyTo(30, 20);
    tick(0);
    const start = cameraPosition();
    tick(FLY_MS / 2);
    expect(cameraPosition()).not.toEqual(start);
    tick(FLY_MS);
    const [x, y, z] = toVector(30, 20, FLY_DISTANCE);
    expect(cameraPosition().map((value) => Math.round(value * 1000) / 1000)).toEqual(
      [x, y, z].map((value) => Math.round(value * 1000) / 1000),
    );
    const arrived = cameraPosition();
    tick(FLY_MS * 2);
    expect(cameraPosition()).toEqual(arrived);
  });

  it('goes back to the home view with the reset', () => {
    scene.flyTo(30, 20);
    tick(0);
    tick(FLY_MS);
    scene.resetView();
    tick(FLY_MS * 2);
    tick(FLY_MS * 4);
    const [x, y, z] = toVector(HOME_VIEW.lon, HOME_VIEW.lat, CAMERA_DISTANCE);
    expect(cameraPosition().map((value) => Math.round(value * 1000) / 1000)).toEqual(
      [x, y, z].map((value) => Math.round(value * 1000) / 1000),
    );
  });
});

describe('resize and dispose', () => {
  it('resizes the drawing and the camera, not the canvas style', () => {
    scene.resize(800, 400);
    expect(mocks.renderers[0].setSize).toHaveBeenCalledWith(800, 400, false);
    expect(mocks.cameras[0].aspect).toBe(2);
    expect(mocks.cameras[0].updateProjectionMatrix).toHaveBeenCalled();
  });

  it('stops the loop and hands everything back to the graphics card', () => {
    scene.setPlaces(buffersOf([0, 0, 1]));
    scene.setMarks({ segments: [0, 0, 1, 0, 1, 0], point: [0, 0, 1] }, null);
    scene.dispose();
    expect(cancelAnimationFrame).toHaveBeenCalled();
    expect(mocks.controls[0].dispose).toHaveBeenCalled();
    expect(mocks.renderers[0].dispose).toHaveBeenCalled();
    for (const object of added()) {
      expect((object.geometry as InstanceType<typeof mocks.FakeGeometry>).dispose).toHaveBeenCalled();
    }
  });
});
