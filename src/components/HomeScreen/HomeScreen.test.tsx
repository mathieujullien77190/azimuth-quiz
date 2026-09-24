import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Animated } from 'react-native';

import { loadHelicopterCaught, saveHelicopterCaught } from '@/helpers';

import HomeScreen from '.';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

jest.mock('@/helpers', () => ({
  ...jest.requireActual('@/helpers'),
  loadHelicopterCaught: jest.fn(),
  saveHelicopterCaught: jest.fn(),
}));

const mockedLoadHelicopterCaught = loadHelicopterCaught as jest.Mock;
const mockedSaveHelicopterCaught = saveHelicopterCaught as jest.Mock;

// `waitFor(() => expect(mock).toHaveBeenCalled())` only proves `loadHelicopterCaught()` was invoked,
// not that its `.then(setHelicopterCaught)` has actually applied — flush the microtask queue for real.
const flushMicrotasks = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });

beforeEach(() => {
  jest.clearAllMocks();
  mockedLoadHelicopterCaught.mockResolvedValue(true);
  mockedSaveHelicopterCaught.mockResolvedValue(undefined);
});

describe('HomeScreen — content', () => {
  it('shows the title, tagline, and both game cards', async () => {
    const { getByText, getAllByText } = await render(<HomeScreen />);
    expect(getByText('AZIMUTH QUIZ')).toBeTruthy();
    expect(getByText('Choisis ton jeu de géographie')).toBeTruthy();
    expect(getByText('Boussole')).toBeTruthy();
    expect(getByText('Indices')).toBeTruthy();
    expect(getAllByText('Jouer')).toHaveLength(2);
  });

  it('navigates to /setup when the Boussole card is played', async () => {
    const { getAllByText } = await render(<HomeScreen />);
    await fireEvent.press(getAllByText('Jouer')[0]);
    expect(mockPush).toHaveBeenCalledWith('/setup');
  });

  it('navigates to /indices-setup when the Indices card is played', async () => {
    const { getAllByText } = await render(<HomeScreen />);
    await fireEvent.press(getAllByText('Jouer')[1]);
    expect(mockPush).toHaveBeenCalledWith('/indices-setup');
  });
});

