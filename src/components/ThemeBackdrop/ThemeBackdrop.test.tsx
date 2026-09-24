import { act, render } from '@testing-library/react-native';

import ThemeBackdrop from '.';

let mockIsDark = true;
let mockAnimationsEnabled = true;

jest.mock('@/themes', () => {
  const actual = jest.requireActual('@/themes');
  return {
    ...actual,
    useTheme: () => (mockIsDark ? actual.night : actual.day),
    useThemeSettings: () => ({ animationsEnabled: mockAnimationsEnabled }),
  };
});

afterEach(() => {
  mockIsDark = true;
  mockAnimationsEnabled = true;
});

describe('ThemeBackdrop', () => {
  it('renders a starry sky at night', async () => {
    mockIsDark = true;
    const { toJSON } = await render(<ThemeBackdrop />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders drifting clouds by day', async () => {
    mockIsDark = false;
    const { toJSON } = await render(<ThemeBackdrop />);
    expect(toJSON()).toBeTruthy();
  });

  it('animates over time without crashing, in both themes', async () => {
    jest.useFakeTimers();
    mockIsDark = true;
    const { rerender, toJSON } = await render(<ThemeBackdrop />);
    await act(() => jest.advanceTimersByTimeAsync(5000));
    expect(toJSON()).toBeTruthy();

    mockIsDark = false;
    await rerender(<ThemeBackdrop />);
    await act(() => jest.advanceTimersByTimeAsync(5000));
    expect(toJSON()).toBeTruthy();
    jest.useRealTimers();
  });

  it('does not start the timer when animations are disabled', async () => {
    mockAnimationsEnabled = false;
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    const { toJSON } = await render(<ThemeBackdrop />);
    expect(toJSON()).toBeTruthy();
    expect(setIntervalSpy).not.toHaveBeenCalled();
    setIntervalSpy.mockRestore();
  });
});
