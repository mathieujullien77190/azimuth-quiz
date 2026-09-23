import { en } from './en';
import { fr } from './fr';

/** Chemins de cles ("a.b.c") pour reperer precisement ou fr/en divergent en cas d'echec. */
const keyPaths = (value: unknown, prefix = ''): string[] => {
  if (typeof value === 'function' || Array.isArray(value) || value === null || typeof value !== 'object') {
    return [prefix];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
};

/** Appelle chaque fonction de traduction avec des arguments bidon (couverture + verifie qu'elle
 * renvoie une chaine non vide sans jeter), et verifie chaque tableau non vide. */
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

  it('setup.availability covers both branches (enough places vs. not enough) in fr and en', () => {
    expect(fr.setup.availability(20, 10)).toBe('20 lieux possibles');
    expect(fr.setup.availability(5, 10)).toBe('5 lieux possibles : la partie sera de 5 manches');
    expect(en.setup.availability(20, 10)).not.toBe(en.setup.availability(5, 10));
  });
});
