import type { ExpoWebGLRenderingContext } from 'expo-gl';
import { WebGLRenderer } from 'three';

import { createRenderer } from './renderer';

// The real renderer would go looking for a graphics card: all that matters here is what it is handed.
jest.mock('three', () => ({
  ...jest.requireActual('three'),
  WebGLRenderer: jest.fn(() => ({ setSize: jest.fn() })),
}));

const context = (overrides: Record<string, unknown> = {}) =>
  ({ drawingBufferWidth: 300, drawingBufferHeight: 200, ...overrides }) as unknown as ExpoWebGLRenderingContext;

/** What the renderer was built with. */
const optionsOf = () => jest.mocked(WebGLRenderer).mock.calls[0][0]!;

beforeEach(() => jest.clearAllMocks());

describe('createRenderer', () => {
  it('draws into the surface it is handed, at that surface own size', () => {
    const gl = context();
    const renderer = createRenderer(gl);
    expect(optionsOf().context).toBe(gl);
    expect(renderer.setSize).toHaveBeenCalledWith(300, 200, false);
  });

  it('stands in for the canvas three.js expects, since there is no DOM on a phone', () => {
    const gl = context();
    createRenderer(gl);
    const canvas = optionsOf().canvas as unknown as HTMLCanvasElement & { getContext: () => unknown };
    expect(canvas.width).toBe(300);
    expect(canvas.height).toBe(200);
    expect(canvas.clientWidth).toBe(300);
    expect(canvas.clientHeight).toBe(200);
    expect(canvas.style).toEqual({});
    expect(canvas.getContext()).toBe(gl);
    // three.js listens for the canvas losing its context: the stand-in takes the calls and does nothing.
    expect(canvas.addEventListener('webglcontextlost', () => {})).toBeUndefined();
    expect(canvas.removeEventListener('webglcontextlost', () => {})).toBeUndefined();
  });

  it('uses the real canvas when there is one (on the web)', () => {
    const canvas = { width: 10, height: 10 } as unknown as HTMLCanvasElement;
    createRenderer(context({ canvas }));
    expect(optionsOf().canvas).toBe(canvas);
  });
});
