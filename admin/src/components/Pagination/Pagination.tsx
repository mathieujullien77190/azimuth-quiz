/** Splits the display into pages: 900+ editable cards (each with its `<select>`/`<input>`)
 * in the DOM at once is sluggish — mounting just one page at a time is plenty. */
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
