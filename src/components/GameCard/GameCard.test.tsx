import { fireEvent, render } from '@testing-library/react-native';

import GameCard from '.';

describe('GameCard', () => {
  it('renders title, tagline, players range and cta, and calls onPress', async () => {
    const onPress = jest.fn();
    const { getByText } = await render(
      <GameCard
        ctaLabel="Play"
        icon="🧭"
        maxPlayers={6}
        onPress={onPress}
        tagline="Guess the bearing"
        title="Compass"
      />,
    );
    expect(getByText('Compass')).toBeTruthy();
    expect(getByText('Guess the bearing')).toBeTruthy();
    expect(getByText('1 à 6 joueurs')).toBeTruthy();
    await fireEvent.press(getByText('Play'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('reflects the given player maximum', async () => {
    const { getByText } = await render(
      <GameCard ctaLabel="Play" icon="🧭" maxPlayers={10} onPress={jest.fn()} tagline="tag" title="Compass" />,
    );
    expect(getByText('1 à 10 joueurs')).toBeTruthy();
  });
});
