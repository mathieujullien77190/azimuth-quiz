/** Decoupe l'affichage : monter 900+ cartes editables d'un coup est lent, une page a la fois suffit. */
export const Pagination = ({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button type="button" className="reset" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ← Précédent
      </button>
      <span className="pagination-status">
        Page {page} / {totalPages}
      </span>
      <button type="button" className="reset" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Suivant →
      </button>
    </div>
  );
};
