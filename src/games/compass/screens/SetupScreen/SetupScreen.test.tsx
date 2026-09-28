import { act, fireEvent, render, waitFor, within } from '@testing-library/react-native';

import { DEFAULT_SETTINGS } from '@/games/compass/constants';
import {
  createRoom,
  joinRoomPresence,
  removeRoomPlayer,
  roomExists,
  subscribeToRoomPlayers,
  subscribeToRoomSettings,
  updateRoomPlayerColors,
  updateRoomSettings,
} from '@/games/compass/helpers/room';
import { useRoomStore } from '@/games/compass/store/roomStore';
import { useSettings } from '@/settings';
import type { GameSettings } from '@/types';

import SetupScreen from '.';

jest.mock('@/settings', () => ({ useSettings: jest.fn() }));
// `helpers/room.ts` pulls in `firebase/firestore`, which is ESM-only and crashes Jest the moment
// anything requires it transitively — mocked out here since these tests exercise the setup UI,
// not real Firestore calls.
jest.mock('@/games/compass/helpers/room', () => ({
  ROOM_MAX_PLAYERS: 10,
  createRoom: jest.fn(),
  deleteRoom: jest.fn(() => Promise.resolve()),
  isValidRoomCode: jest.fn((code: string) => code.length === 8),
  joinRoomPresence: jest.fn(() => Promise.resolve('local-uid')),
  // These default to a resolved promise (not bare `jest.fn()`, which returns `undefined`) since
  // the component chains `.catch(() => {})` on all of them — swallowing a room-deleted-under-us
  // permission error is the whole point of that, see SetupScreen.tsx.
  removeRoomPlayer: jest.fn(() => Promise.resolve()),
  roomExists: jest.fn(() => Promise.resolve(false)),
  roomSettingsFrom: jest.fn((settings) => settings),
  subscribeToRoomPlayers: jest.fn(() => jest.fn()),
  subscribeToRoomSettings: jest.fn(() => jest.fn()),
  // Not otherwise used by SetupScreen itself — pulled in transitively through `roomStore.ts`
  // (the shared connect/disconnect store), which also subscribes to the room's game state.
  subscribeToRoomGame: jest.fn(() => jest.fn()),
  updateRoomPlayerColors: jest.fn(() => Promise.resolve()),
  updateRoomSettings: jest.fn(() => Promise.resolve()),
}));

const mockedUseSettings = useSettings as unknown as jest.Mock;
const mockedCreateRoom = createRoom as jest.Mock;
const mockedRoomExists = roomExists as jest.Mock;
const mockedJoinRoomPresence = joinRoomPresence as jest.Mock;
const mockedRemoveRoomPlayer = removeRoomPlayer as jest.Mock;
const mockedSubscribeToRoomPlayers = subscribeToRoomPlayers as jest.Mock;
const mockedSubscribeToRoomSettings = subscribeToRoomSettings as jest.Mock;
const mockedUpdateRoomPlayerColors = updateRoomPlayerColors as jest.Mock;
const mockedUpdateRoomSettings = updateRoomSettings as jest.Mock;

// `useRoomStore` is a module-level singleton shared with `OnlineGameScreen` (unlike the old
// per-component `useState` it replaces), so its state survives across tests unless reset.
const initialRoomState = useRoomStore.getState();
beforeEach(() => {
  useRoomStore.setState(initialRoomState, true);
});

const renderSetup = async (overrides: Partial<GameSettings> = {}, ready = true) => {
  const updateSettings = jest.fn();
  const resetSettings = jest.fn();
  const settings: GameSettings = { ...DEFAULT_SETTINGS, ...overrides };
  mockedUseSettings.mockReturnValue({ settings, ready, updateSettings, resetSettings });
  const onBack = jest.fn();
  const utils = await render(<SetupScreen onBack={onBack} />);
  return { ...utils, onBack, settings, updateSettings };
};

