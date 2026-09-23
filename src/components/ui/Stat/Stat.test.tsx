import { render } from '@testing-library/react-native';

import Stat from '.';

describe('Stat', () => {
  it('renders the label and value', async () => {
    const { getByText } = await render(<Stat label="Score" value="42" />);
    expect(getByText('Score')).toBeTruthy();
    expect(getByText('42')).toBeTruthy();
  });

  it('applies a custom color to the value when provided', async () => {
    const { getByText } = await render(<Stat color="#FF0000" label="Score" value="42" />);
    const value = getByText('42');
    const flatStyle = [value.props.style].flat();
    expect(flatStyle.some((s) => s && s.color === '#FF0000')).toBe(true);
  });
});
