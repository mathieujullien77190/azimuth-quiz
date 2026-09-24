import { fireEvent, render } from '@testing-library/react-native';

import { DEFAULT_SETTINGS } from '@/constants';
import { useSettings } from '@/settings';
import type { GameSettings } from '@/types';

import SetupScreen from '.';

jest.mock('@/settings', () => ({ useSettings: jest.fn() }));

const mockedUseSettings = useSettings as jest.Mock;

const renderSetup = async (overrides: Partial<GameSettings> = {}, ready = true) => {
  const updateSettings = jest.fn();
  const resetSettings = jest.fn();
  const settings: GameSettings = { ...DEFAULT_SETTINGS, ...overrides };
  mockedUseSettings.mockReturnValue({ settings, ready, updateSettings, resetSettings });
  const onStart = jest.fn();
  const onBack = jest.fn();
  const utils = await render(<SetupScreen onBack={onBack} onStart={onStart} />);
  return { ...utils, onBack, onStart, settings, updateSettings };
};

describe('SetupScreen — defaults', () => {
  it('renders the title and does not show revision/hide-answers toggles nor custom origin with one player + GPS on', async () => {
    const { getByText, queryByLabelText } = await renderSetup();
    expect(getByText('Nouvelle partie')).toBeTruthy();
    expect(queryByLabelText('Modifier après validation')).toBeNull();
    expect(queryByLabelText('Cacher les réponses des autres')).toBeNull();
  });

  it('pressing a player-count chip resizes the player list', async () => {
    const { getByText, updateSettings } = await renderSetup();
    await fireEvent.press(getByText('3'));
    expect(updateSettings).toHaveBeenCalledWith({ playerNames: ['', '', ''] });
  });

  it('typing a player name updates only that player, keeping others', async () => {
    const { getByLabelText, updateSettings } = await renderSetup({ playerNames: ['Alice', ''] });
    await fireEvent.changeText(getByLabelText('Nom du joueur 2'), 'Bob');
    expect(updateSettings).toHaveBeenCalledWith({ playerNames: ['Alice', 'Bob'] });
  });

  it('shows the initials of a typed name, or of the placeholder when empty', async () => {
    const { getByText } = await renderSetup({ playerNames: ['Alice'] });
    expect(getByText('AL')).toBeTruthy();
  });
});

describe('SetupScreen — multiplayer-only toggles', () => {
  it('shows and wires allowRevision and hideOtherAnswers with 2+ players', async () => {
    const { getByLabelText, updateSettings } = await renderSetup({ playerNames: ['A', 'B'] });
    await fireEvent(getByLabelText('Modifier après validation'), 'valueChange', false);
    expect(updateSettings).toHaveBeenCalledWith({ allowRevision: false });
    await fireEvent(getByLabelText('Cacher les réponses des autres'), 'valueChange', true);
    expect(updateSettings).toHaveBeenCalledWith({ hideOtherAnswers: true });
  });
});

describe('SetupScreen — categories / difficulty / rounds / mode', () => {
  it('toggles a category filter', async () => {
    const { getByText, updateSettings } = await renderSetup();
    // Mountains is already selected by default: clicking it deselects it.
    await fireEvent.press(getByText('Montagnes'));
    expect(updateSettings).toHaveBeenCalledWith({
      categories: DEFAULT_SETTINGS.categories.filter((category) => category !== 'mountains'),
      difficulties: DEFAULT_SETTINGS.difficulties,
    });
  });

  it('selects a difficulty filter', async () => {
    const { getByText, updateSettings } = await renderSetup();
    await fireEvent.press(getByText('Difficile'));
    expect(updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ difficulties: ['hard'] }),
    );
  });

  it('selects a round count', async () => {
    const { getByText, updateSettings } = await renderSetup();
    await fireEvent.press(getByText('15'));
    expect(updateSettings).toHaveBeenCalledWith({ rounds: 15 });
  });

  it('selects the inclination mode and shows its description', async () => {
    const { getByText, updateSettings } = await renderSetup();
    await fireEvent.press(getByText('Inclinaison'));
    expect(updateSettings).toHaveBeenCalledWith({ straightLine: true });
  });

  it('shows the distance mode description by default', async () => {
    const { getByText } = await renderSetup({ straightLine: false });
    expect(getByText(/Tu estimes directement la distance/)).toBeTruthy();
  });

  it('shows the inclination mode description when straightLine is true', async () => {
    const { getByText } = await renderSetup({ straightLine: true });
    expect(getByText(/Plus dur/)).toBeTruthy();
  });
});

