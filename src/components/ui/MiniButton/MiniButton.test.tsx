import { fireEvent, render } from '@testing-library/react-native';

import MiniButton from '.';

describe('MiniButton', () => {
  it('renders its label as a button and calls onPress', async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(<MiniButton label="Expulser" onPress={onPress} variant="danger" />);
    await fireEvent.press(getByRole('button', { name: 'Expulser' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('defaults to the accent variant and accepts either', async () => {
    const { getByText, rerender } = await render(<MiniButton label="Info" onPress={jest.fn()} />);
    expect(getByText('Info')).toBeTruthy();
    await rerender(<MiniButton label="Info" onPress={jest.fn()} variant="danger" />);
    expect(getByText('Info')).toBeTruthy();
  });
});
