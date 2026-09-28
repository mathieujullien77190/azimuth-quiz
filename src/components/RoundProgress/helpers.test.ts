import type { Difficulty } from '@/types';

import { formatDifficulty, formatRoundProgress } from './helpers';

describe('formatRoundProgress', () => {
  it('joins the round number and the total with a slash', () => {
    expect(formatRoundProgress(3, 10)).toBe('3 / 10');
  });
});

describe('formatDifficulty', () => {
  const emojiOf = (id: Difficulty): string => ({ easy: '🟢', intermediate: '🟡', hard: '🔴' })[id];
  const labelOf = (id: Difficulty): string => ({ easy: 'Facile', intermediate: 'Moyen', hard: 'Difficile' })[id];

  it('shows the emoji then the label', () => {
    expect(formatDifficulty('intermediate', emojiOf, labelOf)).toBe('🟡 Moyen');
    expect(formatDifficulty('hard', emojiOf, labelOf)).toBe('🔴 Difficile');
  });
});
