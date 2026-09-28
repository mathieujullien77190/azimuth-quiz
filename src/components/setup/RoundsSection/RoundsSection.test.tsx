import { fireEvent, render } from '@testing-library/react-native';

import RoundsSection from '.';

const selected = (element: { parent: { props: Record<string, any> } | null }) =>
  element.parent?.props.accessibilityState.selected;

describe('RoundsSection', () => {
  it('selects the current round count and reports the pressed one', async () => {
    const onSelect = jest.fn();
    const { getByText } = await render(<RoundsSection onSelect={onSelect} rounds={5} />);
    expect(selected(getByText('5'))).toBe(true);
    await fireEvent.press(getByText('10'));
    expect(onSelect).toHaveBeenCalledWith(10);
  });

  it('flags every chip as disabled when read-only', async () => {
    const { getByText } = await render(<RoundsSection disabled onSelect={jest.fn()} rounds={5} />);
    expect(getByText('5').parent?.props.accessibilityState.disabled).toBe(true);
  });
});
