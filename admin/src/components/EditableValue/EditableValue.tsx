import { useEffect, useState } from 'react';

/** Value shown as plain text, which becomes an `<input>` on click — only blur or Enter
 * saves, Escape cancels. */
export const EditableValue = ({
  value,
  saveFlag,
  onSave,
  type = 'text',
  display,
  allowEmpty = false,
}: {
  value: string;
  saveFlag: React.ReactNode;
  onSave: (next: string) => void;
  type?: 'text' | 'number';
  display?: string;
  /** An empty draft normally cancels instead of saving (most fields are never blank) — set this
   * for a field where blank is itself a valid value to save (clearing it on purpose). */
  allowEmpty?: boolean;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  if (!editing) {
    return (
      <button type="button" className="kv-edit-btn" onClick={() => setEditing(true)}>
        {display ?? value ?? '—'}
      </button>
    );
  }

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed !== value && (trimmed !== '' || allowEmpty)) onSave(trimmed);
    setEditing(false);
  };

  return (
    <div className="field-cell">
      <input
        className="kv-input"
        type={type}
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') {
            setDraft(value);
            setEditing(false);
          }
        }}
      />
      {saveFlag}
    </div>
  );
};
