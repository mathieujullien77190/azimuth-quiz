import { fireEvent, render } from '@testing-library/react-native';

import ContourGuessBar from '.';

const baseProps = {
  label: 'Pays',
  guessText: 'Fra',
  onChangeGuessText: jest.fn(),
  onSubmit: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('ContourGuessBar', () => {
  it('shows the label above the field, and nothing about the points (they are in the header)', async () => {
    const { getByText, queryByText } = await render(<ContourGuessBar {...baseProps} />);
    expect(getByText('Pays')).toBeTruthy();
    expect(queryByText(/points/)).toBeNull();
  });

  it('hides the label, the field and Valider once the player already guessed this turn, and says why instead', async () => {
    const { getByText, queryByText, queryByDisplayValue, rerender } = await render(
      <ContourGuessBar {...baseProps} lockedText="Déjà proposé" />,
    );
    expect(getByText('Déjà proposé')).toBeTruthy();
    expect(queryByDisplayValue('Fra')).toBeNull();
    expect(queryByText('Valider')).toBeNull();
    expect(queryByText(baseProps.label)).toBeNull();
    await rerender(<ContourGuessBar {...baseProps} />);
    expect(queryByText('Déjà proposé')).toBeNull();
    expect(queryByDisplayValue('Fra')).toBeTruthy();
  });

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

  it("lets somebody who has not the turn type, but keeps Valider greyed out and says it is not their turn", async () => {
    const onNotYourTurn = jest.fn();
    const { getByDisplayValue, getByRole } = await render(
      <ContourGuessBar {...baseProps} canSubmit={false} onNotYourTurn={onNotYourTurn} />,
    );
    expect(getByDisplayValue('Fra').props.editable).not.toBe(false);
    await fireEvent.changeText(getByDisplayValue('Fra'), 'France');
    expect(baseProps.onChangeGuessText).toHaveBeenCalledWith('France');
    expect(getByRole('button', { name: 'Valider' }).props.accessibilityState.disabled).toBe(true);
    await fireEvent(getByDisplayValue('Fra'), 'submitEditing');
    expect(onNotYourTurn).toHaveBeenCalledTimes(1);
    expect(baseProps.onSubmit).not.toHaveBeenCalled();
  });

  it('survives the keyboard "done" of a player who has not the turn when nobody listens', async () => {
    const { getByDisplayValue } = await render(<ContourGuessBar {...baseProps} canSubmit={false} />);
    await fireEvent(getByDisplayValue('Fra'), 'submitEditing');
    expect(baseProps.onSubmit).not.toHaveBeenCalled();
  });

  it('shows the feedback about the previous wrong attempt only when given', async () => {
    const { queryByText, rerender } = await render(<ContourGuessBar {...baseProps} />);
    expect(queryByText('Zoé se trompe et perd 5 points.')).toBeNull();
    await rerender(<ContourGuessBar {...baseProps} wrongText="Zoé se trompe et perd 5 points." />);
    expect(queryByText('Zoé se trompe et perd 5 points.')).toBeTruthy();
  });
});
