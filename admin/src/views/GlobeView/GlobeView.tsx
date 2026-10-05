import { useEffect, useMemo, useState } from 'react';

import { allContours } from '../../api/contour';
import { fetchCountries, type CountryRecord } from '../../api/countries';
import { fetchPlaces, type PlaceRow } from '../../api/places';
import { ChipGroup, toggleInSet } from '../../components/ChipGroup';
import {
  CATEGORY_COLORS,
  CATEGORY_EMOJIS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  DIFFICULTY_COLORS,
  DIFFICULTY_LABELS,
  DIFFICULTY_ORDER,
} from '../../constants';
import { CountryCard } from '../CountriesView/CountryCard';
import { useCountryEditing } from '../CountriesView/useCountryEditing';
import { PlaceCard } from '../PlacesView/PlaceCard';
import { usePlaceEditing } from '../PlacesView/usePlaceEditing';
import type { Category, Difficulty } from '@/types';

import { COUNTRY_ALTITUDE, PLACE_ALTITUDE } from './constants';
import { GlobeCanvas, type GlobeHit } from './GlobeCanvas';
import {
  centerOf,
  countryGroups,
  difficultyColor,
  markFor,
  placeBuffers,
  searchTargets,
  shapeOf,
  visiblePlaces,
} from './helpers';
import type { SearchTarget, Selection } from './types';

/**
 * The Monde page: the whole world in 3D, every country outline (coloured by its Silhouette difficulty) and every
 * place (coloured by its Compass category). Clicking one opens the very same card the Places / Countries lists use,
 * in a side panel, and an edit there is written through the same functions as in those lists, then the globe follows.
 */
