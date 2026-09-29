import { useMemo, useState } from 'react';

import { addJob, allJobRows, deleteJob, filterJobRows, saveJobEn, saveJobFr, type JobRow } from '../../api/personality';
import { DeleteX } from '../../components/DeleteX';
import { EditableValue } from '../../components/EditableValue';
import { Pagination, pageCount, paginate } from '../../components/Pagination';

/** One job, its two translations editable in place, examples read-only for context. Delete only
 * shows once nothing uses it any more (see `deleteJob`'s own doc comment) — same "only appears
 * when it would actually do something" convention as `SyllablesView`'s own "×", one step further
 * (here it's "only when it's safe", not just "only when there's something to clear"). */
const Row = ({
  row,
  onSaveFr,
  onSaveEn,
  onDelete,
  saveFlag,
}: {
  row: JobRow;
  onSaveFr: (next: string) => void;
  onSaveEn: (next: string) => void;
  onDelete: () => Promise<void>;
  saveFlag: (field: 'fr' | 'en') => React.ReactNode;
}) => (
  <tr>
    <td className="syllable-cell">{row.code}</td>
    <td>
      <EditableValue onSave={onSaveFr} saveFlag={saveFlag('fr')} value={row.fr} />
    </td>
    <td>
      <EditableValue onSave={onSaveEn} saveFlag={saveFlag('en')} value={row.en} />
    </td>
    <td className="muted">{row.examples.length > 0 ? row.examples.join(', ') : '(aucun lieu)'}</td>
    <td>{row.examples.length === 0 && <DeleteX name={`le métier « ${row.fr} »`} onDelete={onDelete} />}</td>
  </tr>
);

/** A new entry needs both texts at once (unlike a rename), so it's its own small form rather than
 * the single-field `EditableValue` "+ Ajouter…" pattern `CharadeEditor` uses — "Ajouter" stays
 * disabled until both are filled in. The code itself is generated (`addJob`), never typed by
 * hand: it's an opaque lookup key, not something worth curating. */
const AddRow = ({ onAdd }: { onAdd: (fr: string, en: string) => void }) => {
  const [fr, setFr] = useState('');
  const [en, setEn] = useState('');

  const submit = () => {
    if (fr.trim() === '' || en.trim() === '') return;
    onAdd(fr.trim(), en.trim());
    setFr('');
    setEn('');
  };

  return (
    <tr>
      <td className="muted">—</td>
      <td>
        <input className="kv-input" placeholder="Français" value={fr} onChange={(e) => setFr(e.target.value)} />
      </td>
      <td>
        <input className="kv-input" placeholder="Anglais" value={en} onChange={(e) => setEn(e.target.value)} />
      </td>
      <td colSpan={2}>
        <button className="reset" type="button" disabled={fr.trim() === '' || en.trim() === ''} onClick={submit}>
          + Ajouter un métier
        </button>
      </td>
    </tr>
  );
};

/**
 * Every curated job (`data/personalityJobs.json`), flat and searchable, add/rename/delete —
 * same relationship to `PersonalityEditor` as `SyllablesView` has to `CharadeEditor`: that editor
 * only ever picks one existing job for one place; this sweeps the whole shared vocabulary at
 * once (renaming "chanteuse" here changes it everywhere it's tagged, adding one here makes it
 * pickable from every place's `PersonalityEditor` select right away).
 */
export const JobsView = () => {
  const [rows, setRows] = useState<JobRow[]>(allJobRows);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  // Which job + field last saved, for a brief "✓" next to it.
  const [savedField, setSavedField] = useState<{ code: string; field: 'fr' | 'en' } | null>(null);

  const visibleRows = useMemo(() => filterJobRows(rows, query), [rows, query]);
  const totalPages = pageCount(visibleRows.length);
  const pageRows = useMemo(() => paginate(visibleRows, page), [visibleRows, page]);

  const handleChangeQuery = (next: string) => {
    setQuery(next);
    setPage(1);
  };

  const flash = (code: string, field: 'fr' | 'en') => {
    setSavedField({ code, field });
    setTimeout(() => setSavedField(null), 1500);
  };

  const handleSaveFr = (row: JobRow, next: string) => {
    saveJobFr(row, next).then((updated) => {
      setRows((current) => current.map((r) => (r.code === row.code ? updated : r)));
      flash(row.code, 'fr');
    });
  };

  const handleSaveEn = (row: JobRow, next: string) => {
    saveJobEn(row, next).then((updated) => {
      setRows((current) => current.map((r) => (r.code === row.code ? updated : r)));
      flash(row.code, 'en');
    });
  };

  const handleDelete = (row: JobRow) =>
    deleteJob(row).then(() => {
      setRows((current) => current.filter((r) => r.code !== row.code));
    });

  const handleAdd = (fr: string, en: string) => {
    addJob(fr, en).then((created) => {
      setRows((current) => [...current, created].sort((a, b) => a.fr.localeCompare(b.fr, 'fr')));
    });
  };

  return (
    <>
      <div className="panel">
        <div className="row">
          <span className="field-label">Recherche</span>
          <input
            type="search"
            placeholder="Métier ou lieu…"
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
        <b>{visibleRows.length}</b> métier{visibleRows.length === 1 ? '' : 's'} affiché{visibleRows.length === 1 ? '' : 's'} sur {rows.length}
      </p>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <table className="kv-table syllables-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Français</th>
            <th>Anglais</th>
            <th>Lieux</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.map((row) => (
            <Row
              key={row.code}
              onDelete={() => handleDelete(row)}
              onSaveEn={(next) => handleSaveEn(row, next)}
              onSaveFr={(next) => handleSaveFr(row, next)}
              row={row}
              saveFlag={(field) => (savedField?.code === row.code && savedField.field === field ? <span className="save-flag saved">✓</span> : null)}
            />
          ))}
          <AddRow onAdd={handleAdd} />
        </tbody>
      </table>
    </>
  );
};
