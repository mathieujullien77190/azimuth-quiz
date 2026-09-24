import { useEffect, useState } from 'react';

/** Value shown as plain text, which becomes an `<input>` on click — only blur or Enter
 * saves, Escape cancels. */
export const EditableValue = ({
  value,
  saveFlag,
  onSave,
  type = 'text',
  display,
}: {
  value: string;
  saveFlag: React.ReactNode;
  onSave: (next: string) => void;
  type?: 'text' | 'number';
  display?: string;
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
    if (draft.trim() && draft.trim() !== value) onSave(draft.trim());
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
