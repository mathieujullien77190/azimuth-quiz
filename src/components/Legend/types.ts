export type LegendItem = {
  label: string;
  color: string;
  /** Circled dot: this is the true answer. */
  ring?: boolean;
  /** Online play's waiting roster only: replaces the plain dot with a spinner (`'pending'`, still
   * hasn't answered this round) or a checkmark next to it (`'answered'`) — omitted everywhere
   * else, which keeps the plain dot exactly as before. */
  status?: 'pending' | 'answered';
};

export type LegendProps = {
  items: LegendItem[];
};
