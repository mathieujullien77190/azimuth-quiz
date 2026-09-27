import type { Difficulty } from '@/types';

import { formatDifficulties, formatRoundProgress } from './helpers';

describe('formatRoundProgress', () => {
  it('joins the round number and the total with a slash', () => {
    expect(formatRoundProgress(3, 10)).toBe('3 / 10');
  });
});

describe('formatDifficulties', () => {
  const emojiOf = (id: Difficulty): string => ({ easy: '🟢', intermediate: '🟡', hard: '🔴' })[id];
  const labelOf = (id: Difficulty): string => ({ easy: 'Facile', intermediate: 'Moyen', hard: 'Difficile' })[id];

  it('shows the emoji and the label for a single difficulty', () => {
    expect(formatDifficulties(['intermediate'], emojiOf, labelOf)).toBe('🟡 Moyen');
  });

  it('shows only the emojis, run together, for several difficulties', () => {
    expect(formatDifficulties(['easy', 'hard'], emojiOf, labelOf)).toBe('🟢🔴');
  });
});
