export type NoticeOverlayProps = {
  /** `null` masque l'overlay. */
  message: string | null;
  /** Tap sur l'overlay. Ignore pendant `loading` : l'attente se termine seule. */
  onDismiss?: () => void;
  /** Spinner clair au-dessus du message : une attente, pas une impasse. */
  loading?: boolean;
};
