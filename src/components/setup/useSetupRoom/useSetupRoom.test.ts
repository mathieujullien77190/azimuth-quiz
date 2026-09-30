import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';

import { PLAYER_NAME_STORAGE_KEY } from '@/data';
import { createRoomStore } from '@/helpers/createRoomStore';
import { nameTakenError } from '@/helpers/roomName';
import type { RoomPlayers } from '@/helpers/roomBase';
import { usePlayerName } from '@/settings';

import type { SetupRoomAdapter } from './types';
import { useSetupRoom } from './useSetupRoom';

const mockPush = jest.fn();
const mockDismissTo = jest.fn();
// A stable router object, like the real hook's: a fresh one per render would re-run effects.
const mockRouter = { push: mockPush, dismissTo: mockDismissTo };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
// Connection-loss detection has its own tests (`useRoomPresence.test.ts`).
jest.mock('@/helpers/useRoomPresence', () => ({ useRoomPresence: jest.fn() }));

type Settings = { playerName: string; rounds: number };
type RoomSettings = { rounds: number };
type GameState = { screen: string };

const SETTINGS: Settings = { playerName: 'Zoe', rounds: 5 };
const player = (name: string, color?: string) => ({ name, joinedAt: null, color });

const flush = () => act(async () => {});

const setup = async (overrides: Partial<SetupRoomAdapter<Settings, RoomSettings>> = {}, settings = SETTINGS) => {
  let onPlayers!: (players: RoomPlayers, hostUid: string | undefined, exists: boolean) => void;
  let onSettings!: (settings: RoomSettings) => void;
  let onGame!: (state: GameState) => void;
  const store = createRoomStore<RoomSettings, GameState>({
    defaultGameState: { screen: 'options' },
    subscribeToRoomPlayers: (_code, callback) => {
      onPlayers = callback;
      return () => {};
    },
    subscribeToRoomSettings: (_code, callback) => {
      onSettings = callback;
      return () => {};
    },
    subscribeToRoomGame: (_code, callback) => {
      onGame = callback;
      return () => {};
    },
  });
  const adapter: SetupRoomAdapter<Settings, RoomSettings> = {
    store: store as never,
    gamePath: '/online-game',
    colors: ['red', 'blue'],
    maxPlayers: 2,
    roomSettingsFrom: ({ rounds }) => ({ rounds }),
    isValidRoomCode: (code) => code.length === 8,
    createRoom: jest.fn(() => Promise.resolve('tabofuna')),
    roomExists: jest.fn(() => Promise.resolve(true)),
    updateRoomSettings: jest.fn(() => Promise.resolve()),
    joinRoomPresence: jest.fn(() => Promise.resolve('zoe')),
    removeRoomPlayer: jest.fn(() => Promise.resolve()),
    deleteRoom: jest.fn(() => Promise.resolve()),
    sendHeartbeat: jest.fn(() => Promise.resolve()),
    updateRoomPlayerColors: jest.fn(() => Promise.resolve()),
    ...overrides,
  };
  const updateSettings = jest.fn();
  const hook = await renderHook(
    (props: { settings: Settings }) => useSetupRoom(adapter, props.settings, updateSettings),
    {
      initialProps: { settings },
    },
  );
  return {
    adapter,
    store,
    updateSettings,
    ...hook,
    emitPlayers: (players: RoomPlayers, hostUid: string | undefined, exists = true) =>
      act(async () => onPlayers(players, hostUid, exists)),
    emitSettings: (roomSettings: RoomSettings) => act(async () => onSettings(roomSettings)),
    emitGame: (state: GameState) => act(async () => onGame(state)),
  };
};

type Setup = Awaited<ReturnType<typeof setup>>;

const hostRoom = async (ctx: Setup) => {
  await act(async () => ctx.result.current.party.onChooseHost());
  await flush();
};

const joinRoom = async (ctx: Setup, code = 'tabofuna') => {
  await act(async () => ctx.result.current.party.onChooseJoin());
  await act(async () => ctx.result.current.party.onJoinCodeChange(code));
  await flush();
};