describe('SetupScreen — defaults', () => {
  it('renders the title and does not show the hide-answers toggle nor custom origin with one player + GPS on', async () => {
    const { getByText, queryByLabelText } = await renderSetup();
    expect(getByText('Nouvelle partie')).toBeTruthy();
    expect(queryByLabelText('Cacher les réponses des autres')).toBeNull();
  });

  it('typing a name updates the solo player', async () => {
    const { getByLabelText, updateSettings } = await renderSetup();
    await fireEvent.changeText(getByLabelText('Nom du joueur 1'), 'Bob');
    expect(updateSettings).toHaveBeenCalledWith({ playerNames: ['Bob'] });
  });

  it('shows the initials of a typed name, or of the placeholder when empty', async () => {
    const { getByText } = await renderSetup({ playerNames: ['Alice'] });
    expect(getByText('AL')).toBeTruthy();
  });
});

describe('SetupScreen — host/join a game', () => {
  it('creating a game shows the generated code once it resolves, in a readonly input', async () => {
    mockedCreateRoom.mockResolvedValue('tabofuna');
    const { getByText, findByDisplayValue } = await renderSetup();
    fireEvent.press(getByText('Créer'));
    const codeInput = await findByDisplayValue('tabofuna');
    expect(codeInput.props.editable).toBe(false);
  });

  it('joining a game keeps every setting section visible but read-only', async () => {
    const { getByText, getByLabelText } = await renderSetup();
    await fireEvent.press(getByText('Rejoindre'));
    expect(getByText('Catégories')).toBeTruthy();
    expect(getByText('Difficulté')).toBeTruthy();
    expect(getByText('Nombre de manches')).toBeTruthy();
    expect(getByText('Options')).toBeTruthy();
    expect(getByLabelText('Nom du joueur 1')).toBeTruthy();
    const mountainsChip = getByText('Montagnes');
    expect(mountainsChip.parent?.props.accessibilityState.disabled).toBe(true);
    expect(getByLabelText('Boussole réelle').props.accessibilityState.disabled).toBe(true);
  });

  it('shows a notice instead of changing anything when a joiner taps a read-only option, then hides it after 2s', async () => {
    jest.useFakeTimers();
    try {
      const { getByText, queryByText, updateSettings } = await renderSetup();
      await fireEvent.press(getByText('Rejoindre'));
      updateSettings.mockClear();

      await fireEvent.press(getByText('Montagnes'));
      expect(updateSettings).not.toHaveBeenCalled();
      expect(getByText('Seul l’hôte peut modifier les options.')).toBeTruthy();

      await act(() => jest.advanceTimersByTimeAsync(2000));
      expect(queryByText('Seul l’hôte peut modifier les options.')).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it('removes the bottom button entirely when joining, leaving only back', async () => {
    const { getByText, queryByText } = await renderSetup();
    await fireEvent.press(getByText('Rejoindre'));
    expect(queryByText('Lancer la partie')).toBeNull();
    expect(queryByText('Rejoindre la partie')).toBeNull();
    expect(getByText('Retour')).toBeTruthy();
  });

  it('lets a joiner go back to solo play via the "Jouer seul" chip', async () => {
    const { getByText, queryByText } = await renderSetup();
    await fireEvent.press(getByText('Rejoindre'));
    expect(queryByText('Lancer la partie')).toBeNull();
    await fireEvent.press(getByText('Jouer seul'));
    expect(getByText('Lancer la partie')).toBeTruthy();
  });

  it('subscribes to the room settings once a full code is typed, and applies them', async () => {
    mockedRoomExists.mockResolvedValue(true);
    const { getByText, findByPlaceholderText, updateSettings } = await renderSetup();
    await fireEvent.press(getByText('Rejoindre'));
    fireEvent.changeText(await findByPlaceholderText('Code de la partie'), 'tabofuna');
    // Now the shared room store's own subscription (opened by `connect()` once the code
    // validates), not one this screen opens itself — see SetupScreen's join-validation effect.
    // The latest matching call, not just any call ever made with this code: `subscribeToRoomPlayers`
    // being 'tabofuna' too is what `latestOnPlayers` above guards against; mocks are never reset
    // between tests, and 'tabofuna' is also used by other (host) tests in this file.
    await waitFor(() => expect(mockedSubscribeToRoomSettings).toHaveBeenCalledWith('tabofuna', expect.any(Function)));
    const settingsCalls = mockedSubscribeToRoomSettings.mock.calls.filter(([code]) => code === 'tabofuna');
    const onRoomSettings = settingsCalls[settingsCalls.length - 1][1];
    await act(async () => onRoomSettings({ ...DEFAULT_SETTINGS, rounds: 15 }));
    expect(updateSettings).toHaveBeenCalledWith(expect.objectContaining({ rounds: 15 }));
    // Lets the join-valid presence/players effects (also triggered by the same state update)
    // settle before the test ends — otherwise they can fire late, into the next test, and steal
    // its `subscribeToRoomPlayers` mock capture.
    await waitFor(() => expect(mockedJoinRoomPresence).toHaveBeenCalled());
  });

  it('pushes settings changes to the room while hosting', async () => {
    mockedCreateRoom.mockResolvedValue('tabofuna');
    const { getByText, findByDisplayValue, rerender, settings, onBack } = await renderSetup();
    fireEvent.press(getByText('Créer'));
    await findByDisplayValue('tabofuna');
    mockedUpdateRoomSettings.mockClear();
    mockedUseSettings.mockReturnValue({
      settings: { ...settings, rounds: 15 },
      ready: true,
      updateSettings: jest.fn(),
      resetSettings: jest.fn(),
    });
    await rerender(<SetupScreen onBack={onBack} />);
    expect(mockedUpdateRoomSettings).toHaveBeenCalledWith('tabofuna', expect.objectContaining({ rounds: 15 }));
  });

  it('registers this device as a connected player, and lists other connected players read-only below its own name (not itself)', async () => {
    mockedCreateRoom.mockResolvedValue('tabofuna');
    mockedJoinRoomPresence.mockResolvedValue('host');
    const onPlayers = jest.fn();
    mockedSubscribeToRoomPlayers.mockImplementation((_code, callback) => {
      onPlayers.mockImplementation(callback);
      return jest.fn();
    });
    const { getByText, queryByText, findByDisplayValue, getByDisplayValue } = await renderSetup({
      playerNames: ['Zoé'],
    });
    fireEvent.press(getByText('Créer'));
    await findByDisplayValue('tabofuna');
    expect(mockedJoinRoomPresence).toHaveBeenCalledWith('tabofuna', 'Zoé');

    onPlayers({
      host: { name: 'Zoé', joinedAt: { toMillis: () => 1 } },
      guest: { name: 'Max', joinedAt: { toMillis: () => 2 } },
    });
    await waitFor(() => expect(getByDisplayValue('Max')).toBeTruthy());
    expect(getByDisplayValue('Max').props.editable).toBe(false);
    // The host's own entry isn't duplicated as a read-only row below its own editable one.
    expect(queryByText('Zoé')).toBeNull();
  });

  it('locks the player-name field once connected to a room', async () => {
    mockedCreateRoom.mockResolvedValue('tabofuna');
    const { getByLabelText, getByText, findByDisplayValue } = await renderSetup({ playerNames: ['Zoé'] });
    expect(getByLabelText('Nom du joueur 1').props.editable).not.toBe(false);
    fireEvent.press(getByText('Créer'));
    await findByDisplayValue('tabofuna');
    expect(getByLabelText('Nom du joueur 1').props.editable).toBe(false);
  });

  it('marks the host entry in a joiner’s read-only players list', async () => {
    mockedRoomExists.mockResolvedValue(true);
    mockedJoinRoomPresence.mockResolvedValue('guest');
    mockedSubscribeToRoomPlayers.mockClear();
    const { getByText, findByPlaceholderText, getByDisplayValue } = await renderSetup({ playerNames: ['Max'] });
    await fireEvent.press(getByText('Rejoindre'));
    fireEvent.changeText(await findByPlaceholderText('Code de la partie'), 'tabofuna');
    await waitFor(() => expect(mockedSubscribeToRoomPlayers).toHaveBeenCalledWith('tabofuna', expect.any(Function)));
    // Reads the callback straight from the mock's own call log instead of a shared indirection
    // object — immune to a stale leftover component from another test also calling this same
    // mock and clobbering a captured reference.
    const calls = mockedSubscribeToRoomPlayers.mock.calls.filter(([code]) => code === 'tabofuna');
    const onPlayers = calls[calls.length - 1][1];

    onPlayers(
      {
        host: { name: 'Zoé', joinedAt: { toMillis: () => 1 } },
        guest: { name: 'Max', joinedAt: { toMillis: () => 2 } },
      },
      'host',
    );
    await waitFor(() => expect(getByDisplayValue('Zoé (hôte)')).toBeTruthy());
  });

  it('lets the host remove a connected player, but shows no such button to a joiner', async () => {
    mockedCreateRoom.mockResolvedValue('tabofuna');
    mockedJoinRoomPresence.mockResolvedValue('host');
    const onPlayers = jest.fn();
    mockedSubscribeToRoomPlayers.mockImplementation((_code, callback) => {
      onPlayers.mockImplementation(callback);
      return jest.fn();
    });
    const { getByText, getByLabelText, findByDisplayValue } = await renderSetup({ playerNames: ['Zoé'] });
    fireEvent.press(getByText('Créer'));
    await findByDisplayValue('tabofuna');
    onPlayers(
      {
        host: { name: 'Zoé', joinedAt: { toMillis: () => 1 } },
        guest: { name: 'Max', joinedAt: { toMillis: () => 2 } },
      },
      'host',
    );
    await waitFor(() => expect(getByLabelText('Retirer Max')).toBeTruthy());

    fireEvent.press(getByLabelText('Retirer Max'));
    expect(mockedRemoveRoomPlayer).toHaveBeenCalledWith('tabofuna', 'guest');
  });

  it('leaves the previous room’s presence when the host creates a new one', async () => {
    mockedCreateRoom.mockResolvedValueOnce('rooma').mockResolvedValueOnce('roomb');
    mockedJoinRoomPresence.mockResolvedValue('host');
    const { getByText, findByDisplayValue } = await renderSetup();
    fireEvent.press(getByText('Créer'));
    await findByDisplayValue('rooma');
    mockedRemoveRoomPlayer.mockClear();

    fireEvent.press(getByText('Créer'));
    await findByDisplayValue('roomb');
    expect(mockedRemoveRoomPlayer).toHaveBeenCalledWith('rooma', 'host');
  });

  // Reads the callback straight from the mock's own call log rather than a shared indirection
  // object — immune to `localUid` resolving asynchronously and re-triggering the players-
  // subscribe effect (a fresh `subscribeToRoomPlayers` call) between setup and use.
  const latestOnPlayers = (code: string) => {
    const calls = mockedSubscribeToRoomPlayers.mock.calls.filter(([callCode]) => callCode === code);
    return calls[calls.length - 1][1];
  };

  it('reflects this device’s own host-assigned color on its own badge once connected', async () => {
    mockedRoomExists.mockResolvedValue(true);
    // Explicit rather than relying on the default mock — an earlier test in this file may have
    // left `joinRoomPresence` resolving to a different uid (mocks are never reset between tests).
    mockedJoinRoomPresence.mockResolvedValue('local-uid');
    const { getByText, getByLabelText, findByPlaceholderText } = await renderSetup({ playerNames: ['Zoé'] });
    await fireEvent.press(getByText('Rejoindre'));
    fireEvent.changeText(await findByPlaceholderText('Code de la partie'), 'coloreja');
    await waitFor(() => expect(mockedSubscribeToRoomPlayers).toHaveBeenCalledWith('coloreja', expect.any(Function)));
    const onPlayers = latestOnPlayers('coloreja');

    // 'local-uid' is the default `joinRoomPresence` mock resolves to — this device's own uid.
    await act(async () =>
      onPlayers(
        {
          'local-uid': { name: 'Zoé', color: '#16A34A', joinedAt: { toMillis: () => 1 } },
          host: { name: 'Floran', color: '#EF4444', joinedAt: { toMillis: () => 2 } },
        },
        'host',
        true,
      ),
    );
    await waitFor(() => {
      const ownWrap = getByLabelText('Nom du joueur 1').parent;
      expect(ownWrap).not.toBeNull();
      const ownInitials = within(ownWrap!).getByText('ZO');
      expect(ownInitials.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ color: '#16A34A' })]));
    });
  });

  it('has the host recompute and write everyone’s color whenever the connected-players list changes', async () => {
    // A code no other test in this file uses — `latestOnPlayers` disambiguates by code, but only
    // within *this* code's own call history, so it can't be tricked by another test's lingering
    // component (mocks here are never reset between tests) also using the common 'tabofuna'.
    mockedCreateRoom.mockResolvedValue('batiroko');
    mockedJoinRoomPresence.mockResolvedValue('host');
    const { getByText, findByDisplayValue } = await renderSetup({ playerNames: ['Zoé'] });
    fireEvent.press(getByText('Créer'));
    await findByDisplayValue('batiroko');
    await waitFor(() => expect(mockedSubscribeToRoomPlayers).toHaveBeenCalledWith('batiroko', expect.any(Function)));

    latestOnPlayers('batiroko')(
      {
        host: { name: 'Zoé', joinedAt: { toMillis: () => 1 } },
        guest: { name: 'Max', joinedAt: { toMillis: () => 2 } },
      },
      'host',
    );
    await waitFor(() =>
      expect(mockedUpdateRoomPlayerColors).toHaveBeenCalledWith(
        'batiroko',
        expect.objectContaining({ host: expect.any(String), guest: expect.any(String) }),
      ),
    );
  });

  it('shows a "room deleted" notice to a joiner once the room disappears, then resets to solo', async () => {
    mockedRoomExists.mockResolvedValue(true);
    const { getByText, findByPlaceholderText, queryByText } = await renderSetup();
    await fireEvent.press(getByText('Rejoindre'));
    fireEvent.changeText(await findByPlaceholderText('Code de la partie'), 'nodilipa');
    await waitFor(() => expect(mockedSubscribeToRoomPlayers).toHaveBeenCalledWith('nodilipa', expect.any(Function)));
    const onPlayers = latestOnPlayers('nodilipa');

    // Async `act` — the resulting state update needs a microtask tick to flush in this
    // environment; the sync form leaves the assertion below looking at the pre-update render.
    await act(async () => onPlayers({ host: { name: 'Zoé', joinedAt: { toMillis: () => 1 } } }, 'host', true));
    await act(async () => onPlayers({}, undefined, false));
    expect(getByText('L’hôte a supprimé la partie.')).toBeTruthy();

    // The room is gone by now, so the leave-cleanup this same reset triggers (connectedRoomCode
    // going back to null) will hit it and get rejected — must not crash the screen with an
    // unhandled rejection, the original bug report this test guards against.
    mockedRemoveRoomPlayer.mockRejectedValueOnce(new Error('permission-denied'));

    // Real 2s wait for the auto-dismiss timeout rather than fake timers — a second fake-timers
    // switch in this same file destabilizes the react-test-renderer act() environment for every
    // test that runs after it.
    await waitFor(() => expect(queryByText('L’hôte a supprimé la partie.')).toBeNull(), { timeout: 3000 });
    expect(getByText('Lancer la partie')).toBeTruthy();
  }, 10000);
});

