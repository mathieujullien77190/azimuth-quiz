import { Platform } from 'react-native';

import { disableTextSelection } from './web';

describe('disableTextSelection', () => {
  const originalOS = Platform.OS;
  const originalDocument = (globalThis as { document?: unknown }).document;

  afterEach(() => {
    Platform.OS = originalOS;
    (globalThis as { document?: unknown }).document = originalDocument;
  });

  it('does nothing on native (no document to touch)', () => {
    Platform.OS = 'ios';
    expect(() => disableTextSelection()).not.toThrow();
  });

  it('does nothing when document is unavailable, even on web', () => {
    Platform.OS = 'web';
    (globalThis as { document?: unknown }).document = undefined;
    expect(() => disableTextSelection()).not.toThrow();
  });

  it('injects a <style> tag once on web', () => {
    Platform.OS = 'web';
    const appended: HTMLElement[] = [];
    const elementsById = new Map<string, unknown>();
    const fakeStyle = { id: '', textContent: '' };
    const fakeDocument = {
      getElementById: (id: string) => elementsById.get(id) ?? null,
      createElement: () => fakeStyle,
      head: {
        appendChild: (el: HTMLElement) => {
          appended.push(el);
          elementsById.set(fakeStyle.id, fakeStyle);
        },
      },
    };
    (globalThis as { document?: unknown }).document = fakeDocument;

    disableTextSelection();
    expect(appended).toHaveLength(1);
    expect(fakeStyle.id).toBe('fullazimut-no-select');
    expect(fakeStyle.textContent).toContain('user-select: none');
  });

  it('is a no-op the second time (style tag already present)', () => {
    Platform.OS = 'web';
    const elementsById = new Map<string, unknown>();
    elementsById.set('fullazimut-no-select', {});
    const appendChild = jest.fn();
    (globalThis as { document?: unknown }).document = {
      getElementById: (id: string) => elementsById.get(id) ?? null,
      createElement: () => ({ id: '', textContent: '' }),
      head: { appendChild },
    };

    disableTextSelection();
    expect(appendChild).not.toHaveBeenCalled();
  });
});
