export type SpinnerProps = {
  /** `small` inline (next to a name, in a row), `large` on its own (a splash). */
  size?: 'small' | 'large';
  /** Any color; the app's accent by default. A player's own color while waiting for them, a light
   * grey on the dark notice splash. */
  color?: string;
};
