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

// Same for the draw of the countries (Firestore): one code per round.
jest.mock('@/games/contour/helpers/firestoreContours', () => ({
  fetchContourRoundCodes: jest.fn(() => Promise.resolve(['FR', 'ES', 'IT', 'DE', 'PT'])),
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
    // The setup stays on screen with the loading splash over it.
    expect(getByText('Préparation de la partie…')).toBeTruthy();
    expect(getByText('Lancer la partie')).toBeTruthy();

    await act(async () => {
      useContourRoomStore.setState({
        localUid: 'local-uid',
        players: { 'local-uid': { name: 'Zoé', joinedAt: null } },
      });
    });

    await waitFor(() => expect(startContourRoomGame).toHaveBeenCalledWith('tabofuna', expect.any(Array), 'local-uid', expect.any(Number)));

    // Once the room leaves its lobby the game screen takes over (this screen stays mounted under it):
    // the splash must not stay on top of it.
    await act(async () => {
      useContourRoomStore.setState({ gameState: { ...useContourRoomStore.getState().gameState, screen: 'game' } });
    });
    expect(queryByText('Préparation de la partie…')).toBeNull();
  });

  it('a joiner changing an option only gets the read-only notice, nothing is updated', async () => {
    jest.useFakeTimers();
    try {
      const { getByText, queryByText } = await renderScreen();
      await fireEvent.press(getByText('Rejoindre'));

      await fireEvent.press(getByText('Difficile'));
      expect(getByText('Seul l’hôte peut modifier les options.')).toBeTruthy();
      expect(getByText('Facile').parent?.props.accessibilityState.selected).toBe(true);

      await act(() => jest.advanceTimersByTimeAsync(2000));
      expect(queryByText('Seul l’hôte peut modifier les options.')).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it('starts with the four kinds of hints selected', async () => {
    const { getByText } = await renderScreen();
    // The screen title is also "Silhouette": look inside the hints section.
    const hints = section(getByText, 'Indices');
    for (const label of ['Silhouette', 'Voisins', 'Villes', 'Capitale']) {
      expect(hints.getByText(label).parent?.props.accessibilityState.selected).toBe(true);
    }
  });

  it('toggles a kind of hint, keeping the others', async () => {
    const { getByText } = await renderScreen();

    await fireEvent.press(getByText('Villes'));
    expect(getByText('Villes').parent?.props.accessibilityState.selected).toBe(false);
    expect(useContourSettings.getState().settings.hintCategories).toEqual(['silhouette', 'neighbors', 'capital']);

    await fireEvent.press(getByText('Villes'));
    expect(useContourSettings.getState().settings.hintCategories).toEqual(['silhouette', 'neighbors', 'cities', 'capital']);
  });

  it('never lets the last kind of hint go', async () => {
    useContourSettings.setState({ settings: { ...DEFAULT_CONTOUR_SETTINGS, hintCategories: ['capital'] } });
    const { getByText } = await renderScreen();

    await fireEvent.press(getByText('Capitale'));

    expect(getByText('Capitale').parent?.props.accessibilityState.selected).toBe(true);
    expect(useContourSettings.getState().settings.hintCategories).toEqual(['capital']);
  });

  it('a joiner cannot change the kinds of hints', async () => {
    jest.useFakeTimers();
    try {
      const { getByText } = await renderScreen();
      await fireEvent.press(getByText('Rejoindre'));

      await fireEvent.press(getByText('Voisins'));

      expect(getByText('Seul l’hôte peut modifier les options.')).toBeTruthy();
      expect(useContourSettings.getState().settings.hintCategories).toEqual(DEFAULT_CONTOUR_SETTINGS.hintCategories);
      await act(() => jest.advanceTimersByTimeAsync(2000));
    } finally {
      jest.useRealTimers();
    }
  });

  it('calls onBack when "Quitter" is pressed', async () => {
    const { getByText, onBack } = await renderScreen();
    await fireEvent.press(getByText('Quitter'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
