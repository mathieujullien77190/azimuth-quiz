import { useEffect, useState } from 'react';

/** Repliee par defaut (anecdote trop longue pour rester affichee sur 900+ cartes), s'ouvre en
 * textarea a la demande. Garde son propre brouillon, ne pousse au parent qu'au clic sur
 * "Enregistrer". */
export const DescriptionCell = ({
  value,
  saveFlag,
  onSave,
}: {
  value: string;
  saveFlag: React.ReactNode;
  onSave: (next: string) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!expanded) setDraft(value);
  }, [value, expanded]);

  if (!expanded) {
    return (
      <div className="desc-preview-row">
        <span className="desc-preview" title={value}>
          {value || '—'}
        </span>
        <button type="button" className="desc-edit" onClick={() => setExpanded(true)}>
          Modifier
        </button>
      </div>
    );
  }

  return (
    <div className="desc-panel">
      <textarea className="desc-textarea" rows={4} autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} />
      <div className="desc-actions">
        <button
          type="button"
          className="desc-save"
          onClick={() => {
            onSave(draft.trim());
            setExpanded(false);
          }}
        >
          Enregistrer
        </button>
        <button
          type="button"
          className="desc-cancel"
          onClick={() => {
            setDraft(value);
            setExpanded(false);
          }}
        >
          Annuler
        </button>
        {saveFlag}
      </div>
    </div>
  );
};
