import { act, fireEvent, render } from '@testing-library/react-native';

import UfoButton from '..';
import { TICK_MS } from '../constants';

describe('UfoButton', () => {
  it('renders and calls onPress with an accessibility label', async () => {
    const onPress = jest.fn();
    const { getByLabelText } = await render(<UfoButton accessibilityLabel="Reglages" onPress={onPress} />);
    await fireEvent.press(getByLabelText('Reglages'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('animates over time without crashing, and cleans up its interval on unmount', async () => {
    jest.useFakeTimers();
    const { unmount } = await render(<UfoButton accessibilityLabel="Reglages" onPress={jest.fn()} />);
    await act(() => jest.advanceTimersByTimeAsync(TICK_MS * 10));
    unmount();
    // Aucun timer ne doit atteindre un composant demonte (l'intervalle est nettoye).
    await act(() => jest.advanceTimersByTimeAsync(TICK_MS * 10));
    jest.useRealTimers();
  });
});