beforeEach(() => {
  jest.useFakeTimers();
  mockPush.mockClear();
  mockDismissTo.mockClear();
  AsyncStorage.clear();
  usePlayerName.setState({ playerName: '', ready: false });
});
afterEach(() => jest.useRealTimers());

describe('useSetupRoom — solo', () => {
  it('starts as solo: editable name, no room, no overlay', async () => {
    const { result } = await setup();
    expect(result.current.party).toMatchObject({
      soloName: 'Zoe',
      nameEditable: true,
      onlineChoice: null,
      roomCode: null,
    });
    expect(result.current.connectedRoomCode).toBeNull();
    expect(result.current.overlayMessage).toBeNull();
    expect(result.current.readOnly).toBe(false);
  });

  it('pushes the typed name into the settings', async () => {
    const { result, updateSettings } = await setup();
    await act(async () => result.current.party.onChangeName('Max'));
    expect(updateSettings).toHaveBeenCalledWith({ playerName: 'Max' });
  });

  it('falls back to the placeholder as the solo name when settings have none', async () => {
    const { result } = await setup({}, { ...SETTINGS, playerName: '' });
    expect(result.current.party.soloName).toBe('');
  });
});

describe('useSetupRoom — hosting', () => {
  it('creates a room with the shared settings and connects to it', async () => {
    const ctx = await setup();
    await hostRoom(ctx);

    expect(ctx.adapter.createRoom).toHaveBeenCalledWith({ rounds: 5 });
    expect(ctx.result.current.party.roomCode).toBe('tabofuna');
    expect(ctx.result.current.connectedRoomCode).toBe('tabofuna');
    expect(ctx.store.getState().code).toBe('tabofuna');
    expect(ctx.adapter.updateRoomSettings).toHaveBeenCalledWith('tabofuna', { rounds: 5 });
  });

  it('registers this device in the room, and the host can still change its name', async () => {
    const ctx = await setup();
    await hostRoom(ctx);

    expect(ctx.adapter.joinRoomPresence).toHaveBeenCalledWith('tabofuna', 'Zoe');
    expect(ctx.store.getState().localUid).toBe('zoe');
    expect(ctx.result.current.party.nameEditable).toBe(true);
  });

  it('renames the host in the room once it stops typing, not on every keystroke', async () => {
    const ctx = await setup();
    await hostRoom(ctx);
    jest.mocked(ctx.adapter.joinRoomPresence).mockClear();

    const renamed = { ...SETTINGS, playerName: 'Zoé' };
    await ctx.rerender({ settings: renamed });
    await act(async () => jest.advanceTimersByTime(300));
    expect(ctx.adapter.joinRoomPresence).not.toHaveBeenCalled();
    await act(async () => jest.advanceTimersByTime(400));
    expect(ctx.adapter.joinRoomPresence).toHaveBeenCalledTimes(1);
    expect(ctx.adapter.joinRoomPresence).toHaveBeenCalledWith('tabofuna', 'Zoé');
  });

  it('registers with the placeholder when the name is blank', async () => {
    const ctx = await setup({}, { ...SETTINGS, playerName: '  ' });
    await hostRoom(ctx);
    expect(jest.mocked(ctx.adapter.joinRoomPresence).mock.calls[0][1]).toBe(ctx.result.current.party.soloPlaceholder);
  });

  it('tolerates a failing presence registration', async () => {
    const ctx = await setup({ joinRoomPresence: jest.fn(() => Promise.reject(new Error('gone'))) });
    await hostRoom(ctx);
    expect(ctx.store.getState().localUid).toBeNull();
  });

  it('tolerates a failing settings sync', async () => {
    const ctx = await setup({ updateRoomSettings: jest.fn(() => Promise.reject(new Error('gone'))) });
    await hostRoom(ctx);
    expect(ctx.result.current.connectedRoomCode).toBe('tabofuna');
  });

  it('lists connected players in arrival order, capped to the max, once the local uid is known', async () => {
    const ctx = await setup();
    await hostRoom(ctx);
    await ctx.emitPlayers({ zoe: player('Zoe'), max: player('Max'), eve: player('Eve') }, 'zoe');

    expect(ctx.result.current.party.connectedPlayers.map(([uid]) => uid)).toHaveLength(2);
    expect(ctx.result.current.party.isHost).toBe(true);
    expect(ctx.result.current.party.hostUid).toBe('zoe');
  });

  it('assigns every player a color from the palette by arrival order (host only)', async () => {
    const ctx = await setup();
    await hostRoom(ctx);
    await ctx.emitPlayers({ zoe: player('Zoe'), max: player('Max', 'blue') }, 'zoe');

    expect(ctx.adapter.updateRoomPlayerColors).toHaveBeenLastCalledWith('tabofuna', { zoe: 'red' });
    expect(ctx.result.current.party.soloColor).toBe('red');
  });

  it('shows the host-assigned color once one exists', async () => {
    const ctx = await setup();
    await hostRoom(ctx);
    await ctx.emitPlayers({ zoe: player('Zoe', 'blue') }, 'zoe');
    expect(ctx.result.current.party.soloColor).toBe('blue');
  });

  it('kicks a player by removing their presence', async () => {
    const ctx = await setup();
    await hostRoom(ctx);
    await act(async () => ctx.result.current.party.onKick('max'));
    expect(ctx.adapter.removeRoomPlayer).toHaveBeenCalledWith('tabofuna', 'max');
  });

  it('swallows a failing kick', async () => {
    const ctx = await setup({ removeRoomPlayer: jest.fn(() => Promise.reject(new Error('gone'))) });
    await hostRoom(ctx);
    await act(async () => ctx.result.current.party.onKick('max'));
    expect(ctx.adapter.removeRoomPlayer).toHaveBeenCalledWith('tabofuna', 'max');
  });

  it('swallows a failing color sync', async () => {
    const ctx = await setup({ updateRoomPlayerColors: jest.fn(() => Promise.reject(new Error('gone'))) });
    await hostRoom(ctx);
    await ctx.emitPlayers({ zoe: player('Zoe'), max: player('Max', 'blue') }, 'zoe');
    expect(ctx.adapter.updateRoomPlayerColors).toHaveBeenCalled();
  });

  it('does nothing when kicking without a room', async () => {
    const ctx = await setup();
    await act(async () => ctx.result.current.party.onKick('max'));
    expect(ctx.adapter.removeRoomPlayer).not.toHaveBeenCalled();
  });

  it('deletes the room when going back to solo', async () => {
    const ctx = await setup();
    await hostRoom(ctx);
    await act(async () => ctx.result.current.party.onChooseSolo());
    expect(ctx.adapter.deleteRoom).toHaveBeenCalledWith('tabofuna');
    expect(ctx.result.current.party.onlineChoice).toBeNull();
    expect(ctx.result.current.connectedRoomCode).toBeNull();
  });

  it('does not delete anything when leaving a host choice that never got a room', async () => {
    const ctx = await setup({ createRoom: jest.fn(() => new Promise<string>(() => {})) });
    await act(async () => ctx.result.current.party.onChooseHost());
    await act(async () => ctx.result.current.party.onChooseSolo());
    expect(ctx.adapter.deleteRoom).not.toHaveBeenCalled();
  });

  it('deletes the hosted room, then switches to join', async () => {
    const ctx = await setup();
    await hostRoom(ctx);
    await act(async () => ctx.result.current.party.onChooseJoin());
    expect(ctx.adapter.deleteRoom).toHaveBeenCalledWith('tabofuna');
    expect(ctx.result.current.readOnly).toBe(true);
  });

  it('swallows a failing deletion when leaving the hosted room', async () => {
    const ctx = await setup({ deleteRoom: jest.fn(() => Promise.reject(new Error('gone'))) });
    await hostRoom(ctx);
    await act(async () => ctx.result.current.party.onChooseSolo());
    expect(ctx.result.current.party.onlineChoice).toBeNull();
  });

  it('host cleanup: deletes its room on unmount', async () => {
    const ctx = await setup();
    await hostRoom(ctx);
    await ctx.emitPlayers({ zoe: player('Zoe', 'red') }, 'zoe');
    await ctx.unmount();
    expect(ctx.adapter.deleteRoom).toHaveBeenCalledWith('tabofuna');
  });
});

