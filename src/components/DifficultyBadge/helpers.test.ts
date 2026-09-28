import { formatDifficulty } from './helpers';

describe('formatDifficulty', () => {
  it('shows the emoji then the label', () => {
    expect(formatDifficulty('🟡', 'Moyen')).toBe('🟡 Moyen');
    expect(formatDifficulty('🔴', 'Difficile')).toBe('🔴 Difficile');
  });
});
