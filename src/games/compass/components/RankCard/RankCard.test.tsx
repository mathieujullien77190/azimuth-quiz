import { render } from '@testing-library/react-native';

import { formatNumber } from '@/helpers';

import RankCard from '.';

describe('RankCard', () => {
  it('shows the emoji, the rank title and the total score', async () => {
    const { getByText } = await render(<RankCard emoji="🧭" score={1330} title="Navigateur" />);
    expect(getByText('🧭')).toBeTruthy();
    expect(getByText('Navigateur')).toBeTruthy();
    expect(getByText(formatNumber(1330))).toBeTruthy();
  });
});
