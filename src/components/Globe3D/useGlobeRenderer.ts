import type { ExpoWebGLRenderingContext } from 'expo-gl';
import { useCallback, useEffect, useState } from 'react';
import { OrthographicCamera, type WebGLRenderer } from 'three';

import type { Coordinates } from '@/types';

import { CAMERA_DISTANCE, CAMERA_FAR, CAMERA_NEAR } from './constants';
import { scenePoint } from './helpers';
import { createRenderer } from './renderer';
import type { GlobeRoutes, GlobeScene } from './types';

type GlobeView = GlobeScene & {
  /** Les routes des reponses, reconstruites par l'appelant quand le zoom change leur epaisseur. */
  routes: GlobeRoutes;
  /** Le lieu montre au milieu du dessin : la camera est juste au-dessus. */
  center: Coordinates;
  /** Moitie de ce que montre le dessin, en rayons de globe : 1 = la boule le remplit, moins = zoome. */
  halfExtent: number;
  /** Echelle des pastilles pour garder leur taille d'ecran non zoomee : 1 / zoom. */
  markScale: number;
  /** Peint autour de la boule (une surface OpenGL n'est pas transparente partout, voir `Globe3DProps`). */
  background: string;
};

/** La surface remise par `expo-gl`, et le renderer qui dessine dedans. */
type Target = { gl: ExpoWebGLRenderingContext; renderer: WebGLRenderer };

/**
 * Dessine le globe dans la surface remise par `expo-gl` et le tient a jour.
 *
 * Rien ne bouge dans la boule, donc pas de boucle : un dessin a l'arrivee de la surface, puis un a chaque changement
 * de ce qu'elle montre (tourner, zoomer, reponse ou theme). Un telephone laisse sur l'ecran solution ne dessine rien,
 * alors qu'une boucle a 60 par seconde chaufferait la puce pour une image fixe.
 */
export const useGlobeRenderer = ({
  scene,
  headlight,
  screenSized,
  routes,
  center,
  halfExtent,
  markScale,
  background,
}: GlobeView) => {
  const [target, setTarget] = useState<Target | null>(null);

  // La carte graphique garde la surface donnee tant qu'on ne la libere pas.
  useEffect(() => () => target?.renderer.dispose(), [target]);

  useEffect(() => {
    if (target === null) return undefined;
    // Une camera par dessin : rien ne bouge entre deux, et la creer coute peu devant la boule. Elle regarde le milieu
    // du globe depuis juste au-dessus de `center`, nord en haut — le globe est tourne de cote et penche, jamais roule
    // (voir `dragCenter`), ce qui garde "⌖ N" juste.
    const camera = new OrthographicCamera(-halfExtent, halfExtent, halfExtent, -halfExtent, CAMERA_NEAR, CAMERA_FAR);
    camera.position.set(...scenePoint(center, CAMERA_DISTANCE));
    camera.lookAt(0, 0, 0);
    // La lampe est accrochee a la camera (le meme cote prend toujours la lumiere), et la camera a la scene —
    // sans quoi une lumiere qui lui est attachee n'eclairerait rien.
    camera.add(headlight);
    scene.add(camera);
    scene.add(routes);
    // Les pastilles gardent leur taille d'ecran au lieu de grossir avec la boule.
    screenSized.forEach((mark) => mark.scale.setScalar(markScale));

    target.renderer.setClearColor(background, 1);
    target.renderer.render(scene, camera);
    // Dit a la surface que le dessin est pret a etre montre.
    target.gl.endFrameEXP();

    return () => {
      camera.remove(headlight);
      scene.remove(camera);
      scene.remove(routes);
    };
  }, [target, scene, headlight, screenSized, routes, center, halfExtent, markScale, background]);

  return useCallback((gl: ExpoWebGLRenderingContext) => setTarget({ gl, renderer: createRenderer(gl) }), []);
};
