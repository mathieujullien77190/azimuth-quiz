import type { ExpoWebGLRenderingContext } from 'expo-gl';
import { useCallback, useEffect, useState } from 'react';
import { OrthographicCamera, type WebGLRenderer } from 'three';

import type { Coordinates } from '@/types';

import { CAMERA_DISTANCE, CAMERA_FAR, CAMERA_NEAR } from './constants';
import { scenePoint } from './helpers';
import { createRenderer } from './renderer';
import type { GlobeScene } from './types';

type GlobeView = GlobeScene & {
  /** The place shown in the middle of the drawing: the camera stands right above it. */
  center: Coordinates;
  /** Half of what the drawing shows, in globe radii: 1 = the ball exactly fills it, less = zoomed in. */
  halfExtent: number;
  /** Painted around the ball (an OpenGL surface cannot be see-through everywhere, see `Globe3DProps`). */
  background: string;
};

/** The surface `expo-gl` handed over, and the renderer drawing into it. */
type Target = { gl: ExpoWebGLRenderingContext; renderer: WebGLRenderer };

/**
 * Draws the globe into the surface `expo-gl` hands over, and keeps it up to date.
 *
 * Nothing moves inside the ball, so there is no render loop: one drawing when the surface arrives, then one more every
 * time something it shows changes (the globe is turned, zoomed, an answer or the theme changes). A phone left on the
 * solution screen draws nothing at all, where a 60-per-second loop would have kept the chip warm for a still image.
 */
export const useGlobeRenderer = ({ scene, headlight, center, halfExtent, background }: GlobeView) => {
  const [target, setTarget] = useState<Target | null>(null);

  // The graphics card keeps the surface it was given until it is told otherwise.
  useEffect(() => () => target?.renderer.dispose(), [target]);

  useEffect(() => {
    if (target === null) return undefined;
    // A camera per drawing: nothing moves in between, and setting one up is cheap next to the ball itself. Looking at
    // the middle of the globe from right above `center`, with north up — the globe is only ever turned sideways and
    // tipped, never rolled (see `dragCenter`), which is what keeps the "⌖ N" button honest.
    const camera = new OrthographicCamera(-halfExtent, halfExtent, halfExtent, -halfExtent, CAMERA_NEAR, CAMERA_FAR);
    camera.position.set(...scenePoint(center, CAMERA_DISTANCE));
    camera.lookAt(0, 0, 0);
    // The lamp hangs on the camera (so the same side of the ball always catches the light), and the camera hangs in
    // the scene — without which a light attached to it would light nothing.
    camera.add(headlight);
    scene.add(camera);

    target.renderer.setClearColor(background, 1);
    target.renderer.render(scene, camera);
    // Tells the surface its drawing is ready to be shown.
    target.gl.endFrameEXP();

    return () => {
      camera.remove(headlight);
      scene.remove(camera);
    };
  }, [target, scene, headlight, center, halfExtent, background]);

  return useCallback((gl: ExpoWebGLRenderingContext) => setTarget({ gl, renderer: createRenderer(gl) }), []);
};
