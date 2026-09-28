import { fireEvent, render } from '@testing-library/react-native';

import FooterNav from '.';

const baseProps = {
  onCap: false,
  onGoToCap: jest.fn(),
  onGoToDistance: jest.fn(),
  validateDisabled: false,
  onValidate: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('FooterNav', () => {
  it('on the distance section: offers "Suivant", which goes to the heading', async () => {
    const { getByText, queryByText } = await render(<FooterNav {...baseProps} />);
    expect(queryByText('Précédent')).toBeNull();
    await fireEvent.press(getByText('Suivant'));
    expect(baseProps.onGoToCap).toHaveBeenCalledTimes(1);
    expect(baseProps.onGoToDistance).not.toHaveBeenCalled();
  });

  it('on the heading section: offers "Précédent", which goes back to the distance', async () => {
    const { getByText, queryByText } = await render(<FooterNav {...baseProps} onCap />);
    expect(queryByText('Suivant')).toBeNull();
    await fireEvent.press(getByText('Précédent'));
    expect(baseProps.onGoToDistance).toHaveBeenCalledTimes(1);
  });

  it('validates', async () => {
    const { getByText } = await render(<FooterNav {...baseProps} />);
    await fireEvent.press(getByText('Valider'));
    expect(baseProps.onValidate).toHaveBeenCalledTimes(1);
  });

  it('disables "Valider" on demand', async () => {
    const { getByRole } = await render(<FooterNav {...baseProps} validateDisabled />);
    expect(getByRole('button', { name: 'Valider' }).props.accessibilityState.disabled).toBe(true);
  });
});
