export type GameCardProps = {
  icon: string;
  title: string;
  tagline: string;
  /** Borne haute de la ligne "1 a N joueurs". */
  maxPlayers: number;
  ctaLabel: string;
  onPress: () => void;
};
