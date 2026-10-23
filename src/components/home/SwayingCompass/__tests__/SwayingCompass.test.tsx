import { act, fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { ThemeSettingsContext } from '@/themes';

import SwayingCompass from '..';

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
      <ThemeSettingsContext.Provider value={{ themeId: 'day', ready: true, setThemeId: jest.fn(), resetThemeId: jest.fn() }}>
        <SwayingCompass size={260} />
      </ThemeSettingsContext.Provider>,
    );
    expect(toJSON()).not.toBeNull();
  });

  it("oscille puis s'arrete au bout d'une minute", async () => {
    const { unmount } = await render(<SwayingCompass size={200} />);
    await act(async () => jest.advanceTimersByTime(61000));
    await unmount();
  });


  it("repart avec de l'elan quand on appuie dessus, meme apres l'arret", async () => {
    const { getByLabelText, unmount } = await render(<SwayingCompass size={200} />);
    await act(async () => jest.advanceTimersByTime(61000));
    await fireEvent.press(getByLabelText('Boussole'));
    await act(async () => jest.advanceTimersByTime(61000));
    await unmount();
  });

  it('accepte un appui en plein balancement', async () => {
    const { getByLabelText, unmount } = await render(<SwayingCompass size={200} />);
    await act(async () => jest.advanceTimersByTime(7000));
    await fireEvent.press(getByLabelText('Boussole'));
    await act(async () => jest.advanceTimersByTime(1000));
    await unmount();
  });
});
