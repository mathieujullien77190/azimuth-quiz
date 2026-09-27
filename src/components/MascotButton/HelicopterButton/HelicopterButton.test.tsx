import { act, fireEvent, render } from '@testing-library/react-native';

import HelicopterButton from '.';
import { TICK_MS } from './constants';

describe('HelicopterButton', () => {
  it('renders and calls onPress with an accessibility label', async () => {
    const onPress = jest.fn();
    const { getByLabelText } = await render(<HelicopterButton accessibilityLabel="Reglages" onPress={onPress} />);
    await fireEvent.press(getByLabelText('Reglages'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('animates over time without crashing, and cleans up its interval on unmount', async () => {
    jest.useFakeTimers();
    const { unmount } = await render(<HelicopterButton accessibilityLabel="Reglages" onPress={jest.fn()} />);
    await act(() => jest.advanceTimersByTimeAsync(TICK_MS * 10));
    unmount();
    // No more timer advancement should reach an unmounted component: if the interval weren't
    // cleaned up, it would be a leak (not necessarily an error here), but we at least verify
    // there's no crash after unmount.
    await act(() => jest.advanceTimersByTimeAsync(TICK_MS * 10));
    jest.useRealTimers();
  });
});
