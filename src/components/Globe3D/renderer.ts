import type { ExpoWebGLRenderingContext } from 'expo-gl';
import { WebGLRenderer } from 'three';

/**
 * On a phone, the context of `expo-gl` is a WebGL 2 one that ALSO answers `instanceof WebGLRenderingContext` (its class
 * chain goes through the WebGL 1 class), which three.js reads as "this is WebGL 1" and refuses with "WebGL 1 is not
 * supported since r163". So the WebGL 1 class is hidden while the renderer is built (it is only looked at there), then put
 * back exactly as it was.
 */
const withoutWebGL1Class = <T>(build: () => T): T => {
  const scope = globalThis as { WebGLRenderingContext?: unknown };
  const had = 'WebGLRenderingContext' in scope;
  const original = scope.WebGLRenderingContext;
  scope.WebGLRenderingContext = undefined;
  try {
    return build();
  } finally {
    if (had) scope.WebGLRenderingContext = original;
    else delete scope.WebGLRenderingContext;
  }
};

/**
 * The three.js renderer drawing into the surface `expo-gl` just handed us.
 *
 * three.js wants a canvas, and on a phone there is no DOM to give it: it only ever reads its size and asks it for the
 * context we already have, so a stand-in object is enough (on the web, `expo-gl` does hand out a real canvas, and that
 * one is used as is). Kept on its own, away from the component, so that the tests can stand in for the whole graphics
 * card.
 */
export const createRenderer = (gl: ExpoWebGLRenderingContext): WebGLRenderer => {
  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;
  const canvas =
    gl.canvas ??
    ({
      width,
      height,
      clientWidth: width,
      clientHeight: height,
      style: {},
      addEventListener: () => {},
      removeEventListener: () => {},
      getContext: () => gl,
    } as unknown as HTMLCanvasElement);

  const renderer = withoutWebGL1Class(
    () =>
      new WebGLRenderer({
        canvas: canvas as HTMLCanvasElement,
        context: gl as unknown as WebGL2RenderingContext,
      }),
  );
  // `false`: the size is the surface's own, in real pixels — there is no style to keep in step with it.
  renderer.setSize(width, height, false);
  return renderer;
};
