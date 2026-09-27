export type NoticeOverlayProps = {
  /** `null` hides the overlay entirely. */
  message: string | null;
  onDismiss: () => void;
};
