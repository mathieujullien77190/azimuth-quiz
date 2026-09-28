export type NoticeOverlayProps = {
  /** `null` hides the overlay entirely. */
  message: string | null;
  /** Tapping the overlay. Unused while `loading`: a wait ends by itself, a tap does nothing. */
  onDismiss?: () => void;
  /** A light spinner above the message: for a wait ("Préparation de la partie…"), not a dead end. */
  loading?: boolean;
};
