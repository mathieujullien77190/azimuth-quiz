import { useEffect, useMemo, useState } from 'react';

import { fetchCountries, type CountryRecord } from '../../api/countries';
import { Pagination, pageCount, paginate } from '../../components/Pagination';

import { CountryCard } from './CountryCard';
import { CONTINENT_LABELS, CONTINENT_ORDER } from './constants';
import { filterCountries, sortCountries } from './helpers';
import { useCountryEditing } from './useCountryEditing';

import type { Continent, SortKey } from './types';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'fr', label: 'Nom (FR)' },
  { key: 'en', label: 'Nom (EN)' },
  { key: 'code', label: 'Code' },
];

export const CountriesView = () => {
  const [countries, setCountries] = useState<CountryRecord[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [continent, setContinent] = useState<Continent | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('fr');
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [page, setPage] = useState(1);
  useEffect(() => {
    fetchCountries()
      .then(setCountries)
      .catch((err: Error) => setLoadError(err.message));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query, continent, sortKey, sortDir]);

  const visible = useMemo(() => {
    if (!countries) return [];
    return sortCountries(filterCountries(countries, query, continent), sortKey, sortDir);
  }, [countries, query, continent, sortKey, sortDir]);

  const totalPages = pageCount(visible.length);
  const pageRows = useMemo(() => paginate(visible, page), [visible, page]);

  const { saveFlagFor, handleChange } = useCountryEditing(countries, setCountries);

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
        {pageRows.map((row) => (
          <CountryCard key={row.code} row={row} saveFlagFor={saveFlagFor} onChange={handleChange} />
        ))}
      </div>

      <footer>{countries.length} pays — les modifications sont enregistrées directement dans Firestore.</footer>
    </>
  );
};
