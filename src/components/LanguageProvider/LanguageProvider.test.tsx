import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { getLocales } from 'expo-localization';
import { Text } from 'react-native';

import { LANGUAGE_STORAGE_KEY } from '@/constants';
import { useLanguage } from '@/i18n';

import LanguageProvider from '.';

jest.mock('expo-localization', () => ({ getLocales: jest.fn() }));

const mockedGetLocales = getLocales as jest.Mock;

const Probe = () => {
  const { language, ready, setLanguage, resetLanguage } = useLanguage();
  return (
    <>
      <Text testID="language">{language}</Text>
      <Text testID="ready">{String(ready)}</Text>
      <Text onPress={() => setLanguage('en')} testID="setEn">
        setEn
      </Text>
      <Text onPress={resetLanguage} testID="reset">
        reset
      </Text>
    </>
  );
};

beforeEach(async () => {
  await AsyncStorage.clear();
  mockedGetLocales.mockReturnValue([{ languageCode: 'fr' }]);
});

describe('LanguageProvider', () => {
  it('starts on French and becomes ready once nothing is stored', async () => {
    const { getByTestId } = await render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );
    await waitFor(() => expect(getByTestId('ready').props.children).toBe('true'));
    expect(getByTestId('language').props.children).toBe('fr');
  });

  it('loads a previously stored language', async () => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
    const { getByTestId } = await render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );
    await waitFor(() => expect(getByTestId('language').props.children).toBe('en'));
  });

  it('setLanguage updates the language and persists it', async () => {
    const { getByTestId } = await render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );
    await waitFor(() => expect(getByTestId('ready').props.children).toBe('true'));
    await fireEvent.press(getByTestId('setEn'));
    expect(getByTestId('language').props.children).toBe('en');
    await waitFor(async () => expect(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en'));
  });

  it('resetLanguage falls back to the system language without touching storage', async () => {
    const { getByTestId } = await render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );
    await waitFor(() => expect(getByTestId('ready').props.children).toBe('true'));
    await fireEvent.press(getByTestId('setEn'));
    expect(getByTestId('language').props.children).toBe('en');

    await fireEvent.press(getByTestId('reset'));
    expect(getByTestId('language').props.children).toBe('fr');
    // Rien n'est ecrit dans le stockage par resetLanguage (voir doc de la fonction).
    expect(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
  });

  it('does not update state after unmounting while the initial load is still pending', async () => {
    let resolveGetItem: (value: string | null) => void = () => {};
    (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(
      () => new Promise<string | null>((resolve) => (resolveGetItem = resolve)),
    );
    const { unmount } = await render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );
    await unmount();
    // Resout apres le demontage : si le flag `cancelled` ne fonctionnait pas, React logguerait un
    // avertissement de mise a jour d'etat sur un composant demonte.
    await act(async () => {
      resolveGetItem('en');
    });
  });
});
