import { fireEvent, render } from '@testing-library/react-native';

import Button from '@/components/ui/Button';

import GameFooter from '.';

describe('GameFooter', () => {
  it('renders its children', async () => {
    const onPress = jest.fn();
    const { getByText } = await render(
      <GameFooter>
        <Button label="Manche suivante" onPress={onPress} />
      </GameFooter>,
    );
    await fireEvent.press(getByText('Manche suivante'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