describe('SetupScreen — options toggles', () => {
  it('toggles liveCompass', async () => {
    const { getByLabelText, updateSettings } = await renderSetup();
    await fireEvent(getByLabelText('Boussole réelle'), 'valueChange', true);
    expect(updateSettings).toHaveBeenCalledWith({ liveCompass: true });
  });

  it('toggles showCountry', async () => {
    const { getByLabelText, updateSettings } = await renderSetup();
    await fireEvent(getByLabelText('Aide pays'), 'valueChange', true);
    expect(updateSettings).toHaveBeenCalledWith({ showCountry: true });
  });

  it('toggling useGps off reveals the custom origin inputs', async () => {
    const { getByLabelText, updateSettings, queryByText } = await renderSetup();
    expect(queryByText('Latitude')).toBeNull();
    await fireEvent(getByLabelText('Utiliser ma position'), 'valueChange', false);
    expect(updateSettings).toHaveBeenCalledWith({ useGps: false });
  });
});

describe('SetupScreen — custom origin inputs', () => {
  it('shows latitude/longitude fields seeded from settings when GPS is off', async () => {
    const { getByDisplayValue } = await renderSetup({ useGps: false, customLatitude: 48.8566, customLongitude: 2.3522 });
    expect(getByDisplayValue('48.8566')).toBeTruthy();
    expect(getByDisplayValue('2.3522')).toBeTruthy();
  });

  it('still shows the custom origin inputs while settings are loading (not ready yet)', async () => {
    const { getByDisplayValue } = await renderSetup(
      { useGps: false, customLatitude: 48.8566, customLongitude: 2.3522 },
      false,
    );
    expect(getByDisplayValue('48.8566')).toBeTruthy();
  });

  it('pushes a valid latitude/longitude to settings as it is typed', async () => {
    const { getByDisplayValue, updateSettings } = await renderSetup({
      useGps: false,
      customLatitude: 48.8566,
      customLongitude: 2.3522,
    });
    await fireEvent.changeText(getByDisplayValue('48.8566'), '45,5');
    expect(updateSettings).toHaveBeenCalledWith({ customLatitude: 45.5 });
    await fireEvent.changeText(getByDisplayValue('2.3522'), '10');
    expect(updateSettings).toHaveBeenCalledWith({ customLongitude: 10 });
  });

  it('does not push an out-of-range or non-numeric latitude/longitude', async () => {
    const { getByDisplayValue, updateSettings } = await renderSetup({
      useGps: false,
      customLatitude: 48.8566,
      customLongitude: 2.3522,
    });
    updateSettings.mockClear();
    await fireEvent.changeText(getByDisplayValue('48.8566'), '91');
    await fireEvent.changeText(getByDisplayValue('2.3522'), '-');
    expect(updateSettings).not.toHaveBeenCalled();
  });

  it('rejects an out-of-range longitude', async () => {
    const { getByDisplayValue, updateSettings } = await renderSetup({
      useGps: false,
      customLatitude: 48.8566,
      customLongitude: 2.3522,
    });
    updateSettings.mockClear();
    await fireEvent.changeText(getByDisplayValue('2.3522'), '181');
    expect(updateSettings).not.toHaveBeenCalled();
  });
});

describe('SetupScreen — start/back', () => {
  it('calls onStart when pressed and enabled', async () => {
    const { getByText, onStart } = await renderSetup();
    await fireEvent.press(getByText('Lancer la partie'));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('disables the start button when no place is available', async () => {
    const { getByRole } = await renderSetup({ categories: [] });
    const button = getByRole('button', { name: 'Lancer la partie' });
    expect(button.props.accessibilityState.disabled).toBe(true);
  });

  it('calls onBack when pressed', async () => {
    const { getByText, onBack } = await renderSetup();
    await fireEvent.press(getByText('Retour'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
