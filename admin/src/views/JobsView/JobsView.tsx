import { useMemo, useState } from 'react';

import { addJob, allJobRows, deleteJob, filterJobRows, saveJobEn, saveJobFr, type JobRow } from '../../api/personality';
import { DeleteX } from '../../components/DeleteX';
import { EditableValue } from '../../components/EditableValue';
import { Pagination, pageCount, paginate } from '../../components/Pagination';

/**
 * Un metier, ses deux traductions editables sur place. Supprimer n'apparait que si plus rien ne l'utilise (voir
 * `deleteJob`).
 */
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
    <td className="code-cell">{row.code}</td>
    <td>
      <EditableValue onSave={onSaveFr} saveFlag={saveFlag('fr')} value={row.fr} />
    </td>
    <td>
      <EditableValue onSave={onSaveEn} saveFlag={saveFlag('en')} value={row.en} />
    </td>
    <td>{row.examples.length === 0 && <DeleteX name={`le métier « ${row.fr} »`} onDelete={onDelete} />}</td>
  </tr>
);

/**
 * Une nouvelle entree a besoin des deux textes d'un coup (contrairement a un renommage) : petit formulaire a part
 * plutot que le "+ Ajouter..." d'`EditableValue`. "Ajouter" reste desactive tant que tout n'est pas rempli. Le code
 * est genere (`addJob`), jamais saisi : cle opaque.
 */
const AddRow = ({ onAdd }: { onAdd: (fr: string, en: string) => void }) => {
  const [fr, setFr] = useState('');
  const [en, setEn] = useState('');

  const submit = () => {
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
      <td>
        <button className="reset" type="button" disabled={fr.trim() === '' || en.trim() === ''} onClick={submit}>
          + Ajouter un métier
        </button>
      </td>
    </tr>
  );
};

/**
 * Tous les metiers cures, a plat et recherchables, ajout/renommage/suppression : le vocabulaire commun derriere
 * `PersonalityEditor`. Renommer ici change partout ou le metier est pose ; en ajouter un le rend aussitot
 * choisissable dans chaque lieu.
 */
export const JobsView = () => {
  const [rows, setRows] = useState<JobRow[]>(allJobRows);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  // Metier + champ sauves en dernier, pour un bref "✓" a cote.
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
            placeholder="Métier…"
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
        <b>{visibleRows.length}</b> métier{visibleRows.length === 1 ? '' : 's'} affiché
        {visibleRows.length === 1 ? '' : 's'} sur {rows.length}
      </p>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <table className="kv-table jobs-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Français</th>
            <th>Anglais</th>
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
              saveFlag={(field) =>
                savedField?.code === row.code && savedField.field === field ? (
                  <span className="save-flag saved">✓</span>
                ) : null
              }
            />
          ))}
          <AddRow onAdd={handleAdd} />
        </tbody>
      </table>
    </>
  );
};
