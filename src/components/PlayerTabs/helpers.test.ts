import { isTabLocked } from './helpers';

describe('isTabLocked', () => {
  it('locks an answered tab that is not active when revisions are not allowed', () => {
    expect(isTabLocked(false, true, false)).toBe(true);
  });

  it('never locks the active tab, even if already answered and revisions are off', () => {
    expect(isTabLocked(true, true, false)).toBe(false);
  });

  it('does not lock an unanswered tab', () => {
    expect(isTabLocked(false, false, false)).toBe(false);
  });

  it('does not lock an answered tab when revisions are allowed', () => {
    expect(isTabLocked(false, true, true)).toBe(false);
  });
});
