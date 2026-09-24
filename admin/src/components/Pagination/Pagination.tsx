/** Decoupe l'affichage en pages : 900+ cartes editables (chacune avec ses `<select>`/`<input>`)
 * dans le DOM en meme temps, ça rame — n'en monter qu'une page a la fois suffit largement. */
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
