import { useEffect, useMemo, useState } from 'react';

import { flagEmoji } from '@/constants/places/countries';
import { CONTOURS } from '@/constants/contours';
import { FLAG_FONT_FAMILY } from '@/themes/fonts';

import { fetchCountries, saveCountry, type CountryPatch, type CountryRecord } from '../../api/countries';
import { EditableValue } from '../../components/EditableValue';
import { Pagination, pageCount, paginate } from '../../components/Pagination';
import { ContourEditor } from '../ContourView';

import { FlagEditor } from './FlagEditor';
import { filterCountries, sortCountries } from './helpers';
import type { Field, SaveState, SortKey } from './types';

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
  const [sortKey, setSortKey] = useState<SortKey>('fr');
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [page, setPage] = useState(1);
  // Which card's own Contour/Silhouette editor is expanded (see the "🗺️ Silhouette" toggle below)
  // — at most one at a time, so the page never mounts more than one interactive SVG board.
  const [expandedContourCode, setExpandedContourCode] = useState<string | null>(null);

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
  }, [query, sortKey, sortDir]);

  const visible = useMemo(() => {
    if (!countries) return [];
    return sortCountries(filterCountries(countries, query), sortKey, sortDir);
  }, [countries, query, sortKey, sortDir]);

  const totalPages = pageCount(visible.length);
  const pageRows = useMemo(() => paginate(visible, page), [visible, page]);

  const handleChange = (row: CountryRecord, field: Field, patch: CountryPatch) => {
    if (!countries) return;
    const previous = countries.find((c) => c.code === row.code)!;
    setCountries(countries.map((c) => (c.code === row.code ? { ...c, ...patch } : c)));
    setSaveState({ code: row.code, field, status: 'saving' });

    saveCountry(row, patch)
      .then((updated) => {
        setCountries((cur) => cur?.map((c) => (c.code === row.code ? updated : c)) ?? cur);
        setSaveState({ code: row.code, field, status: 'saved' });
      })
      .catch((err: Error) => {
        setCountries((cur) => cur?.map((c) => (c.code === row.code ? previous : c)) ?? cur);
        setSaveState({ code: row.code, field, status: 'error', message: err.message });
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
          const contourCountry = CONTOURS.find((c) => c.code === row.code);
          const contourExpanded = expandedContourCode === row.code;
          return (
          <div className="place-card" key={row.code}>
            <div className="place-header">
              <div className="place-identity">
                <span className="place-name">{row.fr}</span>
                <span className="place-meta">{row.code}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
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
                    <EditableValue value={row.fr} saveFlag={saveFlagFor(row, 'fr')} onSave={(next) => handleChange(row, 'fr', { fr: next })} />
                  </td>
                </tr>
                <tr>
                  <th>Nom (EN)</th>
                  <td>
                    <EditableValue value={row.en} saveFlag={saveFlagFor(row, 'en')} onSave={(next) => handleChange(row, 'en', { en: next })} />
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
                    <FlagEditor value={row.flag ?? []} saveFlag={saveFlagFor(row, 'flag')} onSave={(next) => handleChange(row, 'flag', { flag: next })} />
                  </td>
                </tr>
              </tbody>
            </table>

            {contourExpanded && contourCountry && <ContourEditor initialCountry={contourCountry} />}
          </div>
          );
        })}
      </div>

      <footer>{countries.length} pays — les modifications sont enregistrées dans le journal (en haut), pas dans countries.json.</footer>
    </>
  );
};
