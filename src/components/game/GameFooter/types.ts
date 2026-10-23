import type { ReactNode } from 'react';

export type GameFooterProps = {
  /** Ce que le jeu met dans son footer : barre de reponse, bouton "manche suivante", texte d'attente... */
  children: ReactNode;
  /** Fait flotter le bouton de reactions au-dessus du footer ; a omettre quand personne ne les voit (seul dans
   * la room). Ne prend pas de place dans le footer. */
  onReact?: (emoji: string) => void;
};