export const GlobeView = () => {
  const [rows, setRows] = useState<PlaceRow[] | null>(null);
  const [countries, setCountries] = useState<CountryRecord[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showCountries, setShowCountries] = useState(true);
  const [showPlaces, setShowPlaces] = useState(true);
  const [categories, setCategories] = useState<Set<Category>>(new Set(CATEGORY_ORDER));
  const [difficulties, setDifficulties] = useState<Set<Difficulty>>(new Set(DIFFICULTY_ORDER));

  const [selection, setSelection] = useState<Selection | null>(null);
  const [hover, setHover] = useState<GlobeHit | null>(null);
  const [query, setQuery] = useState('');
  const [fly, setFly] = useState<{ lon: number; lat: number; token: number } | null>(null);
  const [resetToken, setResetToken] = useState(0);
  // The country panel's own toggles (neighbors list, Silhouette editor), back to closed for each new selection.
  const [showNeighbors, setShowNeighbors] = useState(false);
  const [contourExpanded, setContourExpanded] = useState(false);

  useEffect(() => {
    Promise.all([fetchPlaces(), fetchCountries()])
      .then(([places, records]) => {
        setRows(places);
        setCountries(records);
      })
      .catch((err: Error) => setLoadError(err.message));
  }, []);

  const placeEditing = usePlaceEditing(setRows);
  const countryEditing = useCountryEditing(countries, setCountries);

  // The countries that have an outline, with their Silhouette difficulty as the list currently has it.
  const shapes = useMemo(() => {
    const difficultyOfCode = new Map((countries ?? []).map((country) => [country.code, country.difficulty]));
    return allContours().map((contour) => shapeOf(contour.code, contour.points, difficultyOfCode.get(contour.code) ?? contour.difficulty));
  }, [countries]);

  const visibleRows = useMemo(() => visiblePlaces(rows ?? [], categories, difficulties), [rows, categories, difficulties]);
  const buffers = useMemo(() => placeBuffers(visibleRows, PLACE_ALTITUDE), [visibleRows]);
  const placeKeys = useMemo(() => visibleRows.map((row) => row.key), [visibleRows]);
  // Each country with an outline, named in French at the middle of that outline.
  const countryNames = useMemo(() => {
    const names = new Map((countries ?? []).map((country) => [country.code, country.fr]));
    return shapes.map((shape) => ({ name: names.get(shape.code) ?? shape.code, ...centerOf(shape) }));
  }, [shapes, countries]);
  const placeNames = useMemo(() => visibleRows.map((row) => row.name), [visibleRows]);
  const groups = useMemo(
    () =>
      countryGroups(shapes, difficulties, COUNTRY_ALTITUDE).map(({ difficulty, positions }) => ({
        color: difficultyColor(difficulty),
        positions,
      })),
    [shapes, difficulties],
  );
  const layers = useMemo(() => ({ countries: showCountries, places: showPlaces }), [showCountries, showPlaces]);
  const selectedMark = useMemo(() => markFor(selection, shapes, rows ?? []), [selection, shapes, rows]);
  const hoveredMark = useMemo(
    () => markFor(hover && { kind: hover.kind, id: hover.id }, shapes, rows ?? []),
    [hover, shapes, rows],
  );
  const results = useMemo(() => searchTargets(query, countries ?? [], shapes, rows ?? []), [query, countries, shapes, rows]);

  const select = (next: Selection | null) => {
    setSelection(next);
    setShowNeighbors(false);
    setContourExpanded(false);
  };

  const goTo = (target: SearchTarget) => {
    select({ kind: target.kind, id: target.id });
    setFly((current) => ({ lon: target.lon, lat: target.lat, token: (current?.token ?? 0) + 1 }));
    setQuery('');
  };

  if (loadError) return <div className="empty">Impossible de charger le monde : {loadError}</div>;
  if (!rows || !countries) return <div className="empty">Chargement…</div>;

  const selectedPlace = selection?.kind === 'place' ? rows.find((row) => row.key === selection.id) : undefined;
  const selectedCountry = selection?.kind === 'country' ? countries.find((country) => country.code === selection.id) : undefined;
  const hoverLabel =
    hover?.kind === 'place'
      ? rows.find((row) => row.key === hover.id)?.name
      : hover && countries.find((country) => country.code === hover.id)?.fr;

  return (
    <>
      <div className="panel globe-toolbar">
        <div className="row">
          <span className="field-label">Recherche</span>
          <div className="globe-search">
            <input
              type="search"
              placeholder="Pays, ville, lieu…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {results.length > 0 && (
              <ul className="globe-results">
                {results.map((target) => (
                  <li key={`${target.kind}-${target.id}`}>
                    <button type="button" onClick={() => goTo(target)}>
                      {target.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button className="chip" type="button" aria-pressed={showCountries} onClick={() => setShowCountries((on) => !on)}>
            Pays
          </button>
          <button className="chip" type="button" aria-pressed={showPlaces} onClick={() => setShowPlaces((on) => !on)}>
            Lieux
          </button>
          <button className="reset" type="button" onClick={() => setResetToken((token) => token + 1)}>
            Recentrer
          </button>
        </div>
        <div className="row">
          <span className="field-label">Catégorie</span>
          <ChipGroup
            order={CATEGORY_ORDER}
            labels={CATEGORY_LABELS}
            active={categories}
            onToggle={(key) => setCategories(toggleInSet(categories, key))}
            colors={CATEGORY_COLORS}
            emojis={CATEGORY_EMOJIS}
          />
          <span className="globe-shapes">● villes · ★ capitales · ■ le reste</span>
        </div>
        <div className="row">
          <span className="field-label">Difficulté (pays et lieux)</span>
          <ChipGroup
            order={DIFFICULTY_ORDER}
            labels={DIFFICULTY_LABELS}
            active={difficulties}
            onToggle={(key) => setDifficulties(toggleInSet(difficulties, key))}
            colors={DIFFICULTY_COLORS}
          />
        </div>
      </div>

      <p className="count-line">
        <b>{visibleRows.length}</b> lieu{visibleRows.length === 1 ? '' : 'x'} sur {rows.length} · <b>{shapes.length}</b> pays dessinés sur{' '}
        {countries.length} — zoome pour voir les noms des pays, puis des lieux ; clic sur un point ou un pays pour l’ouvrir.
      </p>

      <div className="globe-stage">
        <GlobeCanvas
          countryGroups={groups}
          placeBuffers={buffers}
          placeKeys={placeKeys}
          placeNames={placeNames}
          countryNames={countryNames}
          shapes={shapes}
          layers={layers}
          selectedMark={selectedMark}
          hoveredMark={hoveredMark}
          fly={fly}
          resetToken={resetToken}
          onHover={setHover}
          onSelect={select}
        />
        {hover && hoverLabel && (
          <div className="globe-label" style={{ left: hover.x, top: hover.y }}>
            {hoverLabel}
          </div>
        )}
        {(selectedPlace || selectedCountry) && (
          <aside className="globe-panel" aria-label="Détail">
            <button className="reset globe-panel-close" type="button" onClick={() => select(null)}>
              ✕ Fermer
            </button>
            {selectedPlace && (
              <PlaceCard
                row={selectedPlace}
                saveFlagFor={placeEditing.saveFlagFor}
                onDifficultyChange={placeEditing.handleDifficultyChange}
                onCompassChange={placeEditing.handleCompassChange}
                onCluesChange={placeEditing.handleCluesChange}
                onDelete={async (row) => {
                  await placeEditing.handleDelete(row);
                  select(null);
                }}
              />
            )}
            {selectedCountry && (
              <CountryCard
                row={selectedCountry}
                saveFlagFor={countryEditing.saveFlagFor}
                onChange={countryEditing.handleChange}
                onDifficultyChange={countryEditing.handleDifficultyChange}
                showNeighbors={showNeighbors}
                onToggleNeighbors={() => setShowNeighbors((open) => !open)}
                contourExpanded={contourExpanded}
                onToggleContour={() => setContourExpanded((open) => !open)}
              />
            )}
          </aside>
        )}
      </div>
    </>
  );
};
