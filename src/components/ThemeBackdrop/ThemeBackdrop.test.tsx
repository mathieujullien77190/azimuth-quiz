import { act, render } from '@testing-library/react-native';

import ThemeBackdrop from '.';

let mockIsDark = true;

jest.mock('@/themes', () => {
  const actual = jest.requireActual('@/themes');
  return {
    ...actual,
    useTheme: () => (mockIsDark ? actual.night : actual.day),
  };
});

afterEach(() => {
  mockIsDark = true;
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
});
