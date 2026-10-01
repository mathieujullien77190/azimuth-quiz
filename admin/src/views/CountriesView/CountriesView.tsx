import { useEffect, useMemo, useState } from 'react';

import { flagEmoji } from '@/helpers/flagEmoji';
import { allContours } from '../../api/contour';
import { FLAG_FONT_FAMILY } from '@/themes/fonts';

import {
  fetchCountries,
  saveContourDifficulty,
  saveCountry,
  type CountryPatch,
  type CountryRecord,
} from '../../api/countries';
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS, DIFFICULTY_ORDER } from '../../constants';
import { countryName } from '../../data';
import { EditableValue } from '../../components/EditableValue';
import { Pagination, pageCount, paginate } from '../../components/Pagination';
import { ContourEditor } from '../ContourView';

import { FlagEditor } from './FlagEditor';
import { CONTINENT_LABELS, CONTINENT_ORDER } from './constants';
import { filterCountries, sortCountries } from './helpers';
import type { Difficulty } from '@/types';

import type { Continent, Field, SaveState, SortKey } from './types';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'fr', label: 'Nom (FR)' },
  { key: 'en', label: 'Nom (EN)' },
  { key: 'code', label: 'Code' },
];

export const CountriesView = () => {
  const [countries, setCountries] = useState<CountryRecord[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState | null>(null);

  const [query, setQuery] = useState('');
  const [continent, setContinent] = useState<Continent | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('fr');
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [page, setPage] = useState(1);
  // Which card's own Contour/Silhouette editor is expanded (see the "🗺️ Silhouette" toggle below)
  // — at most one at a time, so the page never mounts more than one interactive SVG board.
  const [expandedContourCode, setExpandedContourCode] = useState<string | null>(null);

  // Cards whose "Afficher les voisins" list is open (any number at once: it is only a line of text;
  // the map decor it also turns on lives in the Silhouette editor, which stays one at a time).
  const [neighborsOpen, setNeighborsOpen] = useState<ReadonlySet<string>>(new Set());
  const toggleNeighbors = (code: string) =>
    setNeighborsOpen((current) => {
      const next = new Set(current);
      if (!next.delete(code)) next.add(code);
      return next;
    });

  useEffect(() => {
    fetchCountries()
      .then(setCountries)
      .catch((err: Error) => setLoadError(err.message));
  }, []);

  useEffect(() => {
    if (saveState?.status !== 'saved') return;
    const id = setTimeout(() => setSaveState(null), 1500);
    return () => clearTimeout(id);
  }, [saveState]);

  useEffect(() => {
    setPage(1);
  }, [query, continent, sortKey, sortDir]);

  const visible = useMemo(() => {
    if (!countries) return [];
    return sortCountries(filterCountries(countries, query, continent), sortKey, sortDir);
  }, [countries, query, continent, sortKey, sortDir]);

  const totalPages = pageCount(visible.length);
  const pageRows = useMemo(() => paginate(visible, page), [visible, page]);

  const handleChange = (row: CountryRecord, field: Field, patch: CountryPatch) => {
    const previous = countries!.find((c) => c.code === row.code)!;
    setCountries((cur) => cur!.map((c) => (c.code === row.code ? { ...c, ...patch } : c)));
    setSaveState({ code: row.code, field, status: 'saving' });

    saveCountry(row, patch)
      .then((updated) => {
        setCountries((cur) => cur!.map((c) => (c.code === row.code ? updated : c)));
        setSaveState({ code: row.code, field, status: 'saved' });
      })
      .catch((err: Error) => {
        setCountries((cur) => cur!.map((c) => (c.code === row.code ? previous : c)));
        setSaveState({ code: row.code, field, status: 'error', message: err.message });
      });
  };

  /** The Silhouette difficulty: its own write, because the group numbers follow (see `saveContourDifficulty`). */
  const handleDifficultyChange = (row: CountryRecord, difficulty: Difficulty) => {
    const previous = countries!.find((c) => c.code === row.code)!;
    setCountries((cur) => cur!.map((c) => (c.code === row.code ? { ...c, difficulty } : c)));
    setSaveState({ code: row.code, field: 'difficulty', status: 'saving' });

    saveContourDifficulty(row, difficulty)
      .then(() => setSaveState({ code: row.code, field: 'difficulty', status: 'saved' }))
      .catch((err: Error) => {
        setCountries((cur) => cur!.map((c) => (c.code === row.code ? previous : c)));
        setSaveState({ code: row.code, field: 'difficulty', status: 'error', message: err.message });
      });
  };

  const saveFlagFor = (row: CountryRecord, field: Field) => {
    const s = saveState?.code === row.code && saveState.field === field ? saveState : null;
    if (!s) return null;
    if (s.status === 'saving') return <span className="save-flag saving">…</span>;
    if (s.status === 'saved') return <span className="save-flag saved">✓</span>;
    return (
      <span className="save-flag error" title={s.message}>
        ⚠
      </span>
    );
  };

  if (loadError) {
    return <div className="empty">Impossible de charger les pays : {loadError}</div>;
  }

  if (!countries) {
    return <div className="empty">Chargement…</div>;
  }

  return (
    <>
      <div className="panel">
        <div className="row">
          <span className="field-label">Recherche</span>
          <input type="search" placeholder="Nom ou code…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="row">
          <span className="field-label">Continent</span>
          <button className="chip" type="button" aria-pressed={continent === null} onClick={() => setContinent(null)}>
            Tous
          </button>
          {CONTINENT_ORDER.map((key) => (
            <button
              key={key}
              className="chip"
              type="button"
              aria-pressed={continent === key}
              onClick={() => setContinent(continent === key ? null : key)}
            >
              {CONTINENT_LABELS[key]}
            </button>
          ))}
        </div>
        <div className="row">
          <span className="field-label">Tri</span>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
          <button className="reset" type="button" onClick={() => setSortDir((d) => (d === 1 ? -1 : 1))}>
            {sortDir === 1 ? '▲ croissant' : '▼ décroissant'}
          </button>
        </div>
      </div>

      <p className="count-line">
        <b>{visible.length}</b> pays affiché{visible.length === 1 ? '' : 's'} sur {countries.length}
      </p>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <div className="cards-scroll">
        {pageRows.length === 0 && <div className="empty">Aucun pays ne correspond à cette recherche.</div>}
        {pageRows.map((row) => {
          const contourCountry = allContours().find((c) => c.code === row.code);
          const contourExpanded = expandedContourCode === row.code;
          const showNeighbors = neighborsOpen.has(row.code);
          return (
            <div className="place-card" key={row.code}>
              <div className="place-header">
                <div className="place-identity">
                  <span className="place-name">{row.fr}</span>
                  <span className="place-meta">{row.code}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
                  <button
                    type="button"
                    className="chip"
                    aria-pressed={showNeighbors}
                    onClick={() => toggleNeighbors(row.code)}
                  >
                    {showNeighbors ? 'Masquer les voisins' : 'Afficher les voisins'}
                  </button>
                  {row.difficulty !== null && (
                    <div className="field-cell">
                      <select
                        className="field-select"
                        aria-label="Difficulté Silhouette"
                        style={{ '--tier-color': DIFFICULTY_COLORS[row.difficulty] } as React.CSSProperties}
                        value={row.difficulty}
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
                  )}
                  {contourCountry && (
                    <button
                      type="button"
                      className="chip"
                      aria-pressed={contourExpanded}
                      onClick={() => setExpandedContourCode(contourExpanded ? null : row.code)}
                    >
                      🗺️ Silhouette
                    </button>
                  )}
                  <span style={{ fontFamily: FLAG_FONT_FAMILY, fontSize: 28 }}>{flagEmoji(row.code)}</span>
                </div>
              </div>

              <table className="kv-table">
                <tbody>
                  <tr>
                    <th>Nom (FR)</th>
                    <td>
                      <EditableValue
                        value={row.fr}
                        saveFlag={saveFlagFor(row, 'fr')}
                        onSave={(next) => handleChange(row, 'fr', { fr: next })}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>Nom (EN)</th>
                    <td>
                      <EditableValue
                        value={row.en}
                        saveFlag={saveFlagFor(row, 'en')}
                        onSave={(next) => handleChange(row, 'en', { en: next })}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>Devise</th>
                    <td>
                      <EditableValue
                        value={row.currency ?? ''}
                        saveFlag={saveFlagFor(row, 'currency')}
                        onSave={(next) => handleChange(row, 'currency', { currency: next })}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>Symbole</th>
                    <td>
                      <EditableValue
                        value={row.currencySymbol ?? ''}
                        saveFlag={saveFlagFor(row, 'currencySymbol')}
                        onSave={(next) => handleChange(row, 'currencySymbol', { currencySymbol: next })}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>Indicatif</th>
                    <td>
                      <EditableValue
                        value={row.phoneCode ?? ''}
                        saveFlag={saveFlagFor(row, 'phoneCode')}
                        onSave={(next) => handleChange(row, 'phoneCode', { phoneCode: next })}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>Drapeau</th>
                    <td>
                      <FlagEditor
                        value={row.flag ?? []}
                        saveFlag={saveFlagFor(row, 'flag')}
                        onSave={(next) => handleChange(row, 'flag', { flag: next })}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>

              {showNeighbors && (
                <div className="neighbors-list">
                  {row.neighbors.length === 0 ? (
                    <span className="place-meta">Aucun voisin terrestre.</span>
                  ) : (
                    row.neighbors.map((code) => (
                      <span className="neighbor-tag" key={code}>
                        <span style={{ fontFamily: FLAG_FONT_FAMILY, fontSize: 18 }}>{flagEmoji(code)}</span>
                        {countryName(code)}
                        <span className="place-meta">{code}</span>
                      </span>
                    ))
                  )}
                </div>
              )}

              {contourExpanded && contourCountry && (
                <ContourEditor initialCountry={contourCountry} showNeighbors={showNeighbors} />
              )}
            </div>
          );
        })}
      </div>

      <footer>{countries.length} pays — les modifications sont enregistrées directement dans Firestore.</footer>
    </>
  );
};
