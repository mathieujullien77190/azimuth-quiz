import { flagEmoji } from './flagEmoji';

describe('flagEmoji', () => {
  it('builds the flag from the two letters of the country code, whatever the case', () => {
    expect(flagEmoji('FR')).toBe('🇫🇷');
    expect(flagEmoji('gb')).toBe('🇬🇧');
  });
});
