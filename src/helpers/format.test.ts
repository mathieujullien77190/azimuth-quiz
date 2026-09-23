import { formatBearing, formatDistance, formatInclination, formatNumber, initials } from './format';

describe('formatNumber', () => {
  it('rounds to the nearest integer', () => {
    expect(formatNumber(3.4)).toBe('3');
    expect(formatNumber(3.6)).toBe('4');
  });

  it('inserts a narrow no-break space every 3 digits', () => {
    expect(formatNumber(1234)).toBe('1 234');
    expect(formatNumber(1234567)).toBe('1 234 567');
  });

  it('leaves small numbers untouched', () => {
    expect(formatNumber(42)).toBe('42');
  });
});

describe('formatDistance', () => {
  it('appends km with a narrow no-break space', () => {
    expect(formatDistance(1234)).toBe('1 234 km');
  });
});

describe('formatBearing', () => {
  const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'] as const;

  it('combines the cardinal point and the rounded degrees', () => {
    expect(formatBearing(0, cardinals)).toBe('N · 0°');
    expect(formatBearing(90, cardinals)).toBe('E · 90°');
  });

  it('normalizes negative or out-of-range degrees', () => {
    // -10 normalise a 350°, plus proche de N (360=0) que de NO (315).
    expect(formatBearing(-10, cardinals)).toBe('N · 350°');
    expect(formatBearing(370, cardinals)).toBe('N · 10°');
  });
});

describe('formatInclination', () => {
  it('rounds and appends a degree sign', () => {
    expect(formatInclination(45.4)).toBe('45°');
    expect(formatInclination(45.6)).toBe('46°');
  });
});

describe('initials', () => {
  it('takes the first 2 letters, uppercased', () => {
    expect(initials('mathieu')).toBe('MA');
  });

  it('trims surrounding whitespace first', () => {
    expect(initials('  zoe  ')).toBe('ZO');
  });

  it('handles names shorter than 2 letters', () => {
    expect(initials('a')).toBe('A');
    expect(initials('')).toBe('');
  });
});