describe('useSetupRoom — a name that is already taken', () => {
  const NAME_ERROR = 'Ce pseudo est déjà pris dans la partie : choisis-en un autre.';

  it('refuses a joiner, opens its name field again and says why', async () => {
    const ctx = await setup({ joinRoomPresence: jest.fn(() => Promise.reject(nameTakenError())) });
    await joinRoom(ctx);
    expect(ctx.result.current.party.nameEditable).toBe(true);
    expect(ctx.result.current.party.nameError).toBe(NAME_ERROR);
    expect(ctx.store.getState().localUid).toBeNull();
  });

  it('lets the joiner in once it types a free name, and locks the field again', async () => {
    const joinRoomPresence = jest.fn().mockRejectedValueOnce(nameTakenError()).mockResolvedValue('max');
    const ctx = await setup({ joinRoomPresence });
    await joinRoom(ctx);
    expect(ctx.result.current.party.nameError).toBe(NAME_ERROR);

    await ctx.rerender({ settings: { ...SETTINGS, playerName: 'Max' } });
    await act(async () => jest.advanceTimersByTime(700));
    await flush();

    expect(joinRoomPresence).toHaveBeenLastCalledWith('tabofuna', 'Max');
    expect(ctx.result.current.party.nameError).toBeNull();
    expect(ctx.result.current.party.nameEditable).toBe(false);
    expect(ctx.store.getState().localUid).toBe('max');
  });

  it('tells a host who renames itself to a name a joiner already has', async () => {
    const joinRoomPresence = jest.fn().mockResolvedValueOnce('zoe').mockRejectedValueOnce(nameTakenError());
    const ctx = await setup({ joinRoomPresence });
    await hostRoom(ctx);
    expect(ctx.result.current.party.nameError).toBeNull();

    await ctx.rerender({ settings: { ...SETTINGS, playerName: 'Max' } });
    await act(async () => jest.advanceTimersByTime(700));
    await flush();

    expect(ctx.result.current.party.nameError).toBe(NAME_ERROR);
    expect(ctx.result.current.party.nameEditable).toBe(true);
  });

  it('says nothing about the name for any other failure', async () => {
    const ctx = await setup({ joinRoomPresence: jest.fn(() => Promise.reject(new Error('offline'))) });
    await joinRoom(ctx);
    expect(ctx.result.current.party.nameError).toBeNull();
    expect(ctx.result.current.party.nameEditable).toBe(false);
  });

  it('shows no name error once back to playing alone', async () => {
    const ctx = await setup({ joinRoomPresence: jest.fn(() => Promise.reject(nameTakenError())) });
    await joinRoom(ctx);
    await act(async () => ctx.result.current.party.onChooseSolo());
    expect(ctx.result.current.party.nameError).toBeNull();
    expect(ctx.result.current.party.nameEditable).toBe(true);
  });
});

