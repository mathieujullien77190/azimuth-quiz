import { formatRoundCount } from './helpers';

describe('formatRoundCount', () => {
  it('joins the round number and the total with a slash', () => {
    expect(formatRoundCount(3, 10)).toBe('3 / 10');
  });
});
