import { useEffect, useMemo, useState } from 'react';

import { fetchPlaces, type PlaceRow } from '../../api/places';
import { PlaceCard } from './PlaceCard';
import { usePlaceEditing } from './usePlaceEditing';
import { ChipGroup, toggleInSet } from '../../components/ChipGroup';
import { Pagination, pageCount, paginate } from '../../components/Pagination';
import {
  CATEGORY_COLORS,
  CATEGORY_EMOJIS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  DIFFICULTY_COLORS,
  DIFFICULTY_LABELS,
  DIFFICULTY_ORDER,
} from '../../constants';

import { filterRows } from './helpers';

export const PlacesView = () => {
  const [rows, setRows] = useState<PlaceRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [panelOpen, setPanelOpen] = useState(true);
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState(new Set(CATEGORY_ORDER));
  const [difficulties, setDifficulties] = useState(new Set(DIFFICULTY_ORDER));
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchPlaces()
      .then(setRows)
      .catch((err: Error) => setLoadError(err.message));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query, categories, difficulties]);

  const visibleRows = useMemo(() => {
    if (!rows) return [];
    return filterRows(rows, query, categories, difficulties);
  }, [rows, query, categories, difficulties]);

  const totalPages = pageCount(visibleRows.length);
  const pageRows = useMemo(() => paginate(visibleRows, page), [visibleRows, page]);

  const { saveFlagFor, handleDifficultyChange, handleCompassChange, handleCluesChange, handleDelete } = usePlaceEditing(setRows);

  const resetFilters = () => {
    setQuery('');
    setCategories(new Set(CATEGORY_ORDER));
    setDifficulties(new Set(DIFFICULTY_ORDER));
  };

  if (loadError) {
    return <div className="empty">Impossible de charger les lieux : {loadError}</div>;
  }

  if (!rows) {
    return <div className="empty">Chargement…</div>;
  }

  return (
    <>
      <div className="panel">
        <div className="row panel-header">
          <span className="field-label">Filtres</span>
          <button className="reset" type="button" onClick={() => setPanelOpen((open) => !open)}>
            {panelOpen ? '▲ Réduire' : '▼ Déplier'}
          </button>
        </div>
        {panelOpen && (
          <>
            <div className="row">
              <span className="field-label">Recherche</span>
              <input
                type="search"
                placeholder="Nom du lieu, pays ou code…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button className="reset" type="button" onClick={resetFilters}>
                Réinitialiser
              </button>
            </div>
            <div className="row">
              <span className="field-label">Catégorie (Compass)</span>
              <ChipGroup
                order={CATEGORY_ORDER}
                labels={CATEGORY_LABELS}
                active={categories}
                onToggle={(key) => setCategories(toggleInSet(categories, key))}
                colors={CATEGORY_COLORS}
                emojis={CATEGORY_EMOJIS}
              />
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
          </>
        )}
      </div>

      <p className="count-line">
        <b>{visibleRows.length}</b> lieu{visibleRows.length === 1 ? '' : 'x'} affiché
        {visibleRows.length === 1 ? '' : 's'} sur {rows.length}
      </p>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <div className="cards-scroll">
        {pageRows.length === 0 && <div className="empty">Aucun lieu ne correspond à ces filtres.</div>}
        {pageRows.map((row) => (
          <PlaceCard
            key={row.key}
            row={row}
            saveFlagFor={saveFlagFor}
            onDifficultyChange={handleDifficultyChange}
            onCompassChange={handleCompassChange}
            onCluesChange={handleCluesChange}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </>
  );
};
