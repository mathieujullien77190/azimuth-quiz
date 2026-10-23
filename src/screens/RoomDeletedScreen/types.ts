export type RoomDeletedScreenProps = {
  /** Message de la notice ; par defaut « l'hote a supprime la room ». */
  message?: string;
};

export type RoomDeletedScreenViewProps = {
  message: string;
  onDismiss: () => void;
};
