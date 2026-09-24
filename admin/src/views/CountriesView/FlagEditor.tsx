import { useEffect, useState } from 'react';

import type { IndicesFlagColorId, IndicesFlagColorRow } from '@/types';

const FLAG_COLOR_IDS: IndicesFlagColorId[] = ['red', 'blue', 'white', 'green', 'yellow', 'black'];

const sameFlag = (a: IndicesFlagColorRow[], b: IndicesFlagColorRow[]): boolean => JSON.stringify(a) === JSON.stringify(b);

/** Liste de couleurs (id + hex + %) editable ligne par ligne, avec ajout/suppression — pas le
 * meme principe de clic-pour-editer que les autres champs : un drapeau est une petite liste
 * structuree, ça se manipule mieux comme un mini-formulaire toujours ouvert. */
export const FlagEditor = ({
  value,
  saveFlag,
  onSave,
}: {
  value: IndicesFlagColorRow[];
  saveFlag: React.ReactNode;
  onSave: (next: IndicesFlagColorRow[]) => void;
}) => {
  const [rows, setRows] = useState<IndicesFlagColorRow[]>(value);

  useEffect(() => setRows(value), [value]);

  const dirty = !sameFlag(rows, value);

  const updateRow = (i: number, next: IndicesFlagColorRow) => {
    setRows((cur) => cur.map((row, idx) => (idx === i ? next : row)));
  };

  return (
    <div className="flag-editor">
      {rows.map((row, i) => (
        <div className="flag-row" key={i}>
          <select className="kv-select flag-color-select" value={row[0]} onChange={(e) => updateRow(i, [e.target.value as IndicesFlagColorId, row[1], row[2]])}>
            {FLAG_COLOR_IDS.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
          <input className="kv-input flag-hex-input" type="text" value={row[1]} onChange={(e) => updateRow(i, [row[0], e.target.value, row[2]])} />
          <span className="flag-swatch" style={{ background: row[1] }} />
          <input
            className="kv-input flag-percent-input"
            type="number"
            value={row[2]}
            onChange={(e) => updateRow(i, [row[0], row[1], Number(e.target.value)])}
          />
          <span className="flag-percent-sign">%</span>
          <button type="button" className="delete-x" title="Retirer cette couleur" onClick={() => setRows((cur) => cur.filter((_, idx) => idx !== i))}>
            ×
          </button>
        </div>
      ))}
      <div className="flag-actions">
        <button type="button" className="reset" onClick={() => setRows((cur) => [...cur, ['red', '#FF0000', 50]])}>
          + couleur
        </button>
        {dirty && (
          <>
            <button type="button" className="desc-save" onClick={() => onSave(rows)}>
              Enregistrer
            </button>
            <button type="button" className="desc-cancel" onClick={() => setRows(value)}>
              Annuler
            </button>
          </>
        )}
        {saveFlag}
      </div>
    </div>
  );
};
