import { fireEvent, render } from '@testing-library/react-native';

import Chip from '.';

describe('Chip', () => {
  it('shows its label, with the emoji before it when given', async () => {
    const { getByText, queryByText, rerender } = await render(
      <Chip label="Facile" onPress={jest.fn()} selected={false} />,
    );
    expect(getByText('Facile')).toBeTruthy();
    expect(queryByText('🟢')).toBeNull();

    await rerender(<Chip emoji="🟢" label="Facile" onPress={jest.fn()} selected={false} />);
    expect(getByText('🟢')).toBeTruthy();
  });

  it('reports whether it is selected, to assistive tech', async () => {
    const { getByRole, rerender } = await render(<Chip label="Facile" onPress={jest.fn()} selected={false} />);
    expect(getByRole('button', { name: 'Facile' }).props.accessibilityState).toEqual({
      selected: false,
      disabled: false,
    });

    await rerender(<Chip label="Facile" onPress={jest.fn()} selected />);
    expect(getByRole('button', { name: 'Facile' }).props.accessibilityState.selected).toBe(true);
  });

  it('calls onPress', async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<Chip label="Facile" onPress={onPress} selected={false} />);
    await fireEvent.press(getByText('Facile'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('stays pressable when disabled, so the caller can explain why nothing happens', async () => {
    const onPress = jest.fn();
    const { getByText, getByRole } = await render(<Chip disabled label="Facile" onPress={onPress} selected={false} />);
    expect(getByRole('button', { name: 'Facile' }).props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(getByText('Facile'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
