import { useState, useMemo } from 'react';

import { saveCharadeRiddle } from '../../api/charades';
import { DeleteX } from '../../components/DeleteX';
import { EditableValue } from '../../components/EditableValue';
import { Pagination, pageCount, paginate } from '../../components/Pagination';

import { allSyllableRows, filterSyllableRows } from './helpers';
import type { SyllableRow } from './types';

/** One syllable's riddle, editable — click the text, it becomes an input, blur/Enter saves
 * (`EditableValue`, same as everywhere else in the admin), or the "×" clears it in one action
 * (same result as editing to blank, quicker than select-all) — shown only when there's a riddle
 * to clear; a syllable with nothing curated yet has nothing to delete, so no "×" (same as every
 * other deletable row in the admin: it only appears when it would actually do something). The
 * syllable itself isn't editable here (it's the dictionary's own key, always the live `syllabify`
 * output — see `helpers/charade.ts`'s own doc comment); the examples are just context, read-only. */
const Row = ({
  row,
  onSave,
  saveFlag,
}: {
  row: SyllableRow;
  onSave: (next: string) => void;
  saveFlag: React.ReactNode;
}) => (
  <tr>
    <td className="syllable-cell">{row.syllable}</td>
    <td>
      <EditableValue
        allowEmpty
        multiline
        display={row.riddle ?? '(pas encore de charade — la syllabe se dit telle quelle)'}
        onSave={onSave}
        saveFlag={saveFlag}
        value={row.riddle ?? ''}
      />
    </td>
    <td className="muted">{row.examples.join(', ')}</td>
    <td>
      {row.riddle !== null && (
        <DeleteX name={`la charade de « ${row.syllable} »`} onDelete={() => Promise.resolve(onSave(''))} />
      )}
    </td>
  </tr>
);

/**
 * Every distinct syllable across every Clues place, flat and searchable, its riddle GLOBAL (see
 * `riddleFor`): `PlacesView`'s own `CharadeEditor` only ever shows one place's syllables at a
 * time; this is the same edit (and the same Firestore save, see `api/charades.ts`)
 * but for sweeping through the whole curation dictionary at once, e.g. to find which syllables
 * still have nothing.
 */
export const SyllablesView = () => {
  const [rows, setRows] = useState<SyllableRow[]>(allSyllableRows);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  // Which syllable last saved, for a brief "✓" next to it.
  const [savedSyllable, setSavedSyllable] = useState<string | null>(null);

  const visibleRows = useMemo(() => filterSyllableRows(rows, query), [rows, query]);
  const totalPages = pageCount(visibleRows.length);
  const pageRows = useMemo(() => paginate(visibleRows, page), [visibleRows, page]);

  const handleChangeQuery = (next: string) => {
    setQuery(next);
    setPage(1);
  };

  const handleSave = (row: SyllableRow, next: string) => {
    saveCharadeRiddle(row.syllable, next).then((updated) => {
      setRows((current) => current.map((r) => (r.syllable === row.syllable ? { ...r, riddle: updated } : r)));
      setSavedSyllable(row.syllable);
      setTimeout(() => setSavedSyllable(null), 1500);
    });
  };

  return (
    <>
      <div className="panel">
        <div className="row">
          <span className="field-label">Recherche</span>
          <input
            type="search"
            placeholder="Syllabe, charade ou lieu…"
            value={query}
            onChange={(e) => handleChangeQuery(e.target.value)}
          />
          {query !== '' && (
            <button className="reset" type="button" onClick={() => handleChangeQuery('')}>
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      <p className="count-line">
        <b>{visibleRows.length}</b> syllabe{visibleRows.length === 1 ? '' : 's'} affichée
        {visibleRows.length === 1 ? '' : 's'} sur {rows.length}
      </p>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {pageRows.length === 0 ? (
        <div className="empty">Aucune syllabe ne correspond à cette recherche.</div>
      ) : (
        <table className="kv-table syllables-table">
          <thead>
            <tr>
              <th>Syllabe</th>
              <th>Charade</th>
              <th>Exemples</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <Row
                key={row.syllable}
                onSave={(next) => handleSave(row, next)}
                row={row}
                saveFlag={savedSyllable === row.syllable ? <span className="save-flag saved">✓</span> : null}
              />
            ))}
          </tbody>
        </table>
      )}
    </>
  );
};