describe('HomeScreen — helicopter settings button', () => {
  it('sits at its default spot once already caught, and navigates to /settings without re-saving', async () => {
    const { getByLabelText } = await render(<HomeScreen />);
    await waitFor(() => expect(mockedLoadHelicopterCaught).toHaveBeenCalled());
    await fireEvent.press(getByLabelText('Réglages'));
    expect(mockPush).toHaveBeenCalledWith('/settings');
    expect(mockedSaveHelicopterCaught).not.toHaveBeenCalled();
  });

  it('roams around before being caught, then catching it saves the state and still navigates', async () => {
    mockedLoadHelicopterCaught.mockResolvedValue(false);
    // Resolves synchronously so the move (and, inside it, the recursive schedule) runs
    // immediately when the layout event fires below — no real or fake timers needed.
    const timingSpy = jest
      .spyOn(Animated, 'timing')
      .mockReturnValue({ start: (cb?: (result: { finished: boolean }) => void) => cb?.({ finished: true }), stop: jest.fn() } as unknown as Animated.CompositeAnimation);
    // Math.random() close to 0 always picks the first HELICOPTER_PAUSE_OPTIONS_S entry (never
    // HELICOPTER_SPIN_PAUSE_S): pinned rather than left to real randomness, so this test deterministically
    // covers the "doesn't spin" branch instead of only doing so ~3 times out of 4.
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.01);

    const { getByLabelText, getByText, unmount } = await render(<HomeScreen />);
    await waitFor(() => expect(mockedLoadHelicopterCaught).toHaveBeenCalled());
    await flushMicrotasks();

    // The header must have a non-zero size for the helicopter to start moving.
    await fireEvent(getByText('AZIMUTH QUIZ').parent!, 'layout', {
      nativeEvent: { layout: { width: 300, height: 120, x: 0, y: 0 } },
    });

    await fireEvent.press(getByLabelText('Réglages'));
    expect(mockedSaveHelicopterCaught).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/settings');

    randomSpy.mockRestore();
    timingSpy.mockRestore();
    // Unmounts while a move is still "pending" (the mocked timing chain leaves a real
    // setTimeout scheduled for the next move): exercises the effect's cleanup path.
    await unmount();
  });

  it('spins once when the random pause lands on HELICOPTER_SPIN_PAUSE_S', async () => {
    mockedLoadHelicopterCaught.mockResolvedValue(false);
    const timingSpy = jest
      .spyOn(Animated, 'timing')
      .mockReturnValue({ start: (cb?: (result: { finished: boolean }) => void) => cb?.({ finished: true }), stop: jest.fn() } as unknown as Animated.CompositeAnimation);
    // Math.random() close to 1 always picks the last HELICOPTER_PAUSE_OPTIONS_S entry (HELICOPTER_SPIN_PAUSE_S).
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.99);

    const { getByText, unmount } = await render(<HomeScreen />);
    await waitFor(() => expect(mockedLoadHelicopterCaught).toHaveBeenCalled());
    await flushMicrotasks();
    await fireEvent(getByText('AZIMUTH QUIZ').parent!, 'layout', {
      nativeEvent: { layout: { width: 300, height: 120, x: 0, y: 0 } },
    });

    // The spin's own Animated.timing call is mocked the same way, so it "finishes" synchronously too.
    expect(timingSpy).toHaveBeenCalled();

    randomSpy.mockRestore();
    timingSpy.mockRestore();
    await unmount();
  });

  it('does not continue the loop (or crash) when a move is interrupted before finishing', async () => {
    mockedLoadHelicopterCaught.mockResolvedValue(false);
    const timingSpy = jest
      .spyOn(Animated, 'timing')
      .mockReturnValue({ start: (cb?: (result: { finished: boolean }) => void) => cb?.({ finished: false }), stop: jest.fn() } as unknown as Animated.CompositeAnimation);

    const { getByText, unmount } = await render(<HomeScreen />);
    await waitFor(() => expect(mockedLoadHelicopterCaught).toHaveBeenCalled());
    await flushMicrotasks();
    await fireEvent(getByText('AZIMUTH QUIZ').parent!, 'layout', {
      nativeEvent: { layout: { width: 300, height: 120, x: 0, y: 0 } },
    });

    // A single interrupted move: no follow-up spin/schedule, so timing was only called once.
    expect(timingSpy).toHaveBeenCalledTimes(1);

    timingSpy.mockRestore();
    await unmount();
  });

  it('does not re-center the rotation when the spin animation itself is interrupted', async () => {
    mockedLoadHelicopterCaught.mockResolvedValue(false);
    // 1st Animated.timing call is the move (finishes normally); the 2nd is the spin, on
    // helicopterRotation, which gets interrupted (finished: false) — its callback must be a no-op.
    let call = 0;
    const timingSpy = jest.spyOn(Animated, 'timing').mockImplementation(
      () =>
        ({
          start: (cb?: (result: { finished: boolean }) => void) => {
            call += 1;
            cb?.(call === 1 ? { finished: true } : { finished: false });
          },
          stop: jest.fn(),
        }) as unknown as Animated.CompositeAnimation,
    );
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.99);

    const { getByText, unmount } = await render(<HomeScreen />);
    await waitFor(() => expect(mockedLoadHelicopterCaught).toHaveBeenCalled());
    await flushMicrotasks();
    await fireEvent(getByText('AZIMUTH QUIZ').parent!, 'layout', {
      nativeEvent: { layout: { width: 300, height: 120, x: 0, y: 0 } },
    });

    // The move, then the (interrupted) spin: exactly 2 Animated.timing calls, no crash.
    expect(timingSpy).toHaveBeenCalledTimes(2);

    randomSpy.mockRestore();
    timingSpy.mockRestore();
    await unmount();
  });

  it('clears no timer on unmount if the move never got the chance to finish', async () => {
    mockedLoadHelicopterCaught.mockResolvedValue(false);
    // The move's `.start()` callback is captured but never invoked: `timeoutId` stays undefined.
    const timingSpy = jest
      .spyOn(Animated, 'timing')
      .mockReturnValue({ start: jest.fn(), stop: jest.fn() } as unknown as Animated.CompositeAnimation);
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const { getByText, unmount } = await render(<HomeScreen />);
    await waitFor(() => expect(mockedLoadHelicopterCaught).toHaveBeenCalled());
    await flushMicrotasks();
    await fireEvent(getByText('AZIMUTH QUIZ').parent!, 'layout', {
      nativeEvent: { layout: { width: 300, height: 120, x: 0, y: 0 } },
    });

    await unmount();
    expect(clearTimeoutSpy).not.toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
    timingSpy.mockRestore();
  });
});