describe('useSetupRoom — the default name', () => {
  const BLANK = { ...SETTINGS, playerName: '' };

  it('is the first default name while alone', async () => {
    const ctx = await setup({}, BLANK);
    expect(ctx.result.current.party.soloPlaceholder).toBe('Zoé');
  });

  it('is the first one nobody else in the room has, so two devices never share it', async () => {
    const ctx = await setup({ joinRoomPresence: jest.fn(() => Promise.resolve('max')) }, BLANK);
    await joinRoom(ctx);
    await ctx.emitPlayers({ host: player('Zoé'), other: player('Max') }, 'host');
    expect(ctx.result.current.party.soloPlaceholder).toBe('Léo');
  });

  it('registers under that name when the field is empty, and moves to the next free one if it was just taken', async () => {
    const joinRoomPresence = jest.fn().mockRejectedValueOnce(nameTakenError()).mockResolvedValue('max');
    const ctx = await setup({ joinRoomPresence }, BLANK);
    await joinRoom(ctx);
    expect(joinRoomPresence).toHaveBeenLastCalledWith('tabofuna', 'Zoé');

    // Somebody else got "Zoé" first: the placeholder moves on and the registration is retried.
    await ctx.emitPlayers({ host: player('Zoé') }, 'host');
    await flush();
    expect(joinRoomPresence).toHaveBeenLastCalledWith('tabofuna', 'Max');
    expect(ctx.result.current.party.nameError).toBeNull();
  });
});

