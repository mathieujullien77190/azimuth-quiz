import { useEffect, useMemo, useRef, useState } from 'react';

import { countryName, flagEmoji } from '@/constants/places/countries';
// Pure geometry only, imported directly from the file rather than `@/components/ContourBoard`
// (that folder's own `index.ts` re-exports the React Native `ContourBoard` component, which
// drags in `react-native`/`react-native-svg` — this module has none of that, safe to bundle here.
import { boardDimensionsFor, createProjector, polylinePath, projectPoints } from '@/components/ContourBoard/helpers';
import { BOARD_PADDING_RATIO } from '@/components/ContourBoard/constants';
import { FLAG_FONT_FAMILY } from '@/themes/fonts';
import type { ContourCountry, ContourNeighbor, Point2D } from '@/types';

import { deleteNeighbor, excludePlaceFromContour, saveCenterLabelPosition, saveNeighborPosition } from '../../api/contour';
import { fetchPlaces, type PlaceRow } from '../../api/places';
import { DIFFICULTY_LABELS } from '../../constants';
import { DeleteX } from '../../components/DeleteX';
import { Pagination, pageCount, paginate } from '../../components/Pagination';

import { neighborIcon, neighborName } from './helpers';

const BOARD_MAX_WIDTH = 640;
const BOARD_MAX_HEIGHT = 480;

/**
 * The Contour map editor for a single country — everything ContourView.tsx used to be, minus its
 * own country picker: mounted inline inside CountriesView's own card for whichever country already
 * has Contour data (see CountriesView.tsx's "🗺️ Silhouette" toggle, `CONTOURS.find` — a country
 * gets one as soon as its `countries.json` row grows a `contour` field, hand-curated or generated
 * by `scripts/generateContours.mjs`), so pays and Contour data live on the same screen instead of a
 * separate tab. `initialCountry` seeds local state; nothing here writes back up to the parent (same
 * no-backend, journal-only pattern as the rest of the admin).
 */
