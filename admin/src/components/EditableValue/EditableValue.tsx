import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/** Texte qui devient un `<input>` au clic ; seuls blur ou Entree sauvent, Echap annule. */
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
  /** Un brouillon vide annule normalement ; a activer quand vider est une valeur valide. */
  allowEmpty?: boolean;
  /** Zone de texte qui grandit avec la saisie, pour les longues phrases (jeu de mots). Entree sauve toujours. */
  multiline?: boolean;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const area = useRef<HTMLTextAreaElement>(null);

  // Ajuste la hauteur au texte (reduit d'abord pour suivre aussi un texte qui raccourcit).
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
