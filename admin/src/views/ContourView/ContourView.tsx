import { useEffect, useMemo, useRef, useState } from 'react';

import { countryName, flagEmoji } from '@/constants/places/countries';
// Pure geometry only, imported directly from the file rather than `@/components/ContourBoard`
// (that folder's own `index.ts` re-exports the React Native `ContourBoard` component, which
// drags in `react-native`/`react-native-svg` — this module has none of that, safe to bundle here.
import { boardDimensionsFor, createProjector, polylinePath, projectPoints } from '@/components/ContourBoard/helpers';
import { BOARD_PADDING_RATIO } from '@/components/ContourBoard/constants';
import { FLAG_FONT_FAMILY } from '@/themes/fonts';
import type { ContourCountry, ContourNeighbor, Point2D } from '@/types';

import { deleteNeighbor, excludePlaceFromContour, fetchContourCountries, saveCenterLabelPosition, saveNeighborPosition } from '../../api/contour';
import { fetchPlaces, type PlaceRow } from '../../api/places';
import { DIFFICULTY_LABELS } from '../../constants';
import { DeleteX } from '../../components/DeleteX';
import { Pagination, pageCount, paginate } from '../../components/Pagination';

import { filterContourCountries, neighborIcon, neighborName } from './helpers';
import type { NeighborSaveState } from './types';

const BOARD_MAX_WIDTH = 640;
const BOARD_MAX_HEIGHT = 480;

