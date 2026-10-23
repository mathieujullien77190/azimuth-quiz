import { act, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { buildProgressSteps } from '../helpers';
import { ThemeSettingsContext } from '@/themes';

import LoadingBar from '..';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

const props = {
  loadingLabel: 'Chargement…',
  version: '2.65.0',
  codename: { emoji: '🐦', name: 'great-tit', wiki: 'https://en.wikipedia.org/wiki/Great_tit' },
  fillMs: 5000,
  random: () => 0.5,
};

const percentOf = (view: Awaited<ReturnType<typeof render>>) => {
  const found = view.queryAllByText(/^[0-9]+%$/);
  return Number(found[0].props.children.replace('%', ''));
};
const steps = buildProgressSteps(5000, () => 0.5);

describe('LoadingBar', () => {
  it('montre le libelle de chargement et la ligne de version', async () => {
    const { getByText } = await render(<LoadingBar {...props} />);
    expect(getByText('Chargement…')).toBeTruthy();
    expect(getByText('v2.65.0 - 🐦 - great-tit')).toBeTruthy();
  });

  it('montre toute la ligne de version : non coupee, libre de passer a la ligne, centree', async () => {
    const { getByText } = await render(<LoadingBar {...props} />);
    const version = getByText('v2.65.0 - 🐦 - great-tit');
    expect(version.props.numberOfLines).toBeUndefined();
    expect(version.props.ellipsizeMode).toBeUndefined();
    expect(StyleSheet.flatten(version.props.style).textAlign).toBe('center');
  });

  it('se dessine aussi avec le theme de jour', async () => {
    const { getByText } = await render(
      <ThemeSettingsContext.Provider
        value={{ themeId: 'day', ready: true, setThemeId: jest.fn(), resetThemeId: jest.fn() }}
      >
        <LoadingBar {...props} />
      </ThemeSettingsContext.Provider>,
    );
    expect(getByText('Chargement…')).toBeTruthy();
  });

  it('demarre a 0 %', async () => {
    const view = await render(<LoadingBar {...props} />);
    expect(percentOf(view)).toBe(0);
  });

  it('se bloque : un plateau entre deux sauts garde le meme pourcentage', async () => {
    const view = await render(<LoadingBar {...props} />);
    const first = steps[0];
    const second = steps[1];
    // Juste apres le premier saut et bien avant le keyframe suivant.
    await act(async () => jest.advanceTimersByTime(first.at + first.easeMs + 20));
    const landed = percentOf(view);
    expect(landed).toBeGreaterThan(0);
    await act(async () => jest.advanceTimersByTime((second.at - (first.at + first.easeMs)) / 2));
    expect(percentOf(view)).toBe(landed);
  });

  it("avance et n'atteint jamais 100 % avant d'etre liberee", async () => {
    const view = await render(<LoadingBar {...props} />);
    let previous = 0;
    for (let step = 0; step < 50; step += 1) {
      await act(async () => jest.advanceTimersByTime(100));
      const now = percentOf(view);
      expect(now).toBeGreaterThanOrEqual(previous);
      previous = now;
    }
    const last = steps[steps.length - 1];
    expect(previous).toBe(Math.round(last.to));
    expect(previous).toBeLessThan(100);
    // Pas prete apres le temps minimum : elle attend la.
    await act(async () => jest.advanceTimersByTime(3000));
    expect(percentOf(view)).toBe(previous);
  });

  it("tire ses sauts de Math.random quand aucun aleatoire n'est donne", async () => {
    const view = await render(<LoadingBar {...props} random={undefined} />);
    expect(view.getByText('0%')).toBeTruthy();
  });
});
