import { formatRowScore } from './helpers';

describe('formatRowScore', () => {
  it('adds points and bonus together, prefixed with +', () => {
    expect(formatRowScore(300, 0)).toBe('+300');
    expect(formatRowScore(300, 100)).toBe('+400');
  });
});
