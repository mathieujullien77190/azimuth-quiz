import { fireEvent, render } from '@testing-library/react-native';

import ContourGuessBar from '.';

const baseProps = {
  guessText: 'Fra',
  onChangeGuessText: jest.fn(),
  onSubmit: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('ContourGuessBar', () => {
  it('forwards typing and validation', async () => {
    const { getByDisplayValue, getByText } = await render(<ContourGuessBar {...baseProps} />);
    await fireEvent.changeText(getByDisplayValue('Fra'), 'France');
    await fireEvent.press(getByText('Valider'));
    expect(baseProps.onChangeGuessText).toHaveBeenCalledWith('France');
    expect(baseProps.onSubmit).toHaveBeenCalledTimes(1);
  });

  it('submits from the keyboard when there is a guess', async () => {
    const { getByDisplayValue } = await render(<ContourGuessBar {...baseProps} />);
    await fireEvent(getByDisplayValue('Fra'), 'submitEditing');
    expect(baseProps.onSubmit).toHaveBeenCalledTimes(1);
  });

  it('never submits a blank guess, from the button nor the keyboard', async () => {
    const { getByPlaceholderText, getByRole } = await render(<ContourGuessBar {...baseProps} guessText="   " />);
    expect(getByRole('button', { name: 'Valider' }).props.accessibilityState.disabled).toBe(true);
    await fireEvent(getByPlaceholderText('Nom du pays…'), 'submitEditing');
    expect(baseProps.onSubmit).not.toHaveBeenCalled();
  });

  it("is read-only on somebody else's turn: shows their text, keeps Valider greyed out, and reports a tap", async () => {
    const onReadOnlyPress = jest.fn();
    const { getByDisplayValue, getByRole } = await render(
      <ContourGuessBar {...baseProps} onReadOnlyPress={onReadOnlyPress} readOnly />,
    );
    expect(getByDisplayValue('Fra').props.editable).toBe(false);
    expect(getByRole('button', { name: 'Valider' }).props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(getByDisplayValue('Fra'));
    expect(onReadOnlyPress).toHaveBeenCalledTimes(1);
  });

  it('shows the feedback about the previous wrong attempt only when given', async () => {
    const { queryByText, rerender } = await render(<ContourGuessBar {...baseProps} />);
    expect(queryByText('Zoé perd 50 points.')).toBeNull();
    await rerender(<ContourGuessBar {...baseProps} wrongText="Zoé perd 50 points." />);
    expect(queryByText('Zoé perd 50 points.')).toBeTruthy();
  });
});
