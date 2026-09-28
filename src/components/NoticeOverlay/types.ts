export type NoticeOverlayProps = {
  /** `null` hides the overlay entirely. */
  message: string | null;
  onDismiss: () => void;
  /** A light spinner above the message: for a wait ("Préparation de la partie…"), not a dead end. */
  loading?: boolean;
};
