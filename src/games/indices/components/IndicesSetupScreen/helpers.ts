/** Resizes the name list to the player count, keeping already-entered names. */
export const resizeNames = (names: string[], count: number): string[] =>
  Array.from({ length: count }, (_, index) => names[index] ?? '');
