import { useState } from 'react';

/** Suppression immediate, sans confirmation. */
export const DeleteX = ({ name, onDelete }: { name: string; onDelete: () => Promise<void> }) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        className="delete-x"
        title={`Supprimer « ${name} »`}
        disabled={deleting}
        onClick={() => {
          setDeleting(true);
          setError(null);
          onDelete().catch((err: Error) => {
            setError(err.message);
            setDeleting(false);
          });
        }}
      >
        {deleting ? '…' : '×'}
      </button>
      {error && (
        <span className="save-flag error" title={error}>
          ⚠
        </span>
      )}
    </>
  );
};
