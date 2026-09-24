import { en } from './en';
import { fr } from './fr';

/** Key paths ("a.b.c") to pinpoint exactly where fr/en diverge on failure. */
const keyPaths = (value: unknown, prefix = ''): string[] => {
  if (typeof value === 'function' || Array.isArray(value) || value === null || typeof value !== 'object') {
    return [prefix];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
};

/** Calls every translation function with dummy arguments (coverage + checks it
 * returns a non-empty string without throwing), and checks every non-empty array. */
const walk = (value: unknown, path: string): void => {
  if (typeof value === 'function') {
    const result = (value as (...args: unknown[]) => string)('X', 42);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    return;
  }
  if (Array.isArray(value)) {
    expect(value.length).toBeGreaterThan(0);
    return;
  }
  if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      walk(child, path ? `${path}.${key}` : key);
    }
    return;
  }
  expect(typeof value).toBe('string');
};

describe('translations', () => {
  it('fr and en expose exactly the same key structure', () => {
    expect(keyPaths(fr).sort()).toEqual(keyPaths(en).sort());
  });

  it('every fr leaf is a non-empty string, array or working template function', () => {
    walk(fr, '');
  });

  it('every en leaf is a non-empty string, array or working template function', () => {
    walk(en, '');
  });
});
