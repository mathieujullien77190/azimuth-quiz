import { fireEvent, render } from '@testing-library/react-native';

import GameCard from '.';

describe('GameCard', () => {
  it('renders title, tagline, meta joined and cta, and calls onPress', async () => {
    const onPress = jest.fn();
    const { getByText } = await render(
      <GameCard
        ctaLabel="Play"
        icon="🧭"
        meta={['1 to 6 players', 'up to 20 rounds']}
        onPress={onPress}
        tagline="Guess the bearing"
        title="Compass"
      />,
    );
    expect(getByText('Compass')).toBeTruthy();
    expect(getByText('Guess the bearing')).toBeTruthy();
    expect(getByText('1 to 6 players   ·   up to 20 rounds')).toBeTruthy();
    await fireEvent.press(getByText('Play'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders the note when provided', async () => {
    const { getByText } = await render(
      <GameCard ctaLabel="Play" icon="🧭" meta={[]} note="Coming soon" onPress={jest.fn()} tagline="tag" title="Compass" />,
    );
    expect(getByText('Coming soon')).toBeTruthy();
  });

  it('renders without a note', async () => {
    const { queryByText } = await render(
      <GameCard ctaLabel="Play" icon="🧭" meta={[]} onPress={jest.fn()} tagline="tag" title="Compass" />,
    );
    expect(queryByText('Coming soon')).toBeNull();
  });

  it('is disabled: ghost cta variant and no onPress on button press', async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(
      <GameCard ctaLabel="Play" disabled icon="🧭" meta={[]} onPress={onPress} tagline="tag" title="Compass" />,
    );
    const button = getByRole('button');
    expect(button.props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});
