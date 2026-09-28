import { fireEvent, render } from '@testing-library/react-native';

import HintCategorySection from '.';

const selected = (element: { parent: { props: Record<string, any> } | null }) =>
  element.parent?.props.accessibilityState.selected;

describe('HintCategorySection', () => {
  it('lists the four kinds of hints, marks the selected ones and toggles the pressed one', async () => {
    const onToggle = jest.fn();
    const { getByText } = await render(<HintCategorySection onToggle={onToggle} selected={['silhouette', 'capital']} />);
    expect(selected(getByText('Silhouette'))).toBe(true);
    expect(selected(getByText('Capitale'))).toBe(true);
    expect(selected(getByText('Voisins'))).toBe(false);
    expect(selected(getByText('Villes'))).toBe(false);
    await fireEvent.press(getByText('Villes'));
    expect(onToggle).toHaveBeenCalledWith('cities');
  });

  it('flags every chip as disabled when read-only', async () => {
    const { getByText } = await render(<HintCategorySection disabled onToggle={jest.fn()} selected={['silhouette']} />);
    expect(getByText('Voisins').parent?.props.accessibilityState.disabled).toBe(true);
  });
});
