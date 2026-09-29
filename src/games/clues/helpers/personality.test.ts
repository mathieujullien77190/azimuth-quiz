import { personalityFor } from './personality';

describe('personalityFor', () => {
  it('is null for a place with no curated entry, rather than a made-up one', () => {
    expect(personalityFor({})).toBeNull();
  });

  it('reads the curated entry straight off the place when there is one', () => {
    const entry = { name: 'Édith Piaf', description: 'chanteuse' };
    expect(personalityFor({ personality: entry })).toEqual(entry);
  });
});