describe('useSetupRoom — cleanup that fails', () => {
  it('host: survives a failing deletion of its room on unmount', async () => {
    const ctx = await setup({ deleteRoom: jest.fn(() => Promise.reject(new Error('gone'))) });
    await hostRoom(ctx);
    await ctx.emitPlayers({ zoe: player('Zoe', 'red') }, 'zoe');
    await ctx.unmount();
    expect(ctx.adapter.deleteRoom).toHaveBeenCalledWith('tabofuna');
  });

  it('joiner: survives a failing removal of its presence on unmount', async () => {
    const ctx = await setup({
      joinRoomPresence: jest.fn(() => Promise.resolve('max')),
      removeRoomPlayer: jest.fn(() => Promise.reject(new Error('gone'))),
    });
    await joinRoom(ctx);
    await ctx.emitPlayers({ zoe: player('Host'), max: player('Max') }, 'zoe');
    await ctx.unmount();
    expect(ctx.adapter.removeRoomPlayer).toHaveBeenCalledWith('tabofuna', 'max');
  });
});

describe('useSetupRoom — joining', () => {
  it('does not look up a code with the wrong shape', async () => {
    const ctx = await setup();
    await joinRoom(ctx, 'abc');
    expect(ctx.adapter.roomExists).not.toHaveBeenCalled();
    expect(ctx.result.current.party.joinCodeIsValid).toBe(false);
    expect(ctx.result.current.party.joinStatus).toBe('idle');
  });

  it('marks an existing room valid and connects to it', async () => {
    const ctx = await setup();
    await joinRoom(ctx, ' TaboFuna ');

    expect(ctx.adapter.roomExists).toHaveBeenCalledWith('tabofuna');
    expect(ctx.result.current.party.joinStatus).toBe('valid');
    expect(ctx.result.current.connectedRoomCode).toBe('tabofuna');
    expect(ctx.result.current.party.roomCode).toBeNull();
  });

  it('marks an unknown room invalid and stays disconnected', async () => {
    const ctx = await setup({ roomExists: jest.fn(() => Promise.resolve(false)) });
    await joinRoom(ctx);
    expect(ctx.result.current.party.joinStatus).toBe('invalid');
    expect(ctx.result.current.connectedRoomCode).toBeNull();
  });

  it('ignores a failing lookup', async () => {
    const ctx = await setup({ roomExists: jest.fn(() => Promise.reject(new Error('offline'))) });
    await joinRoom(ctx);
    expect(ctx.result.current.party.joinStatus).toBe('idle');
  });

  it('ignores a lookup answer that arrives after the code changed', async () => {
    let resolveFirst!: (exists: boolean) => void;
    const roomExists = jest
      .fn()
      .mockImplementationOnce(() => new Promise<boolean>((resolve) => (resolveFirst = resolve)))
      .mockResolvedValue(false);
    const ctx = await setup({ roomExists });
    await act(async () => ctx.result.current.party.onChooseJoin());
    await act(async () => ctx.result.current.party.onJoinCodeChange('tabofuna'));
    await act(async () => ctx.result.current.party.onJoinCodeChange('kilobani'));
    await act(async () => resolveFirst(true));
    expect(ctx.result.current.party.joinStatus).toBe('invalid');
  });

  it('mirrors the host settings onto this device once they arrive', async () => {
    const ctx = await setup();
    await joinRoom(ctx);
    await ctx.emitSettings({ rounds: 9 });
    expect(ctx.updateSettings).toHaveBeenCalledWith({ rounds: 9 });
  });

  it('locks the name of a joiner once connected', async () => {
    const ctx = await setup({ joinRoomPresence: jest.fn(() => Promise.resolve('max')) });
    expect(ctx.result.current.party.nameEditable).toBe(true);
    await joinRoom(ctx);
    expect(ctx.result.current.party.nameEditable).toBe(false);
  });

  it('does not mirror anything while hosting', async () => {
    const ctx = await setup();
    await hostRoom(ctx);
    await ctx.emitSettings({ rounds: 9 });
    expect(ctx.updateSettings).not.toHaveBeenCalled();
  });

  it('joiner cleanup: drops its own presence on unmount', async () => {
    const ctx = await setup({ joinRoomPresence: jest.fn(() => Promise.resolve('max')) });
    await joinRoom(ctx);
    await ctx.emitPlayers({ zoe: player('Host'), max: player('Max') }, 'zoe');
    await ctx.unmount();
    expect(ctx.adapter.removeRoomPlayer).toHaveBeenCalledWith('tabofuna', 'max');
  });

  it('shows the "room deleted" notice to a joiner, then goes back to solo after 2s', async () => {
    const ctx = await setup();
    await joinRoom(ctx);
    await ctx.emitPlayers({ zoe: player('Host'), max: player('Max') }, 'zoe');
    await ctx.emitPlayers({}, undefined, false);

    expect(ctx.result.current.overlayMessage).toMatch(/./);
    const message = ctx.result.current.overlayMessage;
    await act(async () => jest.advanceTimersByTime(2000));
    expect(ctx.result.current.overlayMessage).toBeNull();
    expect(message).not.toBeNull();
    expect(ctx.result.current.party.onlineChoice).toBeNull();
    expect(mockDismissTo).not.toHaveBeenCalled();
  });

  it('shows no notice to the host when its own room disappears', async () => {
    const ctx = await setup();
    await hostRoom(ctx);
    await ctx.emitPlayers({ zoe: player('Zoe', 'red') }, 'zoe');
    await ctx.emitPlayers({}, undefined, false);
    expect(ctx.result.current.overlayMessage).toBeNull();
  });
});

