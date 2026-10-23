import { useEffect, useRef, useState, type PointerEvent } from 'react';

import { CLICK_SLOP_PX } from './constants';
import { createGlobeScene, type GlobeScene } from './GlobeScene';
import type { LabelPoint, Mark, PlaceBuffers, Selection } from './types';

export type GlobeHit = Selection & { x: number; y: number };

export type GlobeCanvasProps = {
  placeBuffers: PlaceBuffers;
  /** Cle de chaque lieu de placeBuffers, meme ordre : ce que designe un point choisi. */
  placeKeys: string[];
  /** Nom de chaque lieu de placeBuffers, meme ordre : ecrit pres du point une fois zoome. */
  placeNames: string[];
  selectedMark: Mark;
  hoveredMark: Mark;
  /** Demande de vol vers un point (nouveau token = nouveau vol, meme vers le meme point). */
  fly: { lon: number; lat: number; token: number } | null;
  /** Incremente par le bouton de reinitialisation. */
  resetToken: number;
  onHover: (hit: GlobeHit | null) => void;
  onSelect: (hit: Selection | null) => void;
};

/**
 * Globe 3D sur canvas : cree la scene une fois, la tient a jour de ce que dessine la page et transforme le pointeur
 * en survols et clics sur un lieu. Tout le dessin est dans GlobeScene, tous les calculs dans helpers.ts.
 */
export const GlobeCanvas = ({
  placeBuffers,
  placeKeys,
  placeNames,
  selectedMark,
  hoveredMark,
  fly,
  resetToken,
  onHover,
  onSelect,
}: GlobeCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<GlobeScene | null>(null);
  const pressed = useRef<{ x: number; y: number } | null>(null);
  const [labels, setLabels] = useState<LabelPoint[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const scene = createGlobeScene(canvas);
    sceneRef.current = scene;
    const fit = () => scene.resize(canvas.clientWidth, canvas.clientHeight);
    fit();
    window.addEventListener('resize', fit);
    return () => {
      window.removeEventListener('resize', fit);
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => sceneRef.current!.setPlaces(placeBuffers), [placeBuffers]);
  useEffect(() => sceneRef.current!.setLabels(placeNames, setLabels), [placeNames]);
  useEffect(() => sceneRef.current!.setMarks(selectedMark, hoveredMark), [selectedMark, hoveredMark]);
  useEffect(() => {
    if (fly) sceneRef.current!.flyTo(fly.lon, fly.lat);
  }, [fly]);
  useEffect(() => {
    if (resetToken > 0) sceneRef.current!.resetView();
  }, [resetToken]);

  const hitAt = (clientX: number, clientY: number): GlobeHit | null => {
    const picked = sceneRef.current!.pick(clientX, clientY);
    return picked.place === null ? null : { kind: 'place', id: placeKeys[picked.place], x: picked.x, y: picked.y };
  };

  const handleMove = (event: PointerEvent<HTMLCanvasElement>) => onHover(hitAt(event.clientX, event.clientY));

  const handleUp = (event: PointerEvent<HTMLCanvasElement>) => {
    const start = pressed.current;
    pressed.current = null;
    if (start === null || Math.hypot(event.clientX - start.x, event.clientY - start.y) > CLICK_SLOP_PX) return;
    const hit = hitAt(event.clientX, event.clientY);
    onSelect(hit && { kind: hit.kind, id: hit.id });
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className="globe-canvas"
        aria-label="Globe 3D"
        onPointerDown={(event) => {
          pressed.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerLeave={() => onHover(null)}
      />
      <div className="globe-names" aria-hidden="true">
        {labels.map((label) => (
          <span key={placeKeys[label.index]} className="globe-name" style={{ left: label.x, top: label.y }}>
            {placeNames[label.index]}
          </span>
        ))}
      </div>
    </>
  );
};
