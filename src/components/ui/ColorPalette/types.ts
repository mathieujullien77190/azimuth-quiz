import type { Theme } from '@/types';

export type ColorPaletteProps = {
  /** Themes a comparer, une colonne chacun ; les deux de l'app par defaut. */
  themes?: Theme[];
};

/** Une ligne du recap : ou vit la couleur dans un `Theme`, et son usage. */
export type ColorToken = {
  /** Chemin dans le theme (`colors.accent`). */
  name: string;
  get: (theme: Theme) => string;
  description: { fr: string; en: string };
};
