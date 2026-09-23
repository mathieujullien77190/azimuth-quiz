import { fireEvent, render } from '@testing-library/react-native';

import Button from '.';

describe('Button', () => {
  it('renders the label and calls onPress when pressed (primary by default)', async () => {
    const onPress = jest.fn();
    const { getByRole, getByText } = await render(<Button label="Go" onPress={onPress} />);
    expect(getByText('Go')).toBeTruthy();
    await fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders the ghost variant', async () => {
    const { getByRole } = await render(<Button label="Back" onPress={jest.fn()} variant="ghost" />);
    expect(getByRole('button')).toBeTruthy();
  });

  it('is disabled and does not call onPress when pressed', async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(<Button disabled label="Go" onPress={onPress} />);
    const button = getByRole('button');
    expect(button.props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('resolves a non-empty style for both the pressed and the resting state', async () => {
    const { getByRole } = await render(<Button label="Go" onPress={jest.fn()} />);
    expect(getByRole('button').props.style).toBeTruthy();
    fireEvent(getByRole('button'), 'pressIn');
    expect(getByRole('button').props.style).toBeTruthy();
    fireEvent(getByRole('button'), 'pressOut');
    expect(getByRole('button').props.style).toBeTruthy();
  });
});
