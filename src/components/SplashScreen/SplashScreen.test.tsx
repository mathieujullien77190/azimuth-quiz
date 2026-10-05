import { act, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { ThemeSettingsContext } from '@/themes';
import { day } from '@/themes/day';
import { night } from '@/themes/night';
import type { ThemeId } from '@/types';

import { FADE_OUT_MS } from './constants';
import { buildProgressSteps } from './helpers';
import SplashScreen from '.';


beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

const props = {
  visible: true,
  tagline: 'Pas de GPS, que de l’instinct.',
  loadingLabel: 'Chargement…',
  version: '2.65.0',
  codename: { emoji: '🐦', name: 'great-tit', wiki: 'https://en.wikipedia.org/wiki/Great_tit' },
  fillMs: 5000,
  random: () => 0.5,
};

const themed = (themeId: ThemeId, overrides: Partial<typeof props> = {}) => (
  <ThemeSettingsContext.Provider value={{ themeId, ready: true, setThemeId: jest.fn(), resetThemeId: jest.fn() }}>
    <SplashScreen {...props} {...overrides} />
  </ThemeSettingsContext.Provider>
);

describe('SplashScreen', () => {
  it('shows the title, the tagline, the loading label and the version line', async () => {
    const { getByText } = await render(themed('night'));
    expect(getByText('AZIMUTH QUIZ')).toBeTruthy();
    expect(getByText('Pas de GPS, que de l’instinct.')).toBeTruthy();
    expect(getByText('Chargement…')).toBeTruthy();
    expect(getByText('v2.65.0 - 🐦 - great-tit')).toBeTruthy();
  });

  it('shows the whole version line: not cut, free to wrap, centred', async () => {
    const { getByText } = await render(themed('night'));
    const version = getByText('v2.65.0 - 🐦 - great-tit');
    expect(version.props.numberOfLines).toBeUndefined();
    expect(version.props.ellipsizeMode).toBeUndefined();
    expect(StyleSheet.flatten(version.props.style).textAlign).toBe('center');
  });

  it('paints the night palette by night: the title colour of the home screen on the dark background', async () => {
    const view = await render(themed('night'));
    expect(StyleSheet.flatten(view.getByText('AZIMUTH QUIZ').props.style).color).toBe(night.colors.title);
    expect((StyleSheet.flatten((view.toJSON() as unknown as { props: { style: object } }).props.style) as { backgroundColor: string }).backgroundColor).toBe(night.colors.background);
  });

  it('paints the day palette by day: the title colour of the home screen on the sand background', async () => {
    const view = await render(themed('day'));
    expect(StyleSheet.flatten(view.getByText('AZIMUTH QUIZ').props.style).color).toBe(day.colors.title);
    expect((StyleSheet.flatten((view.toJSON() as unknown as { props: { style: object } }).props.style) as { backgroundColor: string }).backgroundColor).toBe(day.colors.background);
  });

  it('fades out once it is no longer wanted, then takes itself off the screen', async () => {
    const view = await render(themed('night'));
    expect(view.getByText('AZIMUTH QUIZ')).toBeTruthy();
    await view.rerender(themed('night', { visible: false }));
    expect((view.toJSON() as unknown as { props: { pointerEvents: string } }).props.pointerEvents).toBe('none');
    await act(async () => jest.advanceTimersByTime(FADE_OUT_MS + 50));
    expect(view.queryByText('AZIMUTH QUIZ')).toBeNull();
  });

  describe('the loading bar', () => {
    const percentOf = (view: Awaited<ReturnType<typeof render>>) => {
      const found = view.queryAllByText(/^[0-9]+%$/);
      return Number(found[0].props.children.replace('%', ''));
    };
    const steps = buildProgressSteps(5000, () => 0.5);

    it('starts at 0 %', async () => {
      const view = await render(themed('night'));
      expect(percentOf(view)).toBe(0);
    });

    it('stalls: a plateau between two jumps keeps the same percentage', async () => {
      const view = await render(themed('night'));
      const first = steps[0];
      const second = steps[1];
      // Just after the first jump has landed and well before the next keyframe starts.
      await act(async () => jest.advanceTimersByTime(first.at + first.easeMs + 20));
      const landed = percentOf(view);
      expect(landed).toBeGreaterThan(0);
      await act(async () => jest.advanceTimersByTime((second.at - (first.at + first.easeMs)) / 2));
      expect(percentOf(view)).toBe(landed);
    });

    it('moves forward and never reaches 100 % before the splash is released', async () => {
      const view = await render(themed('night'));
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
      // Not ready yet after the minimum time: it waits there.
      await act(async () => jest.advanceTimersByTime(3000));
      expect(percentOf(view)).toBe(previous);
    });

    it('is released at the end of the schedule: the bar completes while the splash fades out, then it is gone', async () => {
      const view = await render(themed('night'));
      await act(async () => jest.advanceTimersByTime(5000));
      expect(percentOf(view)).toBeLessThan(100);
      await view.rerender(themed('night', { visible: false }));
      await act(async () => jest.advanceTimersByTime(FADE_OUT_MS + 50));
      expect(view.queryByText('AZIMUTH QUIZ')).toBeNull();
    });

    it('draws its jumps from Math.random when no random is given', async () => {
      const view = await render(<SplashScreen {...props} random={undefined} />);
      expect(view.getByText('0%')).toBeTruthy();
    });
  });
});
