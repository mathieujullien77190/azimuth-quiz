import { act, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { ThemeSettingsContext } from '@/themes';

import SwayingCompass from '..';
import { SWAY_TOTAL_MS } from '../constants';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('SwayingCompass', () => {
  it('occupe un carre de la taille demandee', async () => {
    const { toJSON } = await render(<SwayingCompass size={260} />);
    const root = toJSON() as unknown as { props: { style: object } };
    expect(StyleSheet.flatten(root.props.style)).toMatchObject({ width: 260, height: 260 });
  });

  it('se dessine aussi avec le theme de jour', async () => {
    const { toJSON } = await render(
      <ThemeSettingsContext.Provider
        value={{ themeId: 'day', ready: true, setThemeId: jest.fn(), resetThemeId: jest.fn() }}
      >
        <SwayingCompass size={260} />
      </ThemeSettingsContext.Provider>,
    );
    expect(toJSON()).not.toBeNull();
  });

  it('enchaine plusieurs cycles balancier + tours sans erreur, puis se demonte', async () => {
    const random = jest.fn(() => 0.5);
    const { unmount } = await render(<SwayingCompass random={random} size={200} />);
    // Premier cycle (de 5,5 a 14,5 sens + tours), puis au moins un cycle suivant.
    await act(async () => jest.advanceTimersByTime(SWAY_TOTAL_MS));
    await act(async () => jest.advanceTimersByTime(SWAY_TOTAL_MS));
    expect(random.mock.calls.length).toBeGreaterThanOrEqual(6);
    await unmount();
  });

  it("tire son aleatoire de Math.random quand aucun n'est donne", async () => {
    const spy = jest.spyOn(Math, 'random');
    const { unmount } = await render(<SwayingCompass size={200} />);
    expect(spy).toHaveBeenCalled();
    await unmount();
    spy.mockRestore();
  });
});
