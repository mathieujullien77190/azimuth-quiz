import { useEffect, useMemo, useState } from 'react';

import { deletePlace, fetchPlaces, saveBoussole, saveDifficulty, saveIndices, type BoussolePatch, type IndicesPatch, type PlaceRow } from '../../api/places';
import { ChipGroup, toggleInSet } from '../../components/ChipGroup';
import { DeleteX } from '../../components/DeleteX';
import { DescriptionCell } from '../../components/DescriptionCell';
import { EditableValue } from '../../components/EditableValue';
import { Pagination, pageCount, paginate } from '../../components/Pagination';
import { WikiLinks } from '../../components/WikiLinks';
import {
  CATEGORY_COLORS,
  CATEGORY_EMOJIS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  countryFor,
  DIFFICULTY_COLORS,
  DIFFICULTY_LABELS,
  DIFFICULTY_ORDER,
  POSITION_LABELS,
} from '../../constants';
import type { Category, Difficulty } from '@/types';

import { filterRows, fmtCoord, INDICES_FIELD_BY_KEY } from './helpers';
import type { Field, SaveState } from './types';

export const PlacesView = () => {
  const [rows, setRows] = useState<PlaceRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState | null>(null);

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
    if (saveState?.status !== 'saved') return;
    const id = setTimeout(() => setSaveState(null), 1500);
    return () => clearTimeout(id);
  }, [saveState]);

  useEffect(() => {
    setPage(1);
  }, [query, categories, difficulties]);

  const visibleRows = useMemo(() => {
    if (!rows) return [];
    return filterRows(rows, query, categories, difficulties);
  }, [rows, query, categories, difficulties]);

  const totalPages = pageCount(visibleRows.length);
  const pageRows = useMemo(() => paginate(visibleRows, page), [visibleRows, page]);

  const resetFilters = () => {
    setQuery('');
    setCategories(new Set(CATEGORY_ORDER));
    setDifficulties(new Set(DIFFICULTY_ORDER));
  };

  const handleDifficultyChange = (row: PlaceRow, difficulty: Difficulty) => {
    if (!rows) return;
    const previousBoussole = row.boussole;
    const previousIndices = row.indices;
    setRows(
      rows.map((r) =>
        r.index === row.index
          ? { ...r, boussole: r.boussole && { ...r.boussole, difficulty }, indices: r.indices && { ...r.indices, difficulty } }
          : r,
      ),
    );
    setSaveState({ index: row.index, field: 'difficulty', status: 'saving' });

    saveDifficulty(row, difficulty)
      .then(({ boussole, indices }) => {
        setRows((cur) => cur?.map((r) => (r.index === row.index ? { ...r, boussole, indices } : r)) ?? cur);
        setSaveState({ index: row.index, field: 'difficulty', status: 'saved' });
      })
      .catch((err: Error) => {
        setRows((cur) => cur?.map((r) => (r.index === row.index ? { ...r, boussole: previousBoussole, indices: previousIndices } : r)) ?? cur);
        setSaveState({ index: row.index, field: 'difficulty', status: 'error', message: err.message });
      });
  };

  const handleBoussoleChange = (row: PlaceRow, patch: BoussolePatch) => {
    if (!rows || !row.boussole) return;
    const field: Field = 'category' in patch ? 'category' : 'description';
    const previous = row.boussole;
    setRows(rows.map((r) => (r.index === row.index ? { ...r, boussole: { ...r.boussole!, ...patch } } : r)));
    setSaveState({ index: row.index, field, status: 'saving' });

    saveBoussole(row, patch)
      .then((updated) => {
        setRows((cur) => cur?.map((r) => (r.index === row.index ? { ...r, boussole: updated } : r)) ?? cur);
        setSaveState({ index: row.index, field, status: 'saved' });
      })
      .catch((err: Error) => {
        setRows((cur) => cur?.map((r) => (r.index === row.index ? { ...r, boussole: previous } : r)) ?? cur);
        setSaveState({ index: row.index, field, status: 'error', message: err.message });
      });
  };

  const handleIndicesChange = (row: PlaceRow, patch: IndicesPatch) => {
    if (!rows || !row.indices) return;
    const key = Object.keys(patch)[0];
    const field = INDICES_FIELD_BY_KEY[key];
    const previous = row.indices;
    setRows(rows.map((r) => (r.index === row.index ? { ...r, indices: { ...r.indices!, ...patch } } : r)));
    setSaveState({ index: row.index, field, status: 'saving' });

    saveIndices(row, patch)
      .then((updated) => {
        setRows((cur) => cur?.map((r) => (r.index === row.index ? { ...r, indices: updated } : r)) ?? cur);
        setSaveState({ index: row.index, field, status: 'saved' });
      })
      .catch((err: Error) => {
        setRows((cur) => cur?.map((r) => (r.index === row.index ? { ...r, indices: previous } : r)) ?? cur);
        setSaveState({ index: row.index, field, status: 'error', message: err.message });
      });
  };

  const saveFlagFor = (row: PlaceRow, field: Field) => {
    const s = saveState?.index === row.index && saveState.field === field ? saveState : null;
    if (!s) return null;
    if (s.status === 'saving') return <span className="save-flag saving">…</span>;
    if (s.status === 'saved') return <span className="save-flag saved">✓</span>;
    return (
      <span className="save-flag error" title={s.message}>
        ⚠
      </span>
    );
  };

  const handleDelete = async (row: PlaceRow) => {
    await deletePlace(row);
    setRows((cur) => (cur ?? []).filter((r) => r.index !== row.index));
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
              <input type="search" placeholder="Nom du lieu, pays ou code…" value={query} onChange={(e) => setQuery(e.target.value)} />
              <button className="reset" type="button" onClick={resetFilters}>
                Réinitialiser
              </button>
            </div>
            <div className="row">
              <span className="field-label">Catégorie (Boussole)</span>
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
        <b>{visibleRows.length}</b> lieu{visibleRows.length === 1 ? '' : 'x'} affiché{visibleRows.length === 1 ? '' : 's'} sur {rows.length}
      </p>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <div className="cards-scroll">
        {pageRows.length === 0 && <div className="empty">Aucun lieu ne correspond à ces filtres.</div>}
        {pageRows.map((row) => (
          <div className="place-card" key={row.index}>
            <div className="place-header">
              <div className="place-identity">
                <span className="place-name">{row.name}</span>
                <span className="place-meta" title={countryFor(row.code)}>
                  {countryFor(row.code)} ({row.code})
                </span>
              </div>
              <div className="place-coords">
                <span className="coord">{fmtCoord(row.coordinates.latitude, 'N', 'S')}</span>
                <span className="coord">{fmtCoord(row.coordinates.longitude, 'E', 'O')}</span>
              </div>
              {row.boussole && (
                <div className="field-cell">
                  <select
                    className="field-select"
                    style={{ '--tier-color': CATEGORY_COLORS[row.boussole.category] } as React.CSSProperties}
                    value={row.boussole.category}
                    onChange={(e) => handleBoussoleChange(row, { category: e.target.value as Category })}
                  >
                    {CATEGORY_ORDER.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_EMOJIS[c]} {CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                  {saveFlagFor(row, 'category')}
                </div>
              )}
              <div className="field-cell">
                <select
                  className="field-select"
                  style={{ '--tier-color': DIFFICULTY_COLORS[(row.boussole ?? row.indices)!.difficulty] } as React.CSSProperties}
                  value={(row.boussole ?? row.indices)!.difficulty}
                  onChange={(e) => handleDifficultyChange(row, e.target.value as Difficulty)}
                >
                  {DIFFICULTY_ORDER.map((d) => (
                    <option key={d} value={d}>
                      {DIFFICULTY_LABELS[d]}
                    </option>
                  ))}
                </select>
                {saveFlagFor(row, 'difficulty')}
              </div>
              <DeleteX name={row.name} onDelete={() => handleDelete(row)} />
            </div>

            <div className="place-games">
              <div className="game-block">
                <h3 className="game-title">Boussole</h3>
                {row.boussole ? (
                  <table className="kv-table">
                    <tbody>
                      <tr>
                        <th>Wiki</th>
                        <td>
                          <WikiLinks wikiFr={row.boussole.wikiFr} wikiEn={row.boussole.wikiEn} />
                        </td>
                      </tr>
                      <tr>
                        <th>Texte</th>
                        <td>
                          <DescriptionCell
                            value={row.boussole.description ?? ''}
                            saveFlag={saveFlagFor(row, 'description')}
                            onSave={(next) => handleBoussoleChange(row, { description: next })}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <p className="absent">Absent de Boussole</p>
                )}
              </div>

              <div className="game-block">
                <h3 className="game-title">Indices</h3>
                {row.indices ? (
                  <table className="kv-table">
                    <tbody>
                      <tr>
                        <th>Position</th>
                        <td className="muted">{POSITION_LABELS[row.indices.positionInCountry]}</td>
                      </tr>
                      <tr>
                        <th>Population</th>
                        <td>
                          <EditableValue
                            type="number"
                            value={String(row.indices.population)}
                            display={row.indices.population.toLocaleString('fr-FR')}
                            saveFlag={saveFlagFor(row, 'population')}
                            onSave={(next) => handleIndicesChange(row, { population: Number(next) })}
                          />
                        </td>
                      </tr>
                      <tr>
                        <th>Climat</th>
                        <td>
                          <EditableValue
                            value={row.indices.climateEmoji}
                            saveFlag={saveFlagFor(row, 'climate')}
                            onSave={(next) => handleIndicesChange(row, { climateEmoji: next })}
                          />
                        </td>
                      </tr>
                      <tr>
                        <th>Altitude</th>
                        <td className="muted">{row.indices.elevationMeters} m</td>
                      </tr>
                      <tr>
                        <th>Fuseau horaire</th>
                        <td className="muted">{row.indices.timezone}</td>
                      </tr>
                      <tr>
                        <th>Indicatif</th>
                        <td className="muted">{row.indices.phoneCode}</td>
                      </tr>
                      <tr>
                        <th>Devise</th>
                        <td className="muted">{row.indices.currency}</td>
                      </tr>
                      <tr>
                        <th>Aéroport</th>
                        <td className="muted">{row.indices.airportCode}</td>
                      </tr>
                      <tr>
                        <th>Emojis</th>
                        <td>
                          <EditableValue
                            value={row.indices.emojis.join(' ')}
                            saveFlag={saveFlagFor(row, 'emojis')}
                            onSave={(next) => {
                              const parts = next.split(/\s+/).filter(Boolean);
                              handleIndicesChange(row, { emojis: [parts[0] ?? '', parts[1] ?? '', parts[2] ?? ''] });
                            }}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <p className="absent">Absent d’Indices</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
