/** An already-submitted tab only reopens if revisions are allowed. */
export const isTabLocked = (isActive: boolean, isAnswered: boolean, allowRevision: boolean): boolean =>
  !isActive && isAnswered && !allowRevision;
