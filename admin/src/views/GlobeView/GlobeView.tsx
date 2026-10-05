import { useEffect, useMemo, useState } from 'react';

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
import { PlaceCard } from '../PlacesView/PlaceCard';
import { usePlaceEditing } from '../PlacesView/usePlaceEditing';
import type { Category, Difficulty } from '@/types';

import { PLACE_ALTITUDE } from './constants';
import { GlobeCanvas, type GlobeHit } from './GlobeCanvas';
import { markFor, placeBuffers, searchTargets, visiblePlaces } from './helpers';
import type { SearchTarget, Selection } from './types';

/**
 * The Monde page: the whole world in 3D with every place (coloured by its Compass category, drawn round, star or square).
 * Clicking one opens the very same card the Places list uses, in a side panel, and an edit there is written through the
 * same functions as in that list, then the globe follows.
 */
export const GlobeView = () => {
  const [rows, setRows] = useState<PlaceRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Set<Category>>(new Set(CATEGORY_ORDER));
  const [difficulties, setDifficulties] = useState<Set<Difficulty>>(new Set(DIFFICULTY_ORDER));

  const [selection, setSelection] = useState<Selection | null>(null);
  const [hover, setHover] = useState<GlobeHit | null>(null);
  const [query, setQuery] = useState('');
  const [fly, setFly] = useState<{ lon: number; lat: number; token: number } | null>(null);
  const [resetToken, setResetToken] = useState(0);

  useEffect(() => {
    fetchPlaces()
      .then(setRows)
      .catch((err: Error) => setLoadError(err.message));
  }, []);

  const placeEditing = usePlaceEditing(setRows);

  const visibleRows = useMemo(() => visiblePlaces(rows ?? [], categories, difficulties), [rows, categories, difficulties]);
  const buffers = useMemo(() => placeBuffers(visibleRows, PLACE_ALTITUDE), [visibleRows]);
  const placeKeys = useMemo(() => visibleRows.map((row) => row.key), [visibleRows]);
  const placeNames = useMemo(() => visibleRows.map((row) => row.name), [visibleRows]);
  const selectedMark = useMemo(() => markFor(selection, rows ?? []), [selection, rows]);
  const hoveredMark = useMemo(
    () => markFor(hover && { kind: hover.kind, id: hover.id }, rows ?? []),
    [hover, rows],
  );
  const results = useMemo(() => searchTargets(query, rows ?? []), [query, rows]);

  const select = (next: Selection | null) => {
    setSelection(next);
  };

  const goTo = (target: SearchTarget) => {
    select({ kind: target.kind, id: target.id });
    setFly((current) => ({ lon: target.lon, lat: target.lat, token: (current?.token ?? 0) + 1 }));
    setQuery('');
  };

  if (loadError) return <div className="empty">Impossible de charger le monde : {loadError}</div>;
  if (!rows) return <div className="empty">Chargement…</div>;

  const selectedPlace = selection?.kind === 'place' ? rows.find((row) => row.key === selection.id) : undefined;
  const hoverLabel = hover && rows.find((row) => row.key === hover.id)?.name;

  return (
    <>
      <div className="panel globe-toolbar">
        <div className="row">
          <span className="field-label">Recherche</span>
          <div className="globe-search">
            <input
              type="search"
              placeholder="Ville, lieu, pays…"
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
          <span className="field-label">Difficulté</span>
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
        <b>{visibleRows.length}</b> lieu{visibleRows.length === 1 ? '' : 'x'} sur {rows.length} — zoome pour voir les noms ; clic sur un
        point pour l’ouvrir.
      </p>

      <div className="globe-stage">
        <GlobeCanvas
          placeBuffers={buffers}
          placeKeys={placeKeys}
          placeNames={placeNames}
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
        {selectedPlace && (
          <aside className="globe-panel" aria-label="Détail">
            <button className="reset globe-panel-close" type="button" onClick={() => select(null)}>
              ✕ Fermer
            </button>
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
          </aside>
        )}
      </div>
    </>
  );
};
