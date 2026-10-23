export type HomeScreenViewProps = {
  /** L'app charge encore : la barre de chargement tient la place des boutons. */
  loading: boolean;
  onSettings: () => void;
  onPlay: () => void;
  onJoin: () => void;
};