export const ContourView = () => {
  const [countries, setCountries] = useState<ContourCountry[] | null>(null);
  const [places, setPlaces] = useState<PlaceRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [countryQuery, setCountryQuery] = useState('');
  const [placesPage, setPlacesPage] = useState(1);
  // Place row clicked in the "Lieux possibles" list — highlighted in yellow on the board until
  // another one is clicked or the country changes (see `selectedPlacePosition`).
  const [selectedPlaceIndex, setSelectedPlaceIndex] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<NeighborSaveState | null>(null);
  // Live pixel position of whichever neighbor is currently being dragged (see `beginDrag`) —
  // `null` the rest of the time, when every neighbor just renders at its stored lon/lat.
  const [dragPos, setDragPos] = useState<{ index: number; pos: Point2D } | null>(null);
  // Same idea as `dragPos`, for the target country's own flag/name anchor (see `ContourCountry.centerLabel`).
  const [centerDragPos, setCenterDragPos] = useState<Point2D | null>(null);

  useEffect(() => {
    fetchContourCountries()
      .then((rows) => {
        setCountries(rows);
        setSelectedCode((current) => current ?? rows[0]?.code ?? null);
      })
      .catch((err: Error) => setLoadError(err.message));
    // Same PLACES pool the game's own city phase draws from (`randomPlacesFor`) — shown here so
    // an obviously-wrong entry (wrong country, duplicate...) can be pruned without going through
    // the general Places view.
    fetchPlaces()
      .then(setPlaces)
      .catch((err: Error) => setLoadError(err.message));
  }, []);

  useEffect(() => {
    if (saveState?.status !== 'saved') return;
    const id = setTimeout(() => setSaveState(null), 1500);
    return () => clearTimeout(id);
  }, [saveState]);

  const selectedCountry = countries?.find((c) => c.code === selectedCode) ?? null;

  const visibleCountries = useMemo(() => (countries ? filterContourCountries(countries, countryQuery) : []), [countries, countryQuery]);

  useEffect(() => {
    setPlacesPage(1);
    setSelectedPlaceIndex(null);
  }, [selectedCode]);

  // Same pool the game's own city phase draws from (`randomPlacesFor`, filtered by country code
  // there too) — this admin view only narrows by country, every difficulty shown together.
  const countryPlaces = useMemo(() => places?.filter((row) => row.code === selectedCode) ?? [], [places, selectedCode]);
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
  const boardSize = useMemo(
    () => (selectedCountry ? boardDimensionsFor(selectedCountry.points, BOARD_MAX_WIDTH, BOARD_MAX_HEIGHT) : { width: BOARD_MAX_WIDTH, height: BOARD_MAX_HEIGHT }),
    [selectedCountry],
  );
  // Only the outline itself still goes through a geographic projection (lon/lat) — see
  // BOARD_PADDING_RATIO's own doc comment for why this is a ratio, not a fixed pixel count.
  // Neighbors and the country's own flag/name anchor are both plain `x`/`y` fractions of this
  // canvas now (see `positionFor`/`positionForCenterLabel`), no projection involved.
  const project = useMemo(
    () => (selectedCountry ? createProjector(selectedCountry.points, boardSize, Math.min(boardSize.width, boardSize.height) * BOARD_PADDING_RATIO) : null),
    [selectedCountry, boardSize],
  );

  // The clicked place's true position, projected the same way as the outline (geographic lon/lat,
  // not a fraction like neighbors) — highlighted in yellow so a wrongly-placed or duplicate entry
  // is obvious before excluding it.
  const selectedPlacePosition = useMemo(
    () => (selectedPlace && project ? project([selectedPlace.coordinates.longitude, selectedPlace.coordinates.latitude]) : null),
    [selectedPlace, project],
  );

  const outlinePath = useMemo(
    () => (selectedCountry && project ? polylinePath(projectPoints(selectedCountry.points, project)) : ''),
    [selectedCountry, project],
  );

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
    const label = selectedCountry?.centerLabel;
    return label ? { x: label.x * boardSize.width, y: label.y * boardSize.height } : { x: 0, y: 0 };
  };

  const handleDelete = async (country: ContourCountry, neighbor: ContourNeighbor) => {
    await deleteNeighbor(country, neighbor);
    setCountries((cur) => cur?.map((c) => (c.code === country.code ? { ...c, neighbors: c.neighbors.filter((n) => n !== neighbor) } : c)) ?? cur);
  };

  const commitDrag = (country: ContourCountry, index: number, finalPixel: Point2D) => {
    if (!countries) return;
    const previous = country.neighbors[index];
    const x = finalPixel.x / boardSize.width;
    const y = finalPixel.y / boardSize.height;

    setCountries(
      countries.map((c) => (c.code === country.code ? { ...c, neighbors: c.neighbors.map((n, i) => (i === index ? { ...n, x, y } : n)) } : c)),
    );
    setSaveState({ code: country.code, index, status: 'saving' });

    saveNeighborPosition(country, previous, { x, y })
      .then((updated) => {
        setCountries((cur) =>
          cur?.map((c) => (c.code === country.code ? { ...c, neighbors: c.neighbors.map((n, i) => (i === index ? updated : n)) } : c)) ?? cur,
        );
        setSaveState({ code: country.code, index, status: 'saved' });
      })
      .catch((err: Error) => {
        setCountries((cur) =>
          cur?.map((c) => (c.code === country.code ? { ...c, neighbors: c.neighbors.map((n, i) => (i === index ? previous : n)) } : c)) ?? cur,
        );
        setSaveState({ code: country.code, index, status: 'error', message: err.message });
      });
  };

  const centerDragStart = useRef<{ clientX: number; clientY: number; pixel: Point2D } | null>(null);

  const commitCenterDrag = (country: ContourCountry, finalPixel: Point2D) => {
    if (!countries) return;
    const previous = country.centerLabel;
    const next = { x: finalPixel.x / boardSize.width, y: finalPixel.y / boardSize.height };

    setCountries(countries.map((c) => (c.code === country.code ? { ...c, centerLabel: next } : c)));

    saveCenterLabelPosition(country, previous, next).catch(() => {
      setCountries((cur) => cur?.map((c) => (c.code === country.code ? { ...c, centerLabel: previous } : c)) ?? cur);
    });
  };

  const beginCenterDrag = (country: ContourCountry) => (event: React.MouseEvent) => {
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
      commitCenterDrag(country, finalPixel);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const beginDrag = (country: ContourCountry, index: number, neighbor: ContourNeighbor) => (event: React.MouseEvent) => {
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
      commitDrag(country, index, finalPixel);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const saveFlagFor = (index: number) => {
    if (!selectedCountry || saveState?.code !== selectedCountry.code || saveState.index !== index) return null;
    if (saveState.status === 'saving') return <span className="save-flag saving">…</span>;
    if (saveState.status === 'saved') return <span className="save-flag saved">✓</span>;
    return (
      <span className="save-flag error" title={saveState.message}>
        ⚠
      </span>
    );
  };

  if (loadError) {
    return <div className="empty">Impossible de charger les pays Contour : {loadError}</div>;
  }

  if (!countries || !selectedCountry) {
    return <div className="empty">Chargement…</div>;
  }

  return (
    <>
      <div className="panel">
        <div className="row">
          <span className="field-label">Recherche</span>
          <input type="search" placeholder="Nom ou code…" value={countryQuery} onChange={(e) => setCountryQuery(e.target.value)} />
        </div>
        <span className="field-label">Pays</span>
        <div className="row">
          {visibleCountries.length === 0 && <p className="count-line">Aucun pays ne correspond à cette recherche.</p>}
          {visibleCountries.map((c) => (
            <button key={c.code} type="button" className="chip" aria-pressed={c.code === selectedCode} onClick={() => setSelectedCode(c.code)}>
              <span style={{ fontFamily: FLAG_FONT_FAMILY }}>{flagEmoji(c.code)}</span>
              {countryName(c.code, 'fr')}
            </button>
          ))}
        </div>
      </div>

      <p className="count-line">
        Fais glisser un voisin (ou le drapeau/nom au centre) pour ajuster sa position — le dépôt journalise le nouveau réglage, rien n'est écrit dans
        les fichiers. Le point se pose exactement là où tu le lâches, et c'est exactement ce qui s'affiche dans le jeu.
      </p>

      <div className="contour-main-row">
        <div className="contour-board-wrap" style={{ width: boardSize.width, height: boardSize.height }}>
          <svg className="contour-svg" width={boardSize.width} height={boardSize.height}>
            <path className="contour-outline" d={outlinePath} />
            {/* The place clicked in "Lieux possibles" below, highlighted so a wrongly-placed or
                duplicate entry is obvious before excluding it (see `selectedPlacePosition`). */}
            {selectedPlacePosition && <circle className="contour-place-highlight" cx={selectedPlacePosition.x} cy={selectedPlacePosition.y} r={7} />}
          </svg>
          {selectedCountry.neighbors.map((neighbor, index) => {
            const pos = positionFor(index, neighbor);
            return (
              <div
                key={index}
                className={`contour-neighbor${dragPos?.index === index ? ' dragging' : ''}`}
                style={{ left: pos.x, top: pos.y }}
                onMouseDown={beginDrag(selectedCountry, index, neighbor)}
              >
                {/* Icon at `pos`, name stacked just below — same layout as the real game's tier
                    1 (icon)/tier 2 (icon+name), shown here always at once since this is a static
                    preview rather than a tiered reveal. */}
                <span className="contour-neighbor-icon" style={neighbor.type === 'country' ? { fontFamily: FLAG_FONT_FAMILY } : undefined}>
                  {neighborIcon(neighbor)}
                </span>
                <span className="contour-neighbor-name">{neighborName(neighbor)}</span>
                {/* Stops the mousedown from bubbling to the anchor's own `onMouseDown` above (which
                    would otherwise start a drag instead of letting this click through). */}
                <span className="contour-neighbor-delete" onMouseDown={(event) => event.stopPropagation()}>
                  <DeleteX name={neighborName(neighbor)} onDelete={() => handleDelete(selectedCountry, neighbor)} />
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
                onMouseDown={beginCenterDrag(selectedCountry)}
              >
                <span className="contour-neighbor-icon" style={{ fontFamily: FLAG_FONT_FAMILY }}>
                  {flagEmoji(selectedCountry.code)}
                </span>
                <span className="contour-neighbor-name">{countryName(selectedCountry.code, 'fr')}</span>
              </div>
            );
          })()}
        </div>

        <div className="contour-places-panel">
          <span className="field-label">
            Lieux possibles ({countryPlaces.length}) — pioché pour la phase "placer une ville". Clique un lieu pour le repérer en jaune sur la carte.
          </span>
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

      <div className="contour-neighbor-list">
        {selectedCountry.neighbors.map((neighbor, index) => (
          <div className="contour-neighbor-row" key={index}>
            <span style={neighbor.type === 'country' ? { fontFamily: FLAG_FONT_FAMILY } : undefined}>{neighborIcon(neighbor)}</span>
            <span>{neighborName(neighbor)}</span>
            <span className="coord">
              x {(neighbor.x * 100).toFixed(1)}%, y {(neighbor.y * 100).toFixed(1)}%
            </span>
            {saveFlagFor(index)}
          </div>
        ))}
      </div>

      <footer>{countries.length} pays Contour — les déplacements et suppressions sont enregistrés dans le journal (en haut), pas dans neighbors.ts.</footer>
    </>
  );
};
