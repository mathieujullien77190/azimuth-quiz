import type { ExpoWebGLRenderingContext } from 'expo-gl';
import { WebGLRenderer } from 'three';

/**
 * Sur telephone, le contexte d'`expo-gl` est un WebGL 2 qui repond AUSSI a `instanceof WebGLRenderingContext` (sa
 * chaine de classes passe par WebGL 1) : three.js le lit comme "WebGL 1" et refuse ("WebGL 1 is not supported since
 * r163"). On cache donc la classe WebGL 1 pendant la construction du renderer (seul moment ou elle est regardee),
 * puis on la remet exactement comme elle etait.
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
 * Le renderer three.js qui dessine dans la surface qu'`expo-gl` vient de remettre.
 *
 * three.js veut un canvas, et sur telephone il n'y a pas de DOM : il ne lit que sa taille et lui demande le contexte
 * qu'on a deja, donc un faux objet suffit (sur le web, `expo-gl` donne un vrai canvas, utilise tel quel). A part du
 * composant pour que les tests remplacent toute la carte graphique.
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
  // `false` : la taille est celle de la surface, en vrais pixels — pas de style a tenir synchronise.
  renderer.setSize(width, height, false);
  return renderer;
};
