/** Un onglet deja valide ne se rouvre que si les revisions sont autorisees. */
export const isTabLocked = (isActive: boolean, isAnswered: boolean, allowRevision: boolean): boolean =>
  !isActive && isAnswered && !allowRevision;
