export type HomeScreenViewProps = {
  /** L'app charge encore : la barre de chargement tient la place des boutons. */
  loading: boolean;
  /** La barre existe (l'accueil s'est ouvert pendant le chargement) ; elle se retire seule apres sa liberation. */
  showsBar: boolean;
  onSettings: () => void;
  onPlay: () => void;
  onJoin: () => void;
};
