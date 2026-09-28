import { fireEvent, render, waitFor, within } from '@testing-library/react-native';

import { DEFAULT_CLUE_SETTINGS } from '@/games/clues/constants';
import { createRoom } from '@/games/clues/helpers/room';
import { useClueRoomStore } from '@/games/clues/store/roomStore';
import { useClueSettings } from '@/settings';

import ClueSetupScreen from '.';

// `helpers/room.ts` pulls in `firebase/firestore`, which is ESM-only and crashes Jest the moment
// anything requires it transitively — mocked out here since these tests exercise the setup UI,
// not real Firestore calls. Same mock shape as Compass' own `SetupScreen.test.tsx`.
jest.mock('@/games/clues/helpers/room', () => ({
  ROOM_MAX_PLAYERS: 10,
  createRoom: jest.fn(),
  deleteRoom: jest.fn(() => Promise.resolve()),
  isValidRoomCode: jest.fn((code: string) => code.length === 8),
  joinRoomPresence: jest.fn(() => Promise.resolve('local-uid')),
  removeRoomPlayer: jest.fn(() => Promise.resolve()),
  roomExists: jest.fn(() => Promise.resolve(false)),
  sendHeartbeat: jest.fn(() => Promise.resolve()),
  clueRoomSettingsFrom: jest.fn((settings) => settings),
  startClueRoomGame: jest.fn(() => Promise.resolve()),
  subscribeToRoomPlayers: jest.fn(() => jest.fn()),
  subscribeToRoomSettings: jest.fn(() => jest.fn()),
  subscribeToRoomGame: jest.fn(() => jest.fn()),
  updateRoomPlayerColors: jest.fn(() => Promise.resolve()),
  updateRoomSettings: jest.fn(() => Promise.resolve()),
}));

// `useClueSettings` is a module-level Zustand store (no more Provider to remount fresh per
// test) — reset explicitly so a chip pressed in one test doesn't leak into the next.
beforeEach(() => {
  useClueSettings.setState({ settings: DEFAULT_CLUE_SETTINGS });
});

// `useClueRoomStore` is also a module-level singleton — reset the same way as Compass' own
// `useRoomStore` in its `SetupScreen.test.tsx`.
const initialRoomState = useClueRoomStore.getState();
beforeEach(() => {
  useClueRoomStore.setState(initialRoomState, true);
});

/** Section (Card) containing a given title: used to resolve ambiguities between labels shared
 * across sections (e.g. "5" is both a possible round count and something else). */
const section = (getByText: (text: string) => Parameters<typeof within>[0], title: string) =>
  within(getByText(title).parent!.parent!);

const renderScreen = async (onBack = jest.fn()) => {
  const utils = await render(<ClueSetupScreen onBack={onBack} />);
  return { ...utils, onBack };
};

describe('ClueSetupScreen', () => {
  it('renders the solo name field and selects the default difficulty/rounds chips', async () => {
    const { getByText, getByPlaceholderText } = await renderScreen();

    expect(getByPlaceholderText(/./)).toBeTruthy(); // solo player's name field, empty by default

    expect(getByText('Facile').parent?.props.accessibilityState.selected).toBe(true);

    const rounds = section(getByText, 'Nombre de manches');
    expect(rounds.getByText('5').parent?.props.accessibilityState.selected).toBe(true);
  });

  it('every category chip is selected by default, and can be toggled off and back on', async () => {
    const { getByText } = await renderScreen();

    expect(getByText('Villes').parent?.props.accessibilityState.selected).toBe(true);
    expect(getByText('Villes FR').parent?.props.accessibilityState.selected).toBe(true);
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

  // No local single-device game: playing alone hosts a room nobody joins — created behind the
  // scenes, never shown (no code, the chips keep saying Solo).
  it('solo: hosts a hidden room when "Lancer la partie" is pressed', async () => {
    (createRoom as jest.Mock).mockResolvedValue('tabofuna');
    const { getByText, queryByText } = await renderScreen();
    await fireEvent.press(getByText('Lancer la partie'));
    await waitFor(() => expect(createRoom).toHaveBeenCalledTimes(1));
    expect(queryByText(/tabofuna/)).toBeNull();
  });

  it('calls onBack when "Retour" is pressed', async () => {
    const { getByText, onBack } = await renderScreen();
    await fireEvent.press(getByText('Retour'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
