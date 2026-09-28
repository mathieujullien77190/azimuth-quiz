import { fireEvent, render } from '@testing-library/react-native';

import CategorySection from '.';

const selected = (element: { parent: { props: Record<string, any> } | null }) =>
  element.parent?.props.accessibilityState.selected;

describe('CategorySection', () => {
  const categories = [
    { id: 'cities' as const, emoji: '🏙️' },
    { id: 'capital' as const, emoji: '🏛️' },
  ];

  it('marks the selected categories and toggles the pressed one', async () => {
    const onToggle = jest.fn();
    const { getByText } = await render(
      <CategorySection categories={categories} onToggle={onToggle} selected={['cities']} title="Catégories" />,
    );
    expect(selected(getByText('Villes'))).toBe(true);
    expect(selected(getByText('Capitales'))).toBe(false);
    await fireEvent.press(getByText('Capitales'));
    expect(onToggle).toHaveBeenCalledWith('capital');
  });

  it('flags every chip as disabled when read-only, yet keeps them pressable', async () => {
    const onToggle = jest.fn();
    const { getByText } = await render(
      <CategorySection categories={categories} disabled onToggle={onToggle} selected={[]} title="Catégories" />,
    );
    expect(getByText('Villes').parent?.props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(getByText('Villes'));
    expect(onToggle).toHaveBeenCalledWith('cities');
  });
});
