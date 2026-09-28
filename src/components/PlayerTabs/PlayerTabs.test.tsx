import { act, render } from '@testing-library/react-native';
import { Dimensions } from 'react-native';

import type { Player } from '@/types';

import PlayerTabs from '.';

const players: Player[] = [
  { name: 'Zoé', color: '#EF4444' },
  { name: 'Max', color: '#16A34A' },
];

// `useWindowDimensions` reads from the real `Dimensions` module (mocking the hook itself doesn't
// reach components in other files — see `RoundResult.test.tsx` for the same technique).
const originalWindow = Dimensions.get('window');
const setWindowWidth = (width: number) => act(async () => Dimensions.set({ window: { ...originalWindow, width } }));

afterEach(async () => {
  await setWindowWidth(originalWindow.width);
});

describe('PlayerTabs', () => {
  it('shows initials for every tab when no activeLabel is given, and a checkmark for answered players', async () => {
    const { getByText, queryAllByText } = await render(
      <PlayerTabs activeIndex={0} answered={[false, true]} order={[0, 1]} players={players} />,
    );
    expect(getByText('ZO')).toBeTruthy();
    expect(getByText('MA')).toBeTruthy();
    // Only Max (index 1) has already answered: a single check mark.
    expect(queryAllByText('✓')).toHaveLength(1);
  });

  it('shows activeLabel(name) for the active tab only, other tabs stay on initials', async () => {
    const { getByText, queryByText } = await render(
      <PlayerTabs
        activeIndex={1}
        activeLabel={(name) => `À ${name} de jouer`}
        answered={[false, false]}
        order={[0, 1]}
        players={players}
      />,
    );
    expect(getByText('À Max de jouer')).toBeTruthy();
    expect(getByText('ZO')).toBeTruthy();
    expect(queryByText('À Zoé de jouer')).toBeNull();
  });

  it('renders the compact layout under the compact breakpoint', async () => {
    await setWindowWidth(300);
    const { getByText } = await render(
      <PlayerTabs activeIndex={0} answered={[false, false]} order={[0, 1]} players={players} />,
    );
    expect(getByText('ZO')).toBeTruthy();
  });

  it('shows a checkmark on the active tab when it is also answered, compact layout included', async () => {
    await setWindowWidth(300);
    const { getByText } = await render(
      <PlayerTabs activeIndex={1} answered={[false, true]} order={[0, 1]} players={players} />,
    );
    expect(getByText('✓')).toBeTruthy();
  });

  it('renders purely informational tabs: not pressable, no accessibilityRole/state, still shows status', async () => {
    const { getByText, queryByRole, queryAllByText } = await render(
      <PlayerTabs activeIndex={0} answered={[false, true]} order={[0, 1]} players={players} />,
    );
    expect(getByText('ZO')).toBeTruthy();
    expect(getByText('MA')).toBeTruthy();
    expect(queryAllByText('✓')).toHaveLength(1);
    expect(queryByRole('button')).toBeNull();
  });

  it('renders using the order array rather than raw player index order', async () => {
    const { getAllByText } = await render(
      <PlayerTabs activeIndex={0} answered={[false, false]} order={[1, 0]} players={players} />,
    );
    expect(getAllByText(/^(MA|ZO)$/).map((node) => node.props.children)).toEqual(['MA', 'ZO']);
  });
});
