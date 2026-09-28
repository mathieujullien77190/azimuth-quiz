import { fireEvent, render } from '@testing-library/react-native';

import DifficultySection from '.';

const selected = (element: { parent: { props: Record<string, any> } | null }) =>
  element.parent?.props.accessibilityState.selected;

describe('DifficultySection', () => {
  it('selects exactly one difficulty and reports the pressed one', async () => {
    const onSelect = jest.fn();
    const { getByText } = await render(
      <DifficultySection onSelect={onSelect} selected="intermediate" title="Difficulté" />,
    );
    expect(selected(getByText('Moyen'))).toBe(true);
    expect(selected(getByText('Facile'))).toBe(false);
    await fireEvent.press(getByText('Difficile'));
    expect(onSelect).toHaveBeenCalledWith('hard');
  });

  it('flags every chip as disabled when read-only', async () => {
    const { getByText } = await render(
      <DifficultySection disabled onSelect={jest.fn()} selected="easy" title="Difficulté" />,
    );
    expect(getByText('Facile').parent?.props.accessibilityState.disabled).toBe(true);
  });
});
