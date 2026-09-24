import { fireEvent, render, within } from '@testing-library/react-native';

import IndicesSettingsProvider from '../IndicesSettingsProvider';
import IndicesSetupScreen from '.';

/** Section (Card) containing a given title: used to resolve ambiguities between labels shared
 * across sections (e.g. "5" is both a possible player count and a possible round count). */
const section = (getByText: (text: string) => Parameters<typeof within>[0], title: string) =>
  within(getByText(title).parent!.parent!);

const renderScreen = async (onStart = jest.fn(), onBack = jest.fn()) => {
  const utils = await render(
    <IndicesSettingsProvider>
      <IndicesSetupScreen onBack={onBack} onStart={onStart} />
    </IndicesSettingsProvider>,
  );
  return { ...utils, onBack, onStart };
};

describe('IndicesSetupScreen', () => {
  it('renders one name input per default player and selects the default difficulty/answer/rounds chips', async () => {
    const { getByText, getByDisplayValue } = await renderScreen();

    expect(getByDisplayValue('')).toBeTruthy(); // 1 player by default, empty name

    expect(getByText('Facile').parent?.props.accessibilityState.selected).toBe(true);
    expect(getByText('Je tape la ville').parent?.props.accessibilityState.selected).toBe(true);

    const rounds = section(getByText, 'Nombre de manches');
    expect(rounds.getByText('5').parent?.props.accessibilityState.selected).toBe(true);
  });

  it('resizes the player list when a player-count chip is pressed, keeping already-typed names', async () => {
    const { getByText, getByPlaceholderText, getAllByDisplayValue } = await renderScreen();

    const nameInput = getByPlaceholderText(/./); // single player, only one input for now
    await fireEvent.changeText(nameInput, 'Zoé');

    const players = section(getByText, 'Joueurs');
    await fireEvent.press(players.getByText('3'));

    let inputs = getAllByDisplayValue(/^.*$/);
    expect(inputs).toHaveLength(3);
    expect(inputs[0].props.value).toBe('Zoé');
    expect(inputs[1].props.value).toBe('');
    expect(inputs[2].props.value).toBe('');

    // Editing the 2nd player should only affect them (covers the i !== index branch of the map).
    await fireEvent.changeText(inputs[1], 'Max');
    inputs = getAllByDisplayValue(/^.*$/);
    expect(inputs[0].props.value).toBe('Zoé');
    expect(inputs[1].props.value).toBe('Max');
    expect(inputs[2].props.value).toBe('');
  });

  it('both category chips are selected by default, and can be toggled off and back on', async () => {
    const { getByText } = await renderScreen();

    expect(getByText('Villes').parent?.props.accessibilityState.selected).toBe(true);
    expect(getByText('Capitales').parent?.props.accessibilityState.selected).toBe(true);

    await fireEvent.press(getByText('Capitales'));
    expect(getByText('Capitales').parent?.props.accessibilityState.selected).toBe(false);
    expect(getByText('Villes').parent?.props.accessibilityState.selected).toBe(true);

    await fireEvent.press(getByText('Capitales'));
    expect(getByText('Capitales').parent?.props.accessibilityState.selected).toBe(true);
  });

  it('updates the difficulty selection when a difficulty chip is pressed', async () => {
    const { getByText } = await renderScreen();

    await fireEvent.press(getByText('Difficile'));

    expect(getByText('Difficile').parent?.props.accessibilityState.selected).toBe(true);
    expect(getByText('Facile').parent?.props.accessibilityState.selected).toBe(false);
  });

  it('updates the answer method when a chip is pressed', async () => {
    const { getByText } = await renderScreen();

    await fireEvent.press(getByText('À voix haute'));

    expect(getByText('À voix haute').parent?.props.accessibilityState.selected).toBe(true);
    expect(getByText('Je tape la ville').parent?.props.accessibilityState.selected).toBe(false);
  });

  it('the "reveal first letter" toggle is on by default, and can be wired off and back on', async () => {
    const { getByLabelText } = await renderScreen();

    expect(getByLabelText('Première lettre révélée').props.value).toBe(true);

    await fireEvent(getByLabelText('Première lettre révélée'), 'valueChange', false);
    expect(getByLabelText('Première lettre révélée').props.value).toBe(false);

    await fireEvent(getByLabelText('Première lettre révélée'), 'valueChange', true);
    expect(getByLabelText('Première lettre révélée').props.value).toBe(true);
  });

  it('updates the rounds count when a rounds chip is pressed', async () => {
    const { getByText } = await renderScreen();

    const rounds = section(getByText, 'Nombre de manches');
    await fireEvent.press(rounds.getByText('20'));

    expect(rounds.getByText('20').parent?.props.accessibilityState.selected).toBe(true);
    expect(rounds.getByText('5').parent?.props.accessibilityState.selected).toBe(false);
  });

  it('calls onStart when "Lancer la partie" is pressed', async () => {
    const { getByText, onStart } = await renderScreen();
    await fireEvent.press(getByText('Lancer la partie'));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('calls onBack when "Retour" is pressed', async () => {
    const { getByText, onBack } = await renderScreen();
    await fireEvent.press(getByText('Retour'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
