export type GameCardProps = {
  icon: string;
  title: string;
  tagline: string;
  /** Upper bound of the "1 to N players" line. */
  maxPlayers: number;
  ctaLabel: string;
  onPress: () => void;
};
