import type { ExpoWebGLRenderingContext } from 'expo-gl';
import { WebGLRenderer } from 'three';

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

  const renderer = new WebGLRenderer({
    canvas: canvas as HTMLCanvasElement,
    context: gl as unknown as WebGL2RenderingContext,
  });
  // `false`: the size is the surface's own, in real pixels — there is no style to keep in step with it.
  renderer.setSize(width, height, false);
  return renderer;
};
