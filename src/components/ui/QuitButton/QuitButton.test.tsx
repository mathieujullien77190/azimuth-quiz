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

  it('is the circled base cross unless told otherwise', async () => {
    const { getByRole } = await render(<QuitButton onPress={jest.fn()} />);
    expect(getByRole('button', { name: 'Quitter' })).toHaveStyle({ borderRadius: 16, borderWidth: 2 });
  });

  it('has an accent variant: the same button, a plain cross in the accent color', async () => {
    const onPress = jest.fn();
    const { getByRole, getByText } = await render(<QuitButton onPress={onPress} variant="accent" />);
    expect(getByText('✕')).toHaveStyle({ color: '#F5B841' });
    expect(getByRole('button', { name: 'Quitter' })).not.toHaveStyle({ borderWidth: 2 });
    await fireEvent.press(getByRole('button', { name: 'Quitter' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
