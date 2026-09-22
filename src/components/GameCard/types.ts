export type GameCardProps = {
  icon: string;
  title: string;
  tagline: string;
  meta: readonly string[];
  note?: string;
  ctaLabel: string;
  onPress: () => void;
  disabled?: boolean;
};
