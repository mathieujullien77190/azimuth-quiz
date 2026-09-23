import { render } from '@testing-library/react-native';

import Legend from '.';

describe('Legend', () => {
  it('renders every item label', async () => {
    const { getByText } = await render(
      <Legend
        items={[
          { color: '#EF4444', label: 'Alice' },
          { color: '#16A34A', label: 'Bob', ring: true },
        ]}
      />,
    );
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();
  });

  it('renders with no items', async () => {
    const { toJSON } = await render(<Legend items={[]} />);
    expect(toJSON()).toBeTruthy();
  });
});
