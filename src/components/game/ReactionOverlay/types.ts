export type ReactionOverlayProps = {
  /** Derniere reaction recue, ou null : chaque nouvelle (nouveau `seq`) lance sa propre bulle. */
  reaction: { emoji: string; name: string | null; seq: number } | null;
};

export type ReactionBubbleProps = {
  reaction: { emoji: string; name: string | null; seq: number };
  /** Hauteur de montee (px), du depart au haut de l'overlay. */
  travel: number;
  /** Appelee quand la bulle est sortie de l'ecran, avec son `seq` : stable, donc la bulle n'est jamais relancee. */
  onDone: (seq: number) => void;
};