export const ContourEditor = ({ initialCountry }: { initialCountry: ContourCountry }) => {
  const [country, setCountry] = useState(initialCountry);
  const [places, setPlaces] = useState<PlaceRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [placesPage, setPlacesPage] = useState(1);
  // Place row clicked in the "Lieux possibles" list — highlighted in yellow on the board until
  // another one is clicked (see `selectedPlacePosition`).
  const [selectedPlaceIndex, setSelectedPlaceIndex] = useState<number | null>(null);
  // Live pixel position of whichever neighbor is currently being dragged (see `beginDrag`) —
  // `null` the rest of the time, when every neighbor just renders at its stored x/y.
  const [dragPos, setDragPos] = useState<{ index: number; pos: Point2D } | null>(null);
  // Same idea as `dragPos`, for the target country's own flag/name anchor (see `ContourCountry.centerLabel`).
  const [centerDragPos, setCenterDragPos] = useState<Point2D | null>(null);

  useEffect(() => {
    // Same PLACES pool the game's own city phase draws from (`randomPlacesFor`) — shown here so
    // an obviously-wrong entry (wrong country, duplicate...) can be pruned without going through
    // the general Places view.
    fetchPlaces()
      .then(setPlaces)
      .catch((err: Error) => setLoadError(err.message));
  }, []);

  // Same pool the game's own city phase draws from (`randomPlacesFor`, filtered by country code
  // there too) — this admin view only narrows by country, every difficulty shown together.
  const countryPlaces = useMemo(() => places?.filter((row) => row.code === country.code) ?? [], [places, country.code]);
  const placesTotalPages = pageCount(countryPlaces.length);
  const pagedPlaces = useMemo(() => paginate(countryPlaces, placesPage), [countryPlaces, placesPage]);

  const selectedPlace = countryPlaces.find((row) => row.index === selectedPlaceIndex) ?? null;

  // Excludes the place from Contour's own pool only (see `excludePlaceFromContour`) — it stays
  // untouched in Boussole/Indices, so this just drops it from this view's own local list rather
  // than calling PlacesView's `deletePlace` (a real, shared deletion).
  const handleExcludePlace = async (row: PlaceRow) => {
    await excludePlaceFromContour(row);
    setPlaces((cur) => cur?.filter((r) => r.index !== row.index) ?? cur);
  };

  // Exactly the game's own framing (`ContourGameScreen`'s `projectRound`): fit to the country's
  // own outline alone — the canvas every neighbor's curated `x`/`y` (a fraction of it) scales
  // against, so this preview matches the real game's layout exactly regardless of either one's
  // absolute pixel size.
  const boardSize = useMemo(() => boardDimensionsFor(country.points, BOARD_MAX_WIDTH, BOARD_MAX_HEIGHT), [country.points]);
  // Only the outline itself still goes through a geographic projection (lon/lat) — see
  // BOARD_PADDING_RATIO's own doc comment for why this is a ratio, not a fixed pixel count.
  // Neighbors and the country's own flag/name anchor are both plain `x`/`y` fractions of this
  // canvas now (see `positionFor`/`positionForCenterLabel`), no projection involved.
  const project = useMemo(
    () => createProjector(country.points, boardSize, Math.min(boardSize.width, boardSize.height) * BOARD_PADDING_RATIO),
    [country.points, boardSize],
  );

  // The clicked place's true position, projected the same way as the outline (geographic lon/lat,
  // not a fraction like neighbors) — highlighted in yellow so a wrongly-placed or duplicate entry
  // is obvious before excluding it.
  const selectedPlacePosition = useMemo(
    () => (selectedPlace ? project([selectedPlace.coordinates.longitude, selectedPlace.coordinates.latitude]) : null),
    [selectedPlace, project],
  );

  const outlinePath = useMemo(() => polylinePath(projectPoints(country.points, project)), [country.points, project]);

  // Refs, not state: a drag session's own starting point never needs to trigger a re-render by
  // itself (only `dragPos`, updated on every move, does).
  const dragStart = useRef<{ index: number; clientX: number; clientY: number; pixel: Point2D } | null>(null);

  // `neighbor.x`/`y` are already a fraction of this exact canvas (see `ContourNeighbor`'s own doc
  // comment) — just scale, no projection involved, and no clamping: this is the one and only
  // position, draggable, and it's exactly what the real game renders too.
  const truePositionFor = (neighbor: ContourNeighbor): Point2D => ({ x: neighbor.x * boardSize.width, y: neighbor.y * boardSize.height });

  const positionFor = (index: number, neighbor: ContourNeighbor): Point2D => {
    if (dragPos && dragPos.index === index) return dragPos.pos;
    return truePositionFor(neighbor);
  };

  // Same `x`/`y`-fraction model as a neighbor (see `truePositionFor`) — the flag renders at this
  // exact point, and its name stacks just below it at render time (`HINT_STACK_GAP_RATIO`, same as
  // the real game — see ContourGameScreen's `stackGap`), not independently curated.
  const centerLabelPosition = (): Point2D => {
    if (centerDragPos) return centerDragPos;
    return { x: country.centerLabel.x * boardSize.width, y: country.centerLabel.y * boardSize.height };
  };

  const handleDelete = async (neighbor: ContourNeighbor) => {
    await deleteNeighbor(country, neighbor);
    setCountry((c) => ({ ...c, neighbors: c.neighbors.filter((n) => n !== neighbor) }));
  };

  const commitDrag = (index: number, finalPixel: Point2D) => {
    const previous = country.neighbors[index];
    const x = finalPixel.x / boardSize.width;
    const y = finalPixel.y / boardSize.height;

    setCountry((c) => ({ ...c, neighbors: c.neighbors.map((n, i) => (i === index ? { ...n, x, y } : n)) }));

    saveNeighborPosition(country, previous, { x, y })
      .then((updated) => {
        setCountry((c) => ({ ...c, neighbors: c.neighbors.map((n, i) => (i === index ? updated : n)) }));
      })
      .catch(() => {
        setCountry((c) => ({ ...c, neighbors: c.neighbors.map((n, i) => (i === index ? previous : n)) }));
      });
  };

  const centerDragStart = useRef<{ clientX: number; clientY: number; pixel: Point2D } | null>(null);

  const commitCenterDrag = (finalPixel: Point2D) => {
    const previous = country.centerLabel;
    const next = { x: finalPixel.x / boardSize.width, y: finalPixel.y / boardSize.height };

    setCountry((c) => ({ ...c, centerLabel: next }));

    saveCenterLabelPosition(country, previous, next).catch(() => {
      setCountry((c) => ({ ...c, centerLabel: previous }));
    });
  };

  const beginCenterDrag = () => (event: React.MouseEvent) => {
    event.preventDefault();
    const pixel = centerLabelPosition();
    centerDragStart.current = { clientX: event.clientX, clientY: event.clientY, pixel };
    setCenterDragPos(pixel);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const start = centerDragStart.current;
      if (!start) return;
      setCenterDragPos({ x: start.pixel.x + (moveEvent.clientX - start.clientX), y: start.pixel.y + (moveEvent.clientY - start.clientY) });
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      const start = centerDragStart.current;
      centerDragStart.current = null;
      setCenterDragPos(null);
      if (!start) return;
      const finalPixel = { x: start.pixel.x + (upEvent.clientX - start.clientX), y: start.pixel.y + (upEvent.clientY - start.clientY) };
      commitCenterDrag(finalPixel);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const beginDrag = (index: number, neighbor: ContourNeighbor) => (event: React.MouseEvent) => {
    event.preventDefault();
    const pixel = truePositionFor(neighbor);
    dragStart.current = { index, clientX: event.clientX, clientY: event.clientY, pixel };
    setDragPos({ index, pos: pixel });

    const onMouseMove = (moveEvent: MouseEvent) => {
      const start = dragStart.current;
      if (!start) return;
      setDragPos({
        index: start.index,
        pos: { x: start.pixel.x + (moveEvent.clientX - start.clientX), y: start.pixel.y + (moveEvent.clientY - start.clientY) },
      });
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      const start = dragStart.current;
      dragStart.current = null;
      setDragPos(null);
      if (!start) return;
      const finalPixel = { x: start.pixel.x + (upEvent.clientX - start.clientX), y: start.pixel.y + (upEvent.clientY - start.clientY) };
      commitDrag(index, finalPixel);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  if (loadError) {
    return <div className="empty">Impossible de charger les lieux : {loadError}</div>;
  }

  return (
    <div className="contour-editor">
      <div className="contour-main-row">
        <div className="contour-board-wrap" style={{ width: boardSize.width, height: boardSize.height }}>
          <svg className="contour-svg" width={boardSize.width} height={boardSize.height}>
            <path className="contour-outline" d={outlinePath} />
            {/* The place clicked in "Lieux possibles" below, highlighted so a wrongly-placed or
                duplicate entry is obvious before excluding it (see `selectedPlacePosition`). */}
            {selectedPlacePosition && <circle className="contour-place-highlight" cx={selectedPlacePosition.x} cy={selectedPlacePosition.y} r={7} />}
          </svg>
          {country.neighbors.map((neighbor, index) => {
            const pos = positionFor(index, neighbor);
            return (
              <div
                key={index}
                className={`contour-neighbor${dragPos?.index === index ? ' dragging' : ''}`}
                style={{ left: pos.x, top: pos.y }}
                onMouseDown={beginDrag(index, neighbor)}
              >
                {/* Icon at `pos`, name stacked just below — same layout as the real game's tier
                    1 (icon)/tier 2 (icon+name), shown here always at once since this is a static
                    preview rather than a tiered reveal. */}
                <span className="contour-neighbor-icon" style={{ fontFamily: FLAG_FONT_FAMILY }}>
                  {neighborIcon(neighbor)}
                </span>
                <span className="contour-neighbor-name">{neighborName(neighbor)}</span>
                {/* Stops the mousedown from bubbling to the anchor's own `onMouseDown` above (which
                    would otherwise start a drag instead of letting this click through). */}
                <span className="contour-neighbor-delete" onMouseDown={(event) => event.stopPropagation()}>
                  <DeleteX name={neighborName(neighbor)} onDelete={() => handleDelete(neighbor)} />
                </span>
              </div>
            );
          })}
          {/* Tier 3/4's own on-board anchor (see `ContourCountry.centerLabel`) — one single
              draggable point, never deletable (every country always has one); flag icon at the
              point, its name stacked below, same as a neighbor above. */}
          {(() => {
            const pos = centerLabelPosition();
            return (
              <div
                className={`contour-neighbor contour-center-label${centerDragPos ? ' dragging' : ''}`}
                style={{ left: pos.x, top: pos.y }}
                onMouseDown={beginCenterDrag()}
              >
                <span className="contour-neighbor-icon" style={{ fontFamily: FLAG_FONT_FAMILY }}>
                  {flagEmoji(country.code)}
                </span>
                <span className="contour-neighbor-name">{countryName(country.code, 'fr')}</span>
              </div>
            );
          })()}
        </div>

        <div className="contour-places-panel">
          <span className="field-label">Clique un lieu pour le repérer en jaune sur la carte.</span>
          {countryPlaces.length === 0 && <p className="count-line">Aucun lieu pour ce pays.</p>}
          <Pagination page={placesPage} totalPages={placesTotalPages} onChange={setPlacesPage} />
          <div className="contour-places-list">
            {pagedPlaces.map((row) => (
              <div
                className={`contour-place-row${row.index === selectedPlaceIndex ? ' selected' : ''}`}
                key={row.index}
                onClick={() => setSelectedPlaceIndex((current) => (current === row.index ? null : row.index))}
              >
                <span>{row.name}</span>
                <span className="coord">{DIFFICULTY_LABELS[(row.boussole ?? row.indices)!.difficulty]}</span>
                <span onClick={(event) => event.stopPropagation()}>
                  <DeleteX name={row.name} onDelete={() => handleExcludePlace(row)} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
