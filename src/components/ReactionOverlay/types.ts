export type ReactionOverlayProps = {
  /** The latest reaction received, or null for none yet: each new one (a new `seq`) starts a bubble of its own. */
  reaction: { emoji: string; name: string | null; seq: number } | null;
};

export type ReactionBubbleProps = {
  reaction: { emoji: string; name: string | null; seq: number };
  /** How far up (px) the bubble rises: from its start to the top of the overlay. */
  travel: number;
  /** Called once the bubble has risen out of sight, with its own `seq`: stable, so the bubble is never restarted. */
  onDone: (seq: number) => void;
};
