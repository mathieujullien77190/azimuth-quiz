import { fireEvent, render } from '@testing-library/react-native';
import * as RN from 'react-native';

import type { Player } from '@/types';

import PlayerTabs from '.';

const players: Player[] = [
  { name: 'Zoé', color: '#EF4444' },
  { name: 'Max', color: '#16A34A' },
];

describe('PlayerTabs', () => {
  it('shows initials for every tab when no activeLabel is given, and a checkmark for answered players', async () => {
    const { getByText, queryAllByText } = await render(
      <PlayerTabs
        activeIndex={0}
        allowRevision={false}
        answered={[false, true]}
        onSelect={jest.fn()}
        order={[0, 1]}
        players={players}
      />,
    );
    expect(getByText('ZO')).toBeTruthy();
    expect(getByText('MA')).toBeTruthy();
    // Seul Max (index 1) a deja repondu : une seule coche.
    expect(queryAllByText('✓')).toHaveLength(1);
  });

  it('shows activeLabel(name) for the active tab only, other tabs stay on initials', async () => {
    const { getByText, queryByText } = await render(
      <PlayerTabs
        activeIndex={1}
        activeLabel={(name) => `À ${name} de jouer`}
        allowRevision={false}
        answered={[false, false]}
        onSelect={jest.fn()}
        order={[0, 1]}
        players={players}
      />,
    );
    expect(getByText('À Max de jouer')).toBeTruthy();
    expect(getByText('ZO')).toBeTruthy();
    expect(queryByText('À Zoé de jouer')).toBeNull();
  });

  it('pressing an unlocked tab calls onSelect with its player index', async () => {
    const onSelect = jest.fn();
    const { getByLabelText } = await render(
      <PlayerTabs
        activeIndex={0}
        allowRevision={false}
        answered={[false, false]}
        onSelect={onSelect}
        order={[0, 1]}
        players={players}
      />,
    );
    await fireEvent.press(getByLabelText('Max'));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('pressing a locked tab (answered, not active, revisions disallowed) does not call onSelect', async () => {
    const onSelect = jest.fn();
    const { getByLabelText } = await render(
      <PlayerTabs
        activeIndex={0}
        allowRevision={false}
        answered={[false, true]}
        onSelect={onSelect}
        order={[0, 1]}
        players={players}
      />,
    );
    const tab = getByLabelText('Max');
    expect(tab.props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(tab);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('an answered tab stays pressable when allowRevision is true', async () => {
    const onSelect = jest.fn();
    const { getByLabelText } = await render(
      <PlayerTabs
        activeIndex={0}
        allowRevision
        answered={[false, true]}
        onSelect={onSelect}
        order={[0, 1]}
        players={players}
      />,
    );
    await fireEvent.press(getByLabelText('Max'));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('renders the compact layout under the compact breakpoint', async () => {
    const spy = jest.spyOn(RN, 'useWindowDimensions').mockReturnValue({ width: 300, height: 600, scale: 2, fontScale: 1 });
    const { getByText } = await render(
      <PlayerTabs
        activeIndex={0}
        allowRevision={false}
        answered={[false, false]}
        onSelect={jest.fn()}
        order={[0, 1]}
        players={players}
      />,
    );
    expect(getByText('ZO')).toBeTruthy();
    spy.mockRestore();
  });

  it('renders using the order array rather than raw player index order', async () => {
    const { getAllByRole } = await render(
      <PlayerTabs
        activeIndex={0}
        allowRevision={false}
        answered={[false, false]}
        onSelect={jest.fn()}
        order={[1, 0]}
        players={players}
      />,
    );
    const buttons = getAllByRole('button');
    expect(buttons[0].props.accessibilityLabel).toBe('Max');
    expect(buttons[1].props.accessibilityLabel).toBe('Zoé');
  });
});
