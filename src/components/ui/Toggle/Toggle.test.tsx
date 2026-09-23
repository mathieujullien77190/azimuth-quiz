import { fireEvent, render } from '@testing-library/react-native';

import Toggle from '.';

describe('Toggle', () => {
  it('renders the label without a description when none is given', async () => {
    const { getByText, queryByText } = await render(
      <Toggle label="Live compass" onValueChange={jest.fn()} value={false} />,
    );
    expect(getByText('Live compass')).toBeTruthy();
    expect(queryByText(/./)).toBeTruthy();
  });

  it('renders the description when provided', async () => {
    const { getByText } = await render(
      <Toggle description="Points to true north" label="Live compass" onValueChange={jest.fn()} value={false} />,
    );
    expect(getByText('Points to true north')).toBeTruthy();
  });

  it('calls onValueChange with the new value', async () => {
    const onValueChange = jest.fn();
    const { getByLabelText } = await render(<Toggle label="Live compass" onValueChange={onValueChange} value={false} />);
    fireEvent(getByLabelText('Live compass'), 'valueChange', true);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('reflects the value being true', async () => {
    const { getByLabelText } = await render(<Toggle label="Live compass" onValueChange={jest.fn()} value={true} />);
    expect(getByLabelText('Live compass').props.value).toBe(true);
  });
});
