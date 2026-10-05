import { useEffect, useRef, useState, type PointerEvent } from 'react';

import { CLICK_SLOP_PX } from './constants';
import { createGlobeScene, type GlobeScene } from './GlobeScene';
import { countryAt } from './helpers';
import type { CountryGroup, CountryNameSource, CountryShape, LabelPoint, Mark, PlaceBuffers, Selection } from './types';

export type GlobeHit = Selection & { x: number; y: number };

export type GlobeCanvasProps = {
  countryGroups: CountryGroup[];
  placeBuffers: PlaceBuffers;
  /** The key of each place of placeBuffers, in the same order: what a picked dot means. */
  placeKeys: string[];
  /** The name of each place of placeBuffers, in the same order: written next to its dot once zoomed in. */
  placeNames: string[];
  /** The country names, each at the visual centre of its country: written permanently from far away. */
  countryNames: CountryNameSource[];
  shapes: CountryShape[];
  layers: { countries: boolean; places: boolean };
  selectedMark: Mark;
  hoveredMark: Mark;
  /** A request to fly to a spot (a new token = a new flight, even to the same spot). */
  fly: { lon: number; lat: number; token: number } | null;
  /** Bumped by the reset button. */
  resetToken: number;
  onHover: (hit: GlobeHit | null) => void;
  onSelect: (hit: Selection | null) => void;
};

/**
 * The 3D globe on a canvas: creates the scene once, keeps it in step with what the page draws, and turns the pointer
 * into hovers and clicks on a place or a country (places win over the country behind them). All the drawing is in
 * GlobeScene, all the maths in helpers.ts.
 */
export const GlobeCanvas = ({
  countryGroups,
  placeBuffers,
  placeKeys,
  placeNames,
  countryNames,
  shapes,
  layers,
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
  const [countryLabels, setCountryLabels] = useState<LabelPoint[]>([]);

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

  useEffect(() => sceneRef.current!.setCountries(countryGroups), [countryGroups]);
  useEffect(() => sceneRef.current!.setPlaces(placeBuffers), [placeBuffers]);
  useEffect(() => sceneRef.current!.setLayers(layers), [layers]);
  useEffect(() => sceneRef.current!.setLabels(placeNames, setLabels), [placeNames]);
  useEffect(() => sceneRef.current!.setCountryNames(countryNames, setCountryLabels), [countryNames]);
  useEffect(() => sceneRef.current!.setMarks(selectedMark, hoveredMark), [selectedMark, hoveredMark]);
  useEffect(() => {
    if (fly) sceneRef.current!.flyTo(fly.lon, fly.lat);
  }, [fly]);
  useEffect(() => {
    if (resetToken > 0) sceneRef.current!.resetView();
  }, [resetToken]);

  /** What is at a pointer position: a place first, else the country around the point of the globe, else nothing. */
  const hitAt = (clientX: number, clientY: number): GlobeHit | null => {
    const picked = sceneRef.current!.pick(clientX, clientY);
    if (picked.place !== null) return { kind: 'place', id: placeKeys[picked.place], x: picked.x, y: picked.y };
    const code = picked.lon === null ? null : countryAt(picked.lon, picked.lat!, shapes);
    return code === null ? null : { kind: 'country', id: code, x: picked.x, y: picked.y };
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
        {countryLabels.map((label) => (
          <span key={countryNames[label.index].name} className="globe-name globe-country-name" style={{ left: label.x, top: label.y }}>
            {countryNames[label.index].name}
          </span>
        ))}
        {labels.map((label) => (
          <span key={placeKeys[label.index]} className="globe-name" style={{ left: label.x, top: label.y }}>
            {placeNames[label.index]}
          </span>
        ))}
      </div>
    </>
  );
};
