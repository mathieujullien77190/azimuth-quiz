import { fireEvent, render } from '@testing-library/react-native';

import { clearAppData } from '@/helpers';
import { useLanguage } from '@/i18n';
import { useSettings } from '@/settings';
import { useThemeSettings } from '@/themes';
import type { ThemeId } from '@/types';

import SettingsScreen from '.';
import { APP_VERSION } from './constants';

jest.mock('@/helpers', () => ({ clearAppData: jest.fn() }));
jest.mock('@/i18n', () => {
  const actual = jest.requireActual('@/i18n');
  return { ...actual, useLanguage: jest.fn() };
});
jest.mock('@/settings', () => {
  const actual = jest.requireActual('@/settings');
  return { ...actual, useSettings: jest.fn() };
});
jest.mock('@/themes', () => {
  const actual = jest.requireActual('@/themes');
  return { ...actual, useThemeSettings: jest.fn() };
});

const mockedUseLanguage = useLanguage as jest.Mock;
const mockedUseSettings = useSettings as jest.Mock;
const mockedUseThemeSettings = useThemeSettings as jest.Mock;

const renderSettings = async (language: 'fr' | 'en' = 'fr', themeId: ThemeId = 'night') => {
  const setLanguage = jest.fn();
  const resetLanguage = jest.fn();
  const resetSettings = jest.fn();
  const setThemeId = jest.fn();
  const resetThemeId = jest.fn();
  mockedUseLanguage.mockReturnValue({ language, ready: true, setLanguage, resetLanguage });
  mockedUseSettings.mockReturnValue({ settings: {}, ready: true, updateSettings: jest.fn(), resetSettings });
  mockedUseThemeSettings.mockReturnValue({ themeId, ready: true, setThemeId, resetThemeId });
  const onBack = jest.fn();
  const utils = await render(<SettingsScreen onBack={onBack} />);
  return { ...utils, onBack, setLanguage, resetLanguage, resetSettings, setThemeId, resetThemeId };
};

describe('SettingsScreen', () => {
  it('renders the title, about section and version', async () => {
    const { getByText } = await renderSettings();
    expect(getByText('Réglages')).toBeTruthy();
    expect(getByText('Par Matou.')).toBeTruthy();
    expect(getByText(APP_VERSION)).toBeTruthy();
  });

  it('shows French selected by default and switches language on press', async () => {
    const { getByRole, setLanguage } = await renderSettings('fr');
    expect(getByRole('button', { name: 'Français' }).props.accessibilityState.selected).toBe(true);
    await fireEvent.press(getByRole('button', { name: 'English' }));
    expect(setLanguage).toHaveBeenCalledWith('en');
  });

  it('shows English selected when language is en', async () => {
    const { getByRole } = await renderSettings('en');
    expect(getByRole('button', { name: 'English' }).props.accessibilityState.selected).toBe(true);
  });

  it('shows Night selected by default and switches theme on press', async () => {
    const { getByRole, setThemeId } = await renderSettings('fr', 'night');
    expect(getByRole('button', { name: '🌙 Nuit' }).props.accessibilityState.selected).toBe(true);
    await fireEvent.press(getByRole('button', { name: '☀️ Jour' }));
    expect(setThemeId).toHaveBeenCalledWith('day');
  });

  it('shows Day selected when the theme is day', async () => {
    const { getByRole } = await renderSettings('fr', 'day');
    expect(getByRole('button', { name: '☀️ Jour' }).props.accessibilityState.selected).toBe(true);
  });

  it('clears app data: calls clearAppData, resetSettings, resetLanguage, resetThemeId, and disables the button', async () => {
    const { getByText, resetSettings, resetLanguage, resetThemeId } = await renderSettings();
    const clearButton = getByText('Vider les données');
    await fireEvent.press(clearButton);
    expect(clearAppData).toHaveBeenCalledTimes(1);
    expect(resetSettings).toHaveBeenCalledTimes(1);
    expect(resetLanguage).toHaveBeenCalledTimes(1);
    expect(resetThemeId).toHaveBeenCalledTimes(1);
    expect(getByText('Données effacées.')).toBeTruthy();
  });

  it('the clear-data button is disabled once data has been cleared', async () => {
    const { getByText, getByRole } = await renderSettings();
    await fireEvent.press(getByText('Vider les données'));
    const button = getByRole('button', { name: 'Données effacées.' });
    expect(button.props.accessibilityState.disabled).toBe(true);
  });

  it('calls onBack when pressed', async () => {
    const { getByText, onBack } = await renderSettings();
    await fireEvent.press(getByText('Retour'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