describe('SetupScreen — multiplayer-only toggles', () => {
  it('shows and wires hideOtherAnswers with 2+ players', async () => {
    const { getByLabelText, updateSettings } = await renderSetup({ playerNames: ['A', 'B'] });
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
    expect(updateSettings).toHaveBeenCalledWith(expect.objectContaining({ difficulties: ['hard'] }));
  });

  it('selects a round count', async () => {
    const { getByText, updateSettings } = await renderSetup();
    await fireEvent.press(getByText('15'));
    expect(updateSettings).toHaveBeenCalledWith({ rounds: 15 });
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
    const { getByDisplayValue } = await renderSetup({
      useGps: false,
      customLatitude: 48.8566,
      customLongitude: 2.3522,
    });
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
  // No local single-device game: playing alone hosts a room nobody joins — created behind the
  // scenes, never shown (no code, the chips keep saying Solo).
  it('solo: hosts a hidden room when pressed and enabled', async () => {
    mockedCreateRoom.mockClear();
    mockedCreateRoom.mockResolvedValue('tabofuna');
    const { getByText, queryByText } = await renderSetup();
    await fireEvent.press(getByText('Lancer la partie'));
    await waitFor(() => expect(mockedCreateRoom).toHaveBeenCalledTimes(1));
    expect(queryByText(/tabofuna/)).toBeNull();
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
