import { fireEvent, render } from '@testing-library/react-native';

import { hintGroupsView, type HintStep } from '@/games/contour/helpers/hintPlan';

import ContourHintList from '.';

const PLAN: HintStep[] = ['silhouette1', 'silhouette2', 'silhouette3', 'neighborShapes', 'neighborFlags', 'reveal'];

describe('ContourHintList', () => {
  it('shows each group with how many steps are out and only its next step as a button', async () => {
    const groups = hintGroupsView(PLAN, 4);
    const { getByText, getByRole, queryByRole } = await render(<ContourHintList groups={groups} onPick={jest.fn()} />);

    expect(getByText('Contour 3/3')).toBeTruthy();
    expect(getByText('Voisins 1/2')).toBeTruthy();
    expect(getByRole('button', { name: 'Drapeaux' })).toBeTruthy();
    expect(queryByRole('button', { name: 'Formes' })).toBeNull();
    expect(queryByRole('button', { name: 'Plus net' })).toBeNull();
  });

  it('reports the group whose next step was tapped', async () => {
    const onPick = jest.fn();
    const { getByRole } = await render(<ContourHintList groups={hintGroupsView(PLAN, 3)} onPick={onPick} />);

    await fireEvent.press(getByRole('button', { name: 'Formes' }));

    expect(onPick).toHaveBeenCalledWith('neighbors');
  });

  it('still reports a tap when it is not this device turn, so the caller can say why nothing happens', async () => {
    const onPick = jest.fn();
    const { getByRole } = await render(<ContourHintList disabled groups={hintGroupsView(PLAN, 0)} onPick={onPick} />);

    await fireEvent.press(getByRole('button', { name: 'Plus net' }));

    expect(onPick).toHaveBeenCalledWith('silhouette');
  });

  it('ticks a group with nothing left, and offers the country as a card of its own', async () => {
    const { getByText, getAllByText } = await render(
      <ContourHintList groups={hintGroupsView(PLAN, 5)} onPick={jest.fn()} />,
    );

    expect(getAllByText('✓')).toHaveLength(2);
    expect(getByText('Pays')).toBeTruthy();
    expect(getByText('Révéler le pays')).toBeTruthy();
  });
});
