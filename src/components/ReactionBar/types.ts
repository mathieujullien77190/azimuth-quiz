export type ReactionBarProps = {
  /** Emojis proposes, dans l'ordre, dans la colonne. */
  emojis: readonly string[];
  onPick: (emoji: string) => void;
  /** Libelle d'accessibilite du bouton d'un emoji (« Envoyer 👍 »). */
  labelFor: (emoji: string) => string;
  /** Libelle d'accessibilite du bouton rond qui ouvre/ferme la colonne (« Reactions »). */
  toggleLabel: string;
};
