import { fireEvent, render } from '@testing-library/react-native';

import QuitButton from '.';

describe('QuitButton', () => {
  it('is an accessible "Quitter" button drawn as a cross, and calls onPress', async () => {
    const onPress = jest.fn();
    const { getByRole, getByText } = await render(<QuitButton onPress={onPress} />);
    expect(getByText('✕')).toBeTruthy();
    const button = getByRole('button', { name: 'Quitter' });
    await fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
