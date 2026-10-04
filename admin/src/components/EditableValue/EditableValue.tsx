import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/** Value shown as plain text, which becomes an `<input>` on click — only blur or Enter
 * saves, Escape cancels. */
export const EditableValue = ({
  value,
  saveFlag,
  onSave,
  type = 'text',
  display,
  allowEmpty = false,
  multiline = false,
}: {
  value: string;
  saveFlag: React.ReactNode;
  onSave: (next: string) => void;
  type?: 'text' | 'number';
  display?: string;
  /** An empty draft normally cancels instead of saving (most fields are never blank) — set this
   * for a field where blank is itself a valid value to save (clearing it on purpose). */
  allowEmpty?: boolean;
  /** A text box that grows with what is typed (and a wider one) instead of a single-line input: for long
   * sentences such as a pun. Enter still saves. */
  multiline?: boolean;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const area = useRef<HTMLTextAreaElement>(null);

  // Grow the box to fit its text (shrink first, so it also follows the text when it gets shorter).
  useLayoutEffect(() => {
    if (!area.current) return;
    area.current.style.height = 'auto';
    area.current.style.height = `${area.current.scrollHeight}px`;
  }, [draft, editing]);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  if (!editing) {
    return (
      <button
        type="button"
        className={multiline ? 'kv-edit-btn kv-edit-btn-wrap' : 'kv-edit-btn'}
        onClick={() => setEditing(true)}
      >
        {display ?? value ?? '—'}
      </button>
    );
  }

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed !== value && (trimmed !== '' || allowEmpty)) onSave(trimmed);
    setEditing(false);
  };

  if (multiline) {
    return (
      <div className="field-cell field-cell-top">
        <textarea
          ref={area}
          className="kv-input kv-textarea"
          autoFocus
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              (e.target as HTMLTextAreaElement).blur();
            }
            if (e.key === 'Escape') {
              setDraft(value);
              setEditing(false);
            }
          }}
        />
        {saveFlag}
      </div>
    );
  }

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