describe('useSetupRoom — being removed', () => {
  const joinedAsMax = async () => {
    const ctx = await setup({ joinRoomPresence: jest.fn(() => Promise.resolve('max')) });
    await joinRoom(ctx);
    await ctx.emitPlayers({ zoe: player('Host'), max: player('Max') }, 'zoe');
    return ctx;
  };

  it('a kick shows a notice, dismissable by tapping it', async () => {
    const ctx = await joinedAsMax();
    await ctx.emitPlayers({ zoe: player('Host') }, 'zoe');

    const kicked = ctx.result.current.overlayMessage;
    expect(kicked).not.toBeNull();
    await act(async () => ctx.result.current.dismissOverlay());
    expect(ctx.result.current.overlayMessage).toBeNull();
    expect(ctx.result.current.party.onlineChoice).toBeNull();
  });

  it('a kick is also dismissed by itself after 2s', async () => {
    const ctx = await joinedAsMax();
    await ctx.emitPlayers({ zoe: player('Host') }, 'zoe');
    await act(async () => jest.advanceTimersByTime(2000));
    expect(ctx.result.current.overlayMessage).toBeNull();
  });

  it('a voluntary leave shows no notice and resets the choice', async () => {
    const ctx = await joinedAsMax();
    ctx.store.getState().markVoluntaryLeave();
    await ctx.emitPlayers({ zoe: player('Host') }, 'zoe');
    expect(ctx.result.current.overlayMessage).toBeNull();
    expect(ctx.result.current.party.onlineChoice).toBeNull();
  });

  it('goes all the way home when dismissed while the game screen is open', async () => {
    const ctx = await joinedAsMax();
    await ctx.emitGame({ screen: 'game' });
    await ctx.emitPlayers({ zoe: player('Host') }, 'zoe');
    await act(async () => jest.advanceTimersByTime(2000));
    expect(mockDismissTo).toHaveBeenCalledWith('/');
  });

  it('a lost connection shows its notice, dismissable by tapping it', async () => {
    const ctx = await setup();
    await hostRoom(ctx);
    await act(async () => ctx.store.getState().markConnectionLost());
    expect(ctx.result.current.overlayMessage).not.toBeNull();
    await act(async () => ctx.result.current.dismissOverlay());
    expect(ctx.result.current.party.onlineChoice).toBeNull();
  });
});

describe('useSetupRoom — read-only notice', () => {
  it('shows the notice on demand, dismissable by tapping or after 2s', async () => {
    const ctx = await setup();
    await act(async () => ctx.result.current.notifyReadOnly());
    expect(ctx.result.current.overlayMessage).not.toBeNull();
    await act(async () => ctx.result.current.dismissOverlay());
    expect(ctx.result.current.overlayMessage).toBeNull();

    await act(async () => ctx.result.current.notifyReadOnly());
    await act(async () => jest.advanceTimersByTime(2000));
    expect(ctx.result.current.overlayMessage).toBeNull();
  });
});

