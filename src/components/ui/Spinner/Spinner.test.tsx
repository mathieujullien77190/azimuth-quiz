import { render } from '@testing-library/react-native';

import Spinner from '.';

describe('Spinner', () => {
  it('renders an activity indicator, small and accent by default', async () => {
    const { toJSON } = await render(<Spinner />);
    expect(toJSON()).toBeTruthy();
  });

  it('takes a size and a color', async () => {
    const { toJSON } = await render(<Spinner color="#EF4444" size="large" />);
    expect(JSON.stringify(toJSON())).toContain('#EF4444');
  });
});
