import type { Theme } from '@/types';

export type ColorPaletteProps = {
  /** The themes to compare, one column each; both of the app's by default. */
  themes?: Theme[];
};

/** One row of the recap: where the color lives in a `Theme`, and what it is used for. */
export type ColorToken = {
  /** Path in the theme, as written in code (`colors.accent`). */
  name: string;
  get: (theme: Theme) => string;
  description: { fr: string; en: string };
};