describe('useSetupRoom — starting the game', () => {
  it('runs the game start on the connected room and shows the loading splash', async () => {
    const ctx = await setup();
    await hostRoom(ctx);
    const run = jest.fn(() => Promise.resolve());

    await act(async () => ctx.result.current.startOnlineGame(run));

    expect(run).toHaveBeenCalledWith('tabofuna');
    expect(ctx.result.current.starting).toBe(true);
    expect(ctx.result.current.overlayLoading).toBe(true);
    // The splash is not dismissable by tapping.
    await act(async () => ctx.result.current.dismissOverlay());
    expect(ctx.result.current.overlayLoading).toBe(true);
  });

  it('lifts the loading state when the start fails', async () => {
    const ctx = await setup();
    await hostRoom(ctx);
    await act(async () => ctx.result.current.startOnlineGame(() => Promise.reject(new Error('nope'))));
    expect(ctx.result.current.starting).toBe(false);
  });

  it('a failed start shows a notice (tap or 4s to dismiss) and the button retries on the same room', async () => {
    const ctx = await setup();
    await hostRoom(ctx);
    await act(async () => ctx.result.current.startOnlineGame(() => Promise.reject(new Error('no places'))));
    expect(ctx.result.current.starting).toBe(false);
    expect(ctx.result.current.overlayMessage).not.toBeNull();
    await act(async () => ctx.result.current.dismissOverlay());
    expect(ctx.result.current.overlayMessage).toBeNull();

    await act(async () => ctx.result.current.startOnlineGame(() => Promise.reject(new Error('no places'))));
    expect(ctx.result.current.overlayMessage).not.toBeNull();
    await act(async () => jest.advanceTimersByTime(4000));
    expect(ctx.result.current.overlayMessage).toBeNull();

    const run = jest.fn(() => Promise.resolve());
    await act(async () => ctx.result.current.startOnlineGame(run));
    expect(run).toHaveBeenCalledWith('tabofuna');
    expect(ctx.result.current.overlayLoading).toBe(true);
  });

  it('lifts the loading state once the game screen takes over, and every device navigates to it', async () => {
    const ctx = await setup();
    await hostRoom(ctx);
    await act(async () => ctx.result.current.startOnlineGame(() => Promise.resolve()));
    await ctx.emitGame({ screen: 'game' });

    expect(ctx.result.current.starting).toBe(false);
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/online-game', params: { code: 'tabofuna' } });
  });

  it('opens the game screen once, however many times the room changes screen afterwards', async () => {
    const ctx = await setup();
    await hostRoom(ctx);
    await ctx.emitGame({ screen: 'game' });
    await ctx.emitGame({ screen: 'reveal' });
    await ctx.emitGame({ screen: 'end' });

    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it('does not navigate while the room is still in its lobby', async () => {
    const ctx = await setup();
    await hostRoom(ctx);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('solo: creates a silent room, then runs once this device is listed in it', async () => {
    const ctx = await setup();
    const run = jest.fn(() => Promise.resolve());

    await act(async () => ctx.result.current.startOnlineGame(run));
    await flush();

    expect(ctx.adapter.createRoom).toHaveBeenCalledWith({ rounds: 5 });
    expect(ctx.result.current.party.roomCode).toBeNull();
    expect(ctx.result.current.connectedRoomCode).toBe('tabofuna');
    // Not before this device shows up in the room.
    expect(run).not.toHaveBeenCalled();

    await ctx.emitPlayers({ zoe: player('Zoe') }, 'zoe');
    expect(run).toHaveBeenCalledWith('tabofuna');
    await ctx.emitPlayers({ zoe: player('Zoe', 'red') }, 'zoe');
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('solo: lifts the loading state when the deferred run fails', async () => {
    const ctx = await setup();
    await act(async () => ctx.result.current.startOnlineGame(() => Promise.reject(new Error('nope'))));
    await flush();
    await ctx.emitPlayers({ zoe: player('Zoe') }, 'zoe');
    expect(ctx.result.current.starting).toBe(false);
    expect(ctx.result.current.overlayMessage).not.toBeNull();
  });

  it('solo: lifts the loading state when the room cannot be created', async () => {
    const ctx = await setup({ createRoom: jest.fn(() => Promise.reject(new Error('offline'))) });
    await act(async () => ctx.result.current.startOnlineGame(jest.fn()));
    expect(ctx.result.current.starting).toBe(false);
    expect(ctx.result.current.connectedRoomCode).toBeNull();
    expect(ctx.result.current.overlayMessage).not.toBeNull();
  });

  it('a joiner never starts a game', async () => {
    const ctx = await setup();
    await act(async () => ctx.result.current.party.onChooseJoin());
    const run = jest.fn();
    await act(async () => ctx.result.current.startOnlineGame(run));
    expect(run).not.toHaveBeenCalled();
    expect(ctx.adapter.createRoom).not.toHaveBeenCalled();
    expect(ctx.result.current.starting).toBe(false);
  });

  it('reuses the silent room instead of creating a second one when choosing to host afterwards', async () => {
    const ctx = await setup();
    // First start attempt leaves a silent room behind (its deferred run never fires: no player yet).
    await act(async () => ctx.result.current.startOnlineGame(jest.fn()));
    await flush();
    await act(async () => ctx.result.current.party.onChooseHost());

    expect(ctx.adapter.createRoom).toHaveBeenCalledTimes(1);
    expect(ctx.result.current.party.onlineChoice).toBe('host');
    expect(ctx.result.current.party.roomCode).toBe('tabofuna');
  });
});

describe('useSetupRoom — the player name is shared across the 3 games', () => {
  it('shows this game’s own settings before the shared name has hydrated (no blank flash)', async () => {
    usePlayerName.setState({ playerName: '', ready: false });
    const { result } = await setup(); // SETTINGS.playerName is 'Zoe'
    expect(result.current.party.soloName).toBe('Zoe');
  });

  it('once hydrated, shows the shared name even if it differs from this game’s own settings', async () => {
    usePlayerName.setState({ playerName: 'Max', ready: true });
    const { result } = await setup(); // SETTINGS.playerName is 'Zoe'
    expect(result.current.party.soloName).toBe('Max');
  });

  it('adopts the shared name into this game’s own settings, the first time it hydrates with one', async () => {
    usePlayerName.setState({ playerName: 'Max', ready: true });
    const { updateSettings } = await setup(); // SETTINGS.playerName is 'Zoe'
    await flush();
    expect(updateSettings).toHaveBeenCalledWith({ playerName: 'Max' });
  });

  it('does nothing once hydrated if this game’s settings already match the shared name', async () => {
    usePlayerName.setState({ playerName: 'Zoe', ready: true });
    const { updateSettings } = await setup();
    await flush();
    expect(updateSettings).not.toHaveBeenCalled();
  });

  it('migrates this game’s own name (e.g. Compass, persisted on disk) into the shared store when that was still empty', async () => {
    usePlayerName.setState({ playerName: '', ready: true });
    await setup(); // SETTINGS.playerName is 'Zoe'
    await flush();
    expect(usePlayerName.getState().playerName).toBe('Zoe');
    expect(await AsyncStorage.getItem(PLAYER_NAME_STORAGE_KEY)).toBe('Zoe');
  });

  it('leaves both empty when neither side has a name yet', async () => {
    usePlayerName.setState({ playerName: '', ready: true });
    const { updateSettings } = await setup({}, { playerName: '', rounds: 5 });
    await flush();
    expect(updateSettings).not.toHaveBeenCalled();
    expect(usePlayerName.getState().playerName).toBe('');
  });

  it('typing here updates the shared store (persisted right away) and this game’s own settings', async () => {
    usePlayerName.setState({ playerName: '', ready: true });
    const { result, updateSettings } = await setup();
    await act(async () => result.current.party.onChangeName('Léo'));
    expect(usePlayerName.getState().playerName).toBe('Léo');
    expect(updateSettings).toHaveBeenCalledWith({ playerName: 'Léo' });
    expect(await AsyncStorage.getItem(PLAYER_NAME_STORAGE_KEY)).toBe('Léo');
  });
});
