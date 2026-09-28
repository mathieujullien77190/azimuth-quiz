import { act, fireEvent, render, waitFor, within } from '@testing-library/react-native';

import { DEFAULT_CONTOUR_SETTINGS } from '@/games/contour/constants';
import { createRoom, startContourRoomGame } from '@/games/contour/helpers/room';
import { useContourRoomStore } from '@/games/contour/store/roomStore';
import { useContourSettings } from '@/settings';

import ContourSetupScreen from '.';

// `helpers/room.ts` pulls in `firebase/firestore`, which is ESM-only and crashes Jest the moment
// anything requires it transitively — mocked out here since these tests exercise the setup UI, not
// real Firestore calls. Same mock shape as Clues' own `ClueSetupScreen.test.tsx`.
jest.mock('@/games/contour/helpers/room', () => ({
  ROOM_MAX_PLAYERS: 10,
  createRoom: jest.fn(),
  deleteRoom: jest.fn(() => Promise.resolve()),
  isValidRoomCode: jest.fn((code: string) => code.length === 8),
  joinRoomPresence: jest.fn(() => Promise.resolve('local-uid')),
  removeRoomPlayer: jest.fn(() => Promise.resolve()),
  roomExists: jest.fn(() => Promise.resolve(false)),
  sendHeartbeat: jest.fn(() => Promise.resolve()),
  contourRoomSettingsFrom: jest.fn((settings) => settings),
  startContourRoomGame: jest.fn(() => Promise.resolve()),
  subscribeToRoomPlayers: jest.fn(() => jest.fn()),
  subscribeToRoomSettings: jest.fn(() => jest.fn()),
  subscribeToRoomGame: jest.fn(() => jest.fn()),
  updateRoomPlayerColors: jest.fn(() => Promise.resolve()),
  updateRoomSettings: jest.fn(() => Promise.resolve()),
}));

// Both stores are module-level singletons — reset explicitly so a chip pressed (or a room joined) in
// one test doesn't leak into the next.
const initialRoomState = useContourRoomStore.getState();
beforeEach(() => {
  useContourSettings.setState({ settings: DEFAULT_CONTOUR_SETTINGS });
  useContourRoomStore.setState(initialRoomState, true);
});

/** Section (Card) containing a given title: used to resolve ambiguities between labels shared
 * across sections (e.g. "5" is both a possible round count and something else). */
const section = (getByText: (text: string) => Parameters<typeof within>[0], title: string) =>
  within(getByText(title).parent!.parent!);

const renderScreen = async (onBack = jest.fn()) => {
  const utils = await render(<ContourSetupScreen onBack={onBack} />);
  return { ...utils, onBack };
};

describe('ContourSetupScreen', () => {
  it('renders the solo name field and selects the default difficulty/rounds chips', async () => {
    const { getByText, getByPlaceholderText } = await renderScreen();

    expect(getByPlaceholderText(/./)).toBeTruthy();
    expect(getByText('Facile').parent?.props.accessibilityState.selected).toBe(true);
    expect(section(getByText, 'Nombre de manches').getByText('5').parent?.props.accessibilityState.selected).toBe(true);
  });

  it('updates the difficulty when a difficulty chip is pressed', async () => {
    const { getByText } = await renderScreen();

    await fireEvent.press(getByText('Difficile'));

    expect(getByText('Difficile').parent?.props.accessibilityState.selected).toBe(true);
    expect(getByText('Facile').parent?.props.accessibilityState.selected).toBe(false);
  });

  it('updates the rounds count when a rounds chip is pressed', async () => {
    const { getByText } = await renderScreen();

    const rounds = section(getByText, 'Nombre de manches');
    await fireEvent.press(rounds.getByText('20'));

    expect(rounds.getByText('20').parent?.props.accessibilityState.selected).toBe(true);
    expect(rounds.getByText('5').parent?.props.accessibilityState.selected).toBe(false);
  });

  // No local single-device game: playing alone hosts a room nobody joins — created behind the
  // scenes, never shown (no code, the chips keep saying Solo), and the game only starts in it once
  // it's connected and lists this device (the first turn goes to whoever's first in that room).
  it('solo: hosts a hidden room, then starts the game in it once this device is listed', async () => {
    (createRoom as jest.Mock).mockResolvedValue('tabofuna');
    const { getByText, queryByText } = await renderScreen();
    await fireEvent.press(getByText('Lancer la partie'));
    await waitFor(() => expect(createRoom).toHaveBeenCalledTimes(1));
    expect(startContourRoomGame).not.toHaveBeenCalled();
    expect(queryByText(/tabofuna/)).toBeNull();

    await act(async () => {
      useContourRoomStore.setState({
        localUid: 'local-uid',
        players: { 'local-uid': { name: 'Zoé', joinedAt: null } },
      });
    });

    await waitFor(() => expect(startContourRoomGame).toHaveBeenCalledWith('tabofuna', expect.any(Array), 'local-uid'));
  });

  it('calls onBack when "Retour" is pressed', async () => {
    const { getByText, onBack } = await renderScreen();
    await fireEvent.press(getByText('Retour'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
